import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId, licenseKey } = await request.json()

    if (!userId && !licenseKey) {
      return NextResponse.json({ error: "Either userId or licenseKey is required" }, { status: 400 })
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
      let licenseKeyDoc = null

      if (licenseKey) {
        licenseKeyDoc = await licenseKeysCollection.findOne({ key: licenseKey })
      } else if (userId) {
        // If userId is provided, try to find by userId
        licenseKeyDoc = await licenseKeysCollection.findOne({ userId: userId })

        // If not found by userId as string, try with ObjectId
        if (!licenseKeyDoc) {
          try {
            licenseKeyDoc = await licenseKeysCollection.findOne({ userId: new ObjectId(userId) })
          } catch (error) {
            // Ignore ObjectId conversion errors
          }
        }
      }

      if (licenseKeyDoc) {
        // Calculate days until expiry
        let daysUntilExpiry = null
        let isExpired = false

        if (licenseKeyDoc.expiryDate && licenseKeyDoc.plan !== "lifetime") {
          const expiryDate = new Date(licenseKeyDoc.expiryDate)
          const today = new Date()
          const diffTime = expiryDate.getTime() - today.getTime()
          daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          isExpired = daysUntilExpiry < 0
        }

        // Get license duration if available
        let licenseDuration = null
        if (licenseKeyDoc.activationDate && licenseKeyDoc.expiryDate && licenseKeyDoc.plan !== "lifetime") {
          const activationDate = new Date(licenseKeyDoc.activationDate)
          const expiryDate = new Date(licenseKeyDoc.expiryDate)
          const diffTime = expiryDate.getTime() - activationDate.getTime()
          licenseDuration = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        }

        return NextResponse.json({
          success: true,
          licenseInfo: {
            key: licenseKeyDoc.key,
            status: licenseKeyDoc.status || "unknown",
            plan: licenseKeyDoc.plan || "standard",
            isActivated: licenseKeyDoc.isActivated === true,
            isDeactivated: licenseKeyDoc.isDeactivated === true,
            activationDate: licenseKeyDoc.activationDate || null,
            expiryDate: licenseKeyDoc.expiryDate || null,
            daysUntilExpiry: daysUntilExpiry,
            isExpired: isExpired,
            licenseDuration: licenseDuration,
            deviceId: licenseKeyDoc.deviceId || null,
          },
        })
      }
    }

    // If we get here, we didn't find the license key in any database
    return NextResponse.json(
      {
        success: false,
        error: "License information not found",
      },
      { status: 404 },
    )
  } catch (error) {
    console.error("License info error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get license information: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

