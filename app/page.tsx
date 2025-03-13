"use client"

import { useState, useEffect } from "react"
import { AuthScreen } from "@/components/auth-screen"
import { MainApp } from "@/components/main-app"
import { LoadingScreen } from "@/components/loading-screen"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { getUserData } from "@/lib/portal-auth"

export default function Home() {
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check for existing authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        try {
          // Get user data from localStorage first for immediate display
          const storedUser = localStorage.getItem("portal_user")
          if (storedUser) {
            const parsedUserData = JSON.parse(storedUser)
            setUserData(parsedUserData)
            setIsAuthenticated(true)
          }

          // Then fetch fresh data from the portal
          const freshUserData = await getUserData(user.uid)
          if (freshUserData) {
            setUserData(freshUserData)
            // Update localStorage with fresh data
            localStorage.setItem("portal_user", JSON.stringify(freshUserData))
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
          // If we can't get fresh data but have stored data, continue with stored data
          if (!userData) {
            setIsAuthenticated(false)
          }
        }
      } else {
        // User is signed out
        setIsAuthenticated(false)
        setUserData(null)
        localStorage.removeItem("portal_user")
      }
      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const handleAuthenticated = (authenticatedUser) => {
    setUserData(authenticatedUser)
    setIsAuthenticated(true)
    // Save user data to localStorage
    localStorage.setItem("portal_user", JSON.stringify(authenticatedUser))
  }

  const handleLogout = () => {
    localStorage.removeItem("portal_user")
    setUserData(null)
    setIsAuthenticated(false)
    auth.signOut().catch((error) => {
      console.error("Error signing out:", error)
    })
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  return <MainApp userData={userData} onLogout={handleLogout} />
}

