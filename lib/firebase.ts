import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics, isSupported } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDE54BfEl0Qx7jqDnXeFPwy0nrDabAmi7U",
  authDomain: "quicktradepro-fbed4.firebaseapp.com",
  projectId: "quicktradepro-fbed4",
  storageBucket: "quicktradepro-fbed4.firebasestorage.app",
  messagingSenderId: "443810193511",
  appId: "1:443810193511:web:85c860d4b61ecd64cff4c2",
  measurementId: "G-EF3W2RMNRQ",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize services
export const auth = getAuth(app)
export const db = getFirestore(app)

// Initialize Analytics conditionally (only in browser)
export const initializeAnalytics = async () => {
  if (typeof window !== "undefined") {
    const analyticsSupported = await isSupported()
    if (analyticsSupported) {
      return getAnalytics(app)
    }
  }
  return null
}

// Helper function to handle Firestore permission errors
export const handleFirestoreError = (error: any) => {
  console.error("Firestore error:", error)

  if (error.code === "permission-denied") {
    console.log("Permission denied. Please check your Firebase security rules.")
    return "Permission denied. Please contact the administrator."
  }

  return error.message || "An error occurred"
}

export default app

