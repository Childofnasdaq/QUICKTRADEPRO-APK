import { type NextRequest, NextResponse } from "next/server"
import { YOCO_KEYS, PAYMENT_PLANS } from "@/lib/yoco-payment"

export async function POST(request: NextRequest) {
  try {
    const { userId, planId, successUrl, cancelUrl } = await request.json()

    // Validate required fields
    if (!userId || !planId || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the selected plan
    const selectedPlan = Object.values(PAYMENT_PLANS).find((plan) => plan.id === planId)

    if (!selectedPlan) {
      return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 })
    }

    // Using the correct Yoco API endpoint for creating checkout sessions
    // Note: This is the updated endpoint based on Yoco's documentation
    const yocoResponse = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_KEYS.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: selectedPlan.price, // Amount in cents
        currency: "ZAR",
        name: selectedPlan.name,
        description: selectedPlan.description,
        metadata: {
          userId,
          planId,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
    })

    // Check if the response is JSON
    const contentType = yocoResponse.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, get the text response for debugging
      const textResponse = await yocoResponse.text()
      console.error("Non-JSON response from Yoco API:", textResponse)
      return NextResponse.json({ error: "Invalid response from payment provider" }, { status: 500 })
    }

    const yocoData = await yocoResponse.json()

    if (!yocoResponse.ok) {
      console.error("Yoco API error:", yocoData)
      return NextResponse.json(
        { error: yocoData.message || "Payment creation failed" },
        { status: yocoResponse.status },
      )
    }

    // Return the redirect URL to the client
    return NextResponse.json({
      success: true,
      redirectUrl: yocoData.redirectUrl || yocoData.url,
    })
  } catch (error: any) {
    console.error("Error creating payment:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}

