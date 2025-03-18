import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore"
import { db } from "./firebase"

// Define the FirebaseUser interface
export interface FirebaseUser {
  uid?: string
  email: string | null
  displayName?: string | null
  photoURL?: string | null
  mentorId?: string
  licenseKey?: string
  robotName?: string
  licenseExpiry?: string
  isActive?: boolean
  allowedSymbols?: AllowedSymbol[]
  licenseKeyUsed?: boolean // Track license key usage
  username?: string // For backward compatibility
}

// Define types for the application

// Symbol allowed for trading
export interface AllowedSymbol {
  symbol: string
  minLotSize: number
  maxTrades: number
}

// Get current user data - optimized for speed
export async function getCurrentUserData(uid: string): Promise<FirebaseUser | null> {
  try {
    console.time("getCurrentUserData")
    console.log("Getting user data for:", uid)

    const userDocRef = doc(db, "users", uid) // Use uid as document ID
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data() as FirebaseUser // Type assertion for safety
      console.log("Retrieved user data:", userData)

      // Ensure we have all the fields we need
      const formattedUserData: FirebaseUser = {
        uid: uid,
        email: userData.email,
        displayName: userData.username || userData.email?.split("@")[0],
        photoURL: userData.avatar || null, // Prioritize the avatar field
        mentorId: userData.mentorId,
        licenseKey: userData.licenseKey,
        robotName: userData.robotName || "Trading Bot",
        licenseExpiry: userData.licenseExpiry || "2025-12-31",
        isActive: userData.isActive !== false, // Default to true if not specified
        allowedSymbols: userData.allowedSymbols || [],
      }

      console.timeEnd("getCurrentUserData")
      return formattedUserData
    } else {
      console.timeEnd("getCurrentUserData")
      console.log("User not found using uid:", uid)
      return null
    }
  } catch (error) {
    console.error("Error getting user data:", error)
    console.timeEnd("getCurrentUserData")
    return null
  }
}

// Update allowed symbols
export async function updateAllowedSymbols(uid: string, allowedSymbols: AllowedSymbol[]): Promise<void> {
  try {
    console.log("Updating allowed symbols for user:", uid, allowedSymbols)

    const userDocRef = doc(db, "users", uid)

    // First check if the document exists
    const docSnap = await getDoc(userDocRef)

    if (docSnap.exists()) {
      // Update existing document
      await updateDoc(userDocRef, { allowedSymbols })
    } else {
      // Create new document if it doesn't exist
      await setDoc(userDocRef, {
        allowedSymbols,
        email: uid, // Use uid as email if creating new doc
        updatedAt: new Date().toISOString(),
      })
    }

    console.log("Successfully updated allowed symbols for user:", uid)
    return Promise.resolve()
  } catch (error) {
    console.error("Error updating allowed symbols:", error)
    throw error
  }
}

// Check MetaAPI connection status
export async function checkMetaApiConnection(): Promise<boolean> {
  // In a real implementation, this would check the actual MetaAPI connection
  // For now, we'll return a mock status
  return new Promise((resolve) => {
    // Simulate a network delay
    setTimeout(() => {
      resolve(true)
    }, 500) // Reduced delay for faster response
  })
}

// Validate portal credentials and fetch user data from Firebase
export async function validatePortalCredentials(credentials: {
  mentorId: string
  email: string
  licenseKey: string
}): Promise<{ success: boolean; user?: FirebaseUser; error?: string }> {
  try {
    console.time("validateCredentials")
    console.log("Validating credentials:", credentials)

    const userDocRef = doc(db, "users", credentials.email) // Use email as document ID
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      console.timeEnd("validateCredentials")
      return { success: false, error: "User not found" }
    }

    const userData = userDocSnap.data() as FirebaseUser // Type assertion for safety

    if (
      String(userData.mentorId || "") !== credentials.mentorId ||
      String(userData.licenseKey || "") !== credentials.licenseKey
    ) {
      console.timeEnd("validateCredentials")
      return { success: false, error: "Invalid credentials (Mentor ID or License Key mismatch)" }
    }

    // Check if license is active
    if (userData.isActive === false) {
      console.timeEnd("validateCredentials")
      return { success: false, error: "Your license is inactive. Please contact support." }
    }

    // Check if license has expired
    if (userData.licenseExpiry) {
      const licenseExpiry = new Date(userData.licenseExpiry)
      const now = new Date()
      if (licenseExpiry < now) {
        console.timeEnd("validateCredentials")
        return { success: false, error: "Your license has expired. Please renew your subscription." }
      }
    }

    // Mark license key as used (for testing purposes only!)
    await updateDoc(userDocRef, { licenseKeyUsed: true })

    // Format user data for return
    const formattedUser: FirebaseUser = {
      uid: credentials.email,
      email: userData.email,
      displayName: userData.username || userData.email?.split("@")[0],
      photoURL: userData.avatar || userData.photoURL || null,
      mentorId: userData.mentorId,
      licenseKey: userData.licenseKey,
      robotName: userData.robotName || "Trading Bot",
      licenseExpiry: userData.licenseExpiry || "2025-12-31",
      isActive: userData.isActive !== false, // Default to true if not specified
      allowedSymbols: userData.allowedSymbols || [],
      licenseKeyUsed: true,
    }

    console.timeEnd("validateCredentials")
    return { success: true, user: formattedUser }
  } catch (error: any) {
    console.error("Portal authentication error:", error)
    console.timeEnd("validateCredentials")
    return { success: false, error: `Authentication failed: ${error.message}` }
  }
}

// Create a new user if one doesn't exist (for testing purposes)
export async function createUserIfNotExists(userData: {
  email: string
  mentorId: string
  licenseKey: string
}): Promise<boolean> {
  try {
    const userDocRef = doc(db, "users", userData.email)
    const userDocSnap = await getDoc(userDocRef)

    if (!userDocSnap.exists()) {
      // Create a new user
      const newUser: FirebaseUser = {
        email: userData.email,
        mentorId: userData.mentorId,
        licenseKey: userData.licenseKey,
        displayName: userData.email.split("@")[0],
        isActive: true,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        robotName: "QuickTrade Bot",
        licenseKeyUsed: false,
        allowedSymbols: [
          {
            symbol: "XAUUSDm",
            minLotSize: 0.01,
            maxTrades: 5,
          },
        ],
      }

      await updateDoc(userDocRef, newUser)
      console.log("Created new user:", userData.email)
      return true
    }

    return false
  } catch (error) {
    console.error("Error creating user:", error)
    return false
  }
}

