// Enhanced trading logic to prevent simultaneous buy/sell trades
// and improve market analysis

import { TradeDirection, TradeStatus } from "@/types/meta-api"

// Check if there are any active trades for the same symbol
export async function hasActiveTrades(userId: string, accountId: string, symbol: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/meta-api/active-trades?userId=${userId}&accountId=${accountId}&symbol=${symbol}`)

    if (!response.ok) {
      throw new Error("Failed to fetch active trades")
    }

    const data = await response.json()
    return data.activeTrades > 0
  } catch (error) {
    console.error("Error checking active trades:", error)
    return false // Default to false to prevent blocking trades unnecessarily
  }
}

// Check if there are conflicting trades (opposite direction)
export async function hasConflictingTrades(
  userId: string,
  accountId: string,
  symbol: string,
  direction: TradeDirection,
): Promise<boolean> {
  try {
    const response = await fetch(`/api/meta-api/active-trades?userId=${userId}&accountId=${accountId}&symbol=${symbol}`)

    if (!response.ok) {
      throw new Error("Failed to fetch active trades")
    }

    const data = await response.json()

    // Check if there are trades in the opposite direction
    return data.trades.some((trade: any) => trade.direction !== direction && trade.status === TradeStatus.ACTIVE)
  } catch (error) {
    console.error("Error checking conflicting trades:", error)
    return false
  }
}

// Calculate optimal trailing stop based on market volatility
export function calculateTrailingStop(
  price: number,
  direction: TradeDirection,
  volatility = 0.01, // Default 1% volatility
): number {
  // Base trailing stop percentage (adjust based on volatility)
  const basePercentage = Math.max(0.005, volatility * 0.5) // Minimum 0.5%

  // Calculate trailing stop distance
  const trailingDistance = price * basePercentage

  // Apply trailing stop based on direction
  if (direction === TradeDirection.BUY) {
    return price - trailingDistance
  } else {
    return price + trailingDistance
  }
}

// Analyze market conditions to determine if it's a good time to trade
export async function analyzeMarketConditions(
  symbol: string,
  direction: TradeDirection,
): Promise<{
  shouldTrade: boolean
  confidence: number
  reason?: string
}> {
  try {
    // Fetch market data
    const response = await fetch(`/api/market-analysis?symbol=${symbol}`)

    if (!response.ok) {
      throw new Error("Failed to fetch market data")
    }

    const data = await response.json()

    // Extract market indicators
    const { trend, rsi, volatility, volume, support, resistance } = data

    let shouldTrade = false
    let confidence = 0
    let reason = ""

    // Analyze for BUY signal
    if (direction === TradeDirection.BUY) {
      // Check for oversold conditions (RSI < 30)
      if (rsi < 30) {
        confidence += 0.3
        reason += "Oversold conditions. "
      }

      // Check if price is near support
      const priceToSupport = (data.price - support) / support
      if (priceToSupport < 0.01 && priceToSupport > -0.01) {
        confidence += 0.3
        reason += "Price near support level. "
      }

      // Check for uptrend
      if (trend === "up") {
        confidence += 0.2
        reason += "Upward trend detected. "
      }

      // Check volume
      if (volume > data.averageVolume * 1.2) {
        confidence += 0.2
        reason += "Above average volume. "
      }
    }
    // Analyze for SELL signal
    else {
      // Check for overbought conditions (RSI > 70)
      if (rsi > 70) {
        confidence += 0.3
        reason += "Overbought conditions. "
      }

      // Check if price is near resistance
      const priceToResistance = (resistance - data.price) / resistance
      if (priceToResistance < 0.01 && priceToResistance > -0.01) {
        confidence += 0.3
        reason += "Price near resistance level. "
      }

      // Check for downtrend
      if (trend === "down") {
        confidence += 0.2
        reason += "Downward trend detected. "
      }

      // Check volume
      if (volume > data.averageVolume * 1.2) {
        confidence += 0.2
        reason += "Above average volume. "
      }
    }

    // Determine if we should trade based on confidence
    shouldTrade = confidence >= 0.5

    return {
      shouldTrade,
      confidence,
      reason: reason || "No strong signals detected.",
    }
  } catch (error) {
    console.error("Error analyzing market conditions:", error)
    return {
      shouldTrade: false,
      confidence: 0,
      reason: "Error analyzing market data.",
    }
  }
}

