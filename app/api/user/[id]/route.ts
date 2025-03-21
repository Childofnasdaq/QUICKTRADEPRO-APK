import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const client = await clientPromise

    // Get list of databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()
    const databases = databasesList.databases.map((db) => db.name)

    // Try to find the user in any database and collection
    let user = null
    let dbUsed = ""
    let collectionUsed = ""

    // List of possible collection names to try
    const collections = ["users", "Users", "user", "User", "accounts", "Accounts", "licenses", "Licenses"]

    // Try each database
    for (const dbName of databases) {
      // Skip admin and local databases
      if (dbName === "admin" || dbName === "local" || dbName === "config") continue

      const db = client.db(dbName)

      // Get all collections in this database
      const dbCollections = await db.listCollections().toArray()

      // Try each collection
      for (const collectionName of [...collections, ...dbCollections.map((c) => c.name)]) {
        try {
          const collection = db.collection(collectionName)

          // Try to find the user by ID
          user = await collection.findOne({
            _id: new ObjectId(userId),
          })

          if (user) {
            dbUsed = dbName
            collectionUsed = collectionName
            break
          }
        } catch (err) {
          continue
        }
      }

      if (user) break
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    console.log(`User found in ${dbUsed}.${collectionUsed}`)

    // Return user data without sensitive information
    return NextResponse.json({
      uid: user._id.toString(),
      email: user.email,
      mentorId: user.mentorId,
      licenseExpiry: user.licenseExpiry,
      photoURL: user.photoURL,
      robotName: user.robotName || "QUICKTRADE PRO",
      displayName: user.displayName,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}

