export interface UserData {
  uid?: string
  mentorId?: string | number
  email?: string
  licenseKey?: string
  licenseExpiry?: string
  photoURL?: string
  robotName?: string
  displayName?: string
  eaName?: string
  deviceId?: string
  licensePlan?: string
  daysUntilExpiry?: number
  licenseDuration?: number
  metaApiAccountId?: string
}

export const authenticateUser = async (
  mentorId: string,
  email: string,
  licenseKey: string,
  deviceId?: string,
): Promise<UserData> => {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mentorId, email, licenseKey, deviceId }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Authentication failed")
    }

    return data.user
  } catch (error) {
    console.error("Authentication error:", error)
    throw error
  }
}

export const logoutUser = async () => {
  try {
    // Get user data to deactivate license key
    const userData = localStorage.getItem("userData")
    if (userData) {
      const parsedUserData = JSON.parse(userData)
      if (parsedUserData.licenseKey) {
        // Deactivate the license key
        await fetch("/api/deactivate-license", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            licenseKey: parsedUserData.licenseKey,
            deviceId: parsedUserData.deviceId,
          }),
        })
      }
    }

    // Clear all localStorage items
    localStorage.removeItem("userData")
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("metatraderDetails")
    localStorage.removeItem("tradingSymbols")
    localStorage.removeItem("isTrading")
    localStorage.removeItem("tradingLogs")
    localStorage.removeItem("showLogs")
    localStorage.removeItem("lotSize")
    localStorage.removeItem("maxTrades")
    // Don't remove deviceId as it's used to identify this device
  } catch (error) {
    console.error("Logout error:", error)
    throw error
  }
}

export const getUserData = async (uid: string): Promise<UserData | null> => {
  try {
    const response = await fetch(`/api/user/${uid}`)

    if (!response.ok) {
      throw new Error("Failed to fetch user data")
    }

    const userData = await response.json()
    return userData
  } catch (error) {
    console.error("Error fetching user data:", error)
    return null
  }
}

export const checkSession = async (): Promise<boolean> => {
  try {
    // Check if we have userData and deviceId in localStorage
    const userData = localStorage.getItem("userData")
    const deviceId = localStorage.getItem("deviceId")

    if (!userData || !deviceId) {
      return false
    }

    // Validate session with the server
    const response = await fetch("/api/check-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: JSON.parse(userData).uid,
        deviceId,
      }),
    })

    const data = await response.json()
    return data.valid === true
  } catch (error) {
    console.error("Session check error:", error)
    return false
  }
}

