import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { PAYMENT_PLANS } from "@/lib/yoco-payment"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "Missing userId parameter" }, { status: 400 })
    }

    // In a real application, you would check your database
    // For testing purposes, we'll check the cookie
    const cookieStore = cookies()
    const userPurchases = cookieStore.get("user_purchases")

    let hasUnlimitedPlan = false

    if (userPurchases) {
      try {
        const purchases = JSON.parse(userPurchases.value)
        const userPurchaseList = purchases[userId] || []

        // Check if the user has purchased the unlimited plan
        hasUnlimitedPlan = userPurchaseList.some(
          (purchase: any) =>
            purchase.planId === PAYMENT_PLANS.UNLIMITED_ACCOUNTS.id ||
            purchase.planId === PAYMENT_PLANS.PROMO_UNLIMITED.id,
        )
      } catch (error) {
        console.error("Error parsing user purchases:", error)
      }
    }

    return NextResponse.json({ hasUnlimitedPlan })
  } catch (error: any) {
    console.error("Error checking unlimited plan:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

