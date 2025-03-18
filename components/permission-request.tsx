"use client"

import { useState } from "react"
import { X, AlertCircle, CheckCircle2 } from "lucide-react"

interface PermissionRequestProps {
  onClose: () => void
  onAccept: () => void
}

export function PermissionRequest({ onClose, onAccept }: PermissionRequestProps) {
  const [accepted, setAccepted] = useState(false)

  const handleAccept = () => {
    setAccepted(true)
    onAccept()

    // Close after a short delay to show the success message
    setTimeout(() => {
      onClose()
    }, 1500)
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg border border-red-900 p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-500">Permission Required</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {!accepted ? (
          <>
            <div className="mb-6">
              <div className="flex items-start mb-4">
                <AlertCircle className="text-yellow-500 mr-2 mt-0.5 flex-shrink-0" size={20} />
                <p className="text-gray-300">
                  QuickTrade Pro needs permission to{" "}
                  <span className="text-yellow-500 font-medium">draw over other apps</span> to display the trading
                  controls when you're using other applications.
                </p>
              </div>

              <p className="text-gray-400 text-sm mb-4">
                This allows you to monitor and control your trades without having to switch back to the app.
              </p>

              <div className="bg-gray-800 p-3 rounded-md text-sm text-gray-300 mb-4">
                <p className="mb-2 font-medium">How to enable this permission:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Tap "Go to Settings" below</li>
                  <li>Find and select "QuickTrade Pro"</li>
                  <li>Enable "Display over other apps" or "Draw over other apps"</li>
                  <li>Return to the app when finished</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col space-y-3">
              <button onClick={handleAccept} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-md">
                Go to Settings
              </button>

              <button onClick={onClose} className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md">
                Later
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center py-6">
            <CheckCircle2 className="text-green-500 mb-4" size={48} />
            <p className="text-center text-gray-300">Thank you! Please enable the permission in your settings.</p>
          </div>
        )}
      </div>
    </div>
  )
}

