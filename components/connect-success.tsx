"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Edit } from "lucide-react"
import { useRouter } from "next/navigation"
import Image from "next/image"

interface ConnectSuccessProps {
  login: string
  server: string
  platform: string
  accountId?: string
}

export default function ConnectSuccess({ login, server, platform, accountId }: ConnectSuccessProps) {
  const router = useRouter()
  const [error, setError] = useState("")

  const handleEditDetails = () => {
    // Clear the connected state by removing a specific flag
    const savedDetails = localStorage.getItem("metatraderDetails")
    if (savedDetails) {
      const details = JSON.parse(savedDetails)
      delete details.isConnected
      delete details.accountId
      localStorage.setItem("metatraderDetails", JSON.stringify(details))
    }

    // Reload the page to show the connection form again
    window.location.reload()
  }

  const handleGoToSettings = () => {
    router.push("/dashboard/settings")
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
        <CardHeader className="pb-2">
          <div className="bg-green-100 text-green-700 p-2 rounded-md mb-2">
            <p className="text-sm">
              Success <i className="fa fa-check-circle"></i>
            </p>
            <p className="text-xs">MetaTrader account connected successfully!</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-white">
                <i className="fa fa-check"></i>
              </div>
            </div>
            <h2 className="text-xl font-bold">MetaTrader Account Connected!</h2>
            <p className="text-muted-foreground">
              Welcome Client! <i className="fa fa-check"></i>
            </p>
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
                  <span className="text-blue-500">🆔</span>
                </div>
                <span className="text-sm">Client ID: {accountId}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative dark:bg-red-900 dark:text-red-300 dark:border-red-800">
              <span className="block sm:inline">{error}</span>
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

