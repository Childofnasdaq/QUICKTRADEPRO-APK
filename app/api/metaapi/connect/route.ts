import { NextResponse, type NextRequest } from "next/server"
import axios from "axios"
import https from "https"
import clientPromise from "@/lib/mongodb"
import { ENDPOINTS, METAAPI_TOKEN, CLIENT_API_URL } from "@/lib/metaapi"

export async function POST(request: NextRequest) {
  try {
    const { login, password, server, platform, mentorId, email, userId } = await request.json()

    // Validate required fields
    if (!login || !password || !server || !platform) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate platform
    if (!["mt4", "mt5"].includes(platform)) {
      return NextResponse.json({ success: false, error: "Invalid platform (must be mt4 or mt5)" }, { status: 400 })
    }

    // Create a custom HTTPS agent that ignores certificate errors
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // This will ignore certificate validation
    })

    try {
      // FIRST: Check if this account already exists in our MongoDB collection
      // This prevents unnecessary API calls to MetaAPI
      const client = await clientPromise
      const db = client.db("Cluster0")
      const metaApiAccountsCollection = db.collection("metaApiAccounts")

      // Look for existing account in our database first
      const existingDbAccount = await metaApiAccountsCollection.findOne({
        login,
        server,
        platform,
      })

      // If we already have this account in our database, use it directly
      if (existingDbAccount && existingDbAccount.accountId) {
        console.log(`Found existing account in our database with ID: ${existingDbAccount.accountId}`)

        // Update the last accessed time and user info if provided
        const updateData: any = { lastAccessed: new Date() }
        if (userId) updateData.userId = userId
        if (mentorId) updateData.mentorId = mentorId
        if (email) updateData.email = email

        await metaApiAccountsCollection.updateOne({ accountId: existingDbAccount.accountId }, { $set: updateData })

        // Check if the account is deployed (optional, only if you want to ensure it's ready)
        try {
          const deploymentStatus = await axios.get(
            `${CLIENT_API_URL}/users/current/accounts/${existingDbAccount.accountId}`,
            {
              headers: { "auth-token": METAAPI_TOKEN },
              httpsAgent,
            },
          )

          console.log(`Account deployment status: ${deploymentStatus.data.state}`)

          // If account is not deployed, deploy it
          if (deploymentStatus.data.state !== "DEPLOYED") {
            console.log(`Deploying account ${existingDbAccount.accountId}...`)
            await axios.post(
              `${CLIENT_API_URL}/users/current/accounts/${existingDbAccount.accountId}/deploy`,
              {},
              {
                headers: { "auth-token": METAAPI_TOKEN },
                httpsAgent,
              },
            )
            console.log(`Deployment initiated for account ${existingDbAccount.accountId}`)
          }
        } catch (error) {
          console.error("Error checking/updating deployment status:", error)
          // Continue anyway as this is just a check
        }

        return NextResponse.json({
          success: true,
          accountId: existingDbAccount.accountId,
          isNewAccount: false,
          message: "Using existing connection from database",
        })
      }

      // SECOND: If not in our database, check if account exists in MetaAPI
      console.log("Account not found in database, checking MetaAPI...")
      const accountsResponse = await axios.get(ENDPOINTS.PROVISIONING.ACCOUNTS, {
        headers: { "auth-token": METAAPI_TOKEN },
        httpsAgent,
      })

      // Improved account matching logic - check login, server, and platform
      const existingAccount = accountsResponse.data.find(
        (acc) => acc.login === login && acc.server === server && acc.platform === platform,
      )

      if (existingAccount) {
        console.log(`Found existing account in MetaAPI with ID: ${existingAccount.id}`)

        // Check if the account is deployed
        try {
          const deploymentStatus = await axios.get(`${CLIENT_API_URL}/users/current/accounts/${existingAccount.id}`, {
            headers: { "auth-token": METAAPI_TOKEN },
            httpsAgent,
          })

          console.log(`Account deployment status: ${deploymentStatus.data.state}`)

          // If account is not deployed, deploy it
          if (deploymentStatus.data.state !== "DEPLOYED") {
            console.log(`Deploying account ${existingAccount.id}...`)
            await axios.post(
              `${CLIENT_API_URL}/users/current/accounts/${existingAccount.id}/deploy`,
              {},
              {
                headers: { "auth-token": METAAPI_TOKEN },
                httpsAgent,
              },
            )
            console.log(`Deployment initiated for account ${existingAccount.id}`)
          }
        } catch (error) {
          console.error("Error checking/updating deployment status:", error)
          // Continue anyway as this is just a check
        }

        // Store in MongoDB since it wasn't there before
        await metaApiAccountsCollection.insertOne({
          userId: userId || null,
          mentorId: mentorId || null,
          email: email || null,
          login,
          server,
          platform,
          accountId: existingAccount.id,
          createdAt: new Date(),
          lastAccessed: new Date(),
          isExisting: true,
        })

        return NextResponse.json({
          success: true,
          accountId: existingAccount.id,
          isNewAccount: false,
          message: "Using existing connection from MetaAPI",
        })
      }

      // THIRD: If not found anywhere, create a new account connection
      console.log("Account not found anywhere, creating new connection...")
      const accountName = `${platform.toUpperCase()} Account (${login}) - ${mentorId || "Unknown"}`
      const newAccount = await axios.post(
        ENDPOINTS.PROVISIONING.ACCOUNTS,
        {
          login,
          password,
          server,
          platform,
          name: accountName,
          application: "QUICKTRADE PRO",
          magic: 0,
        },
        {
          headers: { "auth-token": METAAPI_TOKEN },
          httpsAgent,
        },
      )

      console.log(`Created new account with ID: ${newAccount.data.id}`)

      // Store in MongoDB
      await metaApiAccountsCollection.insertOne({
        userId: userId || null,
        mentorId: mentorId || null,
        email: email || null,
        login,
        server,
        platform,
        accountId: newAccount.data.id,
        createdAt: new Date(),
        lastAccessed: new Date(),
        isExisting: false,
      })

      return NextResponse.json({
        success: true,
        accountId: newAccount.data.id,
        isNewAccount: true,
        message: "New account created and connected successfully",
      })
    } catch (error: any) {
      console.error("Connection error:", error)
      const errorMessage = error.response?.data?.message || error.message
      return NextResponse.json(
        {
          success: false,
          error: errorMessage.includes("already exists")
            ? "Account already connected"
            : `Connection failed: ${errorMessage}`,
        },
        { status: error.response?.status || 500 },
      )
    }
  } catch (error: any) {
    console.error("Internal error:", error)
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

