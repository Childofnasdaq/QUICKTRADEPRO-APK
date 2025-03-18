import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { PAYMENT_PLANS } from "@/lib/yoco-payment"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const chargeId = searchParams.get("charge_id")
    const userId = searchParams.get("userId")
    const planId = searchParams.get("planId")

    if (!chargeId || !userId || !planId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Verify the payment with Yoco API
    // In a real implementation, you would call the Yoco API to verify the payment
    // For now, we'll assume the payment is successful if we have a charge_id

    // Update the user's account based on the plan they purchased
    const cookieStore = cookies()

    if (planId === PAYMENT_PLANS.UNLIMITED_ACCOUNTS.id || planId === PAYMENT_PLANS.PROMO_UNLIMITED.id) {
      // Set a cookie indicating the user has unlimited accounts
      cookieStore.set(`unlimited_plan_${userId}`, "true", {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
    } else if (planId === PAYMENT_PLANS.SINGLE_ACCOUNT.id) {
      // Get the current additional accounts count
      const additionalAccountsCookie = cookieStore.get(`additional_accounts_${userId}`)
      const currentCount = additionalAccountsCookie ? Number.parseInt(additionalAccountsCookie.value, 10) : 0

      // Increment the count
      cookieStore.set(`additional_accounts_${userId}`, (currentCount + 1).toString(), {
        path: "/",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
    }

    // Redirect to the app with a success message
    return NextResponse.redirect(new URL("/?payment=success", request.url))
  } catch (error) {
    console.error("Error processing payment success:", error)
    return NextResponse.redirect(new URL("/?payment=error", request.url))
  }
}

