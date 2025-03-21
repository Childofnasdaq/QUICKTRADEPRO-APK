import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { mentorId, email, licenseKey } = await request.json()
    console.log("Auth request received:", { mentorId, email, licenseKey })

    if (!mentorId || !email || !licenseKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to MongoDB
    console.log("Connecting to MongoDB...")
    const client = await clientPromise
    console.log("MongoDB connected successfully")

    // Get all databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()
    const databases = databasesList.databases.map((db) => db.name)
    console.log("Available databases:", databases)

    // Find the user first
    let user = null
    let userDbName = ""
    let userCollectionName = ""

    // Try each database to find the user
    for (const dbName of databases) {
      // Skip admin and local databases
      if (dbName === "admin" || dbName === "local" || dbName === "config") continue

      console.log(`Searching for user in database: ${dbName}`)
      const db = client.db(dbName)

      // Get all collections in this database
      const dbCollections = await db.listCollections().toArray()
      const collectionNames = dbCollections.map((c) => c.name)
      console.log(`Collections in ${dbName}:`, collectionNames)

      // Try to find user in users collection
      if (collectionNames.includes("users")) {
        console.log(`Trying to find user in ${dbName}.users`)
        const usersCollection = db.collection("users")

        // Try to find the user by mentorId and email
        user = await usersCollection.findOne({
          mentorId: Number.parseInt(mentorId),
          email: email,
        })

        if (!user) {
          // Try with mentorId as string
          user = await usersCollection.findOne({
            mentorId: mentorId,
            email: email,
          })
        }

        if (user) {
          console.log(`User found in ${dbName}.users:`, { id: user.id, email: user.email })
          userDbName = dbName
          userCollectionName = "users"
          break
        }
      }
    }

    if (!user) {
      console.log("User not found in any database")
      return NextResponse.json({ error: "Invalid credentials. User not found." }, { status: 401 })
    }

    // Now find the license key
    let licenseKeyDoc = null
    let licenseDbName = ""
    let licenseCollectionName = ""

    // Try to find the license key in the licenseKeys collection
    for (const dbName of databases) {
      // Skip admin and local databases
      if (dbName === "admin" || dbName === "local" || dbName === "config") continue

      console.log(`Searching for license key in database: ${dbName}`)
      const db = client.db(dbName)

      // Get all collections in this database
      const dbCollections = await db.listCollections().toArray()
      const collectionNames = dbCollections.map((c) => c.name)

      // Check if licenseKeys collection exists
      if (collectionNames.includes("licenseKeys")) {
        console.log(`Trying to find license key in ${dbName}.licenseKeys`)
        const licenseKeysCollection = db.collection("licenseKeys")

        // Try to find the license key by user id and the provided key
        licenseKeyDoc = await licenseKeysCollection.findOne({
          key: licenseKey,
          createdBy: user.id,
        })

        if (licenseKeyDoc) {
          console.log(`License key found in ${dbName}.licenseKeys:`, { id: licenseKeyDoc.id, key: licenseKeyDoc.key })
          licenseDbName = dbName
          licenseCollectionName = "licenseKeys"
          break
        }
      }
    }

    if (!licenseKeyDoc) {
      console.log("License key not found or does not match")
      return NextResponse.json({ error: "Invalid license key." }, { status: 401 })
    }

    // Check license expiry if it exists
    let isExpiring = false
    let expiryDate = null

    if (licenseKeyDoc.expiryDate && licenseKeyDoc.plan !== "lifetime") {
      expiryDate = new Date(licenseKeyDoc.expiryDate)

      // Check if license is expired
      if (expiryDate < new Date()) {
        console.log("License expired")
        return NextResponse.json(
          { error: "Your license key has expired. Please renew it to continue." },
          { status: 401 },
        )
      }

      // Check if license is about to expire (1 day)
      const oneDayFromNow = new Date()
      oneDayFromNow.setDate(oneDayFromNow.getDate() + 1)

      if (expiryDate <= oneDayFromNow) {
        isExpiring = true
      }
    }

    // Get EA information
    let eaInfo = null
    if (licenseKeyDoc.eaId) {
      for (const dbName of databases) {
        if (dbName === "admin" || dbName === "local" || dbName === "config") continue

        const db = client.db(dbName)
        const collections = await db.listCollections().toArray()
        const collectionNames = collections.map((c) => c.name)

        if (collectionNames.includes("eas")) {
          const easCollection = db.collection("eas")
          eaInfo = await easCollection.findOne({ id: licenseKeyDoc.eaId })
          if (eaInfo) break
        }
      }
    }

    // Return user data combined with license information
    return NextResponse.json({
      success: true,
      user: {
        uid: user._id.toString(),
        email: user.email,
        mentorId: user.mentorId,
        licenseExpiry: licenseKeyDoc.plan === "lifetime" ? "NEVER" : licenseKeyDoc.expiryDate,
        licenseKey: licenseKeyDoc.key,
        licenseStatus: licenseKeyDoc.status,
        licensePlan: licenseKeyDoc.plan,
        isExpiring: isExpiring,
        photoURL: user.avatar,
        robotName: licenseKeyDoc.username || eaInfo?.name || "QUICKTRADE PRO",
        eaName: eaInfo?.name || licenseKeyDoc.eaName || "QUICKTRADE PRO",
        displayName: user.displayName || user.name,
      },
    })
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json(
      { error: "Authentication failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

