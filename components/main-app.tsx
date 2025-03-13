"use client"

import { useState } from "react"
import { HomeScreen } from "@/components/home-screen"
import { ConnectScreen } from "@/components/connect-screen"
import { SettingsScreen } from "@/components/settings-screen"
import { BottomNavigation } from "@/components/bottom-navigation"
import type { PortalUser } from "@/lib/portal-auth"

interface MainAppProps {
  userData: PortalUser
  onLogout: () => void
}

export function MainApp({ userData, onLogout }: MainAppProps) {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black">
      {activeTab === "home" && <HomeScreen userData={userData} />}
      {activeTab === "connect" && <ConnectScreen />}
      {activeTab === "settings" && <SettingsScreen userData={userData} onLogout={onLogout} />}

      <BottomNavigation activeTab={activeTab} onChange={setActiveTab} />
    </div>
  )
}

