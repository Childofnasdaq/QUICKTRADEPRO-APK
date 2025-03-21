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

    // Use the correct database name
    const db = client.db("Cluster0")
    console.log("Using database: Cluster0")

    // Try different collection names
    const collections = ["users", "Users", "user", "User", "accounts", "Accounts"]
    let user = null
    let collectionUsed = ""

    for (const collectionName of collections) {
      console.log(`Trying collection: ${collectionName}`)
      const collection = db.collection(collectionName)

      // Log the query we're about to execute
      console.log(`Querying for: email=${email}, mentorId=${mentorId}`)

      // Try to find the user
      user = await collection.findOne({
        email: email,
        mentorId: mentorId,
      })

      if (user) {
        console.log(`User found in collection: ${collectionName}`)
        collectionUsed = collectionName
        break
      }
    }

    if (!user) {
      console.log("User not found in any collection")

      // List all collections in the database to help debug
      const collections = await db.listCollections().toArray()
      console.log(
        "Available collections:",
        collections.map((c) => c.name),
      )

      return NextResponse.json({ error: "Invalid credentials. User not found." }, { status: 401 })
    }

    console.log("User found:", { id: user._id, email: user.email })

    // Verify license key
    if (user.licenseKey !== licenseKey) {
      console.log("License key mismatch")
      return NextResponse.json({ error: "Invalid license key." }, { status: 401 })
    }

    // Check license expiry if it exists
    if (user.licenseExpiry) {
      const expiryDate = new Date(user.licenseExpiry)
      if (expiryDate < new Date()) {
        console.log("License expired")
        return NextResponse.json(
          { error: "Your license key has expired. Please renew it to continue." },
          { status: 401 },
        )
      }
    }

    // Return user data without sensitive information
    return NextResponse.json({
      success: true,
      user: {
        uid: user._id.toString(),
        email: user.email,
        mentorId: user.mentorId,
        licenseExpiry: user.licenseExpiry,
        photoURL: user.photoURL,
        robotName: user.robotName || "QUICKTRADE PRO",
        displayName: user.displayName,
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

