"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import type { UserData } from "@/lib/auth"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

export default function DashboardPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<string[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }
  }, [])

  const handleStartTrading = () => {
    setIsTrading(true)
    // Reset logs when starting trading
    setLogs([])
  }

  const handleSettingsClick = () => {
    router.push("/dashboard/signals")
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      router.push("/auth")
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    if (isTrading) {
      const initialLogs = [
        "[11:18:56] Bot action performed",
        "[11:18:51] Bot action performed",
        "[11:18:46] Bot action performed",
      ]

      let index = 0
      const interval = setInterval(() => {
        if (index < initialLogs.length) {
          setLogs((prev) => [...prev, initialLogs[index]])
          index++
        } else {
          clearInterval(interval)
        }
      }, 500)

      return () => clearInterval(interval)
    }
  }, [isTrading])

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
      <div className="flex justify-between items-start p-4">
        <Image src="/images/bull-logo.png" alt="QUICKTRADE PRO Logo" width={40} height={40} />
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white">
          <LogOut size={24} />
        </Button>
      </div>

      <div className="flex flex-col items-center px-6 flex-1 overflow-auto">
        <div className="w-full max-w-md rounded-lg overflow-hidden mb-4">
          {userData?.photoURL ? (
            <Image
              src={userData.photoURL || "/placeholder.svg"}
              alt="User Profile"
              width={300}
              height={300}
              className="w-full"
            />
          ) : (
            <Image src="/images/bull-logo.png" alt="Default Profile" width={300} height={300} className="w-full" />
          )}
        </div>

        <div className="w-full max-w-md text-center mb-4">
          <h1 className="text-3xl font-bold text-white">{userData?.robotName || "QUICKTRADE PRO"}</h1>
          <p className="text-gray-400 mt-2">{userData?.eaName || "QUICKTRADE PRO"}</p>
        </div>

        {userData?.isExpiring && (
          <Alert variant="warning" className="w-full max-w-md mb-4 bg-yellow-900 border-yellow-600">
            <AlertTitle>License Expiring Soon</AlertTitle>
            <AlertDescription>
              Your license will expire soon. Please renew to continue using the service.
            </AlertDescription>
          </Alert>
        )}

        {/* Bot Logs Section */}
        <div className="w-full max-w-md bg-slate-800 rounded-lg p-4 mb-4">
          <h2 className="text-white text-lg font-medium mb-2">Bot Logs</h2>
          <div className="bg-slate-900 rounded p-3">
            {logs.length > 0 ? (
              <div className="font-mono text-sm space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-green-500">
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-green-500 font-mono text-sm">
                {isTrading ? "Initializing..." : "Waiting to start trading..."}
              </div>
            )}
          </div>
        </div>

        <div className="w-full max-w-md flex space-x-4 mb-4">
          <Button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white" onClick={handleStartTrading}>
            <Play className="mr-2 h-4 w-4" /> Trade
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleSettingsClick}>
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Button>
        </div>
      </div>

      {/* Bottom Navigation remains at the bottom */}
      <div className="h-16"></div>
    </div>
  )
}

