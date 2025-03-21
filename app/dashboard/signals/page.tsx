"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react"

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
    },
    {
      symbol: "EURUSDm",
      type: "SELL",
      price: "1.0876",
      tp: "1.0850",
      sl: "1.0900",
      time: "09:30 AM",
      active: true,
    },
    {
      symbol: "GBPUSDm",
      type: "BUY",
      price: "1.2654",
      tp: "1.2700",
      sl: "1.2600",
      time: "Yesterday",
      active: false,
    },
  ])

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Trading Signals</h1>
        <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
          Manual Mode
        </Badge>
      </div>

      <div className="space-y-4">
        {signals.map((signal, index) => (
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

              <div className="flex items-center mt-2">
                <Badge
                  className={`${signal.type === "BUY" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"} mr-2`}
                >
                  {signal.type}
                </Badge>
                <span className="font-medium">{signal.price}</span>
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
                <Button className="w-full mt-3 bg-blue-500 hover:bg-blue-600" size="sm">
                  Copy Trade
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-muted-foreground">Add more symbols in Settings to receive additional signals</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

