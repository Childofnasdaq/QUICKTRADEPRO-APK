"use client"

import { useState } from "react"
import { HomeScreen } from "@/components/home-screen"
import { ConnectScreen } from "@/components/connect-screen"
import { SettingsScreen } from "@/components/settings-screen"
import { BottomNavigation } from "@/components/bottom-navigation"

export function MainApp({ userData, onLogout }) {
  const [activeScreen, setActiveScreen] = useState("home")

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-black">
      {activeScreen === "home" && <HomeScreen userData={userData} />}
      {activeScreen === "connect" && <ConnectScreen user={userData} />}
      {activeScreen === "settings" && <SettingsScreen user={userData} credentials={{}} onLogout={onLogout} />}

      <BottomNavigation activeScreen={activeScreen} onScreenChange={setActiveScreen} onLogout={onLogout} />
    </div>
  )
}

