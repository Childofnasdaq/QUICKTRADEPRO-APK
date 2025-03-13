"use client"

import { Home, Link2, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

type BottomNavigationProps = {
  activeScreen: string
  onScreenChange: (screen: string) => void
  onLogout: () => void
}

export function BottomNavigation({ activeScreen, onScreenChange, onLogout }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-red-900 p-2 flex justify-around">
      <Button
        variant="ghost"
        className={`flex flex-col items-center ${activeScreen === "home" ? "text-red-500" : "text-gray-400"}`}
        onClick={() => onScreenChange("home")}
      >
        <Home className="h-5 w-5" />
        <span className="text-xs mt-1">Home</span>
      </Button>

      <Button
        variant="ghost"
        className={`flex flex-col items-center ${activeScreen === "connect" ? "text-red-500" : "text-gray-400"}`}
        onClick={() => onScreenChange("connect")}
      >
        <Link2 className="h-5 w-5" />
        <span className="text-xs mt-1">Bot Logs</span>
      </Button>

      <Button
        variant="ghost"
        className={`flex flex-col items-center ${activeScreen === "settings" ? "text-red-500" : "text-gray-400"}`}
        onClick={() => onScreenChange("settings")}
      >
        <Settings className="h-5 w-5" />
        <span className="text-xs mt-1">Settings</span>
      </Button>

      <Button variant="ghost" className="flex flex-col items-center text-gray-400" onClick={onLogout}>
        <LogOut className="h-5 w-5" />
        <span className="text-xs mt-1">Logout</span>
      </Button>
    </div>
  )
}

