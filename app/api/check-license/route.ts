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

      // Try to find the license key
      const licenseKeysCollection = db.collection("licenseKeys")
      const licenseKeyDoc = await licenseKeysCollection.findOne({ key: licenseKey })

      if (licenseKeyDoc) {
        return NextResponse.json({
          found: true,
          isActivated: licenseKeyDoc.isActivated === true,
          isDeactivated: licenseKeyDoc.isDeactivated === true,
          deviceId: licenseKeyDoc.deviceId || null,
          status: licenseKeyDoc.status || "unknown",
          plan: licenseKeyDoc.plan || "standard",
          expiryDate: licenseKeyDoc.expiryDate || null,
        })
      }
    }

    // If we get here, we didn't find the license key in any database
    return NextResponse.json({
      found: false,
      error: "License key not found in any database",
    })
  } catch (error) {
    console.error("License check error:", error)
    return NextResponse.json(
      {
        found: false,
        error: "Failed to check license key: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

