// Direct MetaApi REST API integration without SDK dependency
// This provides a fallback mechanism when the SDK methods fail

// MetaApi token
const META_API_TOKEN =
  "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJkNTc5MTE3MzUyYjAxOTE2ZmU0MDFhMmI3MzU2MTNhNyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX1dLCJpZ25vcmVSYXRlTGltaXRzIjpmYWxzZSwidG9rZW5JZCI6IjIwMjEwMjEzIiwiaW1wZXJzb25hdGVkIjpmYWxzZSwicmVhbFVzZXJJZCI6ImQ1NzkxMTczNTJiMDE5MTZmZTQwMWEyYjczNTYxM2E3IiwiaWF0IjoxNzQyMjMxMjUyfQ.M1dRkgYSnhf77wFhlZgW0zWDbWQM5BvMGr5N4CD2azzDp-4kuhoed-OvQ6fJsVx7Bfpt_uYSWslzh-RCiaqj34VvkSS5SREsOgcf-OmKClyatNNT7odQ-O0WibR1sxiGD_F-m5daUH4PdTNc08aXyvOn7sUN03GEZC7MZh8TbnYKTLj8BDj7PBDvi4pDRRt1xNcup_vs1pA8tNsjxD_qSLPTty6K55vx9w_P0hAMeirllSCKQoY8ABHuNPHKZLWKdahxg-CGXRXdtqP8V6ZsGqKU4-0UNZWxE1Nrlj3gawSMSdK40TEo07prHdtZKgfuo6kmIWue1_u_wjmfeSdj8attciF5J1pj9XkQlmYW6qC-ajrK-NcJLWHQrcaNgCM7ZEptW7VhxrjEh3cAhJI30qoVaWGCne7cIeTLD40FUXimki4n-nOueo22pHTwKjarZkoTVk9deunpgZfNTKvlGH2ktixFAQ3w-LVvclwc3S63dyhfS_IrWul3KgLfr2HAPIZNhkLjYagwRmZGeHrYbzA0N5QIuIJk6fG-kL4ZYoRTMozwgpewPTyfnQ_DUjjOpxZvkWPcFTZ7piKF4Ih1Fucw0FEmP55br3TikyrUWxK-FmD0Faru77U2bs__OFi9AkBmbNLgDXct-pf9bjh3XysSfRkN7KLWWJvJ4cUPQZk"

// Base URLs for MetaApi REST APIs - NOT used directly from client side anymore
const MT_PROVISIONING_API_URL = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai"
// Update the MetaAPI URL to the correct London endpoint
const MT_CLIENT_API_URL = "https://mt-client-api-v1.london.agiliumtrade.ai"

// Get account by ID using our Next.js API route as proxy
export async function getAccountDirect(accountId: string) {
  try {
    console.log(`Getting account ${accountId} via API route proxy`)

    const response = await fetch(`/api/meta-api?endpoint=users/current/accounts/${accountId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Account data retrieved via API route proxy:", data)

    return data
  } catch (error) {
    console.error("Error getting account via API route proxy:", error)
    return null
  }
}

// Deploy account using our Next.js API route as proxy
export async function deployAccountDirect(accountId: string) {
  try {
    console.log(`Deploying account ${accountId} via API route proxy`)

    const response = await fetch(`/api/meta-api`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint: `users/current/accounts/${accountId}/deploy`,
        method: "POST",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    console.log(`Account ${accountId} deployed successfully via API route proxy`)
    return true
  } catch (error) {
    console.error("Error deploying account via API route proxy:", error)
    return false
  }
}

// Improve the executeTradeDirect function to handle fetch errors better

// Replace the executeTradeDirect function with this improved version:

// Improve the executeTradeDirect function to prioritize real trading:
export async function executeTradeDirect(
  accountId: string,
  symbol: string,
  type: "buy" | "sell",
  lotSize: number,
  stopLoss?: number,
  takeProfit?: number,
  comment = "QUICKTRADE-PRO-DIRECT",
) {
  try {
    console.log(`Executing ${type} trade on ${symbol} (${lotSize} lots) via direct MetaAPI call`)

    // Use the direct-trade endpoint instead of meta-api/trade
    const response = await fetch("/api/direct-trade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login: accountId,
        symbol,
        type,
        volume: lotSize,
        stopLoss,
        takeProfit,
        comment,
      }),
    })

    // Check if response is OK
    if (!response.ok) {
      // Try to get error message, handling both JSON and non-JSON responses
      let errorMessage = ""
      const contentType = response.headers.get("content-type")

      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          errorMessage = errorData.message || `Error: ${response.status} ${response.statusText}`
        } else {
          errorMessage = await response.text()
          // Truncate long HTML responses
          if (errorMessage.length > 100) {
            errorMessage = errorMessage.substring(0, 100) + "..."
          }
        }
      } catch (parseError) {
        errorMessage = `Failed to parse error response: ${parseError.message}`
      }

      console.error("Direct trade API error:", errorMessage)
      return { success: false, message: errorMessage }
    }

    // Try to parse the response as JSON, with error handling
    try {
      const data = await response.json()
      console.log("Direct trade API response:", data)
      return {
        success: true,
        tradeId: data.ticket || data.tradeId || `direct-${Date.now()}`,
        message: data.message || "Trade executed successfully",
      }
    } catch (jsonError) {
      console.error("Error parsing JSON response:", jsonError)
      return {
        success: false,
        message: "Invalid JSON response from API",
      }
    }
  } catch (error: any) {
    console.error("Error executing direct trade:", error)
    return { success: false, message: error.message || "Unknown error" }
  }
}

// Get account information using our Next.js API route as proxy
export async function getAccountInfoDirect(accountId: string) {
  try {
    console.log(`Getting account info for ${accountId} via API route proxy`)

    const response = await fetch(`/api/meta-api?endpoint=users/current/accounts/${accountId}/state`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log("Account info retrieved via API route proxy:", data)

    return {
      balance: data.balance || 10000,
      equity: data.equity || 10000,
      margin: data.margin || 0,
      freeMargin: data.freeMargin || 10000,
      leverage: data.leverage || 100,
      currency: data.currency || "USD",
    }
  } catch (error) {
    console.error("Error getting account info via API route proxy:", error)

    // Return simulated data as fallback
    return {
      balance: 10000,
      equity: 10000,
      margin: 0,
      freeMargin: 10000,
      leverage: 100,
      currency: "USD",
    }
  }
}

