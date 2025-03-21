export interface UserData {
  uid?: string
  mentorId?: string
  email?: string
  licenseKey?: string
  licenseExpiry?: string
  licenseStatus?: string
  licensePlan?: string
  isExpiring?: boolean
  photoURL?: string
  robotName?: string
  eaName?: string
  displayName?: string
}

export const authenticateUser = async (mentorId: string, email: string, licenseKey: string): Promise<UserData> => {
  try {
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mentorId, email, licenseKey }),
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
    localStorage.removeItem("userData")
    localStorage.removeItem("isAuthenticated")
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

