"use client"

import { useState, useEffect } from "react"
import { AuthScreen } from "@/components/auth-screen"
import { MainApp } from "@/components/main-app"
import type { PortalUser } from "@/lib/portal-auth"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export default function Home() {
  const [user, setUser] = useState<PortalUser | null>(null)
  const [credentials, setCredentials] = useState<any>(null)
  const [activeScreen, setActiveScreen] = useState<"home" | "connect" | "settings">("home")
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<PortalUser | null>(null)

  // Check for existing authentication
  useEffect(() => {
    // Check for existing authentication
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        const storedUser = localStorage.getItem("portal_user")
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setUserData(userData)
            setIsAuthenticated(true)
          } catch (error) {
            console.error("Error parsing stored user data:", error)
            localStorage.removeItem("portal_user")
          }
        }
      } else {
        // User is signed out
        setIsAuthenticated(false)
        setUserData(null)
      }
      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => unsubscribe()
  }, [])

  const handleAuthenticated = (authenticatedUser: PortalUser) => {
    setUser(authenticatedUser)

    // Save user data to localStorage
    localStorage.setItem("portalUser", JSON.stringify(authenticatedUser))
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
    return <div className="flex items-center justify-center min-h-screen bg-black">Loading...</div>
  }

  if (!isAuthenticated) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />
  }

  return <MainApp handleLogout={handleLogout} />
}

