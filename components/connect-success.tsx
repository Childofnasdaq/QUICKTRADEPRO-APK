"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import type { UserData } from "@/lib/auth"

interface ConnectSuccessProps {
  login: string
  server: string
  platform: string
  accountId?: string
  metaApiAccountId?: string
}

export default function ConnectSuccess({ login, server, platform, accountId, metaApiAccountId }: ConnectSuccessProps) {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [accountInfo, setAccountInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }

    // Fetch account info if we have an account ID
    const fetchAccountInfo = async () => {
      if (accountId) {
        try {
          setIsLoading(true)
          const response = await fetch(`/api/trading-server?accountId=${accountId}`)
          if (response.ok) {
            const data = await response.json()
            setAccountInfo(data)
          }
        } catch (error) {
          console.error("Error fetching account info:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    fetchAccountInfo()
  }, [accountId])

  const handleEditDetails = () => {
    // Clear the connected state
    localStorage.removeItem("isConnected")

    // Remove the trading account details to force reconnection
    localStorage.removeItem("tradingAccountDetails")

    // Redirect to the connect page
    router.push("/dashboard/connect")
  }

  const handleGoToSettings = () => {
    router.push("/dashboard/settings")
  }

  // Get the username to display
  const username = userData?.displayName || userData?.email?.split("@")[0] || "User"

  return (
    <div className="p-4 pb-20">
      <div className="flex justify-center mb-4">
        <Image src="/images/bull-logo.png" alt="QUICKTRADE PRO Logo" width={60} height={60} priority />
      </div>

      <Card className="mx-auto max-w-md">
        <CardHeader className="pb-2">
          <div className="bg-green-100 text-green-700 p-2 rounded-md mb-2">
            <p className="text-sm">Success</p>
            <p className="text-xs">{platform} account connected successfully!</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <div className="h-8 w-8 rounded-full bg-green-500"></div>
            </div>
            <h2 className="text-xl font-bold">{platform} Account Connected!</h2>
            <p className="text-muted-foreground">Welcome {username}!</p>
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-md space-y-2">
            <div className="flex items-center">
              <div className="w-8 flex justify-center">
                <span className="text-blue-500">👤</span>
              </div>
              <span className="text-sm">Login: {login}</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 flex justify-center">
                <span className="text-blue-500">🖥️</span>
              </div>
              <span className="text-sm">Server: {server}</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 flex justify-center">
                <span className="text-blue-500">📊</span>
              </div>
              <span className="text-sm">Platform: {platform}</span>
            </div>
            {accountId && (
              <div className="flex items-center">
                <div className="w-8 flex justify-center">
                  <span className="text-blue-500">🔑</span>
                </div>
                <span className="text-sm">Account ID: {accountId.substring(0, 8)}...</span>
              </div>
            )}
            {metaApiAccountId && (
              <div className="flex items-center">
                <div className="w-8 flex justify-center">
                  <span className="text-blue-500">🌐</span>
                </div>
                <span className="text-sm">MetaAPI ID: {metaApiAccountId.substring(0, 8)}...</span>
              </div>
            )}
          </div>

          {!isLoading && accountInfo && (
            <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-md space-y-2">
              <h3 className="font-medium mb-2">Account Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Balance:</div>
                <div className="text-right">{accountInfo.balance?.toFixed(2)}</div>
                <div>Equity:</div>
                <div className="text-right">{accountInfo.equity?.toFixed(2)}</div>
                <div>Free Margin:</div>
                <div className="text-right">{accountInfo.freeMargin?.toFixed(2)}</div>
                <div>Leverage:</div>
                <div className="text-right">{accountInfo.leverage}</div>
                <div>Open Positions:</div>
                <div className="text-right">{accountInfo.openPositions?.length || 0}</div>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button className="flex-1 bg-blue-500 hover:bg-blue-600" onClick={handleEditDetails}>
              <Edit className="mr-2 h-4 w-4" /> Update Details
            </Button>
            <Button className="flex-1" variant="outline" onClick={handleGoToSettings}>
              Configure Symbols
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

