// MetaAPI configuration
const META_API_TOKEN =
  "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJkNTc5MTE3MzUyYjAxOTE2ZmU0MDFhMmI3MzU2MTNhNyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19XSwiaWdub3JlUmF0ZUxpbWl0cyI6ZmFsc2UsInRva2VuSWQiOiIyMDIxMDIxMyIsImltcGVyc29uYXRlZCI6ZmFsc2UsInJlYWxVc2VySWQiOiJkNTc5MTE3MzUyYjAxOTE2ZmU0MDFhMmI3MzU2MTNhNyIsImlhdCI6MTc0MjgzNjkwMX0.P0R7C53N62g4otV0eFg7asYjYtmP56QUvcpBzf5wzLP_zwf5bxXW5-ozgCMyKRqW--SJgbHUK2BgDXem94fyAtS_CqceEpB_awsVGcIB21RFVRLQT7JmY7lz7ZIkzqkTC6UIGK9p0_g95v8XThcFb8oa0rgI2SgfGoWEoRoFYjhGe8G1imVHDuoeKJaHMLOb_yd82OId_EK_O8uxFCr3KPXsjrBRjwKBwnO3kBsFYL_w2HwVtTfs2cL7h5-trfMyLDcX1v6Vhqmdop6pn6mhISNLJoNbWH9oIl46k5j7xgm_AL7w1iw7HNn72janCRe-C1dsOwUiJNStJHR96Sh9jTxBlg9KZ8qThz9vSJOTqyAD0UiyST51tTJ4kNzjLCBQAUgibT17k-BqNLEP0RnXTMiQSTs2aa9Z5oeSJip83ueJGBkdkBkFC4BNwJOhGKT08gyIEpvcuXlAJ2stHAl0wuVF6C5scz4LFtQWBS_uH8VSKjQ23hfTr5MVzSJBMcUPqLZl-KsGjVHP2VcHdivPq7F9yYEsnkU_0miL5uzoOxv1J78vJBIfpEt4c5HvSMmytqbH_T7ETurgIH0qYrrxhltzInL3QoM18RLonrBLueqtS7SgPxtFoMphx9JiDZFn084vEcGMltGhNSZ-OT3Kq90_zD1QbzFu3OkeaGhUPRo"

// Account types
export enum AccountType {
  MT4 = "MT4",
  MT5 = "MT5",
}

// Account connection interface
export interface MetaApiAccountConnection {
  id: string
  name: string
  login: string
  server: string
  type: AccountType
  state: "DEPLOYED" | "DEPLOYING" | "UNDEPLOYED" | "DELETING"
  connectionStatus: "CONNECTED" | "DISCONNECTED" | "CONNECTING"
}

// MetaAPI client class
class MetaApiClient {
  private static instance: MetaApiClient

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): MetaApiClient {
    if (!MetaApiClient.instance) {
      MetaApiClient.instance = new MetaApiClient()
    }
    return MetaApiClient.instance
  }

  /**
   * Connect to a MetaTrader account
   * This is a simplified version that simulates the connection for now
   */
  public async connectAccount(
    login: string,
    password: string,
    server: string,
    type: AccountType,
  ): Promise<MetaApiAccountConnection> {
    try {
      console.log(`Connecting ${type} account: ${login}@${server}`)

      // Generate a unique ID for the account
      const accountId = `meta-${Date.now()}-${Math.floor(Math.random() * 10000)}`

      // Return a simulated account connection
      return {
        id: accountId,
        name: `${type} - ${login}@${server}`,
        login,
        server,
        type,
        state: "DEPLOYED",
        connectionStatus: "CONNECTED",
      }
    } catch (error) {
      console.error("Error connecting to MetaTrader account:", error)
      throw new Error(
        `Failed to connect to MetaTrader account: ${error instanceof Error ? error.message : "Unknown error"}`,
      )
    }
  }

  /**
   * Execute a trade
   * This is a simplified version that simulates trade execution for now
   */
  public async executeTrade(
    accountId: string,
    symbol: string,
    type: "BUY" | "SELL",
    volume: number,
    stopLoss?: number,
    takeProfit?: number,
  ): Promise<any> {
    try {
      console.log(`Executing ${type} trade for ${symbol} on account ${accountId}`)

      // Generate a unique ID for the position
      const positionId = `pos-${Date.now()}-${Math.floor(Math.random() * 10000)}`

      // Return a simulated trade result
      return {
        positionId,
        symbol,
        type,
        volume,
        openPrice: type === "BUY" ? 1.1234 : 1.1236,
        stopLoss,
        takeProfit,
        comment: "QuickTrade Pro",
      }
    } catch (error) {
      console.error(`Error executing trade on account ${accountId}:`, error)
      throw new Error(`Failed to execute trade: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get account information
   * This is a simplified version that returns simulated account info
   */
  public async getAccountInfo(accountId: string): Promise<any> {
    try {
      console.log(`Getting account info for ${accountId}`)

      // Return simulated account info
      return {
        balance: 10000 + Math.random() * 5000,
        equity: 10000 + Math.random() * 5000,
        margin: 1000 + Math.random() * 500,
        freeMargin: 9000 + Math.random() * 4500,
        leverage: "1:100",
        marginLevel: 200 + Math.random() * 300,
      }
    } catch (error) {
      console.error(`Error getting account info for ${accountId}:`, error)
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Get open positions
   * This is a simplified version that returns simulated positions
   */
  public async getPositions(accountId: string): Promise<any[]> {
    try {
      console.log(`Getting positions for account ${accountId}`)

      // Generate 0-3 random positions
      const count = Math.floor(Math.random() * 4)
      const positions = []

      for (let i = 0; i < count; i++) {
        const type = Math.random() > 0.5 ? "BUY" : "SELL"
        const symbol = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD"][Math.floor(Math.random() * 4)]
        const openPrice = type === "BUY" ? 1.1234 : 1.1236

        positions.push({
          id: `pos-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          symbol,
          type,
          volume: 0.01 * (Math.floor(Math.random() * 10) + 1),
          openPrice,
          stopLoss: type === "BUY" ? openPrice * 0.99 : openPrice * 1.01,
          takeProfit: type === "BUY" ? openPrice * 1.01 : openPrice * 0.99,
          profit: Math.random() * 200 - 100,
        })
      }

      return positions
    } catch (error) {
      console.error(`Error getting positions for account ${accountId}:`, error)
      throw new Error(`Failed to get positions: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }
}

export default MetaApiClient.getInstance()

