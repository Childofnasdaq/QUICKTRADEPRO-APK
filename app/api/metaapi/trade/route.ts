import { NextResponse, type NextRequest } from "next/server"
import axios from "axios"
import https from "https"
import { ENDPOINTS, METAAPI_TOKEN } from "@/lib/metaapi"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()

    // Log the raw request for debugging
    console.log("Raw trade request:", JSON.stringify(requestData, null, 2))

    // Extract required fields
    const { accountId, symbol, type, volume, stopLoss, takeProfit, comment, trailingStopLoss } = requestData

    // Validate required fields
    if (!accountId || !symbol || !type || volume === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (accountId, symbol, type, volume)" },
        { status: 400 },
      )
    }

    // Validate the trade type to ensure it's not undefined
    if (!type || (type !== "BUY" && type !== "SELL")) {
      return NextResponse.json(
        { success: false, error: `Invalid trade type: ${type}. Must be 'BUY' or 'SELL'` },
        { status: 400 },
      )
    }

    // Format the trade request according to MetaAPI documentation
    // Use actionType instead of type as per MetaAPI requirements
    const tradeRequest = {
      symbol,
      actionType: type === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL",
      volume: Number(volume),
    }

    // Add optional parameters if they exist
    if (stopLoss && Number(stopLoss) > 0) {
      tradeRequest["stopLoss"] = Number(stopLoss)
    }

    if (takeProfit && Number(takeProfit) > 0) {
      tradeRequest["takeProfit"] = Number(takeProfit)
    }

    if (trailingStopLoss && Number(trailingStopLoss) > 0) {
      tradeRequest["trailingStopLoss"] = Number(trailingStopLoss)
    }

    // Sanitize comment to ensure it only contains Latin-1 characters
    if (comment) {
      // Replace Unicode characters (like emojis) with Latin-1 compatible alternatives
      // Replace checkmark emoji with "+"
      const sanitizedComment = comment.replace(/✅/g, "+").replace(/[^\x00-\xFF]/g, "")
      tradeRequest["comment"] = sanitizedComment
    }

    console.log("Formatted trade request:", JSON.stringify(tradeRequest, null, 2))

    // Create a custom HTTPS agent that ignores certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // This will ignore certificate validation
    })

    // Log the full URL being used
    const tradeUrl = ENDPOINTS.CLIENT.TRADE(accountId)
    console.log(`Sending trade request to: ${tradeUrl}`)

    console.log("Final trade request being sent to MetaAPI:", JSON.stringify(tradeRequest, null, 2))

    // Execute the trade with the custom agent
    const response = await axios.post(tradeUrl, tradeRequest, {
      headers: {
        "auth-token": METAAPI_TOKEN,
        "Content-Type": "application/json",
      },
      httpsAgent, // Add the custom agent to ignore certificate errors
    })

    console.log("Trade response:", JSON.stringify(response.data, null, 2))

    return NextResponse.json({
      success: true,
      trade: response.data,
    })
  } catch (error) {
    console.error("Trade execution error:", error)

    // Format error response
    let errorMessage = "Unknown error executing trade"
    let errorDetails = null

    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data?.message || error.message
      errorDetails = error.response.data

      console.error("MetaAPI error response:", JSON.stringify(error.response.data, null, 2))
      console.error("Status code:", error.response.status)
      console.error("Headers:", JSON.stringify(error.response.headers, null, 2))
    } else if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        details: errorDetails,
      },
      { status: 500 },
    )
  }
}

