import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { DEFAULT_STOP_LOSS_PIPS, DEFAULT_TAKE_PROFIT_PIPS, COMMENT_PREFIX } from "@/lib/trading-constants"
import { MarketAnalysisService } from "@/lib/market-analysis"
import MetaApiClient from "@/lib/meta-api-client"

// This API will handle communication with MetaAPI
export async function POST(request: NextRequest) {
  try {
    const { action, userId, accountId, symbol, type, lotSize, stopLoss, takeProfit, comment } = await request.json()

    if (!action || !accountId || !symbol || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log(`Trading server received request: ${action} for ${symbol} ${type}`)

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("Cluster0")

    // Get trading account details
    const tradingAccountsCollection = db.collection("tradingAccounts")
    let tradingAccount = null

    try {
      tradingAccount = await tradingAccountsCollection.findOne({ _id: new ObjectId(accountId) })
    } catch (error) {
      console.log("Error finding trading account by ObjectId, trying direct match:", error)
      // Try to find by accountId as a string
      tradingAccount = await tradingAccountsCollection.findOne({ accountId: accountId })
    }

    if (!tradingAccount) {
      return NextResponse.json({ error: "Trading account not found" }, { status: 404 })
    }

    // Get MetaAPI account ID
    const metaApiAccountId = tradingAccount.metaApiAccountId

    if (!metaApiAccountId) {
      return NextResponse.json({ error: "MetaAPI account ID not found" }, { status: 404 })
    }

    // Calculate SL and TP based on settings or defaults
    const finalStopLoss = stopLoss || DEFAULT_STOP_LOSS_PIPS
    const finalTakeProfit = takeProfit || DEFAULT_TAKE_PROFIT_PIPS

    // Create a trading log entry
    const tradingLogsCollection = db.collection("tradingLogs")
    await tradingLogsCollection.insertOne({
      userId,
      accountId,
      metaApiAccountId,
      action,
      symbol,
      type,
      lotSize,
      stopLoss: finalStopLoss,
      takeProfit: finalTakeProfit,
      platform: tradingAccount.platform,
      timestamp: new Date(),
      status: "PENDING",
    })

    // Perform market analysis
    const analysisResult = await MarketAnalysisService.analyzeMarket(symbol)

    // Execute trade
    try {
      console.log("Executing trade via MetaAPI")

      // Convert lotSize to number
      const volume = Number.parseFloat(lotSize) || 0.01

      // Execute the trade via MetaAPI
      const tradeResult = await MetaApiClient.executeTrade(
        metaApiAccountId,
        symbol,
        type as "BUY" | "SELL",
        volume,
        analysisResult.stopLoss,
        analysisResult.takeProfit,
      )

      console.log("Trade executed successfully:", tradeResult)

      // Update the log with success status
      await tradingLogsCollection.updateOne(
        { userId, accountId, symbol, timestamp: { $gte: new Date(Date.now() - 5000) } },
        {
          $set: {
            status: "EXECUTED",
            tradeId: tradeResult.positionId,
            executionPrice: analysisResult.currentPrice,
          },
        },
      )

      return NextResponse.json({
        success: true,
        tradeId: tradeResult.positionId,
        message: `${type} order for ${symbol} executed successfully`,
        details: {
          symbol,
          type,
          lotSize: volume,
          stopLoss: analysisResult.stopLoss,
          takeProfit: analysisResult.takeProfit,
          executionPrice: analysisResult.currentPrice,
          comment: comment || `${COMMENT_PREFIX}~${userId}`,
        },
      })
    } catch (error) {
      console.error("Trading execution error:", error)

      // Update the log with failure status
      await tradingLogsCollection.updateOne(
        { userId, accountId, symbol, timestamp: { $gte: new Date(Date.now() - 5000) } },
        {
          $set: {
            status: "FAILED",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        },
      )

      return NextResponse.json(
        {
          success: false,
          error: "Failed to execute trade: " + (error instanceof Error ? error.message : "Unknown error"),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Trading server error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to execute trading action: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

// This endpoint will handle GET requests to check account status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const accountId = searchParams.get("accountId")

    if (!accountId) {
      return NextResponse.json({ error: "Account ID is required" }, { status: 400 })
    }

    // Get trading account details
    const client = await clientPromise
    const db = client.db("Cluster0")
    const tradingAccountsCollection = db.collection("tradingAccounts")

    let tradingAccount = null
    try {
      tradingAccount = await tradingAccountsCollection.findOne({ _id: new ObjectId(accountId) })
    } catch (error) {
      console.log("Error finding trading account by ObjectId, trying direct match:", error)
      // Try to find by accountId as a string
      tradingAccount = await tradingAccountsCollection.findOne({ accountId: accountId })
    }

    if (!tradingAccount) {
      return NextResponse.json({ error: "Trading account not found" }, { status: 404 })
    }

    // Get MetaAPI account ID
    const metaApiAccountId = tradingAccount.metaApiAccountId

    if (!metaApiAccountId) {
      return NextResponse.json({ error: "MetaAPI account ID not found" }, { status: 404 })
    }

    // Get account info from MetaAPI
    try {
      const accountInfo = await MetaApiClient.getAccountInfo(metaApiAccountId)

      return NextResponse.json({
        success: true,
        connectionStatus: "CONNECTED",
        balance: accountInfo.balance,
        equity: accountInfo.equity,
        margin: accountInfo.margin,
        freeMargin: accountInfo.freeMargin,
        leverage: accountInfo.leverage,
        marginLevel: accountInfo.marginLevel,
        openPositions: await MetaApiClient.getPositions(metaApiAccountId),
      })
    } catch (error) {
      console.error("Error getting account info:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get account info: " + (error instanceof Error ? error.message : "Unknown error"),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error checking account status:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check account status: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 },
    )
  }
}

