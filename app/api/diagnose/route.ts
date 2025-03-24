import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { mentorId, email, licenseKey } = await request.json()

    if (!mentorId || !email || !licenseKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise

    // Get all databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()
    const databases = databasesList.databases.map((db) => db.name)

    // Check each database for the collections we need
    const results = {}

    for (const dbName of databases) {
      // Skip admin and local databases
      if (dbName === "admin" || dbName === "local") continue

      const db = client.db(dbName)
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map((c) => c.name)

      // Convert mentorId to number if it's a string
      const mentorIdValue = typeof mentorId === "string" ? Number.parseInt(mentorId, 10) : mentorId

      // Check for users collection
      const userInfo = { exists: false, userFound: false }
      if (collectionNames.includes("users")) {
        const usersCollection = db.collection("users")
        userInfo.exists = true
        const user = await usersCollection.findOne({
          email: email,
          mentorId: mentorIdValue,
        })
        userInfo.userFound = !!user
        if (user) {
          userInfo["user"] = {
            id: user._id.toString(),
            email: user.email,
            mentorId: user.mentorId,
            fields: Object.keys(user),
          }
        }
      }

      // Check for licenseKeys collection
      const licenseInfo = { exists: false, keyFound: false }
      if (collectionNames.includes("licenseKeys")) {
        const licenseKeysCollection = db.collection("licenseKeys")
        licenseInfo.exists = true
        const license = await licenseKeysCollection.findOne({ key: licenseKey })
        licenseInfo.keyFound = !!license
        if (license) {
          licenseInfo["license"] = {
            id: license._id.toString(),
            key: license.key,
            fields: Object.keys(license),
          }
        }
      }

      results[dbName] = {
        collections: collectionNames,
        users: userInfo,
        licenseKeys: licenseInfo,
      }
    }

    return NextResponse.json({
      success: true,
      databases,
      results,
    })
  } catch (error) {
    console.error("Diagnostic error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

