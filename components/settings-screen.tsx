"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type PortalUser, type AllowedSymbol, saveUserSettings } from "@/lib/portal-auth"
import { AlertCircle, CheckCircle, Plus, Trash2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { auth } from "@/lib/firebase"

type SettingsScreenProps = {
  user: PortalUser
  credentials: any
}

export function SettingsScreen({ user, credentials }: SettingsScreenProps) {
  const [symbols, setSymbols] = useState<AllowedSymbol[]>(user.allowedSymbols || [])
  const [newSymbol, setNewSymbol] = useState<AllowedSymbol>({
    symbol: "",
    minLotSize: 0.01,
    maxTrades: 1,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleAddSymbol = () => {
    if (!newSymbol.symbol) return

    // Check if symbol already exists
    if (symbols.some((s) => s.symbol === newSymbol.symbol)) {
      setError("Symbol already exists")
      return
    }

    setSymbols([...symbols, { ...newSymbol }])
    setNewSymbol({
      symbol: "",
      minLotSize: 0.01,
      maxTrades: 1,
    })
  }

  const handleRemoveSymbol = (index: number) => {
    const updatedSymbols = [...symbols]
    updatedSymbols.splice(index, 1)
    setSymbols(updatedSymbols)
  }

  const handleNewSymbolChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSymbol((prev) => ({
      ...prev,
      [name]: name === "symbol" ? value : Number.parseFloat(value),
    }))
  }

  const handleSaveSettings = async () => {
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    if (!auth.currentUser) {
      alert("You must be logged in to save settings")
      return
    }

    try {
      const result = await saveUserSettings(auth.currentUser.uid, {
        allowedSymbols: symbols,
      })

      if (result) {
        setSuccess("Settings saved successfully!")
      } else {
        setError("Failed to save settings. Please try again.")
      }
    } catch (err) {
      console.error("Save settings error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="bg-black border border-red-500 glow-border">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-red-500 neon-text">Trading Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-900/30 border-green-500 text-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-red-400">Available Symbols</h3>

            {symbols.length > 0 ? (
              <div className="space-y-2">
                {symbols.map((symbol, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-black/50 border border-red-500/30 rounded-md p-2"
                  >
                    <div>
                      <p className="text-white font-medium">{symbol.symbol}</p>
                      <p className="text-xs text-red-300">
                        Min Lot: {symbol.minLotSize} | Max Trades: {symbol.maxTrades}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSymbol(index)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-red-400 py-4">No symbols added yet</div>
            )}

            <div className="pt-4 border-t border-red-900/30">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Add New Symbol</h3>

              <div className="space-y-2">
                <div>
                  <label htmlFor="symbol" className="text-sm font-medium text-red-300">
                    Symbol
                  </label>
                  <Input
                    id="symbol"
                    name="symbol"
                    placeholder="e.g. EURUSD"
                    value={newSymbol.symbol}
                    onChange={handleNewSymbolChange}
                    className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="minLotSize" className="text-sm font-medium text-red-300">
                      Min Lot Size
                    </label>
                    <Input
                      id="minLotSize"
                      name="minLotSize"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newSymbol.minLotSize}
                      onChange={handleNewSymbolChange}
                      className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="maxTrades" className="text-sm font-medium text-red-300">
                      Max Trades
                    </label>
                    <Input
                      id="maxTrades"
                      name="maxTrades"
                      type="number"
                      min="1"
                      value={newSymbol.maxTrades}
                      onChange={handleNewSymbolChange}
                      className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddSymbol}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                  disabled={!newSymbol.symbol}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Symbol
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                className="w-full bg-red-500 hover:bg-red-600 text-white"
                onClick={handleSaveSettings}
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

