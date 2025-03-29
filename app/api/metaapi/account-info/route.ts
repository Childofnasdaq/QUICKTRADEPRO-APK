import { NextResponse, type NextRequest } from "next/server"
import axios from "axios"
import https from "https"
import { ENDPOINTS, METAAPI_TOKEN } from "@/lib/metaapi"

export async function GET(request: NextRequest) {
  try {
    const accountId = request.nextUrl.searchParams.get("accountId")

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Account ID is required",
        },
        { status: 400 },
      )
    }

    console.log(`Fetching account info for account ID: ${accountId}`)

    // Create a custom HTTPS agent that ignores certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // This will ignore certificate validation
    })

    try {
      // Use CLIENT API for account information
      const response = await axios.get(ENDPOINTS.CLIENT.ACCOUNT_INFO(accountId), {
        headers: { "auth-token": METAAPI_TOKEN },
        httpsAgent, // Add the custom agent to ignore certificate errors
      })

      console.log("Account info fetched successfully")

      return NextResponse.json({
        success: true,
        accountInfo: response.data,
      })
    } catch (error: any) {
      console.error("Error in getAccountInformation:", error)

      return NextResponse.json({
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch account information",
        accountInfo: {
          balance: 0,
          equity: 0,
          margin: 0,
          freeMargin: 0,
          marginLevel: 0,
          currency: "USD",
        },
      })
    }
  } catch (error: any) {
    console.error("Error in account-info route:", error)

    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error getting account info",
      accountInfo: {
        balance: 0,
        equity: 0,
        margin: 0,
        freeMargin: 0,
        marginLevel: 0,
        currency: "USD",
      },
    })
  }
}

