import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise

    // Get list of databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()

    // Try to access the main database
    const db = client.db("Cluster0")
    const collections = await db.listCollections().toArray()

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful",
      databases: databasesList.databases.map((db) => db.name),
      collections: collections.map((c) => c.name),
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

