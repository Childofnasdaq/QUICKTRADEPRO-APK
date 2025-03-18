import { type NextRequest, NextResponse } from "next/server"
import { TradeStatus } from "@/types/meta-api"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const accountId = searchParams.get("accountId")
    const symbol = searchParams.get("symbol")

    if (!userId || !accountId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // In a real implementation, you would query your database or the MetaTrader API
    // to get the active trades for the user's account

    // For now, we'll return mock data
    const mockTrades = [
      // Add mock trades here if needed for testing
    ]

    // Filter trades by symbol if provided
    const filteredTrades = symbol ? mockTrades.filter((trade) => trade.symbol === symbol) : mockTrades

    // Count active trades
    const activeTrades = filteredTrades.filter((trade) => trade.status === TradeStatus.ACTIVE).length

    return NextResponse.json({
      activeTrades,
      trades: filteredTrades,
    })
  } catch (error) {
    console.error("Error fetching active trades:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

