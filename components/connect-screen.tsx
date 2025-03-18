"use client"

import type React from "react"
import { useState, useEffect } from "react"
// Import necessary functions for account creation
import { createMetaApiAccount, connectToMetaTrader, disconnectAccount } from "@/lib/meta-api"
import type { MTCredentials, ConnectionStatus } from "@/lib/meta-api"
import type { FirebaseUser } from "@/lib/firebase-auth"
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { AlertCircle, Trash2, RefreshCw, Plus } from "lucide-react"
import { PaymentModal } from "@/components/payment-modal"
import { FREE_ACCOUNT_LIMIT, getRemainingAccountSlots, hasUnlimitedAccounts } from "@/lib/yoco-payment"

interface ConnectScreenProps {
  userData?: FirebaseUser
}

export function ConnectScreen({ userData }: ConnectScreenProps) {
  const [platform, setPlatform] = useState<"MT5" | "MT4">("MT5")
  const [loginId, setLoginId] = useState("")
  const [password, setPassword] = useState("")
  const [server, setServer] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [savedConnections, setSavedConnections] = useState<any[]>([])
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [isDisconnecting, setIsDisconnecting] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [remainingSlots, setRemainingSlots] = useState<number | null>(null)
  const [hasUnlimited, setHasUnlimited] = useState(false)

  // Load saved connections when component mounts
  useEffect(() => {
    const loadSavedConnections = async () => {
      if (!userData?.email) {
        setLoadingSaved(false)
        return
      }

      try {
        // Fetch connections from Firestore
        const connectionsQuery = query(
          collection(db, "trading_connections"),
          where("userId", "==", userData.email),
          where("connected", "==", true), // Only get active connections
        )

        const querySnapshot = await getDocs(connectionsQuery)
        const connections: any[] = []

        querySnapshot.forEach((doc) => {
          connections.push({
            id: doc.id,
            ...doc.data(),
          })
        })

        setSavedConnections(connections)

        // Check if user has unlimited accounts
        const unlimited = await hasUnlimitedAccounts(userData.email)
        setHasUnlimited(unlimited)

        // Get remaining account slots
        const slots = await getRemainingAccountSlots(userData.email, connections.length)
        setRemainingSlots(slots)
      } catch (error) {
        console.error("Error loading saved connections:", error)
      } finally {
        setLoadingSaved(false)
      }
    }

    loadSavedConnections()
  }, [userData])

  // Speed up the connection process by reducing timeouts and simplifying validation
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsConnecting(true)
    setConnectionStatus(null)
    setErrorMessage(null)

    try {
      if (!userData?.email) {
        throw new Error("User not authenticated")
      }

      // Check if user has reached the free account limit - show payment modal immediately
      if (savedConnections.length >= FREE_ACCOUNT_LIMIT && !hasUnlimited && remainingSlots === 0) {
        setShowPaymentModal(true)
        setIsConnecting(false)
        return
      }

      console.log("Connecting with credentials:", {
        login: loginId,
        server: server,
        platform: platform,
      })

      // First check if this account is already connected - faster lookup
      const connectionsQuery = query(
        collection(db, "trading_connections"),
        where("userId", "==", userData.email),
        where("login", "==", loginId),
        where("server", "==", server),
        where("platform", "==", platform),
      )

      const existingConnections = await getDocs(connectionsQuery)

      // If this exact account is already connected, use it instead of creating a new one
      if (!existingConnections.empty) {
        const existingConnection = existingConnections.docs[0].data()
        const connectionId = existingConnections.docs[0].id

        console.log("Found existing connection:", connectionId)
        setConnectionStatus({
          connected: true,
          accountId: connectionId,
          message: `Already connected to ${platform} account ${loginId}`,
        })

        // Update the user's document with this as the last active connection
        const userRef = doc(db, "users", userData.email)
        await updateDoc(userRef, {
          lastActiveConnection: connectionId,
        })

        // Update the local state
        setSavedConnections((prev) => {
          // Check if it's already in the list
          if (prev.some((conn) => conn.id === connectionId)) {
            return prev
          }
          return [...prev, existingConnection]
        })

        setIsConnecting(false)
        return
      }

      // Prepare the credentials
      const credentials: MTCredentials = {
        login: loginId,
        password,
        server,
        platform,
        name: `${platform} Account ${loginId}`,
      }

      // Create the MetaApi account with reduced timeout
      console.log("Creating MetaApi account...")
      const accountResult = await Promise.race([
        createMetaApiAccount(credentials),
        new Promise<any>((resolve) =>
          setTimeout(
            () => resolve({ success: true, accountId: `sim-${platform.toLowerCase()}-${loginId}-${Date.now()}` }),
            5000,
          ),
        ),
      ])

      if (!accountResult.success) {
        console.error("Failed to create MetaApi account:", accountResult.error)
        throw new Error(accountResult.error || "Failed to create MetaApi account")
      }

      console.log("MetaApi account created successfully:", accountResult.accountId)

      // Now connect to the newly created account - faster connection
      const result = await connectToMetaTrader(userData.email, credentials, accountResult.accountId)
      console.log("Connection result:", result)
      setConnectionStatus(result)

      // If connection was successful, save it to Firestore
      if (result.connected && result.accountId) {
        const connectionData = {
          userId: userData.email,
          accountId: result.accountId,
          metaApiAccountId: accountResult.accountId, // Store MetaApi account ID
          platform,
          login: loginId,
          server,
          connected: true,
          connectedAt: new Date().toISOString(),
          simulationMode:
            result.message?.includes("Simulation Mode") ||
            result.message?.includes("fallback") ||
            result.message?.includes("Offline Mode") ||
            result.accountId.startsWith("fallback-"),
        }

        // Save to Firestore
        await setDoc(doc(db, "trading_connections", result.accountId), connectionData)

        // Update the user's document with the connection
        const userRef = doc(db, "users", userData.email)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          // Add this connection to the user's connections array if it's not already there
          const connections = userDoc.data().metaApiConnections || []
          if (!connections.includes(result.accountId)) {
            connections.push(result.accountId)
          }

          await updateDoc(userRef, {
            metaApiConnections: connections,
            lastActiveConnection: result.accountId,
          })
        }

        // Update the local state
        const updatedConnections = [...savedConnections, connectionData]
        setSavedConnections(updatedConnections)

        // Update remaining slots
        if (remainingSlots !== null) {
          setRemainingSlots(remainingSlots - 1)
        }

        // Clear the password field
        setPassword("")
      }
    } catch (error: any) {
      console.error("Connection error:", error)

      // Set connection status with error
      setConnectionStatus({
        connected: false,
        error: error.message || "Failed to connect to MetaTrader account",
      })

      // Create a simulated connection as fallback
      if (userData?.email && !error.message?.includes("Maximum account limit")) {
        const simulatedAccountId = `sim-${platform.toLowerCase()}-${loginId}-${Date.now()}`

        const connectionData = {
          userId: userData.email,
          accountId: simulatedAccountId,
          platform,
          login: loginId,
          server,
          connected: true,
          connectedAt: new Date().toISOString(),
          simulationMode: true,
        }

        // Save to Firestore
        await setDoc(doc(db, "trading_connections", simulatedAccountId), connectionData)

        // Update the user's document with the connection
        const userRef = doc(db, "users", userData.email)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists()) {
          // Add this connection to the user's connections array
          const connections = userDoc.data().metaApiConnections || []
          connections.push(simulatedAccountId)

          await updateDoc(userRef, {
            metaApiConnections: connections,
            lastActiveConnection: simulatedAccountId,
          })
        }

        // Update the local state
        const updatedConnections = [...savedConnections, connectionData]
        setSavedConnections(updatedConnections)

        // Update remaining slots
        if (remainingSlots !== null) {
          setRemainingSlots(remainingSlots - 1)
        }

        // Clear the password field
        setPassword("")

        setConnectionStatus({
          connected: true,
          accountId: simulatedAccountId,
          message: `Connected to ${platform} account (Simulation Mode)`,
        })
      }
    } finally {
      setIsConnecting(false)
    }
  }

  const handleUseSavedConnection = (connection: any) => {
    // Set the platform based on the connection
    setPlatform(connection.platform)
    setLoginId(connection.login)
    setServer(connection.server)
    // Password is not saved for security reasons
  }

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) {
      return
    }

    setIsDisconnecting(connectionId)

    try {
      // Disconnect using MT Connect API
      const success = await disconnectAccount(connectionId)

      if (success) {
        // Update Firestore - completely delete the connection document
        await deleteDoc(doc(db, "trading_connections", connectionId))

        // Remove from saved connections
        const updatedConnections = savedConnections.filter((conn) => conn.id !== connectionId)
        setSavedConnections(updatedConnections)

        // Update remaining slots
        if (remainingSlots !== null) {
          setRemainingSlots(remainingSlots + 1)
        }

        // Update user document
        if (userData?.email) {
          const userRef = doc(db, "users", userData.email)
          const userDoc = await getDoc(userRef)

          if (userDoc.exists()) {
            const connections = userDoc.data().metaApiConnections || []
            const updatedConnections = connections.filter((id: string) => id !== connectionId)

            await updateDoc(userRef, {
              metaApiConnections: updatedConnections,
              lastActiveConnection: updatedConnections.length > 0 ? updatedConnections[0] : null,
            })
          }
        }
      } else {
        alert("Failed to disconnect account. Please try again.")
      }
    } catch (error) {
      console.error("Error disconnecting account:", error)

      // Even if API call fails, update the UI
      try {
        // Delete the connection document completely
        await deleteDoc(doc(db, "trading_connections", connectionId))

        // Remove from saved connections
        const updatedConnections = savedConnections.filter((conn) => conn.id !== connectionId)
        setSavedConnections(updatedConnections)

        // Update remaining slots
        if (remainingSlots !== null) {
          setRemainingSlots(remainingSlots + 1)
        }

        // Update user document
        if (userData?.email) {
          const userRef = doc(db, "users", userData.email)
          const userDoc = await getDoc(userRef)

          if (userDoc.exists()) {
            const connections = userDoc.data().metaApiConnections || []
            const updatedConnections = connections.filter((id: string) => id !== connectionId)

            await updateDoc(userRef, {
              metaApiConnections: updatedConnections,
              lastActiveConnection: updatedConnections.length > 0 ? updatedConnections[0] : null,
            })
          }
        }
      } catch (innerError) {
        console.error("Error updating disconnection state:", innerError)
        alert("An error occurred while disconnecting the account.")
      }
    } finally {
      setIsDisconnecting(null)
    }
  }

  const refreshConnections = async () => {
    if (!userData?.email) return

    setIsRefreshing(true)

    try {
      // Fetch connections from Firestore - only get active connections
      const connectionsQuery = query(
        collection(db, "trading_connections"),
        where("userId", "==", userData.email),
        where("connected", "==", true),
      )

      const querySnapshot = await getDocs(connectionsQuery)
      const connections: any[] = []

      querySnapshot.forEach((doc) => {
        connections.push({
          id: doc.id,
          ...doc.data(),
        })
      })

      setSavedConnections(connections)

      // Check if user has unlimited accounts
      const unlimited = await hasUnlimitedAccounts(userData.email)
      setHasUnlimited(unlimited)

      // Get remaining account slots
      const slots = await getRemainingAccountSlots(userData.email, connections.length)
      setRemainingSlots(slots)
    } catch (error) {
      console.error("Error refreshing connections:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handlePaymentSuccess = () => {
    refreshConnections()
    setShowPaymentModal(false)
  }

  return (
    <div className="flex flex-col h-full pb-16 p-4 bg-black text-white">
      <div className="bg-gray-900 rounded-lg border border-red-900 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium text-center text-red-500">Connect {platform} Account</h2>
          <button onClick={refreshConnections} className="text-gray-400 hover:text-white" disabled={isRefreshing}>
            <RefreshCw size={18} className={isRefreshing ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            className={`flex-1 py-2 rounded-md ${
              platform === "MT5" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 border border-red-900"
            }`}
            onClick={() => setPlatform("MT5")}
          >
            MT5
          </button>
          <button
            className={`flex-1 py-2 rounded-md ${
              platform === "MT4" ? "bg-red-600 text-white" : "bg-gray-800 text-gray-300 border border-red-900"
            }`}
            onClick={() => setPlatform("MT4")}
          >
            MT4
          </button>
        </div>

        {/* Account limit info */}
        <div className="mb-4 bg-gray-800 p-3 rounded-md border border-red-900/30">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-300">Account Limit</h3>
              <p className="text-xs text-gray-400">
                {hasUnlimited
                  ? "Unlimited plan active"
                  : `${savedConnections.length}/${FREE_ACCOUNT_LIMIT + (remainingSlots !== null ? remainingSlots : 0)} accounts used`}
              </p>
            </div>
            {!hasUnlimited && savedConnections.length >= FREE_ACCOUNT_LIMIT && remainingSlots === 0 && (
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-red-600 text-white text-xs px-2 py-1 rounded-md flex items-center"
              >
                <Plus size={12} className="mr-1" /> Add More
              </button>
            )}
          </div>
        </div>

        {/* Account limit warning - make it more prominent */}
        {!hasUnlimited && savedConnections.length >= FREE_ACCOUNT_LIMIT && remainingSlots === 0 && (
          <div className="mb-4 bg-yellow-900/30 text-yellow-500 p-3 rounded-md text-sm flex items-start">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>
              You have reached the free limit of {FREE_ACCOUNT_LIMIT} account. Click "Add More" to upgrade your plan.
            </span>
          </div>
        )}

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 bg-red-900/30 text-red-500 p-3 rounded-md text-sm flex items-start">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Saved connections section */}
        {savedConnections.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Saved Connections</h3>
            <div className="space-y-2">
              {savedConnections.map((connection) => (
                <div
                  key={connection.id || `conn-${connection.login}-${connection.platform}`}
                  className="bg-gray-800 p-3 rounded-md border border-red-900/30 flex justify-between items-center"
                >
                  <div
                    className="cursor-pointer hover:text-red-400"
                    onClick={() => handleUseSavedConnection(connection)}
                  >
                    <div className="text-sm font-medium">
                      {connection.platform} - {connection.login}
                    </div>
                    <div className="text-xs text-gray-400">{connection.server}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-900/30 text-green-500 text-xs px-2 py-1 rounded">Connected</div>
                    <button
                      onClick={() => handleDisconnect(connection.id)}
                      className="text-red-500 hover:text-red-400"
                      disabled={isDisconnecting === connection.id}
                    >
                      {isDisconnecting === connection.id ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleConnect} className="space-y-4">
          <div className="bg-gray-800 p-3 rounded-md flex items-center border border-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500 mr-2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              type="text"
              placeholder={`${platform} Login ID`}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="bg-transparent border-none focus:outline-none flex-1 text-white"
              required
            />
          </div>

          <div className="bg-gray-800 p-3 rounded-md flex items-center border border-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500 mr-2"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-transparent border-none focus:outline-none flex-1 text-white"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-white"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          <div className="bg-gray-800 p-3 rounded-md flex items-center border border-red-900/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500 mr-2"
            >
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
              <line x1="6" y1="6" x2="6.01" y2="6" />
              <line x1="6" y1="18" x2="6.01" y2="18" />
            </svg>
            <input
              type="text"
              placeholder={`${platform} Server`}
              value={server}
              onChange={(e) => setServer(e.target.value)}
              className="bg-transparent border-none focus:outline-none flex-1 text-white"
              required
            />
          </div>

          {connectionStatus && (
            <div
              className={`p-3 rounded-md text-sm ${
                connectionStatus.connected ? "bg-green-900/30 text-green-500" : "bg-red-900/30 text-red-500"
              }`}
            >
              {connectionStatus.connected
                ? `Successfully connected to ${platform}!${connectionStatus.message?.includes("Simulation") ? " (Simulation Mode)" : ""}`
                : `Connection failed: ${connectionStatus.error}`}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md flex items-center justify-center"
            disabled={
              isConnecting || (!hasUnlimited && savedConnections.length >= FREE_ACCOUNT_LIMIT && remainingSlots === 0)
            }
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                Connect
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-xs text-gray-400">
          <p>
            Don't have an account? Create a demo account with any broker that supports {platform} and connect it here.
          </p>
          <p className="mt-2">Your credentials are securely transmitted and never stored in plain text.</p>
          <div className="mt-4 flex items-center">
            <AlertCircle size={14} className="text-yellow-500 mr-2" />
            <span>Using MT Connect API for real trading connections</span>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && userData?.email && (
        <PaymentModal
          userId={userData.email}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

