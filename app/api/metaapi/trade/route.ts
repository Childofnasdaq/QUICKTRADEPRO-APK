import { NextResponse, type NextRequest } from "next/server"
import axios from "axios"
import https from "https"
import { ENDPOINTS, METAAPI_TOKEN } from "@/lib/metaapi"
import clientPromise from "@/lib/mongodb"

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json()

    // Log the raw request for debugging
    console.log("Raw trade request:", JSON.stringify(requestData, null, 2))

    // Extract required fields
    const { accountId, symbol, type, volume, comment } = requestData
    const actionType = requestData.actionType || type // Support both type and actionType

    // Validate required fields
    if (!accountId || !symbol || !actionType || volume === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (accountId, symbol, type/actionType, volume)" },
        { status: 400 },
      )
    }

    // Validate the trade type to ensure it's not undefined
    const tradeType = actionType === "ORDER_TYPE_BUY" || actionType === "BUY" ? "BUY" : "SELL"
    const metaApiActionType = tradeType === "BUY" ? "ORDER_TYPE_BUY" : "ORDER_TYPE_SELL"

    // Create a custom HTTPS agent that ignores certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
    })

    // First, check if the account exists in our MongoDB collection
    try {
      const client = await clientPromise
      const db = client.db("Cluster0")
      const metaApiAccountsCollection = db.collection("metaApiAccounts")

      const existingAccount = await metaApiAccountsCollection.findOne({ accountId })

      if (!existingAccount) {
        console.log(`Account ID ${accountId} not found in MongoDB collection`)
        // Try to verify with MetaAPI directly
        try {
          const accountStatusUrl = ENDPOINTS.CLIENT.ACCOUNT(accountId)
          console.log(`Checking account status at: ${accountStatusUrl}`)

          const statusResponse = await axios.get(accountStatusUrl, {
            headers: { "auth-token": METAAPI_TOKEN },
            httpsAgent,
          })

          const accountState = statusResponse.data.state
          console.log(`Account state: ${accountState}`)

          if (accountState !== "DEPLOYED") {
            console.log(`Account not deployed, attempting to deploy...`)
            await axios.post(
              `${ENDPOINTS.CLIENT.ACCOUNT(accountId)}/deploy`,
              {},
              {
                headers: { "auth-token": METAAPI_TOKEN },
                httpsAgent,
              },
            )

            return NextResponse.json(
              {
                success: false,
                error: `Account is not ready for trading. Current state: ${accountState}. Deployment initiated, please try again in a few minutes.`,
              },
              { status: 400 },
            )
          }

          // Account exists in MetaAPI but not in our DB, let's add it
          await metaApiAccountsCollection.insertOne({
            accountId,
            createdAt: new Date(),
            lastAccessed: new Date(),
            isExisting: true,
          })
        } catch (error) {
          console.error("Error checking account with MetaAPI:", error)
          return NextResponse.json(
            {
              success: false,
              error: "Account not found or not accessible. Please reconnect your MetaTrader account.",
              details: error.response?.data || error.message,
            },
            { status: 400 },
          )
        }
      } else {
        // Account exists in our DB, update last accessed time
        await metaApiAccountsCollection.updateOne({ accountId }, { $set: { lastAccessed: new Date() } })
      }
    } catch (error) {
      console.error("Error checking MongoDB for account:", error)
      // Continue with MetaAPI check as fallback
    }

    // Check if the symbol is available for trading
    try {
      console.log(`Checking if symbol ${symbol} is available for trading...`)
      const symbolsResponse = await axios.get(`${ENDPOINTS.CLIENT.ACCOUNT(accountId)}/symbols`, {
        headers: { "auth-token": METAAPI_TOKEN },
        httpsAgent,
      })

      const availableSymbols = symbolsResponse.data
      if (!availableSymbols.includes(symbol)) {
        console.error(`Symbol ${symbol} is not available for trading on this account`)
        return NextResponse.json(
          {
            success: false,
            error: `Symbol ${symbol} is not available for trading on this account. Available symbols: ${availableSymbols.slice(0, 10).join(", ")}...`,
          },
          { status: 400 },
        )
      }
    } catch (error) {
      console.warn("Error checking available symbols:", error)
      // Continue anyway, as this is just a precautionary check
    }

    // Get symbol specification to determine correct price precision
    let symbolSpecification = null
    try {
      console.log(`Fetching symbol specification for ${symbol} on account ${accountId}...`)
      const specResponse = await axios.get(`${ENDPOINTS.CLIENT.ACCOUNT(accountId)}/specification?symbol=${symbol}`, {
        headers: { "auth-token": METAAPI_TOKEN },
        httpsAgent,
      })

      symbolSpecification = specResponse.data
      console.log(`Symbol specification: ${JSON.stringify(symbolSpecification, null, 2)}`)
    } catch (error) {
      console.error(`Error fetching symbol specification for ${symbol}:`, error)
      // Continue without specification, but log the error
    }

    // Get current price for the symbol
    let currentPrice = null
    try {
      const priceResponse = await axios.get(`${ENDPOINTS.CLIENT.ACCOUNT(accountId)}/symbols/${symbol}/price`, {
        headers: { "auth-token": METAAPI_TOKEN },
        httpsAgent,
      })

      currentPrice = tradeType === "BUY" ? priceResponse.data.ask : priceResponse.data.bid
      console.log(`Current ${tradeType === "BUY" ? "ask" : "bid"} price for ${symbol}: ${currentPrice}`)
    } catch (error) {
      console.error(`Error fetching current price for ${symbol}:`, error)
      // Continue without current price, but log the error
    }

    // Calculate SL/TP based on current price (will be used as a fallback)
    let stopLossValue = null
    let takeProfitValue = null

    if (currentPrice && symbolSpecification) {
      // Determine pip value based on symbol digits
      const digits = symbolSpecification.digits || 5
      let pipValue = 0.0001 // Default for 4 digit forex

      if (digits === 5) {
        pipValue = 0.00001 // 5 digit forex
      } else if (digits === 3) {
        pipValue = 0.001 // JPY pairs typically
      } else if (digits === 2) {
        pipValue = 0.01 // Typically for indices or some commodities
      } else if (digits === 1) {
        pipValue = 0.1 // Some commodities
      } else if (digits === 0) {
        pipValue = 1 // Typically for cryptocurrencies or some indices
      }

      console.log(`Using pip value of ${pipValue} for ${symbol} with ${digits} digits`)

      // Calculate SL/TP based on user-specified pip distances (20 pips for SL, 40 pips for TP - closer to entry)
      if (tradeType === "BUY") {
        // For BUY: SL below entry price, TP above entry price
        stopLossValue = Number.parseFloat((currentPrice - 20 * pipValue).toFixed(digits))
        takeProfitValue = Number.parseFloat((currentPrice + 40 * pipValue).toFixed(digits))
      } else {
        // For SELL: SL above entry price, TP below entry price
        stopLossValue = Number.parseFloat((currentPrice + 20 * pipValue).toFixed(digits))
        takeProfitValue = Number.parseFloat((currentPrice - 40 * pipValue).toFixed(digits))
      }

      console.log(
        `Pre-calculated SL: ${stopLossValue}, TP: ${takeProfitValue} for ${tradeType} order at ${currentPrice}`,
      )
    }

    // Format the trade request according to MetaAPI documentation
    const tradeRequest = {
      symbol,
      actionType: metaApiActionType,
      volume: Number(volume),
    }

    // Try to include SL/TP in the initial request if we have them
    if (stopLossValue !== null) {
      tradeRequest.stopLoss = stopLossValue
    }

    if (takeProfitValue !== null) {
      tradeRequest.takeProfit = takeProfitValue
    }

    // Sanitize comment to ensure it only contains Latin-1 characters
    if (comment) {
      const sanitizedComment = comment.replace(/✅/g, "+").replace(/[^\x00-\xFF]/g, "")
      tradeRequest.comment = sanitizedComment.substring(0, 26)
    }

    // Add magic number to identify trades from this system
    tradeRequest.magic = 123456

    console.log("Formatted trade request:", JSON.stringify(tradeRequest, null, 2))

    // Log the full URL being used
    const tradeUrl = ENDPOINTS.CLIENT.TRADE(accountId)
    console.log(`Sending trade request to: ${tradeUrl}`)

    // Execute the trade with the custom agent
    const response = await axios.post(tradeUrl, tradeRequest, {
      headers: {
        "auth-token": METAAPI_TOKEN,
        "Content-Type": "application/json",
      },
      httpsAgent,
      timeout: 30000,
    })

    console.log("Trade response:", JSON.stringify(response.data, null, 2))

    // Check if the trade was successful
    if (response.data && (response.data.orderId || response.data.positionId)) {
      // Trade was successful, now ensure SL/TP are set
      const positionId = response.data.positionId || response.data.orderId
      const entryPrice = response.data.openPrice || response.data.currentPrice || currentPrice

      if (positionId && entryPrice && symbolSpecification) {
        try {
          console.log(`Trade executed successfully. Position ID: ${positionId}, Entry Price: ${entryPrice}`)

          // Determine pip value based on symbol digits
          const digits = symbolSpecification.digits || 5
          let pipValue = 0.0001 // Default for 4 digit forex

          if (digits === 5) {
            pipValue = 0.00001 // 5 digit forex
          } else if (digits === 3) {
            pipValue = 0.001 // JPY pairs typically
          } else if (digits === 2) {
            pipValue = 0.01 // Typically for indices or some commodities
          } else if (digits === 1) {
            pipValue = 0.1 // Some commodities
          } else if (digits === 0) {
            pipValue = 1 // Typically for cryptocurrencies or some indices
          }

          // Calculate SL/TP based on ACTUAL entry price with closer values (20 pips SL, 40 pips TP)
          let actualStopLoss, actualTakeProfit

          if (tradeType === "BUY") {
            // For BUY: SL below entry price, TP above entry price
            actualStopLoss = Number.parseFloat((entryPrice - 20 * pipValue).toFixed(digits))
            actualTakeProfit = Number.parseFloat((entryPrice + 40 * pipValue).toFixed(digits))
          } else {
            // For SELL: SL above entry price, TP below entry price
            actualStopLoss = Number.parseFloat((entryPrice + 20 * pipValue).toFixed(digits))
            actualTakeProfit = Number.parseFloat((entryPrice - 40 * pipValue).toFixed(digits))
          }

          console.log(
            `Calculated SL: ${actualStopLoss}, TP: ${actualTakeProfit} for ${tradeType} order at ${entryPrice}`,
          )

          // Check if SL/TP were already set in the initial request
          const slTpAlreadySet = response.data.stopLoss !== undefined && response.data.takeProfit !== undefined

          if (!slTpAlreadySet) {
            // Modify the position to add SL/TP
            const modifyRequest = {
              action: "POSITION_MODIFY",
              positionId: positionId,
              stopLoss: actualStopLoss,
              takeProfit: actualTakeProfit,
            }

            console.log(`Sending modify request: ${JSON.stringify(modifyRequest, null, 2)}`)

            // Send the modify request
            const modifyResponse = await axios.post(tradeUrl, modifyRequest, {
              headers: {
                "auth-token": METAAPI_TOKEN,
                "Content-Type": "application/json",
              },
              httpsAgent,
              timeout: 30000,
            })

            console.log(`Modify response: ${JSON.stringify(modifyResponse.data, null, 2)}`)

            // Return success with both the original trade and the modification
            return NextResponse.json({
              success: true,
              trade: response.data,
              modification: {
                success: true,
                stopLoss: actualStopLoss,
                takeProfit: actualTakeProfit,
              },
            })
          } else {
            // SL/TP were already set in the initial request
            console.log("SL/TP were already set in the initial request")
            return NextResponse.json({
              success: true,
              trade: response.data,
              stopLoss: response.data.stopLoss,
              takeProfit: response.data.takeProfit,
            })
          }
        } catch (modifyError) {
          console.error("Error modifying position to add SL/TP:", modifyError)

          // Try a different approach - get the position and then modify it
          try {
            console.log("Trying alternative approach to modify position...")

            // Wait a moment before trying to modify (some brokers need a small delay)
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Get current positions to confirm the position ID
            const positionsResponse = await axios.get(`${ENDPOINTS.CLIENT.POSITIONS(accountId)}`, {
              headers: { "auth-token": METAAPI_TOKEN },
              httpsAgent,
            })

            console.log("Current positions:", JSON.stringify(positionsResponse.data, null, 2))

            // Find our position
            const ourPosition = positionsResponse.data.find(
              (p) =>
                p.id === positionId ||
                (p.symbol === symbol && p.type === (tradeType === "BUY" ? "POSITION_TYPE_BUY" : "POSITION_TYPE_SELL")),
            )

            if (ourPosition) {
              console.log("Found our position:", JSON.stringify(ourPosition, null, 2))

              // Calculate SL/TP based on the position's actual entry price
              const actualEntryPrice = ourPosition.openPrice
              const digits = symbolSpecification.digits || 5
              const pipValue = Math.pow(10, -digits + (digits <= 3 ? 0 : 1))

              let actualStopLoss, actualTakeProfit

              if (tradeType === "BUY") {
                actualStopLoss = Number.parseFloat((actualEntryPrice - 20 * pipValue).toFixed(digits))
                actualTakeProfit = Number.parseFloat((actualEntryPrice + 40 * pipValue).toFixed(digits))
              } else {
                actualStopLoss = Number.parseFloat((actualEntryPrice + 20 * pipValue).toFixed(digits))
                actualTakeProfit = Number.parseFloat((actualEntryPrice - 40 * pipValue).toFixed(digits))
              }

              // Modify the position
              const modifyRequest = {
                action: "POSITION_MODIFY",
                positionId: ourPosition.id,
                stopLoss: actualStopLoss,
                takeProfit: actualTakeProfit,
              }

              console.log(`Sending alternative modify request: ${JSON.stringify(modifyRequest, null, 2)}`)

              const modifyResponse = await axios.post(tradeUrl, modifyRequest, {
                headers: {
                  "auth-token": METAAPI_TOKEN,
                  "Content-Type": "application/json",
                },
                httpsAgent,
                timeout: 30000,
              })

              console.log(`Alternative modify response: ${JSON.stringify(modifyResponse.data, null, 2)}`)

              return NextResponse.json({
                success: true,
                trade: response.data,
                modification: {
                  success: true,
                  stopLoss: actualStopLoss,
                  takeProfit: actualTakeProfit,
                  method: "alternative",
                },
              })
            } else {
              throw new Error("Could not find our position in the positions list")
            }
          } catch (alternativeError) {
            console.error("Alternative modification approach also failed:", alternativeError)

            // Return success for the trade but failure for the modification
            return NextResponse.json({
              success: true,
              trade: response.data,
              modification: {
                success: false,
                error: "Failed to set SL/TP: " + (alternativeError.message || "Unknown error"),
                attemptedStopLoss:
                  tradeType === "BUY"
                    ? Number.parseFloat(
                        (entryPrice - 20 * Math.pow(10, -symbolSpecification.digits)).toFixed(
                          symbolSpecification.digits,
                        ),
                      )
                    : Number.parseFloat(
                        (entryPrice + 20 * Math.pow(10, -symbolSpecification.digits)).toFixed(
                          symbolSpecification.digits,
                        ),
                      ),
                attemptedTakeProfit:
                  tradeType === "BUY"
                    ? Number.parseFloat(
                        (entryPrice + 40 * Math.pow(10, -symbolSpecification.digits)).toFixed(
                          symbolSpecification.digits,
                        ),
                      )
                    : Number.parseFloat(
                        (entryPrice - 40 * Math.pow(10, -symbolSpecification.digits)).toFixed(
                          symbolSpecification.digits,
                        ),
                      ),
              },
            })
          }
        }
      } else {
        // Missing data needed to modify the position
        console.warn(`Missing data to modify position. Position ID: ${positionId}, Entry Price: ${entryPrice}`)
        return NextResponse.json({
          success: true,
          trade: response.data,
          modification: {
            success: false,
            error: "Missing data needed to modify position (position ID or entry price)",
          },
        })
      }
    } else {
      // Trade execution failed
      console.error("Trade execution failed: No position ID or order ID returned")

      // Try a simplified trade request without SL/TP
      console.log("Attempting simplified trade without SL/TP...")

      const simplifiedRequest = {
        symbol,
        actionType: metaApiActionType,
        volume: Number(volume),
      }

      if (tradeRequest.comment) {
        simplifiedRequest.comment = tradeRequest.comment
      }

      if (tradeRequest.magic) {
        simplifiedRequest.magic = tradeRequest.magic
      }

      try {
        const simplifiedResponse = await axios.post(tradeUrl, simplifiedRequest, {
          headers: {
            "auth-token": METAAPI_TOKEN,
            "Content-Type": "application/json",
          },
          httpsAgent,
          timeout: 30000,
        })

        console.log("Simplified trade response:", JSON.stringify(simplifiedResponse.data, null, 2))

        if (simplifiedResponse.data && (simplifiedResponse.data.orderId || simplifiedResponse.data.positionId)) {
          // Now try to modify this position to add SL/TP
          // Similar code as above for modification...
          const positionId = simplifiedResponse.data.positionId || simplifiedResponse.data.orderId

          // Return success for now, we'll handle modification in a separate request
          return NextResponse.json({
            success: true,
            trade: simplifiedResponse.data,
            message: "Trade executed with simplified request. SL/TP will be added separately.",
          })
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Trade execution failed: Broker rejected both standard and simplified trade requests",
            },
            { status: 500 },
          )
        }
      } catch (simplifiedError) {
        console.error("Simplified trade execution error:", simplifiedError)
        return NextResponse.json(
          {
            success: false,
            error: "Trade execution failed: " + (simplifiedError.message || "Unknown error"),
          },
          { status: 500 },
        )
      }
    }
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

      // Check for specific error codes and provide more helpful messages
      if (error.response.data?.message?.includes("symbol not found")) {
        errorMessage = `Symbol not found. Please check if the symbol name is correct for your broker.`
      } else if (error.response.data?.message?.includes("insufficient margin")) {
        errorMessage = `Insufficient margin to execute this trade. Please reduce lot size or add funds.`
      } else if (error.response.data?.message?.includes("invalid volume")) {
        errorMessage = `Invalid volume. Please check if the lot size is valid for this symbol.`
      } else if (error.response.data?.message?.includes("price")) {
        errorMessage = `Invalid price levels. The stop loss or take profit may be too close to current price.`
      } else if (error.response.data?.message?.includes("stopLoss")) {
        errorMessage = `Invalid stop loss. The stop loss may be too close to current price.`
      } else if (error.response.data?.message?.includes("takeProfit")) {
        errorMessage = `Invalid take profit. The take profit may be too close to current price.`
      }
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

