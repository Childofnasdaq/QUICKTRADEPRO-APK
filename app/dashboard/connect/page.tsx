"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Lock, Server, LinkIcon } from "lucide-react"
import ConnectSuccess from "@/components/connect-success"
import PaymentModal from "@/components/payment-modal"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { PaymentPlan } from "@/lib/yoco-payment-client"

export default function ConnectPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnected, setIsConnected] = useState(false)
  const [platform, setPlatform] = useState<"MT5" | "MT4">("MT5")
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [server, setServer] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [accountId, setAccountId] = useState("")
  const [metaApiAccountId, setMetaApiAccountId] = useState("")
  const [connectionStatus, setConnectionStatus] = useState("")
  const [connectionError, setConnectionError] = useState("")
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [currentPlan, setCurrentPlan] = useState<PaymentPlan>(PaymentPlan.SINGLE_ACCOUNT)

  // Load saved connection details if available
  useEffect(() => {
    // Check if we're coming back from the success page to edit details
    const editMode = searchParams.get("edit") === "true"

    // Get user data
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData)
      setUserData(parsedUserData)
    }

    // Get user subscription
    const fetchUserSubscription = async () => {
      if (userData?.uid) {
        try {
          const response = await fetch(`/api/user/${userData.uid}/subscription`)
          if (response.ok) {
            const data = await response.json()
            if (data.plan) {
              setCurrentPlan(data.plan)
            }
          }
        } catch (error) {
          console.error("Error fetching subscription:", error)
        }
      }
    }

    fetchUserSubscription()

    const savedDetails = localStorage.getItem("tradingAccountDetails")
    if (savedDetails && !editMode) {
      const details = JSON.parse(savedDetails)
      setLogin(details.login || "")
      setServer(details.server || "")
      setPlatform(details.platform || "MT5")

      // Check if already connected
      if (details.accountId && details.connectionStatus === "CONNECTED") {
        setAccountId(details.accountId)
        setMetaApiAccountId(details.metaApiAccountId || "")
        setConnectionStatus(details.connectionStatus)
        setIsConnected(true)
      }
    }
  }, [searchParams, userData?.uid])

  const handleConnect = async () => {
    if (!login || !password || !server) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsConnecting(true)
    setConnectionError("")

    try {
      // Call the API to connect to trading account
      const response = await fetch("/api/connect-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ login, password, server, platform }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Check if account limit reached
        if (response.status === 403 && data.requiresUpgrade) {
          setCurrentPlan(data.currentPlan)
          setShowPaymentModal(true)
          return
        }

        throw new Error(data.error || "Failed to connect to your trading account")
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to connect to your trading account")
      }

      // Save connection details
      const connectionDetails = {
        login,
        server,
        platform,
        accountId: data.accountId,
        metaApiAccountId: data.metaApiAccountId,
        connectionStatus: data.connectionStatus,
      }

      localStorage.setItem("tradingAccountDetails", JSON.stringify(connectionDetails))

      // Update state
      setAccountId(data.accountId)
      setMetaApiAccountId(data.metaApiAccountId)
      setConnectionStatus(data.connectionStatus)
      setIsConnected(true)

      toast({
        title: "Connection successful",
        description: "Your trading account is now connected!",
      })
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionError(error instanceof Error ? error.message : "Failed to connect to your trading account")
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to your trading account",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handlePaymentSuccess = (plan: PaymentPlan) => {
    setShowPaymentModal(false)
    setCurrentPlan(plan)

    // Try connecting again after successful payment
    handleConnect()
  }

  if (isConnected) {
    return (
      <ConnectSuccess
        login={login}
        server={server}
        platform={platform}
        accountId={accountId}
        metaApiAccountId={metaApiAccountId}
      />
    )
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-center mb-4">
        <Image src="/images/bull-logo.png" alt="QUICKTRADE PRO Logo" width={60} height={60} priority />
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Connect Trading Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Select Platform:</p>
            <div className="flex mt-2 space-x-2">
              <Button
                className={`flex-1 ${platform === "MT5" ? "bg-blue-500" : "bg-transparent border border-gray-300"}`}
                onClick={() => setPlatform("MT5")}
              >
                MT5
              </Button>
              <Button
                className={`flex-1 ${platform === "MT4" ? "bg-blue-500" : "bg-transparent border border-gray-300"}`}
                onClick={() => setPlatform("MT4")}
              >
                MT4
              </Button>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md flex items-center">
            <User className="text-gray-500 mr-2" size={18} />
            <Input
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
              value={login}
              placeholder="Login ID"
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md flex items-center">
            <Lock className="text-gray-500 mr-2" size={18} />
            <Input
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md flex items-center">
            <Server className="text-gray-500 mr-2" size={18} />
            <Input
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
              placeholder="Server name"
              value={server}
              onChange={(e) => setServer(e.target.value)}
            />
          </div>

          {connectionError && (
            <div className="text-red-500 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded-md">{connectionError}</div>
          )}

          <Button
            className="w-full bg-blue-500 hover:bg-blue-600"
            onClick={handleConnect}
            disabled={isConnecting || !login || !password || !server}
          >
            {isConnecting ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Connecting...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" /> Connect
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={handlePaymentSuccess}
        userId={userData?.uid || "guest"}
        currentPlan={currentPlan}
      />
    </div>
  )
}

