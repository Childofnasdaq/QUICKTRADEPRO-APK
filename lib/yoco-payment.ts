// Yoco Payment Integration

// Yoco API keys
export const YOCO_KEYS = {
  publicKey: "pk_live_4d1ec9c3lW1VJvZ21724",
  secretKey: "sk_live_7f795574aZEv9bPe8de4c63b0d69",
}

// Update the FREE_ACCOUNT_LIMIT from 3 to 1
export const FREE_ACCOUNT_LIMIT = 1

// Update the payment plans with new pricing
export const PAYMENT_PLANS = {
  SINGLE_ACCOUNT: {
    id: "single_account",
    name: "Single Account",
    price: 30000, // R300 in cents
    description: "Add one additional trading account",
  },
  UNLIMITED_ACCOUNTS: {
    id: "unlimited_accounts",
    name: "Unlimited Accounts",
    price: 600000, // R6000 in cents
    description: "Add unlimited trading accounts (up to 20)",
  },
  PROMO_UNLIMITED: {
    id: "promo_unlimited",
    name: "Limited Time Offer",
    price: 500000, // R5000 in cents
    description: "Special 20-day offer: Unlimited accounts for R5000",
    expiryDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
  },
}

// Add a function to check if the promo is still valid
export function isPromoValid(): boolean {
  const promoExpiry = new Date(PAYMENT_PLANS.PROMO_UNLIMITED.expiryDate)
  return new Date() < promoExpiry
}

// Check if user has reached free account limit
export function hasReachedFreeLimit(connectionCount: number): boolean {
  return connectionCount >= FREE_ACCOUNT_LIMIT
}

// Check if user has unlimited accounts
export async function hasUnlimitedAccounts(userId: string): Promise<boolean> {
  try {
    // Check if the user has purchased the unlimited plan
    // This would typically be stored in your database
    const response = await fetch(`/api/check-unlimited-plan?userId=${userId}`)
    const data = await response.json()
    return data.hasUnlimitedPlan
  } catch (error) {
    console.error("Error checking unlimited plan:", error)
    return false
  }
}

// Get remaining account slots
export async function getRemainingAccountSlots(userId: string, connectionCount: number): Promise<number> {
  try {
    // Check if user has unlimited plan
    const hasUnlimited = await hasUnlimitedAccounts(userId)

    if (hasUnlimited) {
      return 20 // Maximum of 20 accounts for unlimited plan
    }

    // Check if user has purchased additional accounts
    const response = await fetch(`/api/additional-accounts?userId=${userId}`)
    const data = await response.json()

    // Calculate total allowed accounts (free + purchased)
    const totalAllowed = FREE_ACCOUNT_LIMIT + (data.additionalAccounts || 0)

    return Math.max(0, totalAllowed - connectionCount)
  } catch (error) {
    console.error("Error getting remaining account slots:", error)
    // Default to just showing the free limit
    return Math.max(0, FREE_ACCOUNT_LIMIT - connectionCount)
  }
}

// Create a Yoco payment for additional accounts
export async function createYocoPayment(
  userId: string,
  planId: string,
  successUrl: string,
  cancelUrl: string,
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const response = await fetch("/api/create-yoco-payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        planId,
        successUrl,
        cancelUrl,
      }),
    })

    // Check if the response is JSON
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      // If not JSON, get the text response for debugging
      const textResponse = await response.text()
      console.error("Non-JSON response from API:", textResponse)
      return {
        success: false,
        error: "Invalid response from server",
      }
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to create payment")
    }

    return {
      success: true,
      redirectUrl: data.redirectUrl,
    }
  } catch (error: any) {
    console.error("Error creating Yoco payment:", error)
    return {
      success: false,
      error: error.message || "An unexpected error occurred",
    }
  }
}

