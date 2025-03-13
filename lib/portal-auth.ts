import { db, auth } from "./firebase"
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"

// Types for portal authentication
export type PortalCredentials = {
  mentorId: string
  email: string
  licenseKey: string
}

export type AllowedSymbol = {
  symbol: string
  minLotSize: number
  maxTrades: number
}

export type PortalUser = {
  mentorId: string
  email: string
  username?: string
  avatar?: string // Profile picture from portal
  robotName: string // Robot name set by user on portal
  isActive: boolean
  licenseExpiry: string
  allowedSymbols: AllowedSymbol[]
}

export async function validatePortalCredentials(credentials: PortalCredentials): Promise<{
  success: boolean
  user?: PortalUser
  error?: string
}> {
  try {
    // Check if the credentials exist in Firebase
    const licenseKeysRef = collection(db, "licenseKeys")
    const q = query(licenseKeysRef, where("key", "==", credentials.licenseKey), where("status", "==", "active"))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return {
        success: false,
        error: "Invalid license key or license is not active.",
      }
    }

    // Get the first matching license key
    const licenseData = querySnapshot.docs[0].data()

    // Try to authenticate with Firebase Auth
    try {
      await signInWithEmailAndPassword(auth, credentials.email, credentials.licenseKey)
    } catch (authError) {
      // If user doesn't exist, create one
      if (authError.code === "auth/user-not-found") {
        try {
          await createUserWithEmailAndPassword(auth, credentials.email, credentials.licenseKey)
        } catch (createError) {
          console.error("Error creating user:", createError)
        }
      } else {
        console.error("Auth error:", authError)
      }
    }

    // Get the EA details
    const eaRef = collection(db, "eas")
    const eaQuery = query(eaRef, where("id", "==", licenseData.eaId))
    const eaSnapshot = await getDocs(eaQuery)

    if (eaSnapshot.empty) {
      return {
        success: false,
        error: "EA not found for this license key.",
      }
    }

    const eaData = eaSnapshot.docs[0].data()

    // Get user profile if exists
    const usersRef = collection(db, "users")
    const userQuery = query(usersRef, where("email", "==", credentials.email))
    const userSnapshot = await getDocs(userQuery)

    let userData = {}
    if (!userSnapshot.empty) {
      userData = userSnapshot.docs[0].data()
    }

    // Create a portal user from the license and EA data
    const portalUser: PortalUser = {
      mentorId: credentials.mentorId,
      email: credentials.email,
      username: userData.username || credentials.email.split("@")[0],
      avatar:
        userData.avatar ||
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%20%2826%29-Jh1kvoApQrXlWl3wCmLOaoRKyQRAwC.png",
      robotName: eaData.name || "Aggressive Scalper",
      isActive: true,
      licenseExpiry: licenseData.expiryDate
        ? new Date(licenseData.expiryDate.toDate()).toLocaleDateString()
        : "1/23/2125",
      allowedSymbols: eaData.allowedSymbols || [
        {
          symbol: "XAUUSDm",
          minLotSize: 0.01,
          maxTrades: 5,
        },
      ],
    }

    // Log the authentication attempt
    try {
      await addDoc(collection(db, "authLogs"), {
        mentorId: credentials.mentorId,
        email: credentials.email,
        licenseKey: credentials.licenseKey,
        timestamp: serverTimestamp(),
        success: true,
      })
    } catch (error) {
      console.error("Error logging authentication:", error)
    }

    return {
      success: true,
      user: portalUser,
    }
  } catch (error) {
    console.error("Portal authentication error:", error)

    // Log the failed authentication attempt
    try {
      await addDoc(collection(db, "authLogs"), {
        mentorId: credentials.mentorId,
        email: credentials.email,
        licenseKey: credentials.licenseKey,
        timestamp: serverTimestamp(),
        success: false,
        error: error.message,
      })
    } catch (logError) {
      console.error("Error logging authentication failure:", logError)
    }

    // For development/testing only - remove this in production
    if (process.env.NODE_ENV === "development") {
      // Mock successful response for testing
      return {
        success: true,
        user: {
          mentorId: credentials.mentorId,
          email: credentials.email,
          username: credentials.email.split("@")[0],
          avatar:
            "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Screenshot%20%2826%29-Jh1kvoApQrXlWl3wCmLOaoRKyQRAwC.png",
          robotName: "Aggressive Scalper",
          isActive: true,
          licenseExpiry: "1/23/2125",
          allowedSymbols: [
            {
              symbol: "XAUUSDm",
              minLotSize: 0.01,
              maxTrades: 5,
            },
          ],
        },
      }
    }

    return {
      success: false,
      error: "Authentication failed. Please check your credentials and try again.",
    }
  }
}
