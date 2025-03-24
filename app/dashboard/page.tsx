"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Image from "next/image"
import { Play, CircleStopIcon as Stop, ChevronUp, ChevronDown, LogOut, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { logoutUser } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import type { UserData } from "@/lib/auth"
import { MarketAnalysisService } from "@/lib/market-analysis"
import { COMMENT_PREFIX } from "@/lib/trading-constants"

export default function DashboardPage() {
  const router = useRouter()
  const [logs, setLogs] = useState<string[]>([])
  const [isTrading, setIsTrading] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showLogs, setShowLogs] = useState(true)
  const [tradingSymbols, setTradingSymbols] = useState<string[]>([])
  const [accountDetails, setAccountDetails] = useState<any>(null)
  const [lotSize, setLotSize] = useState("0.01")
  const [maxTrades, setMaxTrades] = useState(0)
  const [tradingInterval, setTradingInterval] = useState<NodeJS.Timeout | null>(null)
  const [isButtonDisabled, setIsButtonDisabled] = useState(false)
  const [marketAnalysis, setMarketAnalysis] = useState<any>(null)
  const tradeCount = useRef(0)
  const initialTradeExecuted = useRef(false)

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
      setTradingSymbols(JSON.parse(savedSymbols))
    }

    // Get account details
    const savedAccountDetails = localStorage.getItem("tradingAccountDetails")
    if (savedAccountDetails) {
      setAccountDetails(JSON.parse(savedAccountDetails))
    }

    // Get lot size
    const savedLotSize = localStorage.getItem("lotSize")
    if (savedLotSize) {
      setLotSize(savedLotSize)
    }

    // Get max trades
    const savedMaxTrades = localStorage.getItem("maxTrades")
    if (savedMaxTrades) {
      setMaxTrades(Number.parseInt(savedMaxTrades, 10) || 0)
    }
  }, [])

  const analyzeMarketForSymbol = useCallback(async (symbol: string) => {
    try {
      // Log the analysis start
      const analysisStartLog = `[${getCurrentTime()}] ${symbol}: Analyzing market conditions...`
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, analysisStartLog]
        localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
        return newLogs
      })

      // Perform market analysis
      const analysis = await MarketAnalysisService.analyzeMarket(symbol)
      setMarketAnalysis(analysis)

      // Log the analysis results
      const analysisResultLog = `[${getCurrentTime()}] ${symbol}: Analysis complete - Trend: ${analysis.trend}, Strength: ${analysis.strength.toFixed(1)}, Confidence: ${analysis.confidence.toFixed(1)}%`
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, analysisResultLog]
        localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
        return newLogs
      })

      return analysis
    } catch (error) {
      console.error("Market analysis error:", error)
      const errorLog = `[${getCurrentTime()}] ${symbol}: Analysis error - ${error instanceof Error ? error.message : "Unknown error"}`
      setLogs((prevLogs) => {
        const newLogs = [...prevLogs, errorLog]
        localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
        return newLogs
      })
      return null
    }
  }, [])

  const executeTrade = useCallback(
    async (symbol: string, type: string, analysis: any) => {
      try {
        if (!accountDetails || !accountDetails.accountId) {
          throw new Error("Trading account not connected")
        }

        // Log the trade execution
        const executionLog = `[${getCurrentTime()}] ${symbol}: Executing ${type} order...`
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, executionLog]
          localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
          return newLogs
        })

        // Calculate stop loss and take profit from analysis
        const stopLoss = analysis ? analysis.stopLoss : undefined
        const takeProfit = analysis ? analysis.takeProfit : undefined

        console.log("Executing trade:", {
          symbol,
          type,
          lotSize,
          accountId: accountDetails.accountId,
        })

        // Execute the trade via API
        const response = await fetch("/api/trading-server", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "EXECUTE_TRADE",
            userId: userData?.uid || "test-user",
            accountId: accountDetails.accountId,
            platform: accountDetails.platform,
            symbol,
            type,
            lotSize,
            stopLoss,
            takeProfit,
            comment: `${COMMENT_PREFIX}~${userData?.displayName || "User"}`,
          }),
        })

        const data = await response.json()
        console.log("Trade execution response:", data)

        if (data.success) {
          // Increment trade count
          tradeCount.current += 1

          // Log the successful trade
          const tradeLog = `[${getCurrentTime()}] ${symbol}: Order executed - ${type} ${lotSize} lot(s) at ${data.details.executionPrice} with SL: ${data.details.stopLoss} TP: ${data.details.takeProfit}`
          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, tradeLog]
            localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
            return newLogs
          })

          // Mark initial trade as executed
          initialTradeExecuted.current = true

          return true
        } else {
          // Log the error
          const errorLog = `[${getCurrentTime()}] ${symbol}: Trade execution failed - ${data.error}`
          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, errorLog]
            localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
            return newLogs
          })

          return false
        }
      } catch (error) {
        console.error("Trade execution error:", error)
        // Log the error
        const errorLog = `[${getCurrentTime()}] ${symbol}: Error executing trade - ${error instanceof Error ? error.message : "Unknown error"}`
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, errorLog]
          localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
          return newLogs
        })

        return false
      }
    },
    [accountDetails, lotSize, userData],
  )

  const startTradingSimulation = useCallback(() => {
    // Clear any existing interval
    if (tradingInterval) {
      clearInterval(tradingInterval)
    }

    // Reset the initial trade flag
    initialTradeExecuted.current = false

    // Immediately execute a trade for faster feedback
    setTimeout(async () => {
      if (isTrading && tradingSymbols.length > 0) {
        const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]

        // Log the initial analysis
        const initialLog = `[${getCurrentTime()}] ${randomSymbol}: Starting initial market analysis...`
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, initialLog]
          localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
          return newLogs
        })

        const analysis = await analyzeMarketForSymbol(randomSymbol)

        if (analysis) {
          // Force a trade for immediate feedback
          const decisionLog = `[${getCurrentTime()}] ${randomSymbol}: Initial signal detected for ${analysis.recommendation} (Confidence: ${analysis.confidence.toFixed(1)}%)`
          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, decisionLog]
            localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
            return newLogs
          })

          await executeTrade(randomSymbol, analysis.recommendation, analysis)
        }
      }
    }, 2000)

    // Set up trading interval (every 30-60 seconds)
    const interval = setInterval(
      async () => {
        // Only proceed if we're still trading
        if (!isTrading) return

        // Check if we've reached max trades
        if (maxTrades > 0 && tradeCount.current >= maxTrades) {
          const maxTradesLog = `[${getCurrentTime()}] Maximum number of trades (${maxTrades}) reached. Trading paused.`
          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, maxTradesLog]
            localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
            return newLogs
          })

          // Stop trading
          setIsTrading(false)
          localStorage.setItem("isTrading", "false")
          clearInterval(interval)
          return
        }

        // Check if initial trade has been executed
        if (!initialTradeExecuted.current) {
          console.log("Initial trade not yet executed, trying again...")
          const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]
          const analysis = await analyzeMarketForSymbol(randomSymbol)

          if (analysis) {
            await executeTrade(randomSymbol, analysis.recommendation, analysis)
          }
          return
        }

        // Randomly select a symbol to trade
        const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]

        // Analyze the market for this symbol
        const analysis = await analyzeMarketForSymbol(randomSymbol)

        if (!analysis) {
          return // Analysis failed
        }

        // For testing purposes, always execute a trade regardless of confidence
        const decisionLog = `[${getCurrentTime()}] ${randomSymbol}: Signal detected for ${analysis.recommendation} (Confidence: ${analysis.confidence.toFixed(1)}%)`
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, decisionLog]
          localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
          return newLogs
        })

        // Execute the trade
        await executeTrade(randomSymbol, analysis.recommendation, analysis)
      },
      30000, // Every 30 seconds
    )

    setTradingInterval(interval)
  }, [isTrading, tradingSymbols, userData])

  const startTradingInterval = () => {
    // Clear any existing interval
    if (tradingInterval) {
      clearInterval(tradingInterval)
    }

    // Reset the initial trade flag
    initialTradeExecuted.current = false

    // Immediately execute a trade for faster feedback
    setTimeout(async () => {
      if (isTrading && tradingSymbols.length > 0) {
        const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]

        // Log the initial analysis
        const initialLog = `[${getCurrentTime()}] ${randomSymbol}: Starting initial market analysis...`
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, initialLog]
          localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
          return newLogs
        })

        const analysis = await analyzeMarketForSymbol(randomSymbol)

        if (analysis) {
          // Force a trade for immediate feedback
          const decisionLog = `[${getCurrentTime()}] ${randomSymbol}: Initial signal detected for ${analysis.recommendation} (Confidence: ${analysis.confidence.toFixed(1)}%)`
          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, decisionLog]
            localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
            return newLogs
          })

          await executeTrade(randomSymbol, analysis.recommendation, analysis)
        }
      }
    }, 2000)

    // Set up trading interval (every 30-60 seconds)
    const interval = setInterval(
      async () => {
        // Only proceed if we're still trading
        if (!isTrading) return

        // Check if we've reached max trades
        if (maxTrades > 0 && tradeCount.current >= maxTrades) {
          const maxTradesLog = `[${getCurrentTime()}] Maximum number of trades (${maxTrades}) reached. Trading paused.`
          setLogs((prevLogs) => {
            const newLogs = [...prevLogs, maxTradesLog]
            localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
            return newLogs
          })

          // Stop trading
          setIsTrading(false)
          localStorage.setItem("isTrading", "false")
          clearInterval(interval)
          return
        }

        // Check if initial trade has been executed
        if (!initialTradeExecuted.current) {
          console.log("Initial trade not yet executed, trying again...")
          const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]
          const analysis = await analyzeMarketForSymbol(randomSymbol)

          if (analysis) {
            await executeTrade(randomSymbol, analysis.recommendation, analysis)
          }
          return
        }

        // Randomly select a symbol to trade
        const randomSymbol = tradingSymbols[Math.floor(Math.random() * tradingSymbols.length)]

        // Analyze the market for this symbol
        const analysis = await analyzeMarketForSymbol(randomSymbol)

        if (!analysis) {
          return // Analysis failed
        }

        // For testing purposes, always execute a trade regardless of confidence
        const decisionLog = `[${getCurrentTime()}] ${randomSymbol}: Signal detected for ${analysis.recommendation} (Confidence: ${analysis.confidence.toFixed(1)}%)`
        setLogs((prevLogs) => {
          const newLogs = [...prevLogs, decisionLog]
          localStorage.setItem("tradingLogs", JSON.stringify(newLogs))
          return newLogs
        })

        // Execute the trade
        await executeTrade(randomSymbol, analysis.recommendation, analysis)
      },
      30000, // Every 30 seconds
    )

    setTradingInterval(interval)
  }

  const handleToggleTrading = () => {
    // Prevent multiple clicks
    setIsButtonDisabled(true)

    setTimeout(() => {
      setIsButtonDisabled(false)
    }, 1000)

    if (isTrading) {
      // Stop trading
      setIsTrading(false)
      const newLogs = [...logs, `[${getCurrentTime()}] Trading stopped by user`]
      setLogs(newLogs)

      // Save to localStorage
      localStorage.setItem("isTrading", "false")
      localStorage.setItem("tradingLogs", JSON.stringify(newLogs))

      // Clear trading interval
      if (tradingInterval) {
        clearInterval(tradingInterval)
        setTradingInterval(null)
      }
    } else {
      // Start trading

      // Check if trading account is connected
      if (!accountDetails || !accountDetails.accountId) {
        toast({
          title: "Trading account not connected",
          description: "Please connect your trading account first",
          variant: "destructive",
        })
        router.push("/dashboard/connect")
        return
      }

      // Check if user has added symbols
      if (!tradingSymbols || tradingSymbols.length === 0) {
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
        router.push("/dashboard/settings")
        return
      }

      // Reset trade count
      tradeCount.current = 0

      setIsTrading(true)

      // Reset logs when starting trading
      const symbolsList = tradingSymbols.join(", ")
      const initialLogs = [`[${getCurrentTime()}] Trading started`]
      setLogs(initialLogs)

      // Save to localStorage
      localStorage.setItem("isTrading", "true")
      localStorage.setItem("tradingLogs", JSON.stringify(initialLogs))

      // Add logs with delays
      setTimeout(() => {
        const updatedLogs = [...initialLogs, `[${getCurrentTime()}] Trading symbols: ${symbolsList}`]
        setLogs(updatedLogs)
        localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs))

        setTimeout(() => {
          const updatedLogs2 = [
            ...updatedLogs,
            `[${getCurrentTime()}] Initializing trading algorithms...`,
            `[${getCurrentTime()}] Connected to trading account: ${accountDetails.login}`,
            `[${getCurrentTime()}] Stop Loss and Take Profit will be calculated automatically based on market analysis`,
            `[${getCurrentTime()}] Comment format: ${COMMENT_PREFIX}~${userData?.robotName || "QUICKTRADE PRO OFFICIAL"}`,
          ]
          setLogs(updatedLogs2)
          localStorage.setItem("tradingLogs", JSON.stringify(updatedLogs2))

          // Start trading interval
          startTradingSimulation()
        }, 5000)
      }, 5000)
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

  const toggleLogs = () => {
    const newState = !showLogs
    setShowLogs(newState)
    localStorage.setItem("showLogs", newState.toString())
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900 overflow-hidden">
      <div className="flex justify-between items-start p-4">
        <Image src="/images/bull-logo.png" alt="QUICKTRADE PRO Logo" width={50} height={50} priority />
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
          <p className="text-gray-400 mt-2">{userData?.eaName || "Elite precision, 24/7 operation"}</p>
        </div>

        {/* Market Analysis Alert */}
        {marketAnalysis && (
          <div className="w-full max-w-md bg-blue-900/30 rounded-lg p-4 mb-4 border border-blue-500/50">
            <div className="flex items-center mb-2">
              <AlertTriangle className="text-blue-400 mr-2" size={18} />
              <h2 className="text-blue-300 text-lg font-medium">Market Analysis</h2>
            </div>
            <div className="text-sm text-blue-200">
              <p>
                <span className="font-semibold">Symbol:</span> {marketAnalysis.symbol}
              </p>
              <p>
                <span className="font-semibold">Trend:</span> {marketAnalysis.trend}
              </p>
              <p>
                <span className="font-semibold">Strength:</span> {marketAnalysis.strength.toFixed(1)}%
              </p>
              <p>
                <span className="font-semibold">Recommendation:</span> {marketAnalysis.recommendation}
              </p>
              <p>
                <span className="font-semibold">Confidence:</span> {marketAnalysis.confidence.toFixed(1)}%
              </p>
            </div>
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
            <div className="bg-slate-900 rounded p-3 max-h-48 overflow-y-auto">
              {logs.length > 0 ? (
                <div className="font-mono text-sm space-y-1">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`${
                        log.includes("ERROR") || log.includes("failed") || log.includes("WARNING")
                          ? "text-red-400"
                          : log.includes("Order executed")
                            ? "text-blue-400"
                            : "text-green-500"
                      }`}
                    >
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
            disabled={isButtonDisabled}
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

