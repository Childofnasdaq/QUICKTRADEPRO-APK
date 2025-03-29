"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Play, CircleStopIcon as Stop, ChevronUp, ChevronDown, LogOut, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import type { UserData } from "@/lib/auth"

export default function DashboardPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<string[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showLogs, setShowLogs] = useState(true)
  const [tradingSymbols, setTradingSymbols] = useState<string[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [lastTradeSuccess, setLastTradeSuccess] = useState<boolean | null>(null)
  const [lotSize, setLotSize] = useState<string>("0.01")
  const [maxTrades, setMaxTrades] = useState<number>(0)
  const [currentTrades, setCurrentTrades] = useState<{
    [symbol: string]: { count: number; direction: "BUY" | "SELL" | null }
  }>({})

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }

    // Get trading state from localStorage
    const tradingState = localStorage.getItem("isTrading")
    if (tradingState === "true") {
      setIsTrading(true)

      // Get saved logs if available
      const savedLogs = localStorage.getItem("tradingLogs")
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs))
      } else {
        setLogs([`[${getCurrentTime()}] Trading resumed`])
      }
    }

    // Get logs visibility state
    const logsVisibility = localStorage.getItem("showLogs")
    if (logsVisibility === "false") {
      setShowLogs(false)
    }

    // Get trading symbols
    const savedSymbols = localStorage.getItem("tradingSymbols")
    if (savedSymbols) {
      const symbols = JSON.parse(savedSymbols)
      setTradingSymbols(symbols)

      // Initialize currentTrades state with the symbols
      const trades = {}
      symbols.forEach((symbol) => {
        trades[symbol] = { count: 0, direction: null }
      })
      setCurrentTrades(trades)
    }

    // Get lot size
    const savedLotSize = localStorage.getItem("lotSize")
    if (savedLotSize) {
      setLotSize(savedLotSize)
    }

    // Get max trades
    const savedMaxTrades = localStorage.getItem("maxTrades") || "0"
    setMaxTrades(Number.parseInt(savedMaxTrades, 10))

    // Get MetaAPI account ID
    const metatraderDetails = localStorage.getItem("metatraderDetails")
    if (metatraderDetails) {
      const details = JSON.parse(metatraderDetails)
      if (details.accountId) {
        setAccountId(details.accountId)
      }
    }
  }, [])

  const handleToggleTrading = () => {
    if (isTrading) {
      // Stop trading
      setIsTrading(false)
      const newLogs = [...logs, `[${getCurrentTime()}] Trading stopped by user`]
      setLogs(newLogs)

      // Save to localStorage
      localStorage.setItem("isTrading", "false")
      localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
    } else {
      // Start trading
      setIsTrading(true)

      // Check if user has added symbols
      if (tradingSymbols.length === 0) {
        toast({
          title: "No trading symbols",
          description: "Please add trading symbols in the Settings page",
          variant: "destructive",
        })

        // Add warning to logs
        const newLogs = [
          `[${getCurrentTime()}] WARNING: No trading symbols configured. Please add symbols in Settings.`,
        ]
        setLogs(newLogs)
        localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
        return
      }

      // Reset logs and trade tracking when starting trading
      const symbolsList = tradingSymbols.join(", ")
      const newLogs = [
        `[${getCurrentTime()}] Trading started`,
        `[${getCurrentTime()}] Trading symbols: ${symbolsList}`,
        `[${getCurrentTime()}] Initializing trading algorithms...`,
      ]
      setLogs(newLogs)

      // Reset current trades count and direction
      const trades = {}
      tradingSymbols.forEach((symbol) => {
        trades[symbol] = { count: 0, direction: null }
      })
      setCurrentTrades(trades)

      // Save to localStorage
      localStorage.setItem("isTrading", "true")
      localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
    }
  }

  const handleSignalsClick = () => {
    router.push("/dashboard/signals")
  }

  const handleLogout = async () => {
    try {
      // Mark license key as used in the database
      const userData = JSON.parse(localStorage.getItem("userData") || "{}")
      if (userData.licenseKey) {
        try {
          await fetch("/api/deactivate-license", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ licenseKey: userData.licenseKey }),
          })
        } catch (error) {
          console.error("Failed to deactivate license:", error)
        }
      }

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

  const getCurrentTime = () => {
    const now = new Date()
    return now.toTimeString().split(" ")[0]
  }

  // Generate random price levels for SL and TP based on symbol and trade type
  const generatePriceLevels = (symbol, tradeType) => {
    // Base price - this would normally come from market data
    let basePrice = 0

    // Set different base prices for different symbols
    if (symbol.includes("BTC")) {
      basePrice = 65000 + Math.random() * 5000
    } else if (symbol.includes("EUR")) {
      basePrice = 1.08 + Math.random() * 0.02
    } else if (symbol.includes("GBP")) {
      basePrice = 1.26 + Math.random() * 0.02
    } else if (symbol.includes("JPY")) {
      basePrice = 150 + Math.random() * 5
    } else if (symbol.includes("XAU")) {
      basePrice = 2300 + Math.random() * 50
    } else {
      basePrice = 100 + Math.random() * 10 // Default for other symbols
    }

    // Calculate SL and TP based on trade type
    let stopLoss, takeProfit

    if (tradeType === "BUY") {
      // For BUY: SL below current price, TP above current price
      stopLoss = basePrice * 0.99 // 1% below
      takeProfit = basePrice * 1.02 // 2% above
    } else {
      // For SELL: SL above current price, TP below current price
      stopLoss = basePrice * 1.01 // 1% above
      takeProfit = basePrice * 0.98 // 2% below
    }

    return {
      price: basePrice.toFixed(2),
      stopLoss: stopLoss.toFixed(2),
      takeProfit: takeProfit.toFixed(2),
    }
  }

  useEffect(() => {
    if (isTrading && tradingSymbols.length > 0) {
      const tradingActions = [
        "Checking market conditions",
        "Analyzing price patterns",
        "Scanning for entry points",
        "Monitoring open positions",
        "Calculating risk parameters",
        "Executing trade strategy",
        "Adjusting stop loss levels",
        "Verifying signal strength",
        "Bot action performed",
      ]

      const interval = setInterval(async () => {
        // Randomly select a symbol to trade
        const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]

        // Randomly select an action
        const randomAction = tradingActions[Math.floor(Math.random() * tradingActions.length)]

        // Create log entry with symbol
        const newLog = `[${getCurrentTime()}] ${randomSymbol}: ${randomAction}`
        let updatedLogs = [...logs, newLog]

        // Occasionally execute a real trade (approximately 20% chance)
        if (
          accountId &&
          (randomAction === "Scanning for entry points" || randomAction === "Bot action performed") &&
          Math.random() < 0.2
        ) {
          try {
            // Get the user's configured lot size
            const currentLotSize = lotSize || "0.01"

            // Randomly decide if it's a buy or sell
            const tradeType = Math.random() > 0.5 ? "BUY" : "SELL"

            // Execute the trade
            const tradeLog = `[${getCurrentTime()}] ${randomSymbol}: EXECUTING ${tradeType} ORDER...`
            updatedLogs = [...updatedLogs, tradeLog]

            // Generate a comment for the trade - use Latin-1 compatible characters only
            const robotName = userData?.robotName || "QUICKTRADE PRO"
            const tradeComment = `${robotName} +` // Using "+" instead of checkmark emoji

            // Generate price levels for SL and TP
            // const priceLevels = generatePriceLevels(randomSymbol, tradeType)

            // Call the API to execute the trade with retry logic
            const executeTradeWithRetry = async (retries = 3) => {
              try {
                const response = await fetch("/api/metaapi/trade", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    accountId,
                    symbol: randomSymbol,
                    type: tradeType, // This is either "BUY" or "SELL"
                    volume: Number.parseFloat(currentLotSize),
                    comment: tradeComment,
                  }),
                })

                const result = await response.json()

                if (result.success) {
                  const successLog = `[${getCurrentTime()}] ${randomSymbol}: ${tradeType} ORDER EXECUTED SUCCESSFULLY!`
                  updatedLogs = [...updatedLogs, successLog]
                  setLastTradeSuccess(true)
                } else {
                  throw new Error(result.error || "Unknown error")
                }
              } catch (error) {
                if (retries > 0) {
                  const retryLog = `[${getCurrentTime()}] ${randomSymbol}: Retrying trade execution (${retries} attempts left)...`
                  updatedLogs = [...updatedLogs, retryLog]
                  return executeTradeWithRetry(retries - 1)
                } else {
                  const errorLog = `[${getCurrentTime()}] ${randomSymbol}: TRADE ERROR - ${error instanceof Error ? error.message : "Unknown error"}`
                  updatedLogs = [...updatedLogs, errorLog]
                  setLastTradeSuccess(false)
                }
              }
            }

            await executeTradeWithRetry()
          } catch (error) {
            const errorLog = `[${getCurrentTime()}] ${randomSymbol}: TRADE EXECUTION FAILED - ${error instanceof Error ? error.message : "Unknown error"}`
            updatedLogs = [...updatedLogs, errorLog]
            setLastTradeSuccess(false)
          }
        }

        setLogs(updatedLogs)

        // Save logs to localStorage
        localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
      }, 2000) // 2 seconds interval

      return () => clearInterval(interval)
    }
  }, [isTrading, logs, tradingSymbols, accountId, lotSize, userData, currentTrades, maxTrades])

  const toggleLogs = () => {
    const newState = !showLogs
    setShowLogs(newState)
    localStorage.setItem("showLogs", newState.toString())
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
      <div className="flex justify-between items-start p-4">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-47xeYJouFgkAhOYeLZmL50aOqv5JfW.png"
          alt="QUICKTRADE PRO Logo"
          width={50}
          height={50}
          priority
        />
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
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-47xeYJouFgkAhOYeLZmL50aOqv5JfW.png"
              alt="Default Profile"
              width={300}
              height={300}
              className="w-full"
            />
          )}
        </div>

        <div className="w-full max-w-md text-center mb-4">
          <div className="flex items-center justify-center">
            <h1 className="text-3xl font-bold text-white mr-2">{userData?.robotName || "QUICKTRADE PRO"}</h1>
            {lastTradeSuccess !== null &&
              (lastTradeSuccess ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              ))}
          </div>
          <p className="text-gray-400 mt-2">{userData?.eaName || "Elite precision, 24/7 operation"}</p>
        </div>

        {/* Bot Logs Section with toggle */}
        <div className="w-full max-w-md bg-slate-800 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-white text-lg font-medium">Bot Logs</h2>
            <Button variant="ghost" size="sm" onClick={toggleLogs} className="p-1 h-auto">
              {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          {showLogs && (
            <div className="bg-slate-900 rounded p-3 max-h-48 overflow-y-auto">
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
          )}
        </div>

        <div className="w-full max-w-md flex space-x-4 mb-4">
          <Button
            className={`flex-1 ${isTrading ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
            onClick={handleToggleTrading}
          >
            {isTrading ? (
              <>
                <Stop className="mr-2 h-4 w-4" /> Stop
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" /> Trade
              </>
            )}
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleSignalsClick}>
            Signals
          </Button>
        </div>
      </div>

      {/* Bottom Navigation remains at the bottom */}
      <div className="h-16"></div>
    </div>
  )
}

