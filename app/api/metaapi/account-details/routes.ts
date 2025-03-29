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

    console.log(`Fetching account details for account ID: ${accountId}`)

    // Create a custom HTTPS agent that ignores certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })

    try {
      // Get account details from MetaAPI
      const response = await axios.get(ENDPOINTS.PROVISIONING.ACCOUNT(accountId), {
        headers: { "auth-token": METAAPI_TOKEN },
        httpsAgent,
      })

      console.log("Account details fetched successfully")

      return NextResponse.json({
        success: true,
        account: response.data,
      })
    } catch (error: any) {
      console.error("Error fetching account details:", error)

      return NextResponse.json({
        success: false,
        error: error.response?.data?.message || error.message || "Failed to fetch account details",
      })
    }
  } catch (error: any) {
    console.error("Error in account-details route:", error)

    return NextResponse.json({
      success: false,
      error: error.message || "Unknown error getting account details",
    })
  }
}
