"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { findUserWithCredentials, extractProfilePicture } from "@/lib/flexible-auth"

export function PortalLogin() {
  const [email, setEmail] = useState("")
  const [mentorId, setMentorId] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [userImage, setUserImage] = useState<string | null>(null)

  // Check if we're already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("firebase_user")
    if (storedUser) {
      window.location.href = "/"
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    setUserImage(null)

    try {
      // Use the flexible authentication helper
      const userData = await findUserWithCredentials(email, mentorId, licenseKey)

      if (userData) {
        // Extract and display profile picture if available
        const profilePic = extractProfilePicture(userData)
        if (profilePic) {
          setUserImage(profilePic)
        }

        // Store user data and redirect
        localStorage.setItem("firebase_user", JSON.stringify(userData))
        window.location.href = "/"
      } else {
        setError("Invalid credentials. Please check your Email, Mentor ID, and License Key.")
      }
    } catch (error: any) {
      console.error("Authentication error:", error)
      setError(`Authentication failed. Please try again.`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-red-500 rounded-lg p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-500">QUICKTRADE PRO</h1>
          <p className="text-red-400 mt-2">Enter your portal credentials to continue</p>
        </div>

        {userImage && (
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-red-500">
              <img src={userImage || "/placeholder.svg"} alt="User Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-red-500/30 rounded-md p-3 text-white placeholder:text-red-300/50 focus:outline-none focus:border-red-500"
              required
            />

            <input
              type="text"
              placeholder="Mentor ID"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className="w-full bg-transparent border border-red-500/30 rounded-md p-3 text-white placeholder:text-red-300/50 focus:outline-none focus:border-red-500"
              required
            />

            <input
              type="text"
              placeholder="License Key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full bg-transparent border border-red-500/30 rounded-md p-3 text-white placeholder:text-red-300/50 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center">{error}</div>}

          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </div>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <div className="text-center text-red-400 text-sm">
          Need help? Contact support at support@childofnasdaqofficial.co.za
        </div>
      </div>
    </div>
  )
}

