import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const { userId, symbols, lotSize, maxTrades } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise

    // Get all databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()
    const databases = databasesList.databases
      .map((db) => db.name)
      .filter((name) => name !== "admin" && name !== "local")

    // Try to save settings to tradingSettings collection in each database
    for (const dbName of databases) {
      const db = client.db(dbName)
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map((c) => c.name)

      // Create tradingSettings collection if it doesn't exist
      if (!collectionNames.includes("tradingSettings")) {
        await db.createCollection("tradingSettings")
      }

      const tradingSettingsCollection = db.collection("tradingSettings")

      // Update or insert settings
      await tradingSettingsCollection.updateOne(
        { userId },
        {
          $set: {
            symbols,
            lotSize,
            maxTrades,
            updatedAt: new Date(),
          },
        },
        { upsert: true },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    })
  } catch (error) {
    console.error("Save settings error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save settings: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

