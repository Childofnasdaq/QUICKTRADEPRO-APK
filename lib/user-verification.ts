import { doc, getDoc } from "firebase/firestore"
import { db } from "./firebase"

export const verifyUser = async (email: string, mentorID: string, licenseKey: string): Promise<string | null> => {
  try {
    console.log("Verifying user:", { email, mentorID, licenseKey })

    // Direct document lookup using email as the document ID
    const userDocRef = doc(db, "users", email)
    const userDocSnap = await getDoc(userDocRef)

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data()
      console.log("User data retrieved:", userData)

      // Check both mentorId and mentorID (case sensitivity matters)
      const mentorIdMatch = userData.mentorId === mentorID || userData.mentorID === mentorID

      // Check both licenseKey variations
      const licenseKeyMatch = userData.licenseKey === licenseKey || userData.license_key === licenseKey

      if (mentorIdMatch && licenseKeyMatch) {
        console.log("User verified successfully")
        // Return profile picture from any possible field name
        return userData.profilePicture || userData.avatar || userData.photoURL || null
      } else {
        console.log("Credential mismatch:", {
          expectedMentorId: mentorID,
          actualMentorId: userData.mentorId || userData.mentorID,
          expectedLicenseKey: licenseKey,
          actualLicenseKey: userData.licenseKey || userData.license_key,
        })
        return null
      }
    } else {
      console.log("User document not found for email:", email)
      return null
    }
  } catch (error) {
    console.error("Error verifying user:", error)
    return null
  }
}

export const handleLogin = async (
  email: string,
  mentorID: string,
  licenseKey: string,
  setUserProfile: (url: string) => void,
  navigate: (path: string) => void,
) => {
  try {
    const profilePic = await verifyUser(email, mentorID, licenseKey)
    if (profilePic) {
      setUserProfile(profilePic) // Store profile picture for display

      // Store user data in localStorage for persistence
      const userData = {
        email,
        mentorId: mentorID,
        licenseKey: licenseKey,
        photoURL: profilePic,
      }
      localStorage.setItem("firebase_user", JSON.stringify(userData))

      navigate("/home") // Move to the next screen
    } else {
      alert("Invalid details, please try again!")
    }
  } catch (error) {
    console.error("Login error:", error)
    alert("An error occurred during login. Please try again.")
  }
}

