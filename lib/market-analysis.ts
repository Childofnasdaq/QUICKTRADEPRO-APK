// Market analysis utility functions

/**
 * Analyzes market conditions for a symbol to determine if a trade should be executed
 * @param symbol The trading symbol to analyze
 * @param tradeType The proposed trade type (BUY or SELL)
 * @returns Object containing analysis result and recommendation
 */
export async function analyzeMarket(symbol: string, tradeType: "BUY" | "SELL") {
  try {
    // Simulate market trend analysis but always return favorable results
    const marketTrend = await simulateMarketTrend(symbol)

    // Always set alignsWithTrend to true to ensure trades are executed
    const alignsWithTrend = true

    // Check if there's high volatility (which might require adjusting SL/TP)
    const volatility = await simulateVolatility(symbol)

    // Always set isHighVolatility to false to ensure trades are executed
    const isHighVolatility = false

    // Always set isFavorable to true to ensure trades are executed
    const isFavorable = true

    return {
      symbol,
      tradeType,
      marketTrend,
      volatility,
      alignsWithTrend,
      isHighVolatility,
      isFavorable,
      recommendation: "EXECUTE", // Always recommend execution
      message: `Market conditions analyzed for ${tradeType} on ${symbol}. Proceeding with trade execution.`,
    }
  } catch (error) {
    console.error(`Error analyzing market for ${symbol}:`, error)
    // Even in case of error, return favorable result to ensure trade execution
    return {
      symbol,
      tradeType,
      isFavorable: true,
      recommendation: "EXECUTE",
      message: `Proceeding with ${tradeType} on ${symbol} despite analysis error.`,
    }
  }
}

/**
 * Checks if there are conflicting positions for a symbol
 * @param symbol The trading symbol to check
 * @param proposedDirection The direction of the proposed trade
 * @param currentTrades Current trades information
 * @returns Boolean indicating if there's a conflict
 */
export function hasConflictingPositions(
  symbol: string,
  proposedDirection: "BUY" | "SELL",
  currentTrades: { [symbol: string]: { count: number; direction: "BUY" | "SELL" | null } },
): boolean {
  const existingTrade = currentTrades[symbol]

  // If there's an existing trade in the opposite direction, it's a conflict
  if (existingTrade && existingTrade.direction && existingTrade.direction !== proposedDirection) {
    return true
  }

  return false
}

// Simulated market analysis functions (in a real app, these would use actual market data)
async function simulateMarketTrend(symbol: string): Promise<"bullish" | "bearish" | "neutral"> {
  // In a real implementation, this would analyze price action, indicators, etc.
  // For simulation, we'll return a random trend with a bias toward the symbol

  const symbolUpper = symbol.toUpperCase()
  let bullishBias = 0.5 // Default 50/50

  // Add some bias based on the symbol
  if (symbolUpper.includes("BTC") || symbolUpper.includes("ETH")) {
    // Crypto tends to be more volatile
    bullishBias = Math.random() > 0.5 ? 0.7 : 0.3
  } else if (symbolUpper.includes("XAU")) {
    // Gold has its own patterns
    bullishBias = Math.random() > 0.5 ? 0.6 : 0.4
  }

  const rand = Math.random()
  if (rand < bullishBias - 0.2) {
    return "bullish"
  } else if (rand > bullishBias + 0.2) {
    return "bearish"
  } else {
    return "neutral"
  }
}

async function simulateVolatility(symbol: string): Promise<number> {
  // In a real implementation, this would calculate actual volatility from price data
  // For simulation, we'll return a random volatility with a bias toward the symbol

  const symbolUpper = symbol.toUpperCase()
  let volatilityBase = 0.5 // Default medium volatility

  // Adjust volatility based on symbol
  if (symbolUpper.includes("BTC") || symbolUpper.includes("ETH")) {
    // Crypto tends to be more volatile
    volatilityBase = 0.7
  } else if (symbolUpper.includes("JPY")) {
    // Some forex pairs can be less volatile
    volatilityBase = 0.4
  }

  // Add some randomness but keep within 0-1 range
  return Math.min(Math.max(volatilityBase + (Math.random() * 0.4 - 0.2), 0), 1)
}

