"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { checkMetaApiConnection, toggleTrading, type PortalUser } from "@/lib/portal-auth"
import Image from "next/image"
import { AlertCircle, CheckCircle, Play, Square } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { db, auth } from "@/lib/firebase"
import { collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore"

type HomeScreenProps = {
  user: PortalUser
  credentials: any
}

export function HomeScreen({ user, credentials }: HomeScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [isTrading, setIsTrading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [botLogs, setBotLogs] = useState<string[]>([])
  const [userData, setUserData] = useState<PortalUser | null>(null)

  // Check MetaAPI connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkMetaApiConnection()
      setIsConnected(connected)
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const handleToggleTrading = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const result = await toggleTrading(credentials, !isTrading)

      if (result.success) {
        setIsTrading(!isTrading)
        setSuccess(result.message)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Toggle trading error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!userData || !auth.currentUser) return

    // Set up real-time listener for bot logs
    const logsRef = collection(db, "botLogs")
    const q = query(logsRef, where("userId", "==", auth.currentUser.uid), orderBy("timestamp", "desc"), limit(20))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const newLogs = snapshot.docs.map((doc) => doc.data().message)
        setBotLogs(newLogs)
      },
      (error) => {
        console.error("Error fetching logs:", error)
      },
    )

    return () => unsubscribe()
  }, [userData])

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="bg-black border border-red-500 glow-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {user.avatar ? (
              <Image
                src={user.avatar || "/placeholder.svg"}
                alt="User Avatar"
                width={80}
                height={80}
                className="rounded-full border-2 border-red-500"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-red-900 flex items-center justify-center text-white text-2xl">
                {user.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <CardTitle className="text-xl font-bold text-red-500 neon-text">
            Welcome, {user.username || user.email.split("@")[0]}
          </CardTitle>
          <CardDescription className="text-red-300">Robot: {user.robotName}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-900/30 border-green-500 text-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-300">License Status:</span>
              <span className="text-sm text-green-400">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-300">Expiry Date:</span>
              <span className="text-sm text-white">{user.licenseExpiry}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-300">Connection Status:</span>
              <span className={`text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>
                {isConnected ? "Connected" : "Disconnected"}
              </span>
            </div>
          </div>

          <div className="pt-4">
            <Button
              className={`w-full ${isTrading ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"} text-white`}
              onClick={handleToggleTrading}
              disabled={isLoading || !isConnected}
            >
              {isLoading ? (
                "Processing..."
              ) : isTrading ? (
                <>
                  <Square className="mr-2 h-4 w-4" />
                  Stop Trading
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Trading
                </>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-red-400">Allowed Symbols: {user.allowedSymbols.map((s) => s.symbol).join(", ")}</p>
        </CardFooter>
      </Card>
    </div>
  )
}

