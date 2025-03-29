import { type NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"
import axios from "axios"
import https from "https"
import { ENDPOINTS, METAAPI_TOKEN } from "@/lib/metaapi"

export async function POST(request: NextRequest) {
  try {
    const { mentorId, email, licenseKey, deviceId } = await request.json()

    if (!mentorId || !email || !licenseKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate a device ID if not provided
    const currentDeviceId = deviceId || uuidv4()

    // Connect to MongoDB
    const client = await clientPromise

    // Get all databases
    const adminDb = client.db("admin")
    const databasesList = await adminDb.admin().listDatabases()
    const databases = databasesList.databases
      .map((db) => db.name)
      .filter((name) => name !== "admin" && name !== "local")

    // Convert mentorId to number if it's a string
    const mentorIdValue = typeof mentorId === "string" ? Number.parseInt(mentorId, 10) : mentorId

    // Try each database
    for (const dbName of databases) {
      const db = client.db(dbName)
      const collections = await db.listCollections().toArray()
      const collectionNames = collections.map((c) => c.name)

      // Check if this database has the collections we need
      if (!collectionNames.includes("users")) continue

      // Try to find the user
      const usersCollection = db.collection("users")
      const user = await usersCollection.findOne({
        email: email,
        mentorId: mentorIdValue,
      })

      if (!user) continue

      // User found, now check license key
      let licenseKeyDoc = null

      // Check if licenseKeys collection exists
      if (collectionNames.includes("licenseKeys")) {
        const licenseKeysCollection = db.collection("licenseKeys")
        licenseKeyDoc = await licenseKeysCollection.findOne({ key: licenseKey })

        if (!licenseKeyDoc) {
          return NextResponse.json({ error: "Invalid license key." }, { status: 401 })
        }

        // Check if license key is deactivated
        if (licenseKeyDoc.isDeactivated === true || licenseKeyDoc.status === "used") {
          return NextResponse.json(
            { error: "This license key has expired or has been used. Please contact support for a new license key." },
            { status: 401 },
          )
        }

        // Check if license key is already activated on another device
        if (licenseKeyDoc.isActivated && licenseKeyDoc.deviceId && licenseKeyDoc.deviceId !== currentDeviceId) {
          return NextResponse.json(
            {
              error:
                "This license key has been used on another device. Please contact your mentor for a new license key.",
            },
            { status: 401 },
          )
        }

        // Check if license has expired
        if (licenseKeyDoc.expiryDate && licenseKeyDoc.plan !== "lifetime") {
          const expiryDate = new Date(licenseKeyDoc.expiryDate)
          if (expiryDate < new Date()) {
            return NextResponse.json(
              { error: "Your license key has expired. Please contact your mentor for a new license key." },
              { status: 401 },
            )
          }
        }

        // Activate license key on this device if not already activated
        if (!licenseKeyDoc.isActivated || !licenseKeyDoc.deviceId) {
          await licenseKeysCollection.updateOne(
            { key: licenseKey },
            {
              $set: {
                isActivated: true,
                deviceId: currentDeviceId,
                activationDate: new Date(),
                status: "used", // Mark as used immediately
              },
            },
          )
        }
      }

      // Get EA information if available
      let eaInfo = null
      if (collectionNames.includes("eas") && licenseKeyDoc.eaId) {
        const easCollection = db.collection("eas")
        eaInfo = await easCollection.findOne({ id: licenseKeyDoc.eaId })
      }

      // Calculate days until expiry
      let daysUntilExpiry = null
      let expiryDate = null

      if (licenseKeyDoc.expiryDate && licenseKeyDoc.plan !== "lifetime") {
        expiryDate = new Date(licenseKeyDoc.expiryDate)
        const today = new Date()
        const diffTime = expiryDate.getTime() - today.getTime()
        daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      }

      // Check if user already has a MetaAPI account
      let metaApiAccount = null
      if (collectionNames.includes("metaApiAccounts")) {
        const metaApiAccountsCollection = db.collection("metaApiAccounts")
        metaApiAccount = await metaApiAccountsCollection.findOne({
          userId: user._id.toString(),
        })
      }

      // If no MetaAPI account is found in our database, check MetaAPI directly
      let existingMetaApiAccountId = null
      if (metaApiAccount) {
        existingMetaApiAccountId = metaApiAccount.accountId
      } else {
        try {
          // Create a custom HTTPS agent that ignores certificate errors
          const httpsAgent = new https.Agent({
            rejectUnauthorized: false,
          })

          // Check if account exists in MetaAPI
          const accountsResponse = await axios.get(ENDPOINTS.PROVISIONING.ACCOUNTS, {
            headers: { "auth-token": METAAPI_TOKEN },
            httpsAgent,
          })

          // Look for an account with this user's information
          // This is a simplified example - you would need to determine how to match accounts
          // Perhaps by using a naming convention that includes mentorId or email
          const existingAccount = accountsResponse.data.find(
            (acc) => acc.name && (acc.name.includes(mentorIdValue) || acc.name.includes(email)),
          )

          if (existingAccount) {
            existingMetaApiAccountId = existingAccount.id

            // Store this account reference in our database for future use
            if (collectionNames.includes("metaApiAccounts")) {
              const metaApiAccountsCollection = db.collection("metaApiAccounts")
              await metaApiAccountsCollection.insertOne({
                userId: user._id.toString(),
                mentorId: mentorIdValue,
                email: email,
                accountId: existingAccount.id,
                createdAt: new Date(),
                lastAccessed: new Date(),
              })
            }
          }
        } catch (error) {
          console.error("Error checking MetaAPI accounts:", error)
          // Continue without MetaAPI account info if there's an error
        }
      }

      // Return user data with MetaAPI account info if available
      return NextResponse.json({
        success: true,
        user: {
          uid: user._id.toString(),
          email: user.email,
          mentorId: user.mentorId,
          licenseKey: licenseKeyDoc.key,
          licenseExpiry: licenseKeyDoc.expiryDate || "NEVER",
          licenseStatus: licenseKeyDoc.status,
          licensePlan: licenseKeyDoc.plan || "standard",
          daysUntilExpiry: daysUntilExpiry,
          photoURL: user.avatar,
          robotName: licenseKeyDoc.username || "QUICKTRADE PRO",
          eaName: eaInfo?.name || licenseKeyDoc.eaName || "QUICKTRADE PRO",
          displayName: user.displayName || user.name,
          deviceId: currentDeviceId,
          database: dbName,
          metaApiAccountId: existingMetaApiAccountId, // Include MetaAPI account ID if available
        },
      })
    }

    // If we get here, we didn't find the user in any database
    return NextResponse.json({ error: "User not found in any database. Check your credentials." }, { status: 401 })
  } catch (error) {
    console.error("Authentication error:", error)
    return NextResponse.json(
      { error: "Authentication failed: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 },
    )
  }
}
