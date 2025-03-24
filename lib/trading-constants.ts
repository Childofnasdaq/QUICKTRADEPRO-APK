// Trading constants
export const COMMENT_PREFIX = "QuickTrade Pro"
export const DEFAULT_STOP_LOSS_PIPS = 50
export const DEFAULT_TAKE_PROFIT_PIPS = 100
export const DEFAULT_LOT_SIZE = 0.01
export const MAX_TRADES_DEFAULT = 10

// Market analysis thresholds
export const TREND_STRENGTH_THRESHOLD = 70 // 0-100 scale
export const MIN_RISK_REWARD_RATIO = 1.5
export const MAX_SPREAD_PIPS = 10

// Trading server settings
export const TRADING_SERVER_PORT = 5555
export const TRADING_SERVER_HOST = "localhost"

// Trading signals
export const SIGNAL_TYPES = {
  BUY: "BUY",
  SELL: "SELL",
  CLOSE: "CLOSE",
  NONE: "NONE",
}

// Trading timeframes
export const TIMEFRAMES = {
  M1: "M1",
  M5: "M5",
  M15: "M15",
  M30: "M30",
  H1: "H1",
  H4: "H4",
  D1: "D1",
  W1: "W1",
  MN1: "MN1",
}

// Technical indicators
export const INDICATORS = {
  RSI: "RSI",
  MACD: "MACD",
  BOLLINGER_BANDS: "BOLLINGER_BANDS",
  MOVING_AVERAGE: "MOVING_AVERAGE",
  STOCHASTIC: "STOCHASTIC",
  ATR: "ATR",
}

