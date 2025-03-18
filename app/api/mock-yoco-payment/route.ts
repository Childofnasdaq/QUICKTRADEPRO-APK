import { type NextRequest, NextResponse } from "next/server"
import { PAYMENT_PLANS } from "@/lib/yoco-payment"
import { cookies } from "next/headers"

// This is a mock implementation for testing purposes
// In a real application, you would use the actual Yoco API
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

    // For testing purposes, we'll create a mock payment session
    // In a real application, you would call the Yoco API

    // Create a mock redirect URL that simulates a successful payment
    const mockRedirectUrl = `/api/mock-payment-success?userId=${userId}&planId=${planId}&returnUrl=${encodeURIComponent(successUrl)}`

    // Return the mock redirect URL
    return NextResponse.json({
      success: true,
      redirectUrl: mockRedirectUrl,
    })
  } catch (error: any) {
    console.error("Error creating mock payment:", error)
    return NextResponse.json({ error: "Internal server error: " + error.message }, { status: 500 })
  }
}

// This route handles the mock payment success
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const planId = searchParams.get("planId")
    const returnUrl = searchParams.get("returnUrl")

    if (!userId || !planId || !returnUrl) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // In a real application, you would update your database
    // For testing purposes, we'll store the purchase in a cookie
    const cookieStore = cookies()

    // Get existing purchases
    const existingPurchases = cookieStore.get("user_purchases")
    const purchases = existingPurchases ? JSON.parse(existingPurchases.value) : {}

    // Add the new purchase
    if (!purchases[userId]) {
      purchases[userId] = []
    }

    purchases[userId].push({
      planId,
      purchaseDate: new Date().toISOString(),
    })

    // Store the updated purchases
    cookieStore.set("user_purchases", JSON.stringify(purchases), {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })

    // Redirect back to the application
    return NextResponse.redirect(returnUrl)
  } catch (error: any) {
    console.error("Error processing mock payment success:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

