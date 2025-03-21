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

    console.log(
      "Available databases:",
      databasesList.databases.map((db) => db.name),
    )

    // Try to access the main database
    const db = client.db("Cluster0")
    const collections = await db.listCollections().toArray()
    console.log(
      "Collections in Cluster0:",
      collections.map((c) => c.name),
    )

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

