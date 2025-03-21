"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, RefreshCw, User, Shield, List, Box } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { UserData } from "@/lib/auth"

export default function SettingsPage() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [newSymbol, setNewSymbol] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [licenseExpired, setLicenseExpired] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData) as UserData
      setUserData(parsedData)

      // Check if license has expired
      if (parsedData.licenseExpiry && parsedData.licenseExpiry !== "NEVER") {
        const expiryDate = new Date(parsedData.licenseExpiry)
        setLicenseExpired(expiryDate < new Date())
      } else {
        setLicenseExpired(false)
      }
    }
  }, [])

  const handleAddSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol)) {
      setSymbols([...symbols, newSymbol])
      setNewSymbol("")
    }
  }

  const handleRefresh = () => {
    toast({
      title: "Settings refreshed",
      description: "Your settings have been refreshed",
    })
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Trading Settings</h1>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-muted-foreground mr-2" />
              <h2 className="font-medium">Connection Status</h2>
            </div>
            <div className="mt-2 flex items-center">
              <div className="h-5 w-5 rounded-full bg-green-500 mr-2"></div>
              <span className="text-green-500">active</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-muted-foreground mr-2" />
              <h2 className="font-medium">License Status</h2>
            </div>
            <div className="mt-2">
              <div className="flex items-center">
                <div className={`h-5 w-5 rounded-full ${licenseExpired ? "bg-red-500" : "bg-green-500"} mr-2`}></div>
                <span className={licenseExpired ? "text-red-500" : "text-green-500"}>
                  {licenseExpired ? "expired" : "active"}
                </span>
              </div>
              <div className="flex items-center mt-1 ml-7">
                <span className="text-xs text-muted-foreground">
                  {userData?.licenseExpiry === "NEVER"
                    ? "Expires: Never (Lifetime)"
                    : userData?.licenseExpiry
                      ? `Expires: ${new Date(userData.licenseExpiry).toLocaleDateString()}`
                      : "Expires: Not specified"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <List className="h-5 w-5 text-muted-foreground mr-2" />
              <h2 className="font-medium">Allowed Trading Symbols</h2>
            </div>

            <div className="mt-3 flex items-center">
              <Input
                placeholder="Enter symbol"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="flex-1"
              />
              <Button size="icon" className="ml-2 bg-blue-500 hover:bg-blue-600" onClick={handleAddSymbol}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {symbols.map((symbol, index) => (
                <div key={index} className="bg-blue-500 text-white rounded-md px-3 py-1 inline-block mr-2">
                  {symbol} ✓
                </div>
              ))}
              {symbols.length > 0 && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs mb-1">Lot Size</p>
                      <Input defaultValue="0.01" />
                      <p className="text-xs mt-1">Min Lot Size: 0.01</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1">Max Trades</p>
                      <Input defaultValue="0" />
                      <p className="text-xs mt-1">0 for unlimited trades</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Box className="h-5 w-5 text-muted-foreground mr-2" />
              <h2 className="font-medium">Available Symbols</h2>
            </div>
            <div className="mt-2">
              <div className="bg-gray-100 dark:bg-slate-800 p-2 rounded-md">
                <div className="flex justify-between items-center">
                  <span>XAUUSDm</span>
                  <span className="text-xs text-muted-foreground">Min: 0.01</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button className="w-full bg-blue-500 hover:bg-blue-600">Save Settings</Button>
      </div>
    </div>
  )
}

