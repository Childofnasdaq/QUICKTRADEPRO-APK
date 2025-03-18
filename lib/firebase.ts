import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"

// Your Firebase configuration with the provided values
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
let app, auth, db, storage, analytics

try {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)

  // Only initialize analytics in browser environment
  if (typeof window !== "undefined") {
    analytics = getAnalytics(app)
  }

  console.log("Firebase initialized successfully")
} catch (error) {
  console.error("Error initializing Firebase:", error)
}

export { auth, db, storage, analytics }
export default app

