"use client"

import type React from "react"

import { useState } from "react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

export function AddTestUser() {
  const [email, setEmail] = useState("")
  const [mentorId, setMentorId] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      // Create a test user in the database
      const userRef = await addDoc(collection(db, "users"), {
        email: email,
        mentorId: mentorId,
        licenseKey: licenseKey,
        username: email.split("@")[0],
        isActive: true,
        licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
        robotName: "Test Trading Bot",
        allowedSymbols: [
          {
            symbol: "XAUUSDm",
            minLotSize: 0.01,
            maxTrades: 5,
          },
        ],
      })

      setResult({
        success: true,
        message: `Test user created with ID: ${userRef.id}`,
        userId: userRef.id,
      })
    } catch (error: any) {
      console.error("Error adding test user:", error)
      setResult({
        success: false,
        message: `Error: ${error.message || "Unknown error occurred"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-blue-500 rounded-lg p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-500">Add Test User</h1>
          <p className="text-blue-400 mt-2">Create a test user in your database</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Mentor ID"
              value={mentorId}
              onChange={(e) => setMentorId(e.target.value)}
              className="w-full bg-transparent border border-blue-500/30 rounded-md p-3 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-500"
              required
            />

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-blue-500/30 rounded-md p-3 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-500"
              required
            />

            <input
              type="text"
              placeholder="License Key"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              className="w-full bg-transparent border border-blue-500/30 rounded-md p-3 text-white placeholder:text-blue-300/50 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-md transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Create Test User"}
          </button>
        </form>

        {result && (
          <div
            className={`p-3 rounded-md text-sm ${result.success ? "bg-green-900/30 text-green-500" : "bg-red-900/30 text-red-500"}`}
          >
            {result.message}
          </div>
        )}
      </div>
    </div>
  )
}

