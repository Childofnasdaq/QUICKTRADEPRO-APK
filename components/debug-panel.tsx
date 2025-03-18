"use client"

import { useState } from "react"
import { logUserData, checkImageUrl, extractProfileImage } from "@/lib/debug-utils"

interface DebugPanelProps {
  userData: any
}

export function DebugPanel({ userData }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [imageStatus, setImageStatus] = useState<string | null>(null)

  const togglePanel = () => {
    setIsOpen(!isOpen)

    if (!isOpen) {
      // Log user data when opening the panel
      logUserData(userData, "Debug Panel")

      // Check image URL
      const imageUrl = extractProfileImage(userData)
      if (imageUrl) {
        checkImageUrl(imageUrl).then((isValid) => {
          setImageStatus(isValid ? "Valid image URL" : "Invalid image URL")
        })
      } else {
        setImageStatus("No image URL found")
      }
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={togglePanel}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full opacity-50 hover:opacity-100"
      >
        D
      </button>
    )
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-96 bg-gray-900 text-white p-4 rounded-t-lg border border-gray-700 z-50 max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Debug Panel</h3>
        <button onClick={togglePanel} className="text-gray-400 hover:text-white">
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-400">User Data</h4>
          <div className="mt-1 p-2 bg-gray-800 rounded text-xs">
            <pre>{JSON.stringify(userData, null, 2)}</pre>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400">Profile Image</h4>
          <div className="mt-1 flex items-center space-x-2">
            <div className="w-12 h-12 bg-gray-700 rounded-full overflow-hidden">
              {userData.photoURL || userData.avatar ? (
                <img
                  src={userData.photoURL || userData.avatar}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={() => setImageStatus("Error loading image")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No img</div>
              )}
            </div>
            <div>
              <p className="text-xs">{userData.photoURL || userData.avatar || "No image URL"}</p>
              {imageStatus && (
                <p
                  className={`text-xs ${imageStatus.includes("Error") || imageStatus.includes("Invalid") ? "text-red-400" : "text-green-400"}`}
                >
                  {imageStatus}
                </p>
              )}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-400">Robot Name</h4>
          <p className="mt-1 p-2 bg-gray-800 rounded text-sm">{userData.robotName || "Not set"}</p>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <button
            onClick={() => {
              localStorage.removeItem("firebase_user")
              window.location.href = "/portal-login"
            }}
            className="w-full bg-red-600 text-white py-1 px-2 rounded text-sm"
          >
            Clear Data & Logout
          </button>
        </div>
      </div>
    </div>
  )
}

