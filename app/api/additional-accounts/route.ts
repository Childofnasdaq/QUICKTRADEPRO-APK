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

    let additionalAccounts = 0

    if (userPurchases) {
      try {
        const purchases = JSON.parse(userPurchases.value)
        const userPurchaseList = purchases[userId] || []

        // Count single account purchases
        additionalAccounts = userPurchaseList.filter(
          (purchase: any) => purchase.planId === PAYMENT_PLANS.SINGLE_ACCOUNT.id,
        ).length

        // Check if the user has unlimited accounts
        const hasUnlimited = userPurchaseList.some(
          (purchase: any) =>
            purchase.planId === PAYMENT_PLANS.UNLIMITED_ACCOUNTS.id ||
            purchase.planId === PAYMENT_PLANS.PROMO_UNLIMITED.id,
        )

        if (hasUnlimited) {
          // If the user has unlimited accounts, we'll return a large number
          // The actual limit is enforced in the getRemainingAccountSlots function
          additionalAccounts = 999
        }
      } catch (error) {
        console.error("Error parsing user purchases:", error)
      }
    }

    return NextResponse.json({ additionalAccounts })
  } catch (error: any) {
    console.error("Error checking additional accounts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

