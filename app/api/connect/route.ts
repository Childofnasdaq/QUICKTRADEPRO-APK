import { NextResponse } from "next/server"

// Use the updated MetaAPI token with all necessary permissions
const META_API_TOKEN =
  "eyJhbGciOiJSUzUxMiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiJkNTc5MTE3MzUyYjAxOTE2ZmU0MDFhMmI3MzU2MTNhNyIsImFjY2Vzc1J1bGVzIjpbeyJpZCI6InRyYWRpbmctYWNjb3VudC1tYW5hZ2VtZW50LWFwaSIsIm1ldGhvZHMiOlsidHJhZGluZy1hY2NvdW50LW1hbmFnZW1lbnQtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVzdC1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcnBjLWFwaSIsIm1ldGhvZHMiOlsibWV0YWFwaS1hcGk6d3M6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6Im1ldGFhcGktcmVhbC10aW1lLXN0cmVhbWluZy1hcGkiLCJtZXRob2RzIjpbIm1ldGFhcGktYXBpOndzOnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19LHsiaWQiOiJtZXRhc3RhdHMtYXBpIiwibWV0aG9kcyI6WyJtZXRhc3RhdHMtYXBpOnJlc3Q6cHVibGljOio6KiJdLCJyb2xlcyI6WyJyZWFkZXIiLCJ3cml0ZXIiXSwicmVzb3VyY2VzIjpbIio6JFVTRVJfSUQkOioiXX0seyJpZCI6InJpc2stbWFuYWdlbWVudC1hcGkiLCJtZXRob2RzIjpbInJpc2stbWFuYWdlbWVudC1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoiY29weWZhY3RvcnktYXBpIiwibWV0aG9kcyI6WyJjb3B5ZmFjdG9yeS1hcGk6cmVzdDpwdWJsaWM6KjoqIl0sInJvbGVzIjpbInJlYWRlciIsIndyaXRlciJdLCJyZXNvdXJjZXMiOlsiKjokVVNFUl9JRCQ6KiJdfSx7ImlkIjoibXQtbWFuYWdlci1hcGkiLCJtZXRob2RzIjpbIm10LW1hbmFnZXItYXBpOnJlc3Q6ZGVhbGluZzoqOioiLCJtdC1tYW5hZ2VyLWFwaTpyZXN0OnB1YmxpYzoqOioiXSwicm9sZXMiOlsicmVhZGVyIiwid3JpdGVyIl0sInJlc291cmNlcyI6WyIqOiRVU0VSX0lEJDoqIl19XSwiaWdub3JlUmF0ZUxpbWl0cyI6ZmFsc2UsInRva2VuSWQiOiIyMDIxMDIxMyIsImltcGVyc29uYXRlZCI6ZmFsc2UsInJlYWxVc2VySWQiOiJkNTc5MTE3MzUyYjAxOTE2ZmU0MDFhMmI3MzU2MTNhNyIsImlhdCI6MTc0MjI0OTY1M30.fZnTwobCD7XpGAj4IAsxcW4T5CG-qkQNYwlDZZjPsU7GPKzazQ1_acTd71ojtF_4VAU-YYKiZQt6iWoi2sBWkoU_qYRGOm_FB_9SRHD5MD5VNl-odHYRPv_bsGexHLPrH0CcoheL1kOYvHNnMkHUnCFWGjCvSb_B-TGZxsfMLAU8ZkQy4tl4KJzIm02Dfm6E_z9sCF505WNTTUnip2WcoQsMhmM6YKRfNxDYIhpe1naRS_dT5QSFKiCJ1UPjHvIp5w5WlaVOw7bmYCuGQZUxXEc-UyKGexKPz8SaWlPGqVdi77r7CXTuRxkBmTeu8ropvltp0UbrGEmfzN0eWLqFWZx91IYkFhqnOTXQAtMP5x4SAozIg1Kjkn1cc0oZHYQUDnvI3inheSibaV98c7zmr-dRNwVuDWUEs8DkWzlGy43xGH44t9MA-YreqdiJnoo9wdYb1W8rJ0KxS8VduBHs_lXH22f74MBquUtP1e391vnVgNv1O_QXgiSbYreDsHo1hvw34KoZo771x7l8aFTq7cCkuuCPU0xDti1FJiuEpxzzN-W_EJ32xe5Va1EY3_Uxrp_TPGXaVpq4hhIZyuPWDpylXCaUZeHqStIxtVduztM6F6gR9r2Y1nQAkucIbgwxErzIKGNjeCmDXEp9Jgp2B29icbNJh16Qz_Uw32dXu28"

// MetaApi API URL
const META_API_URL = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { login, password, server, platform = "mt5" } = body

    if (!login || !password || !server) {
      return NextResponse.json({ error: "Login, password, and server are required" }, { status: 400 })
    }

    console.log(`[SERVER] Creating MetaApi account for ${platform} with login ${login} and server ${server}`)

    // Instead of using the SDK, we'll make a direct API call to MetaApi
    try {
      // Prepare the request body
      const accountData = {
        name: `User ${login}`,
        type: "cloud",
        login: login,
        password: password,
        server: server,
        platform: platform.toLowerCase(),
        application: "QuickTradePro",
        magic: 123456,
        // Fix for the quote streaming issue - either disable it or set a higher interval
        quoteStreamingIntervalInSeconds: 2.5, // Set to 2.5 seconds instead of 0
        reliability: "high",
        tags: ["QuickTradePro"],
      }

      // Make the API call to create the account
      const response = await fetch(`${META_API_URL}/users/current/accounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": META_API_TOKEN,
        },
        body: JSON.stringify(accountData),
      })

      // Handle the response
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[SERVER] MetaApi account creation error (${response.status}): ${errorText}`)

        // If it's the specific quote streaming error, try again with disabled quote streaming
        if (errorText.includes("quote streaming interval") || errorText.includes("resource slots")) {
          console.log("[SERVER] Retrying with disabled quote streaming")

          // Modify the account data to disable quote streaming
          accountData.quoteStreamingEnabled = false
          delete accountData.quoteStreamingIntervalInSeconds

          // Try again with modified settings
          const retryResponse = await fetch(`${META_API_URL}/users/current/accounts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "auth-token": META_API_TOKEN,
            },
            body: JSON.stringify(accountData),
          })

          if (!retryResponse.ok) {
            const retryErrorText = await retryResponse.text()
            console.error(`[SERVER] Retry failed (${retryResponse.status}): ${retryErrorText}`)
            return NextResponse.json(
              {
                error: `MetaApi error: ${retryResponse.status} ${retryResponse.statusText} - ${retryErrorText}`,
              },
              { status: retryResponse.status },
            )
          }

          const retryData = await retryResponse.json()
          console.log(`[SERVER] MetaApi account created successfully on retry:`, retryData)

          // Now deploy the account
          try {
            const deployResponse = await fetch(`${META_API_URL}/users/current/accounts/${retryData.id}/deploy`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "auth-token": META_API_TOKEN,
              },
            })

            if (!deployResponse.ok) {
              console.warn(`[SERVER] Failed to deploy account ${retryData.id}, but account was created`)
            } else {
              console.log(`[SERVER] Account ${retryData.id} deployed successfully`)
            }
          } catch (deployError) {
            console.warn(`[SERVER] Error deploying account: ${deployError}`)
          }

          return NextResponse.json({
            success: true,
            accountId: retryData.id,
            message: `Successfully connected to ${platform} account`,
          })
        }

        return NextResponse.json(
          {
            error: `MetaApi error: ${response.status} ${response.statusText} - ${errorText}`,
          },
          { status: response.status },
        )
      }

      const data = await response.json()
      console.log(`[SERVER] MetaApi account created successfully:`, data)

      // Now deploy the account
      const deployResponse = await fetch(`${META_API_URL}/users/current/accounts/${data.id}/deploy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": META_API_TOKEN,
        },
      })

      if (!deployResponse.ok) {
        console.warn(`[SERVER] Failed to deploy account ${data.id}, but account was created`)
      } else {
        console.log(`[SERVER] Account ${data.id} deployed successfully`)
      }

      return NextResponse.json({
        success: true,
        accountId: data.id,
        message: `Successfully connected to ${platform} account`,
      })
    } catch (error: any) {
      console.error("[SERVER] Error connecting account:", error)
      return NextResponse.json(
        {
          error: error.message || "Failed to connect account",
        },
        { status: 500 },
      )
    }
  } catch (error: any) {
    console.error("[SERVER] Connect API error:", error.message || error)
    return NextResponse.json(
      {
        error: error.message || "An unexpected error occurred",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

