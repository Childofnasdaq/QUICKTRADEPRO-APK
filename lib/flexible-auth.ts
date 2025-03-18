// Helper functions for flexible authentication

import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"

// Enhance the findUserWithCredentials function to properly extract and normalize user data
export async function findUserWithCredentials(email: string, mentorId: string, licenseKey: string) {
  try {
    // First try direct document lookup by email (most efficient)
    const directUserRef = doc(db, "users", email)
    const directUserSnap = await getDoc(directUserRef)

    if (directUserSnap.exists()) {
      const userData = directUserSnap.data()

      // Check credentials with flexibility
      const result = checkCredentials(userData, mentorId, licenseKey)
      if (result.fullMatch) {
        return normalizeUserData(email, userData)
      }
    }

    // If direct lookup fails or credentials don't match, try query
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))

    const querySnapshot = await getDocs(q)

    // Check each document for matching credentials
    for (const doc of querySnapshot.docs) {
      const userData = doc.data()

      const result = checkCredentials(userData, mentorId, licenseKey)
      if (result.fullMatch) {
        return normalizeUserData(doc.id, userData)
      }
    }

    // If no match found, try a broader search
    const allUsersSnapshot = await getDocs(collection(db, "users"))

    // Store partial matches for potential fallback
    let bestPartialMatch = null
    let bestMatchScore = 0

    for (const doc of allUsersSnapshot.docs) {
      const userData = doc.data()

      // Check if email matches (case insensitive)
      const userEmail = String(userData.email || "").toLowerCase()
      const searchEmail = email.toLowerCase()

      if (userEmail === searchEmail) {
        const result = checkCredentials(userData, mentorId, licenseKey)

        if (result.fullMatch) {
          return normalizeUserData(doc.id, userData)
        } else {
          // Calculate match score (email + mentorId or licenseKey)
          let matchScore = 1 // Email already matches
          if (result.mentorIdMatch) matchScore += 1
          if (result.licenseKeyMatch) matchScore += 1

          // Keep track of best partial match
          if (matchScore > bestMatchScore) {
            bestMatchScore = matchScore
            bestPartialMatch = userData
            bestPartialMatch.id = doc.id
          }
        }
      }
    }

    // If we have a partial match with at least email + one other credential, use it
    if (bestPartialMatch && bestMatchScore >= 2) {
      return normalizeUserData(bestPartialMatch.id, bestPartialMatch)
    }

    return null
  } catch (error) {
    console.error("Error finding user:", error)
    return null
  }
}

// Helper function to check credentials with flexibility
function checkCredentials(userData: any, mentorId: string, licenseKey: string) {
  // Try different possible field names for mentorId
  const possibleMentorIdFields = ["mentorId", "mentorID", "mentor_id", "mentorid", "mentor", "id"]
  let mentorIdMatch = false
  let mentorIdField = ""

  for (const field of possibleMentorIdFields) {
    if (userData[field]) {
      const actualMentorId = String(userData[field]).trim()
      const inputMentorId = String(mentorId).trim()

      if (actualMentorId === inputMentorId) {
        mentorIdMatch = true
        mentorIdField = field
        break
      }
    }
  }

  // Try different possible field names for licenseKey
  const possibleLicenseKeyFields = ["licenseKey", "licensekey", "license_key", "license", "key", "authKey"]
  let licenseKeyMatch = false
  let licenseKeyField = ""

  for (const field of possibleLicenseKeyFields) {
    if (userData[field]) {
      const actualLicenseKey = String(userData[field]).trim()
      const inputLicenseKey = String(licenseKey).trim()

      if (actualLicenseKey === inputLicenseKey) {
        licenseKeyMatch = true
        licenseKeyField = field
        break
      }
    }
  }

  return {
    fullMatch: mentorIdMatch && licenseKeyMatch,
    mentorIdMatch,
    licenseKeyMatch,
    mentorIdField,
    licenseKeyField,
  }
}

// Function to extract profile picture URL from user data
export function extractProfilePicture(userData: any): string | null {
  // Try different possible field names for profile picture
  const possibleFields = [
    "profilePicture",
    "profile_picture",
    "avatar",
    "photoURL",
    "photo_url",
    "image",
    "picture",
    "profileImage",
    "profile_image",
  ]

  for (const field of possibleFields) {
    if (userData[field] && typeof userData[field] === "string") {
      return userData[field]
    }
  }

  return null
}

// Function to get user by email only
export async function getUserByEmailOnly(email: string): Promise<any | null> {
  try {
    const directUserRef = doc(db, "users", email)
    const directUserSnap = await getDoc(directUserRef)

    if (directUserSnap.exists()) {
      const userData = directUserSnap.data()
      return {
        id: email,
        ...userData,
      }
    }

    return null
  } catch (error) {
    console.error("Error getting user by email:", error)
    return null
  }
}

// Helper function to normalize user data and ensure all required fields are present
function normalizeUserData(id: string, userData: any) {
  // Ensure we have standard field names regardless of what's in the database
  return {
    id: id,
    ...userData,
    // Ensure these critical fields exist with proper values
    email: userData.email,
    mentorId: userData.mentorId || userData.mentor_id || userData.mentorID,
    licenseKey: userData.licenseKey || userData.license_key || userData.license,
    robotName: userData.robotName || userData.robot_name || userData.tradingBotName || "Trading Bot",
    licenseExpiry: userData.licenseExpiry || userData.license_expiry || userData.expiry,
    isActive: userData.isActive !== false, // Default to true unless explicitly set to false
    // Keep the original fields too
  }
}

