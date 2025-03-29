"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"
import Image from "next/image"
import { toast } from "@/hooks/use-toast"

export default function SignalsPage() {
  const [signals, setSignals] = useState([
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
  ])

  const [filteredSignals, setFilteredSignals] = useState([])
  const [userSymbols, setUserSymbols] = useState<string[]>([])
  const [accountId, setAccountId] = useState<string | null>(null)
  const [isExecutingTrade, setIsExecutingTrade] = useState<string | null>(null)
  const [symbolTradeDirections, setSymbolTradeDirections] = useState<{ [symbol: string]: string | null }>({})

  // Load user's trading symbols and account ID
  useEffect(() => {
    const savedSymbols = localStorage.getItem("tradingSymbols")
    if (savedSymbols) {
      const parsedSymbols = JSON.parse(savedSymbols)
      setUserSymbols(parsedSymbols)

      // Initialize trade directions
      const directions = {}
      parsedSymbols.forEach((symbol) => {
        directions[symbol] = null
      })
      setSymbolTradeDirections(directions)

      // If user has selected symbols, filter signals to only show those symbols
      if (parsedSymbols.length > 0) {
        const filtered = signals.filter((signal) => parsedSymbols.includes(signal.symbol))
        setFilteredSignals(filtered)
      } else {
        // If no symbols selected, show all signals
        setFilteredSignals(signals)
      }
    } else {
      // If no symbols saved, show all signals
      setFilteredSignals(signals)
    }

    // Get MetaAPI account ID
    const metatraderDetails = localStorage.getItem("metatraderDetails")
    if (metatraderDetails) {
      const details = JSON.parse(metatraderDetails)
      if (details.accountId) {
        setAccountId(details.accountId)
      }
    }
  }, [signals])

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
      toast({
        title: "Direction conflict",
        description: `You already have ${currentDirection} trades for ${signal.symbol}. Cannot execute ${signal.type} trade.`,
        variant: "destructive",
      })
      return
    }

    setIsExecutingTrade(signal.symbol)

    // Retry function with 3 attempts
    const executeTradeWithRetry = async (retries = 3) => {
      try {
        // Get lot size from settings
        const lotSize = localStorage.getItem("lotSize") || "0.01"

        // Generate a comment for the trade - use Latin-1 compatible characters only
        const robotName = localStorage.getItem("userData")
          ? JSON.parse(localStorage.getItem("userData")).robotName || "QUICKTRADE PRO"
          : "QUICKTRADE PRO"
        const tradeComment = `${robotName} +` // Using "+" instead of checkmark emoji

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
          throw new Error(data.error || "Failed to execute trade")
        }

        // Update the trade direction for this symbol
        setSymbolTradeDirections((prev) => ({
          ...prev,
          [signal.symbol]: signal.type,
        }))

        toast({
          title: "Trade executed",
          description: `${signal.type} ${signal.symbol} at ${signal.price} with SL: ${signal.sl}, TP: ${signal.tp}`,
        })

        return true
      } catch (error) {
        console.error("Trade execution error:", error)

        if (retries > 0) {
          console.log(`Retrying trade execution, ${retries} attempts left`)
          return executeTradeWithRetry(retries - 1)
        }

        toast({
          title: "Trade failed",
          description: error instanceof Error ? error.message : "Failed to execute trade",
          variant: "destructive",
        })

        return false
      }
    }

    try {
      await executeTradeWithRetry()
    } finally {
      setIsExecutingTrade(null)
    }
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Image
            src="/images/bull-logo.png"
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
                      (symbolTradeDirections[signal.symbol] && symbolTradeDirections[signal.symbol] !== signal.type)
                    }
                  >
                    {isExecutingTrade === signal.symbol ? (
                      <>
                        <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Executing...
                      </>
                    ) : symbolTradeDirections[signal.symbol] && symbolTradeDirections[signal.symbol] !== signal.type ? (
                      `Conflicts with existing ${symbolTradeDirections[signal.symbol]} trades`
                    ) : (
                      "Copy Trade"
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

