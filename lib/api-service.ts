// API service to communicate with the QuickTradePro portal

export type PortalUser = {
  mentorId: string
  email: string
  licenseKey: string
  username: string
  avatar?: string
  robotName?: string
  licenseExpiry: Date
  isActive: boolean
}

export async function validateLicense(
  mentorId: string,
  email: string,
  licenseKey: string,
): Promise<{
  success: boolean
  user?: PortalUser
  error?: string
}> {
  try {
    // In a real implementation, this would be an API call to your portal
    // For now, we'll simulate the validation with a mock response

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Simple validation - in production, this would be a real API call
    if (!mentorId || !email || !licenseKey) {
      return { success: false, error: "All fields are required" }
    }

    // Mock successful validation
    if (licenseKey.length > 5) {
      const user: PortalUser = {
        mentorId,
        email,
        licenseKey,
        username: email.split("@")[0],
        avatar:
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-XjQ9UtyKq1KXvIjUOL0ffYCtH5gm1g.png", // Default avatar
        robotName: "Aggressive Scalper", // Default robot name
        licenseExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
      }

      return { success: true, user }
    }

    return { success: false, error: "Invalid license key" }
  } catch (error) {
    console.error("License validation error:", error)
    return { success: false, error: "Failed to validate license. Please try again." }
  }
}

export async function getLicenseStatus(licenseKey: string): Promise<{
  isActive: boolean
  expiryDate: Date | null
}> {
  try {
    // In a real implementation, this would be an API call to your portal
    // For now, we'll simulate the status check

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Mock response
    return {
      isActive: true,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }
  } catch (error) {
    console.error("License status check error:", error)
    return {
      isActive: false,
      expiryDate: null,
    }
  }
}

