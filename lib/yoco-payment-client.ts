// Yoco API configuration
const YOCO_PUBLIC_KEY = "pk_live_4d1ec9c3lW1VJvZ21724"
const YOCO_SECRET_KEY = "sk_live_7f795574aZEv9bPe8de4c63b0d69"
const YOCO_API_URL = "https://online.yoco.com/v1"

// Payment plans
export enum PaymentPlan {
  SINGLE_ACCOUNT = "SINGLE_ACCOUNT",
  TWO_ACCOUNTS = "TWO_ACCOUNTS",
  UNLIMITED = "UNLIMITED",
}

// Pricing in Rands
export const PRICING = {
  [PaymentPlan.SINGLE_ACCOUNT]: 300, // R300
  [PaymentPlan.TWO_ACCOUNTS]: 600, // R600
  [PaymentPlan.UNLIMITED]: 5000, // R5000
}

// Payment status
export enum PaymentStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

// Payment interface
export interface Payment {
  id: string
  userId: string
  plan: PaymentPlan
  amount: number
  status: PaymentStatus
  transactionId?: string
  createdAt: Date
  completedAt?: Date
}

// Yoco payment client
class YocoPaymentClient {
  private static instance: YocoPaymentClient

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): YocoPaymentClient {
    if (!YocoPaymentClient.instance) {
      YocoPaymentClient.instance = new YocoPaymentClient()
    }
    return YocoPaymentClient.instance
  }

  /**
   * Create a payment intent - simplified version for server-side
   */
  public async createPaymentIntent(userId: string, plan: PaymentPlan): Promise<any> {
    try {
      const amount = PRICING[plan]

      // Simulate creating a payment intent
      return {
        clientSecret: `pi_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        amount,
        plan,
      }
    } catch (error) {
      console.error("Error creating payment intent:", error)
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Process payment - simplified version for server-side
   */
  public async processPayment(
    paymentIntentId: string,
    cardNumber: string,
    expiryMonth: string,
    expiryYear: string,
    cvv: string,
  ): Promise<any> {
    try {
      // Simulate processing a payment
      return {
        success: true,
        transactionId: `tx_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        status: "succeeded",
      }
    } catch (error) {
      console.error("Error processing payment:", error)
      throw new Error(`Failed to process payment: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get payment details - simplified version for server-side
   */
  public async getPaymentDetails(transactionId: string): Promise<any> {
    try {
      // Simulate getting payment details
      return {
        id: transactionId,
        amount: 1000,
        status: "succeeded",
        created: new Date().toISOString(),
      }
    } catch (error) {
      console.error("Error getting payment details:", error)
      throw new Error(`Failed to get payment details: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

export default YocoPaymentClient.getInstance()

