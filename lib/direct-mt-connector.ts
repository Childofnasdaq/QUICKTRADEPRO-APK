/**
 * Direct MetaTrader connector
 * This connects directly to a local MT4/MT5 terminal running the provided Expert Advisor
 */

// MT order types
const ORDER_TYPE = {
  BUY: 0,
  SELL: 1,
  BUY_LIMIT: 2,
  SELL_LIMIT: 3,
  BUY_STOP: 4,
  SELL_STOP: 5,
}

// Connection parameters
export type MTDirectConfig = {
  platform: "MT4" | "MT5"
  port: number // Local port where MT4/MT5 EA is listening (default: 8080)
}

// Trade parameters
export type DirectTradeParams = {
  symbol: string
  orderType: number // Use ORDER_TYPE constants
  volume: number
  price?: number // For market orders, leave undefined
  slippage?: number
  stopLoss?: number
  takeProfit?: number
  comment?: string
  magicNumber?: number
}

// Add a function to get the configured port
export function getConfiguredPort(): number {
  const storedPort = localStorage.getItem("quicktrade_ea_port")
  if (storedPort && !isNaN(Number.parseInt(storedPort))) {
    return Number.parseInt(storedPort)
  }
  return 8080 // Default port
}

/**
 * Connect to locally running MetaTrader terminal
 * Requires the QuickTradePro EA to be installed and running
 */
export async function testMTConnection(config?: MTDirectConfig): Promise<boolean> {
  // If no config is provided, use the configured port
  if (!config) {
    const port = getConfiguredPort()
    config = { platform: "MT5", port }
  }
  try {
    // Use a timeout to prevent long waiting times if the EA is not running
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`http://localhost:${config.port}/ping`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      // Add mode: 'no-cors' as a fallback option
      mode: "cors",
    }).catch((error) => {
      // If CORS error, we'll try a different approach
      console.log("Initial connection attempt failed, trying alternative method")
      // Return null to indicate we need to try alternative method
      return null
    })

    clearTimeout(timeoutId)

    // If the first attempt failed with CORS, try an alternative approach
    if (!response) {
      // Set a flag in localStorage that we're checking connection
      localStorage.setItem("mt_connection_check", "pending")

      // Create an invisible iframe to try connecting (this can bypass some CORS restrictions)
      const iframe = document.createElement("iframe")
      iframe.style.display = "none"
      iframe.src = `http://localhost:${config.port}/ping`
      document.body.appendChild(iframe)

      // Wait a moment and check if we got a response via localStorage
      await new Promise((resolve) => setTimeout(resolve, 1000))
      document.body.removeChild(iframe)

      // Check if our connection was successful via the EA updating localStorage
      const connectionStatus = localStorage.getItem("mt_connection_status")
      if (connectionStatus === "connected") {
        localStorage.removeItem("mt_connection_check")
        localStorage.removeItem("mt_connection_status")
        return true
      }

      // If we still couldn't connect, try WebSocket as a last resort
      try {
        const ws = new WebSocket(`ws://localhost:${config.port}/ws`)
        return new Promise((resolve) => {
          ws.onopen = () => {
            ws.close()
            resolve(true)
          }
          ws.onerror = () => {
            resolve(false)
          }
          // Set a timeout in case the connection hangs
          setTimeout(() => resolve(false), 2000)
        })
      } catch (wsError) {
        console.error("WebSocket connection failed:", wsError)
        return false
      }
    }

    if (!response.ok) {
      throw new Error(`MT connection failed: ${response.status}`)
    }

    const data = await response.json()
    return data.connected
  } catch (error) {
    console.error("MT connection error:", error)
    // Return false instead of throwing an error for better user experience
    return false
  }
}

/**
 * Get account information from MT terminal
 */
export async function getMTAccountInfo(config?: MTDirectConfig): Promise<any> {
  if (!config) {
    const port = getConfiguredPort()
    config = { platform: "MT5", port }
  }
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`http://localhost:${config.port}/account`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    }).catch(() => null)

    clearTimeout(timeoutId)

    if (!response) {
      return { success: false, message: "Cannot connect to MetaTrader EA" }
    }

    if (!response.ok) {
      return { success: false, message: `MT account info failed: ${response.status}` }
    }

    return await response.json()
  } catch (error) {
    console.error("MT account info error:", error)
    return { success: false, message: "Failed to get account info from MetaTrader" }
  }
}

/**
 * Execute a trade directly on MT terminal
 */
export async function executeMTDirectTrade(params: DirectTradeParams, config?: MTDirectConfig): Promise<any> {
  if (!config) {
    const port = getConfiguredPort()
    config = { platform: "MT5", port }
  }
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(`http://localhost:${config.port}/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
      signal: controller.signal,
    }).catch(() => null)

    clearTimeout(timeoutId)

    if (!response) {
      return { success: false, message: "Cannot connect to MetaTrader EA" }
    }

    if (!response.ok) {
      const errorData = await response.json()
      return { success: false, message: errorData.message || `MT trade failed: ${response.status}` }
    }

    return await response.json()
  } catch (error) {
    console.error("MT trade execution error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to execute trade on MetaTrader",
    }
  }
}

/**
 * Get current market price for a symbol
 */
export async function getMTMarketPrice(symbol: string, config?: MTDirectConfig): Promise<any> {
  if (!config) {
    const port = getConfiguredPort()
    config = { platform: "MT5", port }
  }
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(`http://localhost:${config.port}/price?symbol=${encodeURIComponent(symbol)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    }).catch(() => null)

    clearTimeout(timeoutId)

    if (!response) {
      return { success: false, message: "Cannot connect to MetaTrader EA" }
    }

    if (!response.ok) {
      return { success: false, message: `MT price request failed: ${response.status}` }
    }

    return await response.json()
  } catch (error) {
    console.error("MT price request error:", error)
    return { success: false, message: "Failed to get market price from MetaTrader" }
  }
}

// Helper function to convert direction string to MT order type
export function getOrderType(direction: string): number {
  return direction.toUpperCase() === "BUY" ? ORDER_TYPE.BUY : ORDER_TYPE.SELL
}

