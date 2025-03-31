"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"
import { analyzeMarket } from "@/lib/market-analysis"

// Default signals data
const defaultSignals = [
  {
    symbol: "XAUUSDm",
    type: "BUY",
    price: "2345.67",
    tp: "2360.00",
    sl: "2330.00",
    time: "10:45 AM",
    active: true,
    strength: "Strong",
  },
  {
    symbol: "EURUSDm",
    type: "SELL",
    price: "1.0876",
    tp: "1.0850",
    sl: "1.0900",
    time: "09:30 AM",
    active: true,
    strength: "Very Strong",
  },
  {
    symbol: "GBPUSDm",
    type: "BUY",
    price: "1.2654",
    tp: "1.2700",
    sl: "1.2600",
    time: "Yesterday",
    active: false,
    strength: "Moderate",
  },
  {
    symbol: "USDJPYm",
    type: "SELL",
    price: "153.45",
    tp: "152.80",
    sl: "154.00",
    time: "11:20 AM",
    active: true,
    strength: "Strong",
  },
  {
    symbol: "BTCUSDm",
    type: "BUY",
    price: "67890.50",
    tp: "69000.00",
    sl: "66500.00",
    time: "08:15 AM",
    active: true,
    strength: "Very Strong",
  },
]

export default function SignalsPage() {
  const [signals, setSignals] = useState(defaultSignals)
  const [filteredSignals, setFilteredSignals] = useState([])
  const [userSymbols, setUserSymbols] = useState<string[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isExecutingTrade, setIsExecutingTrade] = useState<string | null>(null)
  const [symbolTradeDirections, setSymbolTradeDirections] = useState<{ [symbol: string]: string | null }>({})
  const [symbolTradeCounts, setSymbolTradeCounts] = useState<{ [symbol: string]: number }>({})
  const [maxTrades, setMaxTrades] = useState<number>(0)
  const [isProcessingMultipleTrades, setIsProcessingMultipleTrades] = useState(false)

  useEffect(() => {
    console.log("Loading signals page")

    // Load user's trading symbols and account ID
    const savedSymbols = localStorage.getItem("tradingSymbols")
    if (savedSymbols) {
      const parsedSymbols = JSON.parse(savedSymbols)
      console.log("User symbols:", parsedSymbols)
      setUserSymbols(parsedSymbols)

      // Initialize trade directions and counts
      const directions = {}
      const counts = {}
      parsedSymbols.forEach((symbol) => {
        directions[symbol] = null
        counts[symbol] = 0
      })
      setSymbolTradeDirections(directions)
      setSymbolTradeCounts(counts)

      // Filter signals to only show those symbols that the user has selected
      const filtered = signals.filter((signal) => parsedSymbols.includes(signal.symbol))
      setFilteredSignals(filtered.length > 0 ? filtered : [])
    } else {
      // If no symbols saved, show empty array
      setFilteredSignals([])
    }

    // Get MetaAPI account ID
    const metatraderDetails = localStorage.getItem("metatraderDetails")
    if (metatraderDetails) {
      const details = JSON.parse(metatraderDetails)
      if (details.accountId) {
        setAccountId(details.accountId)
      }
    }

    // Get max trades setting
    const savedMaxTrades = localStorage.getItem("maxTrades") || "0"
    setMaxTrades(Number.parseInt(savedMaxTrades, 10))
  }, [signals])

  // Update the handleCopyTrade function to always execute trades regardless of analysis
  const handleCopyTrade = async (signal) => {
    if (!accountId) {
      toast({
        title: "No account connected",
        description: "Please connect your MetaTrader account first",
        variant: "destructive",
      })
      return
    }

    // Check if we already have trades in the opposite direction
    const currentDirection = symbolTradeDirections[signal.symbol]
    if (currentDirection && currentDirection !== signal.type) {
      // Just show a warning but proceed with the trade
      toast({
        title: "Direction conflict",
        description: `You have existing ${currentDirection} trades for ${signal.symbol}, but proceeding with ${signal.type} trade as requested.`,
        variant: "warning",
      })
    }

    // Check if we've reached max trades for this symbol
    const currentCount = symbolTradeCounts[signal.symbol] || 0
    if (maxTrades > 0 && currentCount >= maxTrades) {
      // Just show a warning but proceed with the trade
      toast({
        title: "Maximum trades warning",
        description: `You've reached the configured maximum of ${maxTrades} trades for ${signal.symbol}, but proceeding with additional trade as requested.`,
        variant: "warning",
      })
    }

    setIsExecutingTrade(signal.symbol)
    setIsProcessingMultipleTrades(true)

    try {
      // Get lot size from settings
      const lotSize = localStorage.getItem("lotSize") || "0.01"

      // Generate a comment for the trade - use Latin-1 compatible characters only
      const robotName = localStorage.getItem("userData")
        ? JSON.parse(localStorage.getItem("userData")).robotName || "QUICKTRADE PRO"
        : "QUICKTRADE PRO"
      const tradeComment = `${robotName}` // Simplified comment

      // Perform market analysis but always proceed with trade execution
      const analysis = await analyzeMarket(signal.symbol, signal.type)

      // Log analysis but don't use it to determine whether to execute trade
      console.log(`Market analysis for ${signal.symbol}: ${analysis.message}`)

      // Calculate how many trades to open
      const tradesToOpen = maxTrades > 0 ? maxTrades : 1
      let successCount = 0

      // Add detailed logging
      console.log(`Attempting to execute ${tradesToOpen} ${signal.type} trades for ${signal.symbol} with:`, {
        stopLoss: signal.sl,
        takeProfit: signal.tp,
        volume: lotSize,
      })

      // Open all trades at once
      for (let i = 0; i < tradesToOpen; i++) {
        try {
          // Execute trade via MetaAPI
          const response = await fetch("/api/metaapi/trade", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accountId,
              symbol: signal.symbol,
              type: signal.type, // BUY or SELL
              volume: Number.parseFloat(lotSize),
              stopLoss: Number.parseFloat(signal.sl),
              takeProfit: Number.parseFloat(signal.tp),
              comment: tradeComment,
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            console.error(`Trade ${i + 1} failed:`, data)
            throw new Error(data.error || "Failed to execute trade")
          }

          console.log(`Trade ${i + 1} executed successfully:`, data)
          successCount++

          // Small delay between trades to avoid overwhelming the API
          if (i < tradesToOpen - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500))
          }
        } catch (error) {
          console.error(`Trade execution error (${i + 1}/${tradesToOpen}):`, error)
        }
      }

      if (successCount > 0) {
        // Update the trade direction and count for this symbol
        setSymbolTradeDirections((prev) => ({
          ...prev,
          [signal.symbol]: signal.type,
        }))

        setSymbolTradeCounts((prev) => ({
          ...prev,
          [signal.symbol]: (prev[signal.symbol] || 0) + successCount,
        }))

        toast({
          title: "Trades executed",
          description: `${successCount} ${signal.type} trades for ${signal.symbol} executed successfully`,
        })
      } else {
        toast({
          title: "Trade failed",
          description: "Failed to execute any trades",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Trade execution error:", error)
      toast({
        title: "Trade failed",
        description: error instanceof Error ? error.message : "Failed to execute trade",
        variant: "destructive",
      })
    } finally {
      setIsExecutingTrade(null)
      setIsProcessingMultipleTrades(false)
    }
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
          <h1 className="text-xl font-bold">Trading Signals</h1>
        </div>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Today's Signals
        </Badge>
      </div>

      <div className="space-y-4">
        {filteredSignals.length > 0 ? (
          filteredSignals.map((signal, index) => (
            <Card key={index} className={signal.active ? "border-l-4 border-l-green-500" : ""}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <span className="font-bold mr-2">{signal.symbol}</span>
                    {signal.active && <Badge className="bg-green-500 text-white">Active</Badge>}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{signal.time}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <Badge
                      className={`${signal.type === "BUY" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"} mr-2`}
                    >
                      {signal.type}
                    </Badge>
                    <span className="font-medium">{signal.price}</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                  >
                    {signal.strength}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center">
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm">TP: {signal.tp}</span>
                  </div>
                  <div className="flex items-center">
                    <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-sm">SL: {signal.sl}</span>
                  </div>
                </div>

                {signal.active && (
                  <Button
                    className="w-full mt-3 bg-blue-500 hover:bg-blue-600"
                    size="sm"
                    onClick={() => handleCopyTrade(signal)}
                    disabled={
                      isExecutingTrade === signal.symbol ||
                      isProcessingMultipleTrades ||
                      (symbolTradeDirections[signal.symbol] && symbolTradeDirections[signal.symbol] !== signal.type) ||
                      (maxTrades > 0 && (symbolTradeCounts[signal.symbol] || 0) >= maxTrades)
                    }
                  >
                    {isExecutingTrade === signal.symbol ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Executing {maxTrades > 0 ? `${maxTrades} trades` : "trade"}...
                      </>
                    ) : maxTrades > 0 && (symbolTradeCounts[signal.symbol] || 0) >= maxTrades ? (
                      `Max trades (${maxTrades}) reached`
                    ) : symbolTradeDirections[signal.symbol] && symbolTradeDirections[signal.symbol] !== signal.type ? (
                      `Conflicts with existing ${symbolTradeDirections[signal.symbol]} trades`
                    ) : (
                      `Copy ${maxTrades > 0 ? `${maxTrades} Trades` : "Trade"}`
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">No signals available for your selected symbols</p>
              <Button className="mt-3" variant="outline" onClick={() => (window.location.href = "/dashboard/settings")}>
                Add Trading Symbols
              </Button>
            </CardContent>
          </Card>
        )}

        {userSymbols.length > 0 && filteredSignals.length > 0 && (
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">Showing signals for: {userSymbols.join(", ")}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

