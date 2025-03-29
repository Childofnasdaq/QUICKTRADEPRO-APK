import { NextResponse, type NextRequest } from "next/server"
import axios from "axios"
import https from "https"
import clientPromise from "@/lib/mongodb"
import { ENDPOINTS, METAAPI_TOKEN } from "@/lib/metaapi"

export async function POST(request: NextRequest) {
  try {
    const { login, password, server, platform, mentorId } = await request.json()

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
      // Check if account exists in MetaAPI - use PROVISIONING API
      const accountsResponse = await axios.get(ENDPOINTS.PROVISIONING.ACCOUNTS, {
        headers: { "auth-token": METAAPI_TOKEN },
        httpsAgent, // Add the custom agent to ignore certificate errors
      })

      // Improved account matching logic - check login, server, and platform
      const existingAccount = accountsResponse.data.find(
        (acc) => acc.login === login && acc.server === server && acc.platform === platform,
      )

      if (existingAccount) {
        console.log(`Found existing account with ID: ${existingAccount.id}`)

        // Store in MongoDB if not already there
        try {
          const client = await clientPromise
          const db = client.db("Cluster0")
          const metaApiAccountsCollection = db.collection("metaApiAccounts")

          // Check if this account is already in our database
          const existingDbAccount = await metaApiAccountsCollection.findOne({
            login,
            server,
            platform,
            accountId: existingAccount.id,
          })

          if (!existingDbAccount) {
            // Store the account reference in our database
            await metaApiAccountsCollection.insertOne({
              mentorId: mentorId || null,
              login,
              server,
              platform,
              accountId: existingAccount.id,
              createdAt: new Date(),
              lastAccessed: new Date(),
              isExisting: true,
            })
          } else {
            // Update the last accessed time
            await metaApiAccountsCollection.updateOne(
              { accountId: existingAccount.id },
              { $set: { lastAccessed: new Date() } },
            )
          }
        } catch (dbError) {
          console.error("MongoDB storage failed:", dbError)
        }

        return NextResponse.json({
          success: true,
          accountId: existingAccount.id,
          isNewAccount: false,
          message: "Using existing connection",
        })
      }

      // Create new account connection - use PROVISIONING API
      const newAccount = await axios.post(
        ENDPOINTS.PROVISIONING.ACCOUNTS,
        {
          login,
          password,
          server,
          platform,
          name: `${platform.toUpperCase()} Account (${login})`,
          application: "QUICKTRADE PRO",
          magic: 0,
        },
        {
          headers: { "auth-token": METAAPI_TOKEN },
          httpsAgent, // Add the custom agent to ignore certificate errors
        },
      )

      // Store in MongoDB
      try {
        const client = await clientPromise
        const db = client.db("Cluster0")
        await db.collection("metaApiAccounts").insertOne({
          mentorId: mentorId || null,
          login,
          server,
          platform,
          accountId: newAccount.data.id,
          createdAt: new Date(),
          lastAccessed: new Date(),
          isExisting: false,
        })
      } catch (dbError) {
        console.error("MongoDB storage failed:", dbError)
      }

      return NextResponse.json({
        success: true,
        accountId: newAccount.data.id,
        isNewAccount: true,
        message: "Account connected successfully",
      })
    } catch (error: any) {
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
    return NextResponse.json({ success: false, error: error.message || "Internal server error" }, { status: 500 })
  }
}

