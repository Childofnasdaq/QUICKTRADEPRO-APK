"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Lock, Server, LinkIcon } from "lucide-react"
import ConnectSuccess from "@/components/connect-success"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import type { UserData } from "@/lib/auth"

export default function ConnectPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [platform, setPlatform] = useState<"mt5" | "mt4">("mt5")
  const [login, setLogin] = useState("")
  const [password, setPassword] = useState("")
  const [server, setServer] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [accountId, setAccountId] = useState("")
  const [connectionError, setConnectionError] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isCheckingExistingAccount, setIsCheckingExistingAccount] = useState(true)

  // Load saved connection details if available
  useEffect(() => {
    const savedDetails = localStorage.getItem("metatraderDetails")
    if (savedDetails) {
      const details = JSON.parse(savedDetails)
      setLogin(details.login || "")
      setServer(details.server || "")
      setPlatform(details.platform || "mt5")

      // Check if already connected
      if (details.accountId) {
        setAccountId(details.accountId)
        setIsConnected(true)
        setIsCheckingExistingAccount(false)
      }
    }

    // Get user data
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      const parsedUserData = JSON.parse(storedUserData)
      setUserData(parsedUserData)

      // Check if user already has a MetaAPI account from auth
      if (parsedUserData.metaApiAccountId) {
        checkExistingMetaApiAccount(parsedUserData.metaApiAccountId)
      } else {
        setIsCheckingExistingAccount(false)
      }
    } else {
      setIsCheckingExistingAccount(false)
    }
  }, [])

  // Check if the user already has a MetaAPI account
  const checkExistingMetaApiAccount = async (accountId: string) => {
    try {
      // Fetch account details from MetaAPI
      const response = await fetch(`/api/metaapi/account-details?accountId=${accountId}`)
      const data = await response.json()

      if (data.success && data.account) {
        // Account exists, auto-connect
        const connectionDetails = {
          login: data.account.login || "",
          server: data.account.server || "",
          platform: data.account.platform || "mt5",
          accountId: accountId,
          isConnected: true,
          connectedAt: new Date().toISOString(),
        }

        localStorage.setItem("metatraderDetails", JSON.stringify(connectionDetails))
        setLogin(connectionDetails.login)
        setServer(connectionDetails.server)
        setPlatform(connectionDetails.platform as "mt5" | "mt4")
        setAccountId(accountId)
        setIsConnected(true)

        toast({
          title: "Account auto-connected",
          description: "Your existing MetaTrader account has been automatically connected",
        })
      }
    } catch (error) {
      console.error("Error checking existing MetaAPI account:", error)
    } finally {
      setIsCheckingExistingAccount(false)
    }
  }

  const handleConnect = async () => {
    if (!login || !password || !server) {
      setConnectionError("Please fill in all fields")
      return
    }

    setConnectionError("")
    setIsConnecting(true)

    try {
      // Connect to MetaAPI
      const response = await fetch("/api/metaapi/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
          server,
          platform,
          mentorId: userData?.mentorId || "unknown",
          email: userData?.email || "unknown",
          userId: userData?.uid || "unknown",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to connect to MetaTrader account")
      }

      // Save connection details
      const connectionDetails = {
        login,
        server,
        platform,
        accountId: data.accountId,
        isConnected: true,
        connectedAt: new Date().toISOString(),
      }

      localStorage.setItem("metatraderDetails", JSON.stringify(connectionDetails))
      setAccountId(data.accountId)
      setIsConnected(true)

      toast({
        title: "Connection successful",
        description: data.isNewAccount
          ? "Your MetaTrader account has been created and connected successfully"
          : "Connected to your existing MetaTrader account",
      })
    } catch (error) {
      console.error("Connection error:", error)
      setConnectionError(error instanceof Error ? error.message : "Failed to connect to MetaTrader account")

      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to MetaTrader account",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  if (isCheckingExistingAccount) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2">Checking for existing accounts...</span>
      </div>
    )
  }

  if (isConnected) {
    return <ConnectSuccess login={login} server={server} platform={platform} accountId={accountId} />
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-center mb-4">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-47xeYJouFgkAhOYeLZmL50aOqv5JfW.png"
          alt="QUICKTRADE PRO Logo"
          width={60}
          height={60}
          priority
        />
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Connect MetaTrader Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-800">
              <span className="block sm:inline">{connectionError}</span>
            </div>
          )}

          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Select Platform:</p>
            <div className="flex mt-2 space-x-2">
              <Button
                className={`flex-1 ${platform === "mt5" ? "bg-blue-500" : "bg-transparent border border-gray-300"}`}
                onClick={() => setPlatform("mt5")}
              >
                MT5
              </Button>
              <Button
                className={`flex-1 ${platform === "mt4" ? "bg-blue-500" : "bg-transparent border border-gray-300"}`}
                onClick={() => setPlatform("mt4")}
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
    </div>
  )
}

