"use client"

import { useState, useEffect, useRef } from "react"
import { HomeScreen } from "@/components/home-screen"
import { ConnectScreen } from "@/components/connect-screen"
import { SettingsScreen } from "@/components/settings-screen"
import { BottomNavigation } from "@/components/bottom-navigation"
import { FloatingOverlay } from "@/components/floating-overlay"
import type { FirebaseUser } from "@/lib/firebase-auth"
import { getAccountInfo } from "@/lib/meta-api"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface MainAppProps {
  userData: FirebaseUser
  onLogout: () => void
  permissionGranted?: boolean
}

export function MainApp({ userData, onLogout, permissionGranted = false }: MainAppProps) {
  const [activeTab, setActiveTab] = useState("home")
  const [activeConnection, setActiveConnection] = useState<any>(null)
  const [isLoadingConnection, setIsLoadingConnection] = useState(true)
  const [isTrading, setIsTrading] = useState(false)
  const [showOverlay, setShowOverlay] = useState(false)
  const [botLogs, setBotLogs] = useState<string[]>([])
  const [showBotLogs, setShowBotLogs] = useState(false)

  // Use refs to maintain state across tab changes
  const isTradingRef = useRef(false)
  const tradingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load the active connection when component mounts
  useEffect(() => {
    const loadActiveConnection = async () => {
      if (!userData?.email) {
        setIsLoadingConnection(false)
        return
      }

      try {
        // Get user document to find last active connection
        const userRef = doc(db, "users", userData.email)
        const userDoc = await getDoc(userRef)

        if (userDoc.exists() && userDoc.data().lastActiveConnection) {
          const connectionId = userDoc.data().lastActiveConnection

          // Get connection details
          const connectionRef = doc(db, "trading_connections", connectionId)
          const connectionDoc = await getDoc(connectionRef)

          if (connectionDoc.exists()) {
            const connectionData = connectionDoc.data()

            // Check if it's a simulation/fallback account
            if (connectionId.startsWith("fallback-") || connectionId.startsWith("sim-")) {
              // For simulation accounts, use mock data
              setActiveConnection({
                ...connectionData,
                accountInfo: {
                  balance: 10000,
                  equity: 10000,
                  margin: 0,
                  freeMargin: 10000,
                  leverage: 100,
                  currency: "USD",
                },
              })
            } else {
              try {
                // Get account info from MT Connect API
                const accountInfo = await getAccountInfo(connectionId)

                setActiveConnection({
                  ...connectionData,
                  accountInfo,
                })
              } catch (apiError) {
                console.error("Error fetching account info:", apiError)
                // Use fallback data if API call fails
                setActiveConnection({
                  ...connectionData,
                  accountInfo: {
                    balance: 10000,
                    equity: 10000,
                    margin: 0,
                    freeMargin: 10000,
                    leverage: 100,
                    currency: "USD",
                  },
                })
              }
            }

            // Check if trading was active - but don't auto-start
            if (connectionData.tradingActive) {
              // Just update the UI to show it was active, but don't start trading
              const currentTime = new Date().toLocaleTimeString()
              setBotLogs([`[${currentTime}] Trading was previously active. Press Start Trading to resume.`, ...botLogs])
            }
          }
        }
      } catch (error) {
        console.error("Error loading active connection:", error)
      } finally {
        setIsLoadingConnection(false)
      }
    }

    loadActiveConnection()
  }, [userData])

  // Handle starting/stopping trading
  const handleToggleTrading = (newTradingState: boolean, logs: string[]) => {
    setIsTrading(newTradingState)
    isTradingRef.current = newTradingState
    setShowOverlay(newTradingState && permissionGranted)
    setBotLogs(logs)
  }

  // Handle showing logs
  const handleShowLogs = () => {
    setShowBotLogs(true)
    // If we're not on the home screen, switch to it
    if (activeTab !== "home") {
      setActiveTab("home")
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black">
      {activeTab === "home" && (
        <HomeScreen
          userData={userData}
          onLogout={onLogout}
          isTrading={isTrading}
          onTradingChange={handleToggleTrading}
          showBotLogs={showBotLogs}
          onShowBotLogsChange={setShowBotLogs}
          botLogs={botLogs}
          onBotLogsChange={setBotLogs}
        />
      )}
      {activeTab === "connect" && <ConnectScreen userData={userData} />}
      {activeTab === "settings" && <SettingsScreen userData={userData} onLogout={onLogout} />}

      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />

      {/* Floating overlay that persists across all tabs - only show if permission granted */}
      {permissionGranted && (
        <FloatingOverlay
          robotName={userData.robotName || "QuickTrade Pro"}
          isConnected={!!activeConnection?.connected}
          onStopTrading={() => {
            setIsTrading(false)
            isTradingRef.current = false
            setShowOverlay(false)
            // If we're not on the home screen, switch to it to handle the stop action
            if (activeTab !== "home") {
              setActiveTab("home")
            }
          }}
          onShowLogs={handleShowLogs}
          isVisible={showOverlay}
          userImage={userData.photoURL || userData.avatar}
        />
      )}
    </div>
  )
}

