// Utility functions for debugging Firebase data issues

/**
 * Logs user data to console with formatting
 */
export function logUserData(userData: any, source: string) {
  console.group(`User Data from ${source}`)
  console.log("Full user data:", userData)

  // Log specific important fields
  console.log("Email:", userData.email)
  console.log("Mentor ID:", userData.mentorId)
  console.log("License Key:", userData.licenseKey)
  console.log("Robot Name:", userData.robotName)
  console.log("Profile Image:", userData.photoURL || userData.avatar)
  console.log("License Expiry:", userData.licenseExpiry)
  console.groupEnd()
}

/**
 * Checks if an image URL is valid and accessible
 */
export async function checkImageUrl(url: string): Promise<boolean> {
  if (!url) return false

  try {
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch (error) {
    console.error("Error checking image URL:", error)
    return false
  }
}

/**
 * Extracts profile image URL from user data trying multiple possible field names
 */
export function extractProfileImage(userData: any): string | null {
  const possibleFields = ["photoURL", "avatar", "profilePicture", "profile_picture", "image", "userImage"]

  for (const field of possibleFields) {
    if (userData[field] && typeof userData[field] === "string") {
      return userData[field]
    }
  }

  return null
}

