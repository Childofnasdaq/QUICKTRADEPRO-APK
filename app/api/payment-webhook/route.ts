import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the signature from the headers
    const signature = request.headers.get("x-yoco-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    // Get the raw body as text
    const rawBody = await request.text()

    // In a real implementation, you would verify the signature
    // using the Yoco secret key and the raw body

    // Parse the body as JSON
    const body = JSON.parse(rawBody)

    // Process the webhook event
    const { event, data } = body

    if (event === "payment.succeeded") {
      // Extract metadata from the payment
      const { userId, planId } = data.metadata || {}

      if (!userId || !planId) {
        console.error("Missing metadata in payment webhook", data)
        return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
      }

      // Update the user's account based on the plan
      // In a real implementation, you would update your database
      console.log(`User ${userId} purchased plan ${planId}`)

      // For demonstration purposes, we'll just return a success response
      return NextResponse.json({ success: true })
    }

    // Handle other event types if needed

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error("Error processing webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

