import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    console.log("Testing MongoDB connection...")
    const client = await clientPromise
    console.log("MongoDB connected successfully")

    // Get list of databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()
    const databases = databasesList.databases.map((db) => db.name)

    console.log("Available databases:", databases)

    // Collect information about all non-system databases
    const dbInfo = []

    for (const dbName of databases) {
      // Skip admin, local, and config databases
      if (dbName === "admin" || dbName === "local" || dbName === "config") continue

      const db = client.db(dbName)
      const collections = await db.listCollections().toArray()

      // For each collection, count documents and get a sample document
      const collectionInfo = []
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments()

        // Get a sample document structure (fields only, not values)
        let sampleDocumentFields = []
        if (count > 0) {
          const sampleDoc = await db.collection(collection.name).findOne({})
          if (sampleDoc) {
            sampleDocumentFields = Object.keys(sampleDoc)
          }
        }

        collectionInfo.push({
          name: collection.name,
          documentCount: count,
          fields: sampleDocumentFields,
        })
      }

      dbInfo.push({
        name: dbName,
        collections: collectionInfo,
      })
    }

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      databases: databases,
      databaseDetails: dbInfo,
    })
  } catch (error) {
    console.error("MongoDB connection test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

