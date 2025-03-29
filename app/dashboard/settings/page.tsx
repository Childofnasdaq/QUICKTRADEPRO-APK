"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, RefreshCw, User, Shield, List, Box, X, AlertTriangle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { UserData } from "@/lib/auth"
import Image from "next/image"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const [symbols, setSymbols] = useState<string[]>([])
  const [newSymbol, setNewSymbol] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [licenseExpired, setLicenseExpired] = useState(false)
  const [lotSize, setLotSize] = useState("0.01")
  const [maxTrades, setMaxTrades] = useState("0")
  const [isSaving, setIsSaving] = useState(false)
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      const parsedData = JSON.parse(storedUserData) as UserData
      setUserData(parsedData)

      // Check if license has expired
      if (parsedData.licenseExpiry && parsedData.licenseExpiry !== "NEVER") {
        const expiryDate = new Date(parsedData.licenseExpiry)
        // Don't mark lifetime licenses as expired
        setLicenseExpired(parsedData.licensePlan !== "lifetime" && expiryDate < new Date())

        // Show warning if license expires in 2 days or less
        if (parsedData.daysUntilExpiry !== null && parsedData.daysUntilExpiry !== undefined) {
          setShowExpiryWarning(parsedData.daysUntilExpiry <= 2 && parsedData.daysUntilExpiry > 0)
        }
      }
    }

    // Load saved symbols if available
    const savedSymbols = localStorage.getItem("tradingSymbols")
    if (savedSymbols) {
      setSymbols(JSON.parse(savedSymbols))
    }

    // Load saved lot size and max trades
    const savedLotSize = localStorage.getItem("lotSize")
    if (savedLotSize) {
      setLotSize(savedLotSize)
    }

    const savedMaxTrades = localStorage.getItem("maxTrades")
    if (savedMaxTrades) {
      setMaxTrades(savedMaxTrades)
    }

    // Check if MetaTrader account is connected
    const metatraderDetails = localStorage.getItem("metatraderDetails")
    if (metatraderDetails) {
      const details = JSON.parse(metatraderDetails)
      if (details.isConnected) {
        setIsConnected(true)
      }
    }
  }, [])

  const handleAddSymbol = () => {
    if (newSymbol && !symbols.includes(newSymbol)) {
      const updatedSymbols = [...symbols, newSymbol]
      setSymbols(updatedSymbols)
      setNewSymbol("")
    }
  }

  const handleRemoveSymbol = (symbolToRemove: string) => {
    const updatedSymbols = symbols.filter((symbol) => symbol !== symbolToRemove)
    setSymbols(updatedSymbols)
  }

  const handleRefresh = () => {
    // Load saved symbols if available
    const savedSymbols = localStorage.getItem("tradingSymbols")
    if (savedSymbols) {
      setSymbols(JSON.parse(savedSymbols))
    }

    // Load saved lot size and max trades
    const savedLotSize = localStorage.getItem("lotSize")
    if (savedLotSize) {
      setLotSize(savedLotSize)
    }

    const savedMaxTrades = localStorage.getItem("maxTrades")
    if (savedMaxTrades) {
      setMaxTrades(savedMaxTrades)
    }

    toast({
      title: "Settings refreshed",
      description: "Your settings have been refreshed",
    })
  }

  const handleSaveSettings = async () => {
    setIsSaving(true)

    try {
      // Validate lot size (ensure it's a valid number)
      const lotSizeNum = Number.parseFloat(lotSize)
      if (isNaN(lotSizeNum) || lotSizeNum <= 0) {
        throw new Error("Lot size must be a positive number")
      }

      // Save all settings to localStorage
      localStorage.setItem("tradingSymbols", JSON.stringify(symbols))
      localStorage.setItem("lotSize", lotSize)
      localStorage.setItem("maxTrades", maxTrades)

      // Simulate API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 500))

      toast({
        title: "Settings saved",
        description: "Your trading settings have been saved successfully",
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Helper function to format license plan name
  const formatLicensePlan = (plan: string) => {
    if (!plan) return "Standard"

    // Capitalize first letter and replace hyphens with spaces
    return plan.charAt(0).toUpperCase() + plan.slice(1).replace(/-/g, " ")
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-47xeYJouFgkAhOYeLZmL50aOqv5JfW.png"
            alt="QUICKTRADE PRO Logo"
            width={30}
            height={30}
            className="mr-2"
            priority
          />
          <h1 className="text-xl font-bold">Trading Settings</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {showExpiryWarning && (
        <Alert variant="warning" className="mb-4 bg-yellow-100 dark:bg-yellow-900 border-yellow-400">
          <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-300">
            Your license will expire in {userData?.daysUntilExpiry} day{userData?.daysUntilExpiry !== 1 ? "s" : ""}.
            Please contact your mentor to renew.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="h-5 w-5 text-muted-foreground mr-2" />
              <h2 className="font-medium">Connection Status</h2>
            </div>
            <div className="mt-2 flex items-center">
              <div className={`h-5 w-5 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} mr-2`}></div>
              <span className={isConnected ? "text-green-500" : "text-red-500"}>
                {isConnected ? "active" : "not connected"}
              </span>
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
                  Plan: {formatLicensePlan(userData?.licensePlan || "standard")}
                </span>
              </div>
              <div className="flex items-center mt-1 ml-7">
                <span className="text-xs text-muted-foreground">
                  {userData?.licensePlan === "lifetime"
                    ? "Expires: Never (Lifetime)"
                    : userData?.licenseExpiry && userData.licenseExpiry !== "NEVER"
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
                placeholder="Enter symbol (e.g. EURUSDm)"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                className="flex-1"
              />
              <Button size="icon" className="ml-2 bg-blue-500 hover:bg-blue-600" onClick={handleAddSymbol}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-3 space-y-2">
              {symbols.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {symbols.map((symbol, index) => (
                    <div key={index} className="bg-blue-500 text-white rounded-md px-3 py-1 inline-flex items-center">
                      {symbol}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-1 p-0 text-white hover:bg-blue-600"
                        onClick={() => handleRemoveSymbol(symbol)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No symbols added yet. Add symbols to start trading.</p>
              )}

              {symbols.length > 0 && (
                <div className="mt-2">
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs mb-1">Lot Size</p>
                      <Input value={lotSize} onChange={(e) => setLotSize(e.target.value)} />
                      <p className="text-xs mt-1">Min Lot Size: 0.01</p>
                    </div>
                    <div>
                      <p className="text-xs mb-1">Max Trades</p>
                      <Input value={maxTrades} onChange={(e) => setMaxTrades(e.target.value)} />
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
            <div className="mt-2 space-y-2">
              {/* Show symbols that the user has added with their chosen lot size */}
              {symbols.length > 0 ? (
                symbols.map((symbol, index) => (
                  <div key={index} className="bg-gray-100 dark:bg-slate-800 p-2 rounded-md">
                    <div className="flex justify-between items-center">
                      <span>{symbol}</span>
                      <span className="text-xs text-muted-foreground">Lot Size: {lotSize}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No symbols added yet. Add symbols above to see them here.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}

