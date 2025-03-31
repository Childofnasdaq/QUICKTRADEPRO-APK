import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId, deviceId } = await request.json()

    if (!userId || !deviceId) {
      return NextResponse.json({ valid: false, error: "Missing required fields" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise

    // Get all databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()
    const databases = databasesList.databases
      .map((db) => db.name)
      .filter((name) => name !== "admin" && name !== "local")

    // Try each database
    for (const dbName of databases) {
      const db = client.db(dbName)
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map((c) => c.name)

      // Check if this database has the userSessions collection
      if (!collectionNames.includes("userSessions")) continue

      // Try to find the session
      const userSessionsCollection = db.collection("userSessions")
      const session = await userSessionsCollection.findOne({
        userId: userId,
        deviceId: deviceId,
        isActive: true,
      })

      if (session) {
        // Update last active time
        await userSessionsCollection.updateOne({ _id: session._id }, { $set: { lastActiveAt: new Date() } })

        return NextResponse.json({ valid: true })
      }
    }

    // If we get here, no valid session was found
    return NextResponse.json({ valid: false })
  } catch (error) {
    console.error("Session check error:", error)
    return NextResponse.json(
      { valid: false, error: "Failed to check session: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}

