"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Pause, LogOut, AlertCircle, RefreshCw, ChevronUp, ChevronDown } from "lucide-react"
import type { FirebaseUser } from "@/lib/firebase-auth"
import {
  analyzeMarket,
  getMetaApiAccount,
  initializeMetaApi,
  executeTrade,
  getActiveTrades,
  applyTrailingStop,
} from "@/lib/meta-api"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface HomeScreenProps {
  userData: FirebaseUser
  onLogout: () => void
  isTrading: boolean
  onTradingChange: (isTrading: boolean, logs: string[]) => void
  showBotLogs: boolean
  onShowBotLogsChange: (show: boolean) => void
  botLogs: string[]
  onBotLogsChange: (logs: string[]) => void
}

export function HomeScreen({
  userData,
  onLogout,
  isTrading,
  onTradingChange,
  showBotLogs,
  onShowBotLogsChange,
  botLogs,
  onBotLogsChange,
}: HomeScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [tradingError, setTradingError] = useState<string | null>(null)
  const [activeConnection, setActiveConnection] = useState<any>(null)
  const [refreshingData, setRefreshingData] = useState(false)
  const [currentUserData, setCurrentUserData] = useState<FirebaseUser>(userData)
  const [isProcessing, setIsProcessing] = useState(false)
  const [consecutiveFailures, setConsecutiveFailures] = useState(0)
  const [metaApiAccount, setMetaApiAccount] = useState<any>(null)
  const [stopLoss, setStopLoss] = useState<number>(100)
  const [takeProfit, setTakeProfit] = useState<number>(200)
  const [tradingSettings, setTradingSettings] = useState({
    enableTrailingStop: false,
    trailingStopDistance: 10, // Default value
  })

  // Use refs to track if trading is active for the interval
  const isTradingRef = useRef(isTrading)
  const tradingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isExecutingTradeRef = useRef(false)

  // Load active connection and account data
  useEffect(() => {
    setCurrentUserData(userData)
    loadActiveConnection()

    // Cleanup function to clear interval when component unmounts
    return () => {
      if (tradingIntervalRef.current) {
        clearInterval(tradingIntervalRef.current)
      }
    }
  }, [userData])

  // Update the ref when isTrading changes
  useEffect(() => {
    isTradingRef.current = isTrading

    // If trading is started, set up the interval for real trades
    if (isTrading && !tradingIntervalRef.current && activeConnection) {
      setupTradingSimulation()
    } else if (!isTrading && tradingIntervalRef.current) {
      // Clear the interval if trading is stopped
      clearInterval(tradingIntervalRef.current)
      tradingIntervalRef.current = null
      setConsecutiveFailures(0)
    }
  }, [isTrading, activeConnection])

  // Initialize MetaApi account when active connection changes
  useEffect(() => {
    const initMetaApiAccount = async () => {
      if (
        activeConnection &&
        !activeConnection.accountId?.startsWith("fallback-") &&
        !activeConnection.accountId?.startsWith("sim-")
      ) {
        try {
          // Initialize MetaApi SDK
          await initializeMetaApi()

          // Get the MetaApi account - handle potential errors gracefully
          try {
            console.log("Attempting to get MetaApi account:", activeConnection.accountId)
            const account = await getMetaApiAccount(activeConnection.accountId)
            if (account) {
              setMetaApiAccount(account)
              console.log("MetaApi account initialized successfully:", account.id)
            } else {
              console.warn("MetaApi account not found, using fallback mode")
            }
          } catch (accountError) {
            console.error("Error getting MetaApi account:", accountError)
          }
        } catch (error) {
          console.error("Error initializing MetaApi SDK:", error)
        }
      }
    }

    if (activeConnection) {
      initMetaApiAccount()
    }
  }, [activeConnection])

  // Load SL/TP values from Firestore
  useEffect(() => {
    const loadUserSettings = async () => {
      if (currentUserData?.email) {
        try {
          const userDoc = doc(db, "users", currentUserData.email)
          const userSnapshot = await getDoc(userDoc)

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data()
            if (userData.stopLoss) {
              setStopLoss(userData.stopLoss)
            }
            if (userData.takeProfit) {
              setTakeProfit(userData.takeProfit)
            }
            if (userData.tradingSettings) {
              setTradingSettings(userData.tradingSettings)
            }
          }
        } catch (error) {
          console.error("Error loading user settings:", error)
        }
      }
    }

    loadUserSettings()
  }, [currentUserData])

  const loadActiveConnection = async () => {
    if (!currentUserData?.email) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)

      // Get user document to find last active connection and latest user data
      const userRef = doc(db, "users", currentUserData.email)
      const userDoc = await getDoc(userRef)

      if (userDoc.exists()) {
        // Update current user data with latest from Firestore
        const latestUserData = userDoc.data() as FirebaseUser
        setCurrentUserData({
          ...currentUserData,
          allowedSymbols: latestUserData.allowedSymbols || [],
        })

        // Check for active connection
        if (userDoc.data().lastActiveConnection) {
          const connectionId = userDoc.data().lastActiveConnection

          // Get connection details
          const connectionRef = doc(db, "trading_connections", connectionId)
          const connectionDoc = await getDoc(connectionRef)

          if (connectionDoc.exists()) {
            const connectionData = connectionDoc.data()
            setActiveConnection(connectionData)
            setIsConnected(connectionData.connected === true)

            // Check if trading was active, but don't automatically start it
            if (connectionData.tradingActive) {
              // Just update the UI state to show it was active, but don't start trading
              const currentTime = new Date().toLocaleTimeString()
              onBotLogsChange([
                `[${currentTime}] Trading was previously active. Press Start Trading to resume.`,
                ...botLogs,
              ])
            }
          }
        } else {
          // No active connection
          const currentTime = new Date().toLocaleTimeString()
          onBotLogsChange([
            `[${currentTime}] No active trading account connected`,
            `[${currentTime}] Please connect your ${currentUserData.robotName || "Trading Bot"} to a trading account`,
            ...botLogs,
          ])
        }
      }
    } catch (error) {
      console.error("Error loading active connection:", error)

      // Add an error log entry
      const currentTime = new Date().toLocaleTimeString()
      onBotLogsChange([`[${currentTime}] Error: Failed to load connection data`, ...botLogs])
    } finally {
      setIsLoading(false)
      setRefreshingData(false)
    }
  }

  // Add a connection monitoring and auto-reconnect feature
  useEffect(() => {
    // Set up a connection monitoring interval
    const connectionMonitor = setInterval(() => {
      if (activeConnection && !isConnected) {
        console.log("Detected disconnection, attempting to reconnect...")

        // Add a log entry
        const currentTime = new Date().toLocaleTimeString()
        onBotLogsChange([`[${currentTime}] Connection lost, attempting to reconnect...`, ...botLogs])

        // Attempt to reconnect
        refreshAllData()
      }
    }, 60000) // Check every minute

    return () => {
      clearInterval(connectionMonitor)
    }
  }, [activeConnection, isConnected])

  // Enhance the refreshAllData function to be more robust
  const refreshAllData = async () => {
    setRefreshingData(true)
    setTradingError(null)

    try {
      // Get latest user data from localStorage
      const storedUser = localStorage.getItem("firebase_user")
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setCurrentUserData(parsedUser)

          const currentTime = new Date().toLocaleTimeString()
          onBotLogsChange([`[${currentTime}] Refreshed user data`, ...botLogs])
        } catch (error) {
          console.error("Error parsing stored user data:", error)
        }
      }

      // Reload connection data with retry mechanism
      let retryCount = 0
      const maxRetries = 3

      const attemptLoadConnection = async () => {
        try {
          await loadActiveConnection()
          return true
        } catch (error) {
          console.error(`Connection retry ${retryCount + 1}/${maxRetries} failed:`, error)
          retryCount++
          if (retryCount < maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise((resolve) => setTimeout(resolve, 1000 * retryCount))
            return attemptLoadConnection()
          }
          return false
        }
      }

      const connectionResult = await attemptLoadConnection()

      if (connectionResult) {
        const currentTime = new Date().toLocaleTimeString()
        onBotLogsChange([`[${currentTime}] Connection restored successfully`, ...botLogs])
        setIsConnected(true)
      }
    } catch (error) {
      console.error("Error refreshing data:", error)
    } finally {
      setRefreshingData(false)
    }
  }

  // Function to manually refresh all data
  // const refreshAllData = async () => {
  //   setRefreshingData(true)
  //   setTradingError(null)

  //   // Get latest user data from localStorage
  //   const storedUser = localStorage.getItem("firebase_user")
  //   if (storedUser) {
  //     try {
  //       const parsedUser = JSON.parse(storedUser)
  //       setCurrentUserData(parsedUser)

  //       const currentTime = new Date().toLocaleTimeString()
  //       onBotLogsChange([`[${currentTime}] Refreshed user data`, ...botLogs])
  //     } catch (error) {
  //       console.error("Error parsing stored user data:", error)
  //     }
  //   }

  //   // Reload connection data
  //   await loadActiveConnection()
  // }

  // Update the executeRealTrade function to analyze market first and be more reliable
  const executeRealTrade = async () => {
    // Prevent multiple simultaneous trade executions
    if (isExecutingTradeRef.current) {
      console.log("Trade execution already in progress, skipping")
      return
    }

    if (!activeConnection || !currentUserData.allowedSymbols || currentUserData.allowedSymbols.length === 0) {
      return
    }

    isExecutingTradeRef.current = true

    try {
      const currentTime = new Date().toLocaleTimeString()
      onBotLogsChange([`[${currentTime}] Starting market analysis for all symbols...`, ...botLogs])

      // Get active trades first to avoid opening conflicting positions
      let activeTrades: any[] = []
      try {
        // Use the accountId from activeConnection
        const accountToUse = activeConnection.metaApiAccountId || activeConnection.accountId
        activeTrades = await getActiveTrades(accountToUse)
        onBotLogsChange([`[${currentTime}] Found ${activeTrades.length} active trades`, ...botLogs])

        // CONSERVATIVE APPROACH: If there are too many active trades already, don't open more
        if (activeTrades.length >= 20) {
          onBotLogsChange([
            `[${currentTime}] SAFETY LIMIT: Already have ${activeTrades.length} active trades. Skipping new trades to protect account.`,
            ...botLogs,
          ])
          isExecutingTradeRef.current = false
          return
        }
      } catch (error) {
        console.error("Error getting active trades:", error)
        onBotLogsChange([`[${currentTime}] Warning: Could not retrieve active trades`, ...botLogs])
      }

      // Process each allowed symbol
      for (const symbolData of currentUserData.allowedSymbols) {
        const symbol = symbolData.symbol
        const lotSize = symbolData.minLotSize
        // CONSERVATIVE APPROACH: Limit max trades per symbol to 2 (or user setting if lower)
        const maxTrades = Math.min(symbolData.maxTrades || 2, 2)

        // Count existing trades for this symbol
        const existingSymbolTrades = activeTrades.filter((trade) => trade.symbol === symbol).length

        // CONSERVATIVE APPROACH: Skip if already have trades for this symbol
        if (existingSymbolTrades > 0) {
          onBotLogsChange([
            `[${currentTime}] Already have ${existingSymbolTrades} active trades for ${symbol}. Skipping to avoid overexposure.`,
            ...botLogs,
          ])
          continue
        }

        // Check if this symbol has known stop loss issues
        const hasStopIssues = symbol.includes("z") || symbol.endsWith("z")

        // Analyze market to determine trade direction, passing active trades
        onBotLogsChange([`[${currentTime}] Analyzing market conditions for ${symbol}...`, ...botLogs])
        const analysis = analyzeMarket(symbol, activeTrades)

        // If analysis suggests no trade, log and continue to next symbol
        if (analysis.decision === "none") {
          onBotLogsChange([`[${currentTime}] Analysis for ${symbol}: ${analysis.reason} - No trade opened`, ...botLogs])
          continue
        }

        // Get trade type from analysis
        const tradeType = analysis.decision

        // CONSERVATIVE APPROACH: Always use stop loss and take profit when possible
        let userStopLoss = analysis.stopLoss || stopLoss
        let userTakeProfit = analysis.takeProfit || takeProfit

        // If this symbol has stop issues, don't use stops
        if (hasStopIssues) {
          userStopLoss = undefined
          userTakeProfit = undefined
          onBotLogsChange([
            `[${currentTime}] Symbol ${symbol} has known stop issues - trading without SL/TP`,
            ...botLogs,
          ])
        }

        onBotLogsChange([
          `[${currentTime}] Analysis for ${symbol}: ${analysis.reason}`,
          `[${currentTime}] Opening ${maxTrades} ${tradeType.toUpperCase()} trades on ${symbol} (${lotSize} lots each)${
            hasStopIssues ? " without SL/TP" : ` with SL: ${userStopLoss}, TP: ${userTakeProfit}`
          }`,
          ...botLogs,
        ])

        // Prioritize using metaApiAccountId if available, then fallback to accountId
        const accountToUse = activeConnection.metaApiAccountId || activeConnection.accountId

        // Execute trades sequentially for better control
        let successCount = 0
        let failCount = 0
        const errorMessages = new Set<string>()

        for (let i = 0; i < maxTrades; i++) {
          try {
            // CONSERVATIVE APPROACH: Execute trades one by one with retry
            const result = await executeTrade(
              accountToUse,
              symbol,
              tradeType,
              lotSize,
              hasStopIssues ? undefined : userStopLoss,
              hasStopIssues ? undefined : userTakeProfit,
              `QUICKTRADE-PRO-${i + 1}`,
            )

            if (result.success) {
              successCount++
              onBotLogsChange([
                `[${currentTime}] Opened ${tradeType.toUpperCase()} trade #${i + 1} on ${symbol} (${lotSize} lots)`,
                ...botLogs,
              ])
            } else {
              failCount++
              if (result.error) {
                errorMessages.add(result.error)
              }
            }
          } catch (error: any) {
            failCount++
            errorMessages.add(error.message || "Unknown error")
          }
        }

        // Log success/failure summary
        if (successCount > 0) {
          onBotLogsChange([
            `[${currentTime}] Completed batch for ${symbol}: ${successCount} trades opened, ${failCount} failed`,
            ...botLogs,
          ])
        } else if (failCount > 0) {
          onBotLogsChange([
            `[${currentTime}] ERROR: Failed to open any trades for ${symbol}. ${failCount} attempts failed.`,
            ...botLogs,
          ])

          // Log each unique error message
          errorMessages.forEach((errorMsg) => {
            onBotLogsChange([`[${currentTime}] Error details: ${errorMsg}`, ...botLogs])
          })
        }
      }

      // Reset consecutive failures on successful trade execution
      setConsecutiveFailures(0)
    } catch (error: any) {
      console.error("Unexpected error in trade execution flow:", error)
      const currentTime = new Date().toLocaleTimeString()
      onBotLogsChange([
        `[${currentTime}] ERROR: ${error.message || "Unknown error during trade execution"}`,
        `[${currentTime}] Continuing with trading simulation...`,
        ...botLogs,
      ])
    } finally {
      // Release the lock after a delay to prevent rapid trade execution
      setTimeout(() => {
        isExecutingTradeRef.current = false
      }, 5000)
    }
  }

  // Add a function to monitor and manage trailing stops
  const monitorTrailingStops = async () => {
    if (!activeConnection || !isTrading || !tradingSettings.enableTrailingStop) {
      return
    }

    try {
      const accountToUse = activeConnection.metaApiAccountId || activeConnection.accountId
      const activeTrades = await getActiveTrades(accountToUse)
      const currentTime = new Date().toLocaleTimeString()

      if (activeTrades.length === 0) {
        return
      }

      onBotLogsChange([`[${currentTime}] Monitoring ${activeTrades.length} trades for trailing stops...`, ...botLogs])

      for (const trade of activeTrades) {
        // Skip trades that don't have a current price
        if (!trade.currentPrice) continue

        const tradeType = trade.type.toLowerCase()
        const isProfit =
          (tradeType === "buy" && trade.currentPrice > trade.openPrice) ||
          (tradeType === "sell" && trade.currentPrice < trade.openPrice)

        // Only apply trailing stop to trades in profit
        if (isProfit) {
          // Calculate pip value based on the symbol
          const pipValue = trade.symbol.includes("JPY") ? 0.01 : 0.0001

          // Convert trailing stop distance from pips to price
          const trailingDistancePrice = tradingSettings.trailingStopDistance * pipValue

          // Apply the trailing stop
          const success = await applyTrailingStop(
            accountToUse,
            trade.id,
            trade.currentPrice,
            trailingDistancePrice,
            tradeType as "buy" | "sell",
          )

          if (success) {
            onBotLogsChange([
              `[${currentTime}] Applied trailing stop to ${tradeType} trade on ${trade.symbol} at ${trade.currentPrice}`,
              ...botLogs,
            ])
          }
        }
      }
    } catch (error) {
      console.error("Error monitoring trailing stops:", error)
    }
  }

  // Update the setupTradingSimulation function to include trailing stop monitoring
  const setupTradingSimulation = () => {
    // Clear any existing interval
    if (tradingIntervalRef.current) {
      clearInterval(tradingIntervalRef.current)
    }

    // Reset state
    setConsecutiveFailures(0)

    // Set up an interval to execute trades that will continue until explicitly stopped
    tradingIntervalRef.current = setInterval(() => {
      // Check if trading is still active using the ref (not the state)
      if (isTradingRef.current && activeConnection && !isExecutingTradeRef.current) {
        executeRealTrade()

        // Monitor and update trailing stops if enabled
        if (tradingSettings.enableTrailingStop) {
          monitorTrailingStops()
        }
      }
    }, 180000) // Try to open trades every 3 minutes

    // Log that trading simulation is set up and will continue until stopped
    const currentTime = new Date().toLocaleTimeString()
    onBotLogsChange([`[${currentTime}] Trading automation active - will continue until stopped`, ...botLogs])
  }

  // Update the toggleTrading function to ensure it doesn't start automatically
  const toggleTrading = async () => {
    if (!activeConnection) {
      setTradingError("No trading account connected. Please connect an account first.")
      return
    }

    setTradingError(null)
    setIsProcessing(true)

    try {
      if (isTrading) {
        // User explicitly pressed Stop Trading
        const currentTime = new Date().toLocaleTimeString()
        const newLogs = [`[${currentTime}] User requested to stop trading...`, ...botLogs]
        onBotLogsChange(newLogs)

        // Update Firestore
        await updateDoc(doc(db, "trading_connections", activeConnection.accountId), {
          tradingActive: false,
          tradingStoppedAt: new Date().toISOString(),
        }).catch((err) => {
          console.error("Error updating Firestore:", err)
        })

        // Add a log entry
        const updatedLogs = [`[${currentTime}] Trading stopped by user`, ...newLogs]
        onBotLogsChange(updatedLogs)

        // Clear the trading interval
        if (tradingIntervalRef.current) {
          clearInterval(tradingIntervalRef.current)
          tradingIntervalRef.current = null
        }

        // Reset state
        setConsecutiveFailures(0)

        // Update the ref to ensure the interval check stops
        isTradingRef.current = false

        // Update parent component
        onTradingChange(false, updatedLogs)
      } else {
        // User explicitly pressed Start Trading
        // First refresh user data to ensure we have the latest symbols
        await refreshAllData()

        // Get the allowed symbols from user data
        const allowedSymbols = currentUserData.allowedSymbols || []

        if (!allowedSymbols || allowedSymbols.length === 0) {
          setTradingError("No trading symbols configured. Please add symbols in Settings and save your changes.")
          setIsProcessing(false)
          return
        }

        // Create trading parameters from allowed symbols
        const tradingParameters = allowedSymbols.map((symbol) => ({
          symbol: symbol.symbol,
          lotSize: symbol.minLotSize,
          maxTrades: symbol.maxTrades || 5, // Default to 5 if not specified
        }))

        const currentTime = new Date().toLocaleTimeString()
        const newLogs = [`[${currentTime}] User requested to start trading...`, ...botLogs]
        onBotLogsChange(newLogs)

        // Update Firestore
        try {
          await updateDoc(doc(db, "trading_connections", activeConnection.accountId), {
            tradingActive: true,
            tradingStartedAt: new Date().toISOString(),
            tradingParameters,
          })
        } catch (firestoreError) {
          console.error("Error updating Firestore:", firestoreError)
          // Continue anyway - don't let Firestore errors stop trading
        }

        // Update the ref immediately to ensure the interval check works
        isTradingRef.current = true

        // Add a log entry
        const updatedLogs = [
          `[${currentTime}] Trading started with ${tradingParameters.length} symbols`,
          `[${currentTime}] ${currentUserData.robotName || "Trading Bot"} is now active and will continue until stopped`,
          ...newLogs,
        ]
        onBotLogsChange(updatedLogs)

        // Setup the trading simulation
        setupTradingSimulation()

        // Now execute the first trade since the user explicitly requested it
        executeRealTrade()

        // Update parent component
        onTradingChange(true, updatedLogs)
      }
    } catch (error: any) {
      console.error("Error toggling trading:", error)

      // Log the error
      const currentTime = new Date().toLocaleTimeString()
      const updatedLogs = [`[${currentTime}] Error: ${error.message || "Failed to toggle trading"}`, ...botLogs]
      onBotLogsChange(updatedLogs)

      // Don't automatically change the trading state on error
      setTradingError("Failed to " + (isTrading ? "stop" : "start") + " trading. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle image error
  const handleImageError = () => {
    setImageError(true)
  }

  // Determine the profile image source - try multiple possible field names
  const profileImageSrc = !imageError
    ? currentUserData.avatar || currentUserData.photoURL || "/placeholder.svg?height=200&width=400"
    : "/placeholder.svg?height=200&width=400"

  // Get the robot name from user data
  const robotName =
    currentUserData.robotName || currentUserData.robot_name || currentUserData.tradingBotName || "Trading Bot"

  if (isLoading) {
    return (
      <div className="flex flex-col h-full pb-16 p-4 bg-black text-white items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-red-500">Loading your trading profile...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full pb-16 p-4 bg-black text-white">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center text-xs mr-2">
            $
          </div>
          <span className="font-medium">QuicktradePro</span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          <button
            onClick={refreshAllData}
            className="flex items-center justify-center bg-gray-800 hover:bg-gray-700 text-white rounded-full p-2"
            aria-label="Refresh"
            disabled={refreshingData}
          >
            <RefreshCw size={16} className={refreshingData ? "animate-spin" : ""} />
          </button>

          {/* Logout button */}
          <button
            onClick={onLogout}
            className="flex items-center justify-center bg-red-600/20 hover:bg-red-600/30 text-red-500 rounded-full p-2"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg overflow-hidden mb-4 border border-red-900">
        <div className="relative">
          {/* Display user's profile picture from portal with better error handling */}
          <img
            src={profileImageSrc || "/placeholder.svg"}
            alt={robotName}
            className="w-full h-48 object-cover"
            onError={handleImageError}
          />
          <div className="absolute bottom-2 left-2 text-white bg-black/50 px-2 py-1 rounded text-sm">
            {currentUserData.username || currentUserData.displayName || "Trader"}
          </div>
        </div>

        <div className="p-4">
          {/* Display robot name from user data */}
          <h2 className="text-xl font-bold text-center text-red-500">{robotName}</h2>
          <p className="text-gray-400 text-center text-sm mb-4">Fully automated</p>

          {/* Trading error message */}
          {tradingError && (
            <div className="bg-red-900/30 text-red-500 p-3 rounded-md mb-4 flex items-start">
              <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm">{tradingError}</div>
            </div>
          )}

          <button
            className={`w-full ${isTrading ? "bg-red-600" : "bg-green-600"} text-white py-3 rounded-md flex items-center justify-center mb-4 hover:${isTrading ? "bg-red-700" : "bg-green-700"} ${isProcessing ? "opacity-70" : ""}`}
            onClick={toggleTrading}
            disabled={!activeConnection || refreshingData || isProcessing}
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isTrading ? "Stopping..." : "Starting..."}
              </>
            ) : isTrading ? (
              <>
                <Pause size={18} className="mr-2" /> Stop Trading
              </>
            ) : (
              <>
                <Play size={18} className="mr-2" /> Start Trading
              </>
            )}
          </button>

          <div className="flex items-center justify-center mb-4">
            <div className={`w-2 h-2 ${isConnected ? "bg-green-500" : "bg-red-500"} rounded-full mr-2`}></div>
            <span className="text-gray-400 text-sm">
              {activeConnection
                ? `Connected to ${activeConnection.platform} account ${activeConnection.login}`
                : "No account connected"}
            </span>
          </div>

          <div className="mt-4">
            <button
              className="text-red-500 text-sm flex items-center w-full justify-between"
              onClick={() => onShowBotLogsChange(!showBotLogs)}
            >
              <span>{showBotLogs ? "Hide Bot Logs" : "Show Bot Logs"}</span>
              {showBotLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showBotLogs && (
              <div className="mt-2 bg-gray-800 p-3 rounded-md text-xs text-gray-300 max-h-40 overflow-y-auto">
                {botLogs.map((log, index) => (
                  <div key={index} className="mb-1 pb-1 border-b border-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

