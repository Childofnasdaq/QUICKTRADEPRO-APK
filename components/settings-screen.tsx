"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Save, Calendar, AlertTriangle, Check, Plus, ToggleLeft, ToggleRight } from "lucide-react"
import type { FirebaseUser } from "@/lib/firebase-auth"
import { updateAllowedSymbols } from "@/lib/firebase-auth"
import type { AllowedSymbol } from "@/lib/firebase-auth"
import { formatDate, getDaysRemaining } from "@/lib/utils"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface SettingsScreenProps {
  userData: FirebaseUser
  onLogout: () => void
}

// Common trading symbols
const COMMON_SYMBOLS = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "USDCHF",
  "NZDUSD",
  "EURGBP",
  "EURJPY",
  "GBPJPY",
  "XAUUSD",
  "XAGUSD",
  "BTCUSD",
  "ETHUSD",
  "US30",
  "USOIL",
  "SPX500",
  "NAS100",
  "GER40",
  "UK100",
  "XAUUSDm",
  "XAUUSDz",
  "GOLDm",
  "GOLDz",
  "XAGUSDm",
  "XAGUSDz",
]

// Interface for trading settings
interface TradingSettings {
  enableTrailingStop: boolean
  trailingStopDistance: number
  maxDailyLoss: number
  maxDailyTrades: number
  stopLoss: number // Added stop loss
  takeProfit: number // Added take profit
}

export function SettingsScreen({ userData, onLogout }: SettingsScreenProps) {
  const [allowedSymbols, setAllowedSymbols] = useState<AllowedSymbol[]>(userData.allowedSymbols || [])
  const [globalLotSize, setGlobalLotSize] = useState("0.01")
  const [globalMaxTrades, setGlobalMaxTrades] = useState("5")
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])
  const [showSymbolSelector, setShowSymbolSelector] = useState(false)
  const [customSymbol, setCustomSymbol] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Trading settings state
  const [tradingSettings, setTradingSettings] = useState<TradingSettings>({
    enableTrailingStop: false,
    trailingStopDistance: 20,
    maxDailyLoss: 100,
    maxDailyTrades: 10,
    stopLoss: 100, // Default 100 pips stop loss
    takeProfit: 200, // Default 200 pips take profit
  })

  // Initialize selected symbols from existing allowed symbols
  useEffect(() => {
    if (userData.allowedSymbols && userData.allowedSymbols.length > 0) {
      setAllowedSymbols(userData.allowedSymbols)
      setSelectedSymbols(userData.allowedSymbols.map((s) => s.symbol))

      // Set global values from the first symbol (assuming they're all the same)
      if (userData.allowedSymbols[0]) {
        setGlobalLotSize(userData.allowedSymbols[0].minLotSize.toString())
        setGlobalMaxTrades(userData.allowedSymbols[0].maxTrades.toString())
      }
    }

    // Load trading settings if available
    if (userData.tradingSettings) {
      setTradingSettings({
        ...tradingSettings,
        ...userData.tradingSettings,
      })
    }

    // Load SL/TP values if available
    const loadUserSettings = async () => {
      if (userData.email) {
        try {
          const userDoc = doc(db, "users", userData.email)
          const userSnapshot = await getDoc(userDoc)

          if (userSnapshot.exists()) {
            const userData = userSnapshot.data()
            if (userData.stopLoss) {
              setTradingSettings((prev) => ({
                ...prev,
                stopLoss: userData.stopLoss,
              }))
            }
            if (userData.takeProfit) {
              setTradingSettings((prev) => ({
                ...prev,
                takeProfit: userData.takeProfit,
              }))
            }
          }
        } catch (error) {
          console.error("Error loading user settings:", error)
        }
      }
    }

    loadUserSettings()
  }, [userData.allowedSymbols, userData.tradingSettings, userData.email])

  // Format license expiry date
  const formatExpiryDate = () => {
    const licenseExpiry = userData.licenseExpiry

    if (!licenseExpiry) {
      // If we don't have an expiry date, check if we have a fallback
      if (userData.license_expiry) {
        return formatDate(userData.license_expiry)
      }
      return "Not specified"
    }

    const daysRemaining = getDaysRemaining(licenseExpiry)
    const formattedDate = formatDate(licenseExpiry)

    return `${formattedDate} (${daysRemaining} days remaining)`
  }

  // Update the isLicenseExpired function to handle missing data better
  const isLicenseExpired = () => {
    const licenseExpiry = userData.licenseExpiry || userData.license_expiry

    if (!licenseExpiry) return false

    return getDaysRemaining(licenseExpiry) < 0
  }

  // Update the getLicenseExpiryStatus function to handle missing data better
  const getLicenseExpiryStatus = () => {
    const licenseExpiry = userData.licenseExpiry || userData.license_expiry

    if (!licenseExpiry) {
      return { text: "UNKNOWN", color: "text-yellow-500", icon: <AlertTriangle size={16} className="mr-1" /> }
    }

    const daysRemaining = getDaysRemaining(licenseExpiry)

    if (daysRemaining < 0) {
      return { text: "EXPIRED", color: "text-red-500", icon: <AlertTriangle size={16} className="mr-1" /> }
    } else if (daysRemaining < 30) {
      return { text: "EXPIRING SOON", color: "text-yellow-500", icon: <AlertTriangle size={16} className="mr-1" /> }
    } else {
      return { text: "ACTIVE", color: "text-green-500", icon: <Calendar size={16} className="mr-1" /> }
    }
  }

  const toggleSymbolSelection = (symbol: string) => {
    if (selectedSymbols.includes(symbol)) {
      setSelectedSymbols(selectedSymbols.filter((s) => s !== symbol))
    } else {
      setSelectedSymbols([...selectedSymbols, symbol])
    }
  }

  const addCustomSymbol = () => {
    if (!customSymbol || selectedSymbols.includes(customSymbol)) return
    setSelectedSymbols([...selectedSymbols, customSymbol])
    setCustomSymbol("")
  }

  // Fix the applySymbolSettings function to ensure it properly updates the allowedSymbols state
  const applySymbolSettings = () => {
    // Create allowed symbols array from selected symbols
    const newAllowedSymbols: AllowedSymbol[] = selectedSymbols.map((symbol) => ({
      symbol,
      minLotSize: Number.parseFloat(globalLotSize) || 0.01,
      maxTrades: Number.parseInt(globalMaxTrades) || 5,
    }))

    setAllowedSymbols(newAllowedSymbols)
    setShowSymbolSelector(false)

    // Log for debugging
    console.log("Applied symbols:", newAllowedSymbols)
  }

  // Handle trading settings change
  const handleTradingSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target

    setTradingSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : Number(value),
    }))
  }

  // Toggle trailing stop
  const toggleTrailingStop = () => {
    setTradingSettings((prev) => ({
      ...prev,
      enableTrailingStop: !prev.enableTrailingStop,
    }))
  }

  // Enhance the saveSettings function to ensure it properly saves to Firestore and localStorage
  const saveSettings = async () => {
    if (!userData.uid && !userData.email) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      // Ensure we have symbols to save
      if (allowedSymbols.length === 0 && selectedSymbols.length > 0) {
        // If allowedSymbols is empty but we have selectedSymbols, create them now
        const newAllowedSymbols: AllowedSymbol[] = selectedSymbols.map((symbol) => ({
          symbol,
          minLotSize: Number.parseFloat(globalLotSize) || 0.01,
          maxTrades: Number.parseInt(globalMaxTrades) || 5,
        }))
        setAllowedSymbols(newAllowedSymbols)

        // Update allowed symbols in Firestore using email as ID
        const userId = userData.email || userData.uid
        await updateAllowedSymbols(userId, newAllowedSymbols)

        // Update the user data in localStorage with both symbols and trading settings
        const updatedUserData = {
          ...userData,
          allowedSymbols: newAllowedSymbols,
          tradingSettings: tradingSettings,
        }
        localStorage.setItem("firebase_user", JSON.stringify(updatedUserData))

        console.log("Saved symbols and trading settings:", newAllowedSymbols, tradingSettings)
      } else {
        // Update allowed symbols in Firestore using email as ID
        const userId = userData.email || userData.uid
        await updateAllowedSymbols(userId, allowedSymbols)

        // Update the user data in localStorage with both symbols and trading settings
        const updatedUserData = {
          ...userData,
          allowedSymbols,
          tradingSettings: tradingSettings,
        }
        localStorage.setItem("firebase_user", JSON.stringify(updatedUserData))

        console.log("Saved symbols and trading settings:", allowedSymbols, tradingSettings)
      }

      // Save SL/TP values to Firestore
      if (userData.email) {
        const userDoc = doc(db, "users", userData.email)
        await updateDoc(userDoc, {
          stopLoss: tradingSettings.stopLoss,
          takeProfit: tradingSettings.takeProfit,
          tradingSettings: tradingSettings,
        })
      }

      // Show success message
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      alert("Failed to save settings. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const licenseStatus = getLicenseExpiryStatus()

  // Filter symbols based on search term
  const filteredSymbols = COMMON_SYMBOLS.filter((symbol) => symbol.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="flex flex-col h-full pb-16 p-4 bg-black text-white">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-medium text-red-500">Trading Settings</h1>
      </div>

      <div className="bg-gray-900 rounded-lg border border-red-900 p-4 mb-4">
        <div className="flex items-center mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500 mr-2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2 className="font-medium text-red-400">User Status</h2>
        </div>

        <div className="flex items-center ml-8">
          <div
            className={`w-5 h-5 rounded-full ${
              userData.isActive !== false ? "bg-green-500" : "bg-red-500"
            } flex items-center justify-center mr-2`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {userData.isActive !== false ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <g>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </g>
              )}
            </svg>
          </div>
          <span className={userData.isActive !== false ? "text-green-500" : "text-red-500"}>
            {userData.isActive !== false ? "active" : "inactive"}
          </span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-red-900 p-4 mb-4">
        <div className="flex items-center mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-red-500 mr-2"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2 className="font-medium text-red-400">License Status</h2>
        </div>

        <div className="flex items-center ml-8 mb-2">
          <div
            className={`w-5 h-5 rounded-full ${isLicenseExpired() ? "bg-red-500" : "bg-green-500"} flex items-center justify-center mr-2`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isLicenseExpired() ? (
                <g>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </g>
              ) : (
                <polyline points="20 6 9 17 4 12" />
              )}
            </svg>
          </div>
          <span className={licenseStatus.color}>
            {licenseStatus.icon}
            {licenseStatus.text}
          </span>
        </div>

        <div className="flex items-center ml-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400 mr-2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <span className={`text-sm ${isLicenseExpired() ? "text-red-400" : "text-gray-400"}`}>
            Expires: {formatExpiryDate()}
          </span>
        </div>
      </div>

      {/* Trading Settings Section */}
      <div className="bg-gray-900 rounded-lg border border-red-900 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500 mr-2"
            >
              <path d="M12 20V10" />
              <path d="M18 20V4" />
              <path d="M6 20v-6" />
            </svg>
            <h2 className="font-medium text-red-400">Trading Settings</h2>
          </div>
        </div>

        <div className="space-y-4">
          {/* Stop Loss and Take Profit Settings */}
          <div className="bg-gray-800 p-3 rounded-md border border-red-900/30">
            <label className="block text-sm font-medium text-gray-300 mb-1">Stop Loss (pips)</label>
            <input
              type="number"
              name="stopLoss"
              value={tradingSettings.stopLoss}
              onChange={handleTradingSettingsChange}
              min="10"
              max="1000"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Default stop loss in pips for all trades</p>
          </div>

          <div className="bg-gray-800 p-3 rounded-md border border-red-900/30">
            <label className="block text-sm font-medium text-gray-300 mb-1">Take Profit (pips)</label>
            <input
              type="number"
              name="takeProfit"
              value={tradingSettings.takeProfit}
              onChange={handleTradingSettingsChange}
              min="10"
              max="2000"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Default take profit in pips for all trades</p>
          </div>

          {/* Trailing Stop Toggle */}
          <div className="flex items-center justify-between bg-gray-800 p-3 rounded-md border border-red-900/30">
            <div>
              <h3 className="text-sm font-medium text-gray-300">Trailing Stop</h3>
              <p className="text-xs text-gray-400 mt-1">Automatically adjust stop loss as price moves in your favor</p>
            </div>
            <button onClick={toggleTrailingStop} className="text-red-500 hover:text-red-400">
              {tradingSettings.enableTrailingStop ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
            </button>
          </div>

          {/* Trailing Stop Distance - only show if trailing stop is enabled */}
          {tradingSettings.enableTrailingStop && (
            <div className="bg-gray-800 p-3 rounded-md border border-red-900/30">
              <label className="block text-sm font-medium text-gray-300 mb-1">Trailing Stop Distance (pips)</label>
              <input
                type="number"
                name="trailingStopDistance"
                value={tradingSettings.trailingStopDistance}
                onChange={handleTradingSettingsChange}
                min="5"
                max="100"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Distance in pips to maintain between current price and trailing stop
              </p>
            </div>
          )}

          {/* Max Daily Loss */}
          <div className="bg-gray-800 p-3 rounded-md border border-red-900/30">
            <label className="block text-sm font-medium text-gray-300 mb-1">Max Daily Loss ($)</label>
            <input
              type="number"
              name="maxDailyLoss"
              value={tradingSettings.maxDailyLoss}
              onChange={handleTradingSettingsChange}
              min="0"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">
              Stop trading for the day after reaching this loss amount (0 = unlimited)
            </p>
          </div>

          {/* Max Daily Trades */}
          <div className="bg-gray-800 p-3 rounded-md border border-red-900/30">
            <label className="block text-sm font-medium text-gray-300 mb-1">Max Daily Trades</label>
            <input
              type="number"
              name="maxDailyTrades"
              value={tradingSettings.maxDailyTrades}
              onChange={handleTradingSettingsChange}
              min="1"
              max="50"
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
            />
            <p className="text-xs text-gray-400 mt-1">Maximum number of trades to execute per day</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg border border-red-900 p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500 mr-2"
            >
              <line x1="4" y1="9" x2="20" y2="9" />
              <line x1="4" y1="15" x2="20" y2="15" />
              <line x1="10" y1="3" x2="8" y2="21" />
              <line x1="16" y1="3" x2="14" y2="21" />
            </svg>
            <h2 className="font-medium text-red-400">Trading Symbols</h2>
          </div>
          <button
            onClick={() => setShowSymbolSelector(true)}
            className="bg-red-600 text-white text-sm px-2 py-1 rounded-md flex items-center"
          >
            <Plus size={16} className="mr-1" /> Configure
          </button>
        </div>

        {/* Global settings */}
        <div className="mb-4 bg-gray-800 p-3 rounded-md border border-red-900/30">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Global Trading Settings</h3>

          <div className="grid grid-cols-2 gap-4 mb-2">
            <div>
              <label className="block text-gray-400 text-sm mb-1">Lot Size</label>
              <input
                type="number"
                value={globalLotSize}
                onChange={(e) => setGlobalLotSize(e.target.value)}
                step="0.01"
                min="0.01"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">Max Trades</label>
              <input
                type="number"
                value={globalMaxTrades}
                onChange={(e) => setGlobalMaxTrades(e.target.value)}
                min="1"
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
              />
            </div>
          </div>
        </div>

        {/* Selected symbols display */}
        {selectedSymbols.length > 0 ? (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Selected Symbols ({selectedSymbols.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedSymbols.map((symbol) => (
                <div key={symbol} className="bg-red-600/20 text-red-400 rounded-full px-3 py-1 text-sm">
                  {symbol}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-900/30 text-yellow-500 p-3 rounded-md mb-4 text-sm">
            No trading symbols configured. Click "Configure" to add symbols.
          </div>
        )}

        {/* Symbol selector modal */}
        {showSymbolSelector && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-lg border border-red-900 p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-red-500">Configure Trading Symbols</h3>
                <button onClick={() => setShowSymbolSelector(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Global Lot Size</label>
                <input
                  type="number"
                  value={globalLotSize}
                  onChange={(e) => setGlobalLotSize(e.target.value)}
                  step="0.01"
                  min="0.01"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white mb-2"
                />

                <label className="block text-gray-400 text-sm mb-1">Global Max Trades</label>
                <input
                  type="number"
                  value={globalMaxTrades}
                  onChange={(e) => setGlobalMaxTrades(e.target.value)}
                  min="1"
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-400 text-sm mb-1">Search Symbols</label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                />
              </div>

              {/* Replace the Common Symbols section with a more prominent custom symbols section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Your Trading Symbols</h4>
                {selectedSymbols.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {selectedSymbols.map((symbol) => (
                      <div
                        key={symbol}
                        onClick={() => toggleSymbolSelection(symbol)}
                        className="flex items-center p-2 rounded-md cursor-pointer bg-red-600/20 border border-red-600/50"
                      >
                        <div className="w-4 h-4 rounded-sm mr-2 flex items-center justify-center bg-red-600">
                          <Check size={12} />
                        </div>
                        <span>{symbol}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-yellow-900/30 text-yellow-500 p-3 rounded-md text-sm">
                    No symbols added yet. Add your trading symbols above.
                  </div>
                )}
              </div>

              {/* In the SidebarSelector modal, update the custom symbol input to be more prominent */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-300 mb-2">Add Your Trading Symbols</h4>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    placeholder="Enter symbol (e.g. EURUSD, XAUUSDm)"
                    className="flex-1 bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                  />
                  <button
                    onClick={addCustomSymbol}
                    disabled={!customSymbol}
                    className="bg-red-600 text-white px-3 py-2 rounded-md disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Enter the exact symbol as shown in your broker platform. For symbols with stop loss issues, add 'z' at
                  the end.
                </p>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setShowSymbolSelector(false)}
                  className="bg-gray-700 text-white px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button onClick={applySymbolSettings} className="bg-red-600 text-white px-4 py-2 rounded-md">
                  Apply Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add a note about symbols with stop issues */}
      <div className="mt-4 bg-gray-800 p-3 rounded-md text-sm text-gray-300">
        <p className="font-medium mb-1">Important Notes:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>For symbols with stop loss issues, add 'z' at the end (e.g., XAUUSDz)</li>
          <li>Symbols with 'z' will trade without stop loss to avoid broker rejections</li>
          <li>Regular symbols will trade with proper stop loss and take profit</li>
        </ul>
      </div>

      <button
        className="bg-red-600 text-white py-3 rounded-md flex items-center justify-center mb-4 hover:bg-red-700"
        onClick={saveSettings}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2" size={18} />
            Save Settings
          </>
        )}
      </button>

      {saveSuccess && (
        <div className="bg-green-900/30 text-green-500 p-3 rounded-md mb-4 text-center">
          Settings saved successfully!
        </div>
      )}

      <button
        className="bg-gray-800 text-white py-3 rounded-md flex items-center justify-center mb-4 hover:bg-gray-700"
        onClick={onLogout}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>
    </div>
  )
}

