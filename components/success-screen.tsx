"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Edit } from "lucide-react"
import { BottomNavigation } from "./bottom-navigation"

interface SuccessScreenProps {
  details: {
    login: string
    server: string
    platform: string
  }
  onClose: () => void
  onChangeTab: (tab: string) => void
  activeTab: string
}

export function SuccessScreen({ details, onClose, onChangeTab, activeTab }: SuccessScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-green-100 text-green-800 p-2 rounded-md mb-4">
          <p className="font-medium">Success</p>
          <p className="text-sm">{details.platform} account connected successfully!</p>
        </div>

        <Card className="w-full">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full"></div>
            </div>

            <h2 className="text-xl font-bold mb-1">{details.platform} Account Connected!</h2>
            <p className="text-gray-500 mb-6">Welcome aboard, Respect client!</p>

            <div className="w-full bg-gray-50 p-3 rounded-md mb-4">
              <div className="flex items-center mb-2">
                <div className="w-5 h-5 text-blue-500 mr-2">👤</div>
                <p className="text-sm text-gray-500">Login:</p>
                <p className="text-sm ml-2">{details.login}</p>
              </div>
              <div className="flex items-center mb-2">
                <div className="w-5 h-5 text-blue-500 mr-2">🖥️</div>
                <p className="text-sm text-gray-500">Server:</p>
                <p className="text-sm ml-2">{details.server}</p>
              </div>
              <div className="flex items-center">
                <div className="w-5 h-5 text-blue-500 mr-2">📱</div>
                <p className="text-sm text-gray-500">Platform:</p>
                <p className="text-sm ml-2">{details.platform}</p>
              </div>
            </div>

            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={onClose}>
              <Edit className="mr-2 h-4 w-4" /> Update {details.platform} Details
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation activeTab={activeTab} onChangeTab={onChangeTab} />
    </div>
  )
}

