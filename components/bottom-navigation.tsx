"use client"

import { Home, Link2, Settings } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onChange: (tab: string) => void
}

export function BottomNavigation({ activeTab, onChange }: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-black border-t border-red-900 flex items-center justify-around max-w-md mx-auto">
      <button
        className={`flex flex-col items-center justify-center w-1/3 h-full ${
          activeTab === "home" ? "text-red-500" : "text-gray-500"
        }`}
        onClick={() => onChange("home")}
      >
        <Home size={20} />
        <span className="text-xs mt-1">Home</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center w-1/3 h-full ${
          activeTab === "connect" ? "text-red-500" : "text-gray-500"
        }`}
        onClick={() => onChange("connect")}
      >
        <Link2 size={20} />
        <span className="text-xs mt-1">Connect</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center w-1/3 h-full ${
          activeTab === "settings" ? "text-red-500" : "text-gray-500"
        }`}
        onClick={() => onChange("settings")}
      >
        <Settings size={20} />
        <span className="text-xs mt-1">Settings</span>
      </button>
    </div>
  )
}

