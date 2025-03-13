// Trading service to handle MT4/MT5 trade execution
export async function executeMTTrade(
  symbol: string,
  direction: string,
  lotSize: string,
  platform: string,
  login: string,
  server: string,
) {
  try {
    // Get current price to calculate SL and TP
    const currentPrice = await getMarketPrice(symbol)

    // Calculate stop loss and take profit based on direction and symbol
    const pipsMultiplier = getPipsMultiplier(symbol)
    const stopLossPips = direction === "BUY" ? 50 : 50 // 50 pips SL
    const takeProfitPips = direction === "BUY" ? 100 : 100 // 100 pips TP

    const stopLoss =
      direction === "BUY" ? currentPrice - stopLossPips * pipsMultiplier : currentPrice + stopLossPips * pipsMultiplier

    const takeProfit =
      direction === "BUY"
        ? currentPrice + takeProfitPips * pipsMultiplier
        : currentPrice - takeProfitPips * pipsMultiplier

    // Send trade to API
    const response = await fetch("/api/trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        platform,
        login,
        server,
        symbol,
        direction,
        lotSize,
        stopLoss,
        takeProfit,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Failed to execute trade")
    }

    return await response.json()
  } catch (error) {
    console.error("Trade execution error:", error)
    throw error
  }
}

// Helper function to get current market price
// In a real app, this would fetch from a market data API
async function getMarketPrice(symbol: string): Promise<number> {
  // Simulated market prices
  const basePrices: Record<string, number> = {
    XAUUSDm: 2350.0,
    EURUSD: 1.08,
    GBPUSD: 1.27,
    USDJPY: 155.0,
    XAUUSD: 2350.0,
    BTCUSD: 68500.0,
    US30: 39200.0,
    USOIL: 78.5,
  }

  const basePrice = basePrices[symbol] || 100.0
  const variance = basePrice * 0.0005 // 0.05% variance
  return basePrice + (Math.random() * variance * 2 - variance)
}

// Helper function to get pips multiplier based on symbol
function getPipsMultiplier(symbol: string): number {
  if (symbol.includes("JPY")) return 0.01
  if (symbol.includes("XAU") || symbol.includes("GOLD")) return 0.1
  if (symbol.includes("BTC")) return 1.0
  if (symbol.includes("US30") || symbol.includes("NAS")) return 1.0
  return 0.0001 // Default for forex pairs
}

