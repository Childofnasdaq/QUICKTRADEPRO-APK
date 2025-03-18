"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, DollarSign } from "lucide-react"

interface FloatingOverlayProps {
  robotName: string
  isConnected: boolean
  onStopTrading: () => void
  onShowLogs: () => void
  isVisible: boolean
  userImage?: string
}

export function FloatingOverlay({
  robotName,
  isConnected,
  onStopTrading,
  onShowLogs,
  isVisible,
  userImage,
}: FloatingOverlayProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [expanded, setExpanded] = useState(false)

  // Set initial position in the center of the screen
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPosition({
        x: (window.innerWidth - 300) / 2,
        y: (window.innerHeight - 200) / 2,
      })
    }
  }, [])

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Add and remove event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded)
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed z-50 shadow-lg rounded-lg overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: expanded ? "300px" : "60px",
        transition: "width 0.3s ease",
      }}
    >
      {expanded ? (
        <div className="bg-black/90 border border-red-500 rounded-lg overflow-hidden">
          <div
            className="bg-gradient-to-r from-red-900 to-black p-3 flex justify-between items-center cursor-move"
            onMouseDown={handleMouseDown}
          >
            <h2 className="text-xl font-bold text-white">{robotName}</h2>
            <button onClick={toggleExpanded} className="text-white hover:text-red-300">
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            {userImage && (
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full overflow-hidden border border-red-500">
                  <img src={userImage || "/placeholder.svg"} alt="User" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="flex items-center mb-4">
              <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"} mr-2`}></div>
              <p className="text-white text-sm">Server: {isConnected ? "Connected" : "Disconnected"}</p>
            </div>

            <div className="text-white text-sm mb-4">
              <p>
                Robot accuracy: <span className="text-green-500 font-bold">93%</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onStopTrading}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md text-sm"
              >
                Stop Trade
              </button>
              <button
                onClick={onShowLogs}
                className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md text-sm"
              >
                Show Logs
              </button>
            </div>

            <div className="mt-4 text-center text-xs text-gray-400">Powered by QUICKTRADE PRO</div>
          </div>
        </div>
      ) : (
        <div
          className="bg-red-600 rounded-full w-12 h-12 flex items-center justify-center cursor-pointer shadow-lg"
          onClick={toggleExpanded}
        >
          <DollarSign size={20} className="text-white" />
        </div>
      )}
    </div>
  )
}

