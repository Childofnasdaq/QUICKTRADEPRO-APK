"use client"

import type React from "react"

import { useState } from "react"
import { handleLogin } from "@/lib/user-verification"

export function LoginVerification() {
  const [email, setEmail] = useState("")
  const [mentorID, setMentorID] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [userProfile, setUserProfile] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Simple navigation function for demo purposes
  const navigate = (path: string) => {
    console.log(`Navigating to: ${path}`)
    // In a real app, you would use router.push(path) or similar
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await handleLogin(email, mentorID, licenseKey, setUserProfile, navigate)
    } catch (error) {
      console.error("Login error:", error)
      alert("An error occurred during login. Please try again.")
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

        {userProfile && (
          <div className="flex justify-center">
            <img
              src={userProfile || "/placeholder.svg"}
              alt="Profile Picture"
              className="w-24 h-24 rounded-full object-cover border-2 border-red-500"
            />
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
              value={mentorID}
              onChange={(e) => setMentorID(e.target.value)}
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

          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Verifying..." : "Login"}
          </button>
        </form>

        <div className="text-center text-red-400 text-sm">
          Need help? Contact support at support@childofnasdaqofficial.co.za
        </div>
      </div>
    </div>
  )
}

