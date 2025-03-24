import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("Cluster0") // Use the correct database name
    const usersCollection = db.collection("users")

    // Find user by ID
    const user = await usersCollection.findOne({
      _id: new ObjectId(userId),
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Return user data
    return NextResponse.json({
      uid: user._id.toString(),
      email: user.email,
      mentorId: user.mentorId,
      licenseKey: user.licenseKey,
      licenseExpiry: user.licenseExpiry,
      photoURL: user.avatar,
      robotName: user.robotName || "QUICKTRADE PRO",
      displayName: user.displayName,
    })
  } catch (error) {
    console.error("Error fetching user data:", error)
    return NextResponse.json({ error: "Failed to fetch user data" }, { status: 500 })
  }
}

