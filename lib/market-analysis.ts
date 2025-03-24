import { INDICATORS, TIMEFRAMES } from "./trading-constants"

// Types for market analysis
export interface MarketCondition {
  symbol: string
  trend: "BULLISH" | "BEARISH" | "NEUTRAL"
  strength: number // 0-100
  volatility: number // 0-100
  support: number
  resistance: number
  stopLoss: number
  takeProfit: number
  riskRewardRatio: number
  recommendation: "BUY" | "SELL" | "HOLD"
  confidence: number // 0-100
  timestamp: Date
  currentPrice: number // Added current price
}

export interface IndicatorResult {
  name: string
  value: number
  signal: "BUY" | "SELL" | "NEUTRAL"
  timeframe: string
}

// Market analysis service
export class MarketAnalysisService {
  // Analyze market conditions for a symbol
  static async analyzeMarket(symbol: string): Promise<MarketCondition> {
    // In a real implementation, this would use actual market data
    // For now, we'll simulate analysis with realistic but random results

    // Get indicator signals
    const rsiSignal = await this.calculateIndicator(INDICATORS.RSI, symbol, TIMEFRAMES.H1)
    const macdSignal = await this.calculateIndicator(INDICATORS.MACD, symbol, TIMEFRAMES.H1)
    const bbSignal = await this.calculateIndicator(INDICATORS.BOLLINGER_BANDS, symbol, TIMEFRAMES.H1)
    const maSignal = await this.calculateIndicator(INDICATORS.MOVING_AVERAGE, symbol, TIMEFRAMES.H1)

    // Determine overall trend
    const signals = [rsiSignal, macdSignal, bbSignal, maSignal]
    const buySignals = signals.filter((s) => s.signal === "BUY").length
    const sellSignals = signals.filter((s) => s.signal === "SELL").length

    let trend: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL"
    if (buySignals > sellSignals) trend = "BULLISH"
    else if (sellSignals > buySignals) trend = "BEARISH"

    // Calculate trend strength (0-100)
    const strength = Math.abs((buySignals - sellSignals) / signals.length) * 100

    // Simulate price data
    const currentPrice = this.getSymbolPrice(symbol)
    const volatility = Math.random() * 100

    // Calculate support and resistance
    const support = currentPrice * (1 - Math.random() * 0.05)
    const resistance = currentPrice * (1 + Math.random() * 0.05)

    // Calculate stop loss and take profit based on volatility and trend
    const atr = currentPrice * (volatility / 1000) // Simulated ATR
    const stopLoss = trend === "BULLISH" ? currentPrice - atr * 2 : currentPrice + atr * 2

    const takeProfit = trend === "BULLISH" ? currentPrice + atr * 3 : currentPrice - atr * 3

    // Calculate risk-reward ratio
    const riskRewardRatio =
      trend === "BULLISH"
        ? (takeProfit - currentPrice) / (currentPrice - stopLoss)
        : (currentPrice - takeProfit) / (stopLoss - currentPrice)

    // Determine recommendation - always return a recommendation for testing
    let recommendation: "BUY" | "SELL" | "HOLD" = "HOLD"

    // For testing purposes, always generate a BUY or SELL signal
    if (trend === "BULLISH" || Math.random() > 0.5) {
      recommendation = "BUY"
    } else {
      recommendation = "SELL"
    }

    // Calculate confidence level - ensure it's high enough for testing
    const confidence = Math.max(70, (strength + riskRewardRatio * 20) / 2)

    return {
      symbol,
      trend,
      strength,
      volatility,
      support,
      resistance,
      stopLoss,
      takeProfit,
      riskRewardRatio,
      recommendation,
      confidence,
      timestamp: new Date(),
      currentPrice,
    }
  }

  // Calculate indicator value and signal
  private static async calculateIndicator(
    indicator: string,
    symbol: string,
    timeframe: string,
  ): Promise<IndicatorResult> {
    // In a real implementation, this would calculate actual indicator values
    // For now, we'll simulate with random values

    let value = 0
    let signal: "BUY" | "SELL" | "NEUTRAL" = "NEUTRAL"

    switch (indicator) {
      case INDICATORS.RSI:
        value = Math.random() * 100
        if (value < 30) signal = "BUY"
        else if (value > 70) signal = "SELL"
        break

      case INDICATORS.MACD:
        value = Math.random() * 2 - 1 // -1 to 1
        if (value > 0.2) signal = "BUY"
        else if (value < -0.2) signal = "SELL"
        break

      case INDICATORS.BOLLINGER_BANDS:
        // Simulate price position in Bollinger Bands (-1 to 1, where -1 is lower band, 0 is middle, 1 is upper)
        value = Math.random() * 2 - 1
        if (value < -0.8)
          signal = "BUY" // Near lower band
        else if (value > 0.8) signal = "SELL" // Near upper band
        break

      case INDICATORS.MOVING_AVERAGE:
        // Simulate price vs MA (negative means price below MA, positive means price above MA)
        value = Math.random() * 2 - 1
        if (value > 0.3)
          signal = "BUY" // Price well above MA in uptrend
        else if (value < -0.3) signal = "SELL" // Price well below MA in downtrend
        break

      default:
        value = 0
    }

    return {
      name: indicator,
      value,
      signal,
      timeframe,
    }
  }

  // Get simulated price for a symbol
  private static getSymbolPrice(symbol: string): number {
    // In a real implementation, this would get the actual market price
    // For now, we'll return realistic simulated prices based on the symbol

    const symbolMap: Record<string, number> = {
      EURUSDm: 1.0876,
      GBPUSDm: 1.2654,
      USDJPYm: 153.45,
      XAUUSDm: 2345.67,
      BTCUSDm: 67890.5,
      ETHUSDm: 3456.78,
      NASDAQm: 17890.45,
      US30m: 38765.32,
    }

    // Return the mapped price or a random price if symbol not found
    return symbolMap[symbol] || 1000 + Math.random() * 1000
  }
}

