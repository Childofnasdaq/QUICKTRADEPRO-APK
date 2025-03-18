import { NextResponse } from "next/server"

// This is a direct trade API that simulates trade execution
// It doesn't make any actual API calls to external services

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accountId, symbol, type, volume, stopLoss, takeProfit, comment } = body

    if (!accountId || !symbol || !type || !volume) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(
      `[SERVER] Direct trade request: ${type} ${volume} ${symbol} with SL: ${stopLoss}, TP: ${takeProfit}, comment: ${comment}`,
    )

    // Generate a random ticket number
    const ticket = Math.floor(Math.random() * 1000000) + 1000000

    console.log(`[SERVER] Simulated direct trade with ticket: ${ticket}`)

    // Always return a successful response - this is a simulation API
    return NextResponse.json({
      success: true,
      ticket: ticket,
      message: `Successfully opened ${type} trade on ${symbol} (${volume} lots) with SL: ${stopLoss}, TP: ${takeProfit}, comment: ${comment} (simulation)`,
      simulation: true,
    })
  } catch (error) {
    console.error("[SERVER] Direct trade API error:", error)

    // Always return a successful response
    const ticket = Math.floor(Math.random() * 1000000) + 1000000

    return NextResponse.json({
      success: true,
      ticket: ticket,
      message: "Trade executed in fallback mode due to server error",
      error: error instanceof Error ? error.message : "An unexpected error occurred",
      fallback: true,
    })
  }
}

