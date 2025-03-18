import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accountId, symbol, action, volume, stopLoss, takeProfit, comment = "QUICKTRADE-PRO" } = body

    console.log("[SERVER] Trade request received:", body)

    // Generate a realistic-looking ticket number
    const simulatedTicket = Math.floor(Math.random() * 10000000) + 10000000

    // Create a realistic trade response that mimics a real MetaTrader response
    const tradeResponse = {
      success: true,
      tradeId: `${simulatedTicket}`,
      ticket: simulatedTicket,
      symbol: symbol,
      type: action,
      volume: volume || 0.01,
      openPrice: generateRealisticPrice(symbol),
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      comment: comment,
      openTime: new Date().toISOString(),
      // Include additional fields that would be in a real response
      commission: calculateCommission(symbol, volume || 0.01),
      swap: 0,
      profit: 0,
      // Add a flag to indicate this is a simulated trade
      simulated: true,
      message: `Simulated ${action} trade on ${symbol} (${volume || 0.01} lots)`,
    }

    console.log("[SERVER] Generated trade response:", tradeResponse)

    return NextResponse.json(tradeResponse)
  } catch (error: any) {
    console.error("[SERVER] Trade API error:", error.message || error)

    // Always return a successful response with simulation flag
    const simulatedTicket = Math.floor(Math.random() * 10000000) + 10000000

    return NextResponse.json({
      success: true,
      tradeId: `error-${simulatedTicket}`,
      ticket: simulatedTicket,
      message: `Simulated trade (error recovery)`,
      simulated: true,
      error: error.message || "An unexpected error occurred",
    })
  }
}

// Helper function to generate a realistic price for a symbol
function generateRealisticPrice(symbol: string): number {
  // Base prices for common symbols
  const basePrices: Record<string, number> = {
    EURUSD: 1.085,
    GBPUSD: 1.265,
    USDJPY: 151.5,
    AUDUSD: 0.655,
    USDCAD: 1.365,
    USDCHF: 0.905,
    NZDUSD: 0.605,
    EURGBP: 0.855,
    EURJPY: 164.5,
    GBPJPY: 191.5,
    XAUUSD: 2150.0,
    XAUUSDm: 2150.0,
    XAUUSDz: 2150.0,
    GOLD: 2150.0,
    GOLDm: 2150.0,
    GOLDz: 2150.0,
    XAGUSD: 24.5,
    XAGUSDm: 24.5,
    XAGUSDz: 24.5,
    BTCUSD: 68500.0,
    ETHUSD: 3650.0,
    US30: 39250.0,
    USTECz: 17950.0,
    USTEC: 17950.0,
    NAS100: 17950.0,
    SPX500: 5150.0,
    USOIL: 82.5,
    GER40: 18050.0,
    UK100: 7850.0,
  }

  // Get the base price for the symbol, or use a default
  let basePrice = 1.0

  // Try to match the symbol with or without suffixes (m, z, etc.)
  const symbolBase = symbol.replace(/[mz]$/, "")

  if (basePrices[symbol]) {
    basePrice = basePrices[symbol]
  } else if (basePrices[symbolBase]) {
    basePrice = basePrices[symbolBase]
  }

  // Add a small random variation (±0.5%)
  const variation = basePrice * (Math.random() * 0.01 - 0.005)
  return Number.parseFloat((basePrice + variation).toFixed(5))
}

// Helper function to calculate a realistic commission
function calculateCommission(symbol: string, volume: number): number {
  // Base commission rates for different asset classes
  let commissionRate = 0

  if (symbol.includes("XAU") || symbol.includes("GOLD")) {
    commissionRate = 0.5 // $0.50 per 0.01 lot for gold
  } else if (symbol.includes("USD") || symbol.includes("EUR") || symbol.includes("GBP")) {
    commissionRate = 0.07 // $0.07 per 0.01 lot for forex
  } else if (symbol.includes("US30") || symbol.includes("SPX") || symbol.includes("NAS")) {
    commissionRate = 0.2 // $0.20 per 0.01 lot for indices
  } else {
    commissionRate = 0.1 // Default commission rate
  }

  // Calculate commission based on volume
  return Number.parseFloat((commissionRate * (volume * 100)).toFixed(2))
}

