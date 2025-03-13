import { db, auth } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
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
  allowedSymbols?: AllowedSymbol[]
}

// Get user data from Firestore
export async function getUserData(userId: string): Promise<PortalUser | null> {
  try {
    const userDocRef = doc(db, "users", userId)
    const userDoc = await getDoc(userDocRef)

    if (userDoc.exists()) {
      return userDoc.data() as PortalUser
    } else {
      console.log("No user data found in Firestore")
      return null
    }
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

// Check MetaAPI connection status
export async function checkMetaApiConnection(): Promise<boolean> {
  try {
    // In a real implementation, this would check the actual MetaAPI connection
    // For now, we'll return a mock status
    return true
  } catch (error) {
    console.error("MetaAPI connection check error:", error)
    return false
  }
}

// Get bot logs from Firebase
export async function getBotLogs(userId: string): Promise<string[]> {
  try {
    const logsRef = collection(db, "botLogs")
    const q = query(logsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return ["No logs found. The bot may not be running yet."]
    }

    return querySnapshot.docs.map((doc) => doc.data().message)
  } catch (error) {
    console.error("Error fetching bot logs:", error)
    return ["Error fetching logs. Please try again later."]
  }
}

export async function toggleTrading(isTrading: boolean): Promise<{
  success: boolean
  message: string
}> {
  try {
    // In a real implementation, this would toggle trading on the MetaAPI account
    // For now, we'll return a mock response

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock successful response
    return {
      success: true,
      message: `Trading ${isTrading ? "started" : "stopped"} successfully!`,
    }
  } catch (error) {
    console.error("Toggle trading error:", error)
    return {
      success: false,
      message: "Failed to toggle trading. Please try again.",
    }
  }
}

export async function validatePortalCredentials(credentials: PortalCredentials): Promise<{
  success: boolean
  user?: PortalUser
  error?: string
}> {
  try {
    // In a real implementation, this would validate credentials against your portal API
    // For now, we'll use a mock implementation

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simple validation
    if (!credentials.mentorId || !credentials.email || !credentials.licenseKey) {
      return { success: false, error: "All fields are required" }
    }

    // Mock successful validation
    if (credentials.licenseKey.length > 5) {
      const user: PortalUser = {
        mentorId: credentials.mentorId,
        email: credentials.email,
        username: credentials.email.split("@")[0],
        avatar:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-XjQ9UtyKq1KXvIjUOL0ffYCtH5gm1g.png",
        robotName: "Aggressive Scalper",
        isActive: true,
        licenseExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        allowedSymbols: [
          {
            symbol: "XAUUSDm",
            minLotSize: 0.01,
            maxTrades: 5,
          },
        ],
      }

      // After successful Firebase authentication, store user data in Firestore
      try {
        // First try to sign in
        const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.licenseKey)
        const userId = userCredential.user.uid

        // Store user data in Firestore
        await setDoc(doc(db, "users", userId), user, { merge: true })

        return { success: true, user }
      } catch (firebaseError: any) {
        // If user doesn't exist, create a new account
        if (firebaseError.code === "auth/user-not-found") {
          const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.licenseKey)
          const userId = userCredential.user.uid

          // Store user data in Firestore
          await setDoc(doc(db, "users", userId), user)

          return { success: true, user }
        } else {
          throw firebaseError
        }
      }
    }

    return { success: false, error: "Invalid license key" }
  } catch (error: any) {
    console.error("Authentication error:", error)
    return {
      success: false,
      error: error.message || "Authentication failed. Please check your credentials and try again.",
    }
  }
}

export async function saveUserSettings(
  userId: string,
  settings: { allowedSymbols: AllowedSymbol[] },
): Promise<boolean> {
  try {
    const userDocRef = doc(db, "users", userId)

    await updateDoc(userDocRef, {
      allowedSymbols: settings.allowedSymbols,
    })

    return true
  } catch (error) {
    console.error("Error saving user settings:", error)
    return false
  }
}

