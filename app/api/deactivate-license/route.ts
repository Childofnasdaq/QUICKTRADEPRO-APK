import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { licenseKey } = await request.json()

    if (!licenseKey) {
      return NextResponse.json({ error: "License key is required" }, { status: 400 })
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

      // Check if this database has the licenseKeys collection
      if (!collectionNames.includes("licenseKeys")) continue

      // Try to find and update the license key
      const licenseKeysCollection = db.collection("licenseKeys")
      const result = await licenseKeysCollection.updateOne(
        { key: licenseKey },
        { $set: { status: "used", isDeactivated: true } },
      )

      if (result.matchedCount > 0) {
        return NextResponse.json({
          success: true,
          message: "License key deactivated successfully",
        })
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "License key not found in any database",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("Deactivation error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to deactivate license key: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

