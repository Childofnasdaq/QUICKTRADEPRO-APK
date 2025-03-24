import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("Cluster0")

    // Get collection names
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    // Check users collection
    const usersCollection = db.collection("users")
    const userCount = await usersCollection.countDocuments()
    const userSample = await usersCollection.find({}).limit(1).toArray()

    // Check licenseKeys collection
    const licenseKeysCollection = db.collection("licenseKeys")
    const licenseKeyCount = await licenseKeysCollection.countDocuments()
    const licenseKeySample = await licenseKeysCollection.find({}).limit(1).toArray()

    return NextResponse.json({
      success: true,
      collections: collectionNames,
      userCollection: {
        count: userCount,
        fields: userSample.length > 0 ? Object.keys(userSample[0]) : [],
        sample:
          userSample.length > 0
            ? {
                id: userSample[0].id,
                email: userSample[0].email,
                mentorId: userSample[0].mentorId,
              }
            : null,
      },
      licenseKeysCollection: {
        count: licenseKeyCount,
        fields: licenseKeySample.length > 0 ? Object.keys(licenseKeySample[0]) : [],
        sample:
          licenseKeySample.length > 0
            ? {
                id: licenseKeySample[0].id,
                key: licenseKeySample[0].key,
                status: licenseKeySample[0].status,
              }
            : null,
      },
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

