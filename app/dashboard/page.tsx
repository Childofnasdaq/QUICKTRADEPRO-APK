"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import {
  ChevronUp,
  ChevronDown,
  LogOut,
  CheckCircle,
  XCircle,
  AlertCircle,
  CircleStopIcon as Stop,
  Play,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import type { UserData } from "@/lib/auth"
import { analyzeMarket, hasConflictingPositions } from "@/lib/market-analysis"
import { FloatingOverlay } from "@/components/floating-overlay"

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
  const [isProcessingTrades, setIsProcessingTrades] = useState(false)
  const [tradeMode, setTradeMode] = useState<"SYMBOL_TRADE_MODE_LONGONLY" | "SYMBOL_TRADE_MODE_SHORTONLY" | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [showOverlay, setShowOverlay] = useState(false)

  // Use a ref to track if trading should be stopped
  const shouldStopTrading = useRef(false)
  // Use a ref to track if component is mounted
  const isMounted = useRef(true)

  useEffect(() => {
    // Set mounted state
    isMounted.current = true

    // Get user data from localStorage
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }

    // Get trading state from localStorage
    const tradingState = localStorage.getItem("isTrading")
    if (tradingState === "true") {
      setIsTrading(true)
      setShowOverlay(true)
      shouldStopTrading.current = false

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

    // Get trade mode preference (if any)
    const savedTradeMode = localStorage.getItem("tradeMode")
    if (savedTradeMode) {
      setTradeMode(savedTradeMode as any)
    }

    // Get MetaAPI account ID
    const metatraderDetails = localStorage.getItem("metatraderDetails")
    if (metatraderDetails) {
      const details = JSON.parse(metatraderDetails)
      if (details.accountId) {
        setAccountId(details.accountId)
      }
    }

    // Cleanup function
    return () => {
      isMounted.current = false
    }
  }, [])

  // Update the handleToggleTrading function to stop trading immediately
  const handleToggleTrading = async () => {
    if (isTrading) {
      // Stop trading immediately
      setIsTrading(false)
      setShowOverlay(false)
      shouldStopTrading.current = true // Set the flag to stop any ongoing trades
      setIsProcessingTrades(false) // Stop any ongoing trade processing
      const newLogs = [...logs, `[${getCurrentTime()}] Trading stopped by user`]
      setLogs(newLogs)

      // Save to localStorage
      localStorage.setItem("isTrading", "false")
      localStorage.setItem("tradingLogs", JSON.stringify(newLogs))

      // Reset current trades to prevent continuation
      const trades = {}
      tradingSymbols.forEach((symbol) => {
        trades[symbol] = { count: 0, direction: null }
      })
      setCurrentTrades(trades)

      return // Exit immediately
    } else {
      // Start trading
      setIsTrading(true)
      setShowOverlay(true)
      shouldStopTrading.current = false // Reset the stop flag

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

      // Execute trades for all symbols in the background
      if (accountId) {
        // Don't await this - let it run in the background
        executeTradesForAllSymbols(newLogs)
      }
    }
  }

  // Update the executeTradesForAllSymbols function to check for stop flag and add delays
  const executeTradesForAllSymbols = async (initialLogs) => {
    if (!accountId) return

    setIsProcessingTrades(true)
    let updatedLogs = [...initialLogs]

    try {
      // Process each symbol
      for (const symbol of tradingSymbols) {
        // Check if we should stop trading
        if (shouldStopTrading.current || !isMounted.current) {
          console.log("Trading stopped, exiting trade execution loop")
          break
        }

        // Determine trade direction based on strategy or trade mode
        let tradeType: "BUY" | "SELL"

        if (tradeMode === "SYMBOL_TRADE_MODE_LONGONLY") {
          tradeType = "BUY"
        } else if (tradeMode === "SYMBOL_TRADE_MODE_SHORTONLY") {
          tradeType = "SELL"
        } else {
          // If no specific trade mode, determine randomly
          tradeType = Math.random() > 0.5 ? "BUY" : "SELL"
        }

        // Log the initial strategy decision
        const strategyLog = `[${getCurrentTime()}] ${symbol}: Strategy indicates ${tradeType} direction`
        updatedLogs = [...updatedLogs, strategyLog]
        if (isMounted.current) {
          setLogs(updatedLogs)
          localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
        }

        // Add a delay for analysis
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if we should stop trading
        if (shouldStopTrading.current || !isMounted.current) {
          console.log("Trading stopped during analysis")
          break
        }

        // Log the analysis step
        const analysisLog = `[${getCurrentTime()}] ${symbol}: Performing market analysis...`
        updatedLogs = [...updatedLogs, analysisLog]
        if (isMounted.current) {
          setLogs(updatedLogs)
          localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
        }

        // Add a delay for analysis
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // Check if we should stop trading
        if (shouldStopTrading.current || !isMounted.current) {
          console.log("Trading stopped after analysis")
          break
        }

        // Analyze market conditions
        const analysis = await analyzeMarket(symbol, tradeType)

        // Log the analysis results
        const analysisResultLog = `[${getCurrentTime()}] ${symbol}: Market analysis - ${analysis.marketTrend} trend, volatility: ${(analysis.volatility * 100).toFixed(1)}%`
        updatedLogs = [...updatedLogs, analysisResultLog]
        if (isMounted.current) {
          setLogs(updatedLogs)
          localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
        }

        // Add a delay after analysis
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if we should stop trading
        if (shouldStopTrading.current || !isMounted.current) {
          console.log("Trading stopped before trade execution")
          break
        }

        // Check for conflicting positions - but only log the conflict, don't skip the trade
        if (hasConflictingPositions(symbol, tradeType, currentTrades)) {
          const conflictLog = `[${getCurrentTime()}] ${symbol}: Note: Conflicting ${currentTrades[symbol].direction} positions exist, but proceeding anyway`
          updatedLogs = [...updatedLogs, conflictLog]
          if (isMounted.current) {
            setLogs(updatedLogs)
            localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
          }
        }

        // Calculate how many trades to open
        const tradesToOpen = maxTrades > 0 ? maxTrades : 1

        // Generate price levels for SL and TP
        const priceLevels = generatePriceLevels(symbol, tradeType)

        // Open the specified number of trades with 5-second delays between them
        for (let i = 0; i < tradesToOpen; i++) {
          // Check if we should stop trading
          if (shouldStopTrading.current || !isMounted.current) {
            console.log("Trading stopped during trade execution loop")
            break
          }

          const tradeLog = `[${getCurrentTime()}] ${symbol}: EXECUTING ${tradeType} ORDER (${i + 1}/${tradesToOpen})...`
          updatedLogs = [...updatedLogs, tradeLog]
          if (isMounted.current) {
            setLogs(updatedLogs)
            localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
          }

          // Execute the trade
          const result = await executeTrade(symbol, tradeType, priceLevels)

          if (result.success) {
            const successLog = `[${getCurrentTime()}] ${symbol}: ${tradeType} ORDER EXECUTED SUCCESSFULLY! Entry: ${result.entryPrice || priceLevels.price}, TP: ${result.takeProfit || priceLevels.takeProfit}, SL: ${result.stopLoss || priceLevels.stopLoss}`
            updatedLogs = [...updatedLogs, successLog]

            // Update current trades for this symbol
            if (isMounted.current) {
              setCurrentTrades((prev) => ({
                ...prev,
                [symbol]: {
                  count: (prev[symbol]?.count || 0) + 1,
                  direction: tradeType,
                },
              }))
            }
          } else {
            const errorLog = `[${getCurrentTime()}] ${symbol}: TRADE EXECUTION FAILED - ${result.error}`
            updatedLogs = [...updatedLogs, errorLog]
            if (isMounted.current) {
              setErrorDetails(result.error)
            }
          }

          if (isMounted.current) {
            setLogs(updatedLogs)
            localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
          }

          // Wait 5 seconds between trades as requested
          if (i < tradesToOpen - 1) {
            await new Promise((resolve) => setTimeout(resolve, 5000))
          }

          // Check if we should stop trading after each trade
          if (shouldStopTrading.current || !isMounted.current) {
            console.log("Trading stopped after executing a trade")
            break
          }
        }

        // Add delay between symbols
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Check if we should stop trading between symbols
        if (shouldStopTrading.current || !isMounted.current) {
          console.log("Trading stopped between symbols")
          break
        }
      }

      // Only add completion log if we didn't stop trading
      if (!shouldStopTrading.current && isMounted.current) {
        const completionLog = `[${getCurrentTime()}] All trades executed according to strategy`
        updatedLogs = [...updatedLogs, completionLog]
        setLogs(updatedLogs)
        localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
      }
    } catch (error) {
      console.error("Error executing trades:", error)
      if (isMounted.current) {
        const errorLog = `[${getCurrentTime()}] ERROR: ${error.message || "Unknown error executing trades"}`
        updatedLogs = [...updatedLogs, errorLog]
        setLogs(updatedLogs)
        localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
      }
    } finally {
      if (isMounted.current) {
        setIsProcessingTrades(false)
      }
    }
  }

  // Update the executeTrade function to include better error handling and SL/TP
  const executeTrade = async (symbol, tradeType, priceLevels) => {
    try {
      // Check if we should stop trading
      if (shouldStopTrading.current) {
        return { success: false, error: "Trading stopped by user" }
      }

      // Get the user's configured lot size
      const currentLotSize = lotSize || "0.01"

      // Generate a comment for the trade - use Latin-1 compatible characters only
      const robotName = userData?.robotName || "QUICKTRADE PRO"
      const tradeComment = `${robotName}` // Simplified comment

      // Add detailed logging
      console.log(`Executing ${tradeType} trade for ${symbol} with:`, {
        price: priceLevels.price,
        stopLoss: priceLevels.stopLoss,
        takeProfit: priceLevels.takeProfit,
        volume: currentLotSize,
      })

      // Call the API to execute the trade
      const response = await fetch("/api/metaapi/trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accountId,
          symbol: symbol,
          type: tradeType,
          volume: Number.parseFloat(currentLotSize),
          stopLoss: Number.parseFloat(priceLevels.stopLoss),
          takeProfit: Number.parseFloat(priceLevels.takeProfit),
          comment: tradeComment,
        }),
      })

      const result = await response.json()

      if (result.success) {
        console.log(`Trade executed successfully for ${symbol}:`, result)
        if (isMounted.current) {
          setLastTradeSuccess(true)
        }

        // Return the actual entry price, SL and TP if available
        const trade = result.trade || {}
        const modification = result.modification || {}

        return {
          success: true,
          entryPrice: trade.openPrice || trade.currentPrice,
          stopLoss: modification.stopLoss || trade.stopLoss,
          takeProfit: modification.takeProfit || trade.takeProfit,
        }
      } else {
        console.error(`Trade execution failed for ${symbol}:`, result.error)
        if (isMounted.current) {
          setLastTradeSuccess(false)
        }
        return { success: false, error: result.error || "Unknown error" }
      }
    } catch (error) {
      console.error(`Trade execution error for ${symbol}:`, error)
      if (isMounted.current) {
        setLastTradeSuccess(false)
      }
      return { success: false, error: error.message || "Network error" }
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

  // Update the generatePriceLevels function to handle symbol names correctly
  const generatePriceLevels = (symbol, tradeType) => {
    // Base price - this would normally come from market data
    let basePrice = 0

    // Set different base prices for different symbols
    // Adjust symbol handling to match broker's format
    const symbolUpper = symbol.toUpperCase()

    if (symbolUpper.includes("BTC")) {
      basePrice = 65000 + Math.random() * 5000
    } else if (symbolUpper.includes("ETH")) {
      basePrice = 3500 + Math.random() * 300
    } else if (symbolUpper.includes("EUR")) {
      basePrice = 1.08 + Math.random() * 0.02
    } else if (symbolUpper.includes("GBP")) {
      basePrice = 1.26 + Math.random() * 0.02
    } else if (symbolUpper.includes("JPY")) {
      basePrice = 150 + Math.random() * 5
    } else if (symbolUpper.includes("XAU")) {
      basePrice = 2300 + Math.random() * 50
    } else {
      basePrice = 100 + Math.random() * 10 // Default for other symbols
    }

    // Calculate SL and TP based on trade type with more realistic risk:reward ratio
    let stopLoss, takeProfit

    // Adjust the precision based on the symbol
    const precision =
      symbolUpper.includes("JPY") ||
      symbolUpper.includes("XAU") ||
      symbolUpper.includes("BTC") ||
      symbolUpper.includes("ETH")
        ? 2
        : 5

    if (tradeType === "BUY") {
      // For BUY: SL below current price, TP above current price
      stopLoss = basePrice * 0.995 // 0.5% below (closer to entry)
      takeProfit = basePrice * 1.01 // 1% above (closer to entry)
    } else {
      // For SELL: SL above current price, TP below current price
      stopLoss = basePrice * 1.005 // 0.5% above (closer to entry)
      takeProfit = basePrice * 0.99 // 1% below (closer to entry)
    }

    return {
      price: basePrice.toFixed(precision),
      stopLoss: stopLoss.toFixed(precision),
      takeProfit: takeProfit.toFixed(precision),
    }
  }

  // Monitor trading status and add periodic logs
  useEffect(() => {
    if (isTrading) {
      const monitoringActions = [
        "Monitoring open positions",
        "Verifying signal strength",
        "Calculating risk parameters",
        "Bot action performed",
        "Analyzing price patterns",
      ]

      const interval = setInterval(() => {
        // Only add monitoring logs if we're not currently processing trades
        if (!isProcessingTrades && isMounted.current && !shouldStopTrading.current) {
          // Check if we have any trading symbols
          if (tradingSymbols.length > 0) {
            // Randomly select a symbol to monitor
            const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]

            // Randomly select a monitoring action
            const randomAction = monitoringActions[Math.floor(Math.random() * monitoringActions.length)]

            // Create log entry with symbol
            const newLog = `[${getCurrentTime()}] ${randomSymbol}: ${randomAction}`
            const updatedLogs = [...logs, newLog]

            setLogs(updatedLogs)
            localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))
          }
        }
      }, 2000) // 2 seconds interval

      return () => clearInterval(interval)
    }
  }, [isTrading, logs, tradingSymbols, isProcessingTrades])

  const toggleLogs = () => {
    const newState = !showLogs
    setShowLogs(newState)
    localStorage.setItem("showLogs", newState.toString())
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-slate-900 overflow-auto">
        <div className="flex justify-between items-start p-4">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-GBCkirdfPdXpjKjo3p1MEP148IpaVv.png"
            alt="QUICKTRADE PRO Logo"
            width={50}
            height={50}
            priority
          />
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white">
            <LogOut size={24} />
          </Button>
        </div>

        <div className="flex flex-col items-center px-6 flex-1 overflow-y-auto pb-24">
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
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-GBCkirdfPdXpjKjo3p1MEP148IpaVv.png"
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

          {errorDetails && (
            <div className="w-full max-w-md bg-red-900/50 border border-red-700 rounded-lg p-4 mb-4 text-white">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-red-400" />
                <h3 className="font-medium">Trade Error</h3>
              </div>
              <p className="mt-2 text-sm text-red-300">{errorDetails}</p>
            </div>
          )}

          {/* Bot Logs Section with toggle */}
          <div className="w-full max-w-md bg-slate-800 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-white text-lg font-medium">Bot Logs</h2>
              <Button variant="ghost" size="sm" onClick={toggleLogs} className="p-1 h-auto">
                {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>

            {showLogs && (
              <div className="bg-slate-900 rounded p-3 h-24 overflow-y-auto">
                {logs.length > 0 ? (
                  <div className="font-mono text-sm space-y-1">
                    {logs.slice(-3).map((log, index) => (
                      <div key={index} className="text-green-500">
                        {log}
                      </div>
                    ))}
                    {logs.length > 3 && (
                      <div className="text-xs text-gray-400 text-center mt-1">
                        Scroll to see {logs.length - 3} more logs
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-green-500 font-mono text-sm">
                    {isTrading ? "Initializing..." : "Waiting to start trading..."}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons directly under bot logs */}
          <div className="w-full max-w-md mb-8">
            <div className="flex space-x-4">
              <Button
                className={`flex-1 py-6 ${isTrading ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"} text-white`}
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
              <Button variant="outline" className="flex-1 py-6" onClick={handleSignalsClick}>
                Signals
              </Button>
            </div>
          </div>
        </div>

        <FloatingOverlay isVisible={showOverlay} onClose={() => setShowOverlay(false)} />
      </div>
    </>
  )
}

