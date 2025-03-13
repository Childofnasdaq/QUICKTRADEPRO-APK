"use client"

import { useEffect } from "react"
import { initializeAnalytics } from "@/lib/firebase"

export default function EnvSetup() {
  useEffect(() => {
    // Initialize Firebase Analytics
    const setupAnalytics = async () => {
      const analytics = await initializeAnalytics()
      if (analytics) {
        console.log("Firebase Analytics initialized")
      }
    }

    setupAnalytics()
  }, [])

  return null
}

