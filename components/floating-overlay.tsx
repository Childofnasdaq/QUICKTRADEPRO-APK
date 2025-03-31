"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { X, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import type { UserData } from "@/lib/auth"

interface FloatingOverlayProps {
  isVisible: boolean
  onClose: () => void
}

export function FloatingOverlay({ isVisible, onClose }: FloatingOverlayProps) {
  const [expanded, setExpanded] = useState(false)
  const [showStatus, setShowStatus] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [connectionDetails, setConnectionDetails] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 100 })

  useEffect(() => {
    console.log("Floating overlay visibility:", isVisible)

    // Load user data
    const storedUserData = localStorage.getItem("userData")
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData))
    }

    // Load connection details
    const metatraderDetails = localStorage.getItem("metatraderDetails")
    if (metatraderDetails) {
      setConnectionDetails(JSON.parse(metatraderDetails))
    }
  }, [isVisible])

  const handleDragStart = () => setIsDragging(true)
  const handleDragEnd = () => {
    setTimeout(() => setIsDragging(false), 100)
  }

  const toggleExpanded = () => {
    if (!isDragging) {
      setExpanded(!expanded)
      setShowStatus(false)
    }
  }

  const toggleStatus = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowStatus(!showStatus)
  }

  if (!isVisible) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed z-50"
          initial={{ x: position.x, y: position.y }}
          animate={{ x: position.x, y: position.y }}
          drag
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDrag={(e, info) => {
            setPosition({
              x: position.x + info.delta.x,
              y: position.y + info.delta.y,
            })
          }}
        >
          {/* Collapsed state - just show logo */}
          {!expanded && (
            <motion.div
              className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center cursor-pointer"
              onClick={toggleExpanded}
              whileTap={{ scale: 0.95 }}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-GBCkirdfPdXpjKjo3p1MEP148IpaVv.png"
                alt="QuickTrade Pro"
                width={32}
                height={32}
                className="rounded-full"
              />
            </motion.div>
          )}

          {/* Expanded state */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-64 rounded-xl bg-black shadow-lg overflow-hidden"
            >
              {/* Header with close button */}
              <div className="relative p-3 flex justify-between items-center border-b border-gray-800">
                <div className="flex items-center space-x-2">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-GBCkirdfPdXpjKjo3p1MEP148IpaVv.png"
                    alt="QuickTrade Pro"
                    width={24}
                    height={24}
                  />
                  <span className="text-white text-sm font-bold">QuickTrade Pro</span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-gray-800 hover:bg-gray-700"
                    onClick={toggleStatus}
                  >
                    <Info className="h-3 w-3 text-white" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-gray-800 hover:bg-gray-700"
                    onClick={onClose}
                  >
                    <X className="h-3 w-3 text-white" />
                  </Button>
                </div>
              </div>

              {/* User info */}
              <div className="p-3 flex items-center space-x-3" onClick={toggleExpanded}>
                <div className="relative">
                  <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden">
                    {userData?.photoURL ? (
                      <Image
                        src={userData.photoURL || "/placeholder.svg"}
                        alt="User"
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-GBCkirdfPdXpjKjo3p1MEP148IpaVv.png"
                        alt="Default"
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-black"></div>
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{userData?.displayName || "User"}</div>
                  <div className="text-gray-400 text-xs">{userData?.robotName || "QUICKTRADE PRO"}</div>
                </div>
              </div>

              {/* Status section */}
              {showStatus && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gray-900 p-3 space-y-2"
                >
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Broker:</span>
                    <span className="text-white text-xs">{connectionDetails?.server || "Not connected"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Connection:</span>
                    <span className="text-xs flex items-center">
                      <span
                        className={`h-2 w-2 rounded-full mr-1 ${connectionDetails?.isConnected ? "bg-green-500" : "bg-red-500"}`}
                      ></span>
                      <span className="text-white">{connectionDetails?.isConnected ? "Active" : "Inactive"}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 text-xs">Robot Status:</span>
                    <span className="text-xs flex items-center">
                      <span
                        className={`h-2 w-2 rounded-full mr-1 ${localStorage.getItem("isTrading") === "true" ? "bg-green-500" : "bg-red-500"}`}
                      ></span>
                      <span className="text-white">
                        {localStorage.getItem("isTrading") === "true" ? "Running" : "Stopped"}
                      </span>
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Footer */}
              <div className="p-2 bg-gray-900 border-t border-gray-800">
                <div className="text-center text-gray-500 text-[10px]">Powered by QuickTrade Pro</div>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

