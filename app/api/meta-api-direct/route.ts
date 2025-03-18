// Improve the direct API route for more reliable trade execution
import { NextResponse } from "next/server"

// Use the provided MetaAPI token with all necessary permissions
const META_API_TOKEN =
  "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJkNTc5MTE3MzUyYjAxOTE2ZmU0MDFhMmI3MzU2MTNhNyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19XSwiaWdub3JlUmF0ZUxpbWl0cyI6ZmFsc2UsInRva2VuSWQiOiIyMDIxMDIxMyIsImltcGVyc29uYXRlZCI6ZmFsc2UsInJlYWxVc2VySWQiOiJkNTc5MTE3MzUyYjAxOTE2ZmU0MDFhMmI3MzU2MTNhNyIsImlhdCI6MTc0MjI0OTY1M30.fZnTwobCD7XpGAj4IAsxcW4T5CG-qkQNYwlDZZjPsU7GPKzazQ1_acTd71ojtF_4VAU-YYKiZQt6iWoi2sBWkoU_qYRGOm_FB_9SRHD5MD5VNl-odHYRPv_bsGexHLPrH0CcoheL1kOYvHNnMkHUnCFWGjCvSb_B-TGZxsfMLAU8ZkQy4tl4KJzIm02Dfm6E_z9sCF505WNTTUnip2WcoQsMhmM6YKRfNxDYIhpe1naRS_dT5QSFKiCJ1UPjHvIp5w5WlaVOw7bmYCuGQZUxXEc-UyKGexKPz8SaWlPGqVdi77r7CXTuRxkBmTeu8ropvltp0UbrGEmfzN0eWLqFWZx91IYkFhqnOTXQAtMP5x4SAozIg1Kjkn1cc0oZHYQUDnvI3inheSibaV98c7zmr-dRNwVuDWUEs8DkWzlGy43xGH44t9MA-YreqdiJnoo9wdYb1W8rJ0KxS8VduBHs_lXH22f74MBquUtP1e391vnVgNv1O_QXgiSbYreDsHo1hvw34KoZo771x7l8aFTq7cCkuuCPU0xDti1FJiuEpxzzN-W_EJ32xe5Va1EY3_Uxrp_TPGXaVpq4hhIZyuPWDpylXCaUZeHqStIxtVduztM6F6gR9r2Y1nQAkucIbgwxErzIKGNjeCmDXEp9Jgp2B29icbNJh16Qz_Uw32dXu28"

// This is a direct API route for MetaAPI trading
// It uses the MetaApi REST API directly for trading

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accountId, symbol, type, volume, stopLoss, takeProfit, comment } = body

    console.log("[SERVER] Direct MetaApi trade request received:", body)

    if (!accountId || !symbol || !type) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(
      `[SERVER] Processing MetaApi trade: ${type} ${volume || 0.01} ${symbol} with SL: ${stopLoss}, TP: ${takeProfit}, comment: ${comment || "QUICKTRADE-PRO"}`,
    )

    // Use the MetaApi REST API directly
    try {
      // Format the request for MetaApi
      const requestBody: any = {
        actionType: type === "buy" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
        symbol,
        volume: volume || 0.01,
        comment: comment || "QUICKTRADE-PRO",
      }

      // Add stop loss and take profit if provided
      if (stopLoss) {
        requestBody.stopLoss = stopLoss
      }

      if (takeProfit) {
        requestBody.takeProfit = takeProfit
      }

      console.log("[SERVER] Sending request to MetaApi:", requestBody)

      // Make the API call to MetaApi
      const response = await fetch(
        `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${accountId}/trade`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "auth-token": META_API_TOKEN,
          },
          body: JSON.stringify(requestBody),
        },
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[SERVER] MetaApi error (${response.status}): ${errorText}`)
        throw new Error(`MetaApi error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log(`[SERVER] MetaApi trade response:`, data)

      return NextResponse.json({
        success: true,
        positionId: data.positionId || data.orderId || `meta-direct-${Date.now()}`,
        message: `Successfully opened ${type} trade on ${symbol} (${volume} lots)`,
      })
    } catch (apiError: any) {
      console.error("[SERVER] MetaApi direct API error:", apiError.message || apiError)

      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: apiError.message || "An error occurred while executing the trade",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[SERVER] Direct trade API error:", error.message || error)

    // Return error response
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred",
      },
      { status: 500 },
    )
  }
}

