import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"
import YocoPaymentClient, { type PaymentPlan, PaymentStatus, PRICING } from "@/lib/yoco-payment-client"

export async function POST(request: NextRequest) {
  try {
    const { userId, plan, cardDetails } = await request.json()

    if (!userId || !plan) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("Cluster0")

    // Create payment record
    const paymentsCollection = db.collection("payments")
    const paymentId = uuidv4()

    await paymentsCollection.insertOne({
      paymentId,
      userId,
      plan,
      amount: PRICING[plan as PaymentPlan],
      status: PaymentStatus.PENDING,
      createdAt: new Date(),
    })

    // Create payment intent with Yoco
    const paymentIntent = await YocoPaymentClient.createPaymentIntent(userId, plan as PaymentPlan)

    // If card details are provided, process the payment immediately
    if (cardDetails) {
      const { cardNumber, expiryMonth, expiryYear, cvv } = cardDetails

      if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
        return NextResponse.json({ error: "Missing card details" }, { status: 400 })
      }

      // Process payment
      const paymentResult = await YocoPaymentClient.processPayment(
        paymentIntent.clientSecret,
        cardNumber,
        expiryMonth,
        expiryYear,
        cvv,
      )

      if (paymentResult.success) {
        // Update payment record
        await paymentsCollection.updateOne(
          { paymentId },
          {
            $set: {
              status: PaymentStatus.COMPLETED,
              transactionId: paymentResult.transactionId,
              completedAt: new Date(),
            },
          },
        )

        // Update user subscription
        const subscriptionsCollection = db.collection("subscriptions")

        await subscriptionsCollection.updateOne(
          { userId },
          {
            $set: {
              plan,
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        )

        return NextResponse.json({
          success: true,
          paymentId,
          transactionId: paymentResult.transactionId,
          status: PaymentStatus.COMPLETED,
          plan,
          amount: PRICING[plan as PaymentPlan],
        })
      } else {
        // Update payment record
        await paymentsCollection.updateOne(
          { paymentId },
          {
            $set: {
              status: PaymentStatus.FAILED,
              error: paymentResult.error,
            },
          },
        )

        return NextResponse.json(
          {
            success: false,
            paymentId,
            status: PaymentStatus.FAILED,
            error: paymentResult.error,
          },
          { status: 400 },
        )
      }
    }

    // If no card details, return payment intent for client-side processing
    return NextResponse.json({
      success: true,
      paymentId,
      clientSecret: paymentIntent.clientSecret,
      amount: paymentIntent.amount,
      plan,
      status: PaymentStatus.PENDING,
    })
  } catch (error) {
    console.error("Payment error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to process payment: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

// Get payment status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const paymentId = searchParams.get("paymentId")

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("Cluster0")
    const paymentsCollection = db.collection("payments")

    // Get payment record
    const payment = await paymentsCollection.findOne({ paymentId })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // If payment has a transaction ID, get details from Yoco
    if (payment.transactionId) {
      const paymentDetails = await YocoPaymentClient.getPaymentDetails(payment.transactionId)

      return NextResponse.json({
        success: true,
        payment: {
          paymentId: payment.paymentId,
          userId: payment.userId,
          plan: payment.plan,
          amount: payment.amount,
          status: payment.status,
          transactionId: payment.transactionId,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
        },
        details: paymentDetails,
      })
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        userId: payment.userId,
        plan: payment.plan,
        amount: payment.amount,
        status: payment.status,
        createdAt: payment.createdAt,
      },
    })
  } catch (error) {
    console.error("Error getting payment status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to get payment status: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

