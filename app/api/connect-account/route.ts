import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"
import MetaApiClient, { AccountType } from "@/lib/meta-api-client"

export async function POST(request: NextRequest) {
  try {
    const { login, password, server, platform } = await request.json()

    if (!login || !password || !server) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db("Cluster0")

    // Check if user has reached account limit
    let userId = "guest"
    const cookieValue = request.cookies.get("userData")

    if (cookieValue && cookieValue.value) {
      try {
        const parsedUserData = JSON.parse(cookieValue.value)
        userId = parsedUserData.uid || "guest"
      } catch (error) {
        console.error("Error parsing user data:", error)
      }
    }

    // Get user's existing accounts
    const tradingAccountsCollection = db.collection("tradingAccounts")
    const userAccounts = await tradingAccountsCollection.find({ userId }).toArray()

    // Check if user has reached their account limit
    const userSubscription = await db.collection("subscriptions").findOne({ userId })
    const accountLimit =
      userSubscription?.plan === "UNLIMITED"
        ? Number.POSITIVE_INFINITY
        : userSubscription?.plan === "TWO_ACCOUNTS"
          ? 2
          : 1

    // Check if this account already exists
    const existingAccount = await tradingAccountsCollection.findOne({
      login,
      server,
      platform,
    })

    if (existingAccount) {
      // Update the existing account with MetaAPI
      try {
        const metaApiAccount = await MetaApiClient.connectAccount(
          login,
          password,
          server,
          platform === "MT5" ? AccountType.MT5 : AccountType.MT4,
        )

        // Update the account in the database
        await tradingAccountsCollection.updateOne(
          { _id: existingAccount._id },
          {
            $set: {
              metaApiAccountId: metaApiAccount.id,
              lastConnected: new Date(),
              connectionStatus: "CONNECTED",
            },
          },
        )

        return NextResponse.json({
          success: true,
          accountId: existingAccount._id.toString(),
          metaApiAccountId: metaApiAccount.id,
          connectionStatus: "CONNECTED",
          platform,
          login,
          server,
        })
      } catch (error) {
        console.error("Error connecting to existing account:", error)
        return NextResponse.json(
          {
            success: false,
            error:
              "Failed to connect to MetaTrader account: " + (error instanceof Error ? error.message : "Unknown error"),
          },
          { status: 500 },
        )
      }
    }

    // If user has reached their account limit and this is a new account
    if (userAccounts.length >= accountLimit && !existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: "Account limit reached",
          requiresUpgrade: true,
          currentPlan: userSubscription?.plan || "SINGLE_ACCOUNT",
          accountLimit,
        },
        { status: 403 },
      )
    }

    // Connect to MetaAPI
    try {
      const metaApiAccount = await MetaApiClient.connectAccount(
        login,
        password,
        server,
        platform === "MT5" ? AccountType.MT5 : AccountType.MT4,
      )

      // Generate a unique account ID
      const accountId = uuidv4()

      // Store the account details
      const result = await tradingAccountsCollection.insertOne({
        accountId,
        userId,
        login,
        password, // In production, this should be encrypted
        server,
        platform,
        metaApiAccountId: metaApiAccount.id,
        createdAt: new Date(),
        lastConnected: new Date(),
        connectionStatus: "CONNECTED",
      })

      return NextResponse.json({
        success: true,
        accountId: result.insertedId.toString(),
        metaApiAccountId: metaApiAccount.id,
        connectionStatus: "CONNECTED",
        platform,
        login,
        server,
      })
    } catch (error) {
      console.error("Error connecting to MetaTrader account:", error)
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to connect to MetaTrader account: " + (error instanceof Error ? error.message : "Unknown error"),
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Account connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to your account: " + (error instanceof Error ? error.message : "Connection failed"),
      },
      { status: 500 },
    )
  }
}

