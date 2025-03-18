"use client"

import { useState, useEffect } from "react"
import { MainApp } from "@/components/main-app"
import { PermissionRequest } from "@/components/permission-request"
import { auth } from "@/lib/firebase"
import type { FirebaseUser } from "@/lib/firebase-auth"

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userData, setUserData] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPermissionRequest, setShowPermissionRequest] = useState(false)
  const [permissionGranted, setPermissionGranted] = useState(false)

  useEffect(() => {
    async function loadUserData() {
      try {
        // Check for existing authentication
        const storedUser = localStorage.getItem("firebase_user")
        if (storedUser) {
          try {
            // Parse the stored user data
            const user = JSON.parse(storedUser)

            // Validate and normalize the stored user data
            if (user && user.email) {
              // Normalize the user data to ensure all required fields are present
              const normalizedUser = {
                ...user,
                // Ensure these critical fields exist with proper values
                mentorId: user.mentorId || user.mentor_id || user.mentorID,
                licenseKey: user.licenseKey || user.license_key || user.license,
                robotName: user.robotName || user.robot_name || user.tradingBotName || "Trading Bot",
                licenseExpiry: user.licenseExpiry || user.license_expiry || user.expiry,
                isActive: user.isActive !== false, // Default to true unless explicitly set to false
              }

              setUserData(normalizedUser)
              setIsAuthenticated(true)

              // Check if permission has been requested before
              const permissionRequested = localStorage.getItem("overlay_permission_requested")
              if (!permissionRequested) {
                setShowPermissionRequest(true)
                // Mark that we've shown the permission request
                localStorage.setItem("overlay_permission_requested", "true")
              } else {
                // Assume permission is granted if previously requested
                setPermissionGranted(true)
              }
            } else {
              // Invalid user data, clear it
              localStorage.removeItem("firebase_user")
              setError("Invalid user data. Please log in again.")
            }
          } catch (error) {
            localStorage.removeItem("firebase_user")
            setError("Error loading user data. Please log in again.")
          }
        }
      } catch (error) {
        setError("An unexpected error occurred. Please try again.")
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [])

  const handleLogout = async () => {
    try {
      await auth.signOut()
      localStorage.removeItem("firebase_user")
      setUserData(null)
      setIsAuthenticated(false)

      // Redirect to login page
      window.location.href = "/portal-login"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const handlePermissionAccept = () => {
    // In a real mobile app, this would open the system settings
    // For our web app, we'll just simulate accepting the permission
    setPermissionGranted(true)
    localStorage.setItem("overlay_permission_granted", "true")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  // If there was an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white p-4">
        <div className="bg-red-900/30 p-4 rounded-lg max-w-md text-center mb-4">
          <p className="text-red-400">{error}</p>
        </div>
        <button
          onClick={() => (window.location.href = "/portal-login")}
          className="bg-red-600 text-white px-4 py-2 rounded-md"
        >
          Go to Login
        </button>
      </div>
    )
  }

  // If not authenticated, redirect to the portal login page
  if (!isAuthenticated || !userData) {
    if (typeof window !== "undefined") {
      window.location.href = "/portal-login"
      return (
        <div className="flex items-center justify-center h-screen bg-black text-white">
          <p>Redirecting to login...</p>
        </div>
      )
    }
    return <div>Redirecting to login...</div>
  }

  // If authenticated, show the main app
  return (
    <>
      <MainApp userData={userData} onLogout={handleLogout} permissionGranted={permissionGranted} />

      {showPermissionRequest && (
        <PermissionRequest onClose={() => setShowPermissionRequest(false)} onAccept={handlePermissionAccept} />
      )}
    </>
  )
}

