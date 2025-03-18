"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { doc, updateDoc, getDoc, increment } from "firebase/firestore"
import { db } from "@/lib/firebase"

export default function PaymentSimulation() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing")
  const [message, setMessage] = useState("Processing your payment...")

  useEffect(() => {
    const planId = searchParams.get("planId")
    const userId = searchParams.get("userId")
    const amount = searchParams.get("amount")
    const successUrl = searchParams.get("success")

    if (!planId || !userId || !amount || !successUrl) {
      setStatus("failed")
      setMessage("Invalid payment parameters")
      return
    }

    // Simulate payment processing - faster processing time
    const timer = setTimeout(async () => {
      try {
        // Update the user's account in Firestore
        const userRef = doc(db, "users", userId)

        // Check if user exists
        const userDoc = await getDoc(userRef)
        if (!userDoc.exists()) {
          throw new Error("User not found")
        }

        if (planId === "unlimited_accounts") {
          // For unlimited plan
          await updateDoc(userRef, {
            hasUnlimitedPlan: true,
            paymentHistory: [
              ...(userDoc.data().paymentHistory || []),
              {
                planId,
                amount: Number.parseInt(amount) / 100, // Convert cents to Rand
                date: new Date().toISOString(),
              },
            ],
          })
        } else {
          // For single account plan
          await updateDoc(userRef, {
            additionalAccounts: increment(1),
            paymentHistory: [
              ...(userDoc.data().paymentHistory || []),
              {
                planId,
                amount: Number.parseInt(amount) / 100, // Convert cents to Rand
                date: new Date().toISOString(),
              },
            ],
          })
        }

        setStatus("success")
        setMessage("Payment successful! Redirecting...")

        // Redirect back to the app - faster redirect
        setTimeout(() => {
          window.location.href = successUrl
        }, 1000) // Reduced from 2000ms to 1000ms for faster experience
      } catch (error) {
        console.error("Error processing payment:", error)
        setStatus("failed")
        setMessage("Payment failed. Please try again.")
      }
    }, 1500) // Reduced from 3000ms to 1500ms for faster processing

    return () => clearTimeout(timer)
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg border border-red-900 p-6 w-full max-w-md">
        <h1 className="text-xl font-medium text-center text-red-500 mb-6">Yoco Payment Simulation</h1>

        <div className="flex flex-col items-center justify-center py-8">
          {status === "processing" && (
            <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          )}

          {status === "success" && (
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-green-500"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
          )}

          {status === "failed" && (
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
          )}

          <p className="text-center text-white">{message}</p>

          {status === "failed" && (
            <button
              onClick={() => window.history.back()}
              className="mt-6 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
            >
              Go Back
            </button>
          )}
        </div>

        <div className="mt-4 text-xs text-center text-gray-400">
          This is a simulated payment page for demonstration purposes.
        </div>
      </div>
    </div>
  )
}

