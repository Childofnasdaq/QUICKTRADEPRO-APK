// Define types for the application

// Symbol allowed for trading
export interface AllowedSymbol {
  symbol: string
  minLotSize: number
  maxTrades: number
}

// Portal credentials for authentication
export interface PortalCredentials {
  mentorId: string
  email: string
  licenseKey: string
}

// Trading settings
export interface TradingSettings {
  maxLotSize?: number
  stopLoss?: number
  takeProfit?: number
  maxDailyLoss?: number
  tradingHours?: {
    start: string
    end: string
  }
  tradingDays?: string[]
}

