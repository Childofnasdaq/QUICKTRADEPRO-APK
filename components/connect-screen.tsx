"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getBotLogs, checkMetaApiConnection, type PortalUser } from "@/lib/portal-auth"
import { RefreshCw } from "lucide-react"

type ConnectScreenProps = {
  user: PortalUser
  credentials: any
}

export function ConnectScreen({ user, credentials }: ConnectScreenProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Check MetaAPI connection status periodically
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkMetaApiConnection()
      setIsConnected(connected)
    }

    checkConnection()
    const interval = setInterval(checkConnection, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Fetch logs on initial load
  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setIsLoading(true)
    try {
      const botLogs = await getBotLogs(credentials)
      setLogs(botLogs)
    } catch (err) {
      console.error("Error fetching logs:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <Card className="bg-black border border-red-500 glow-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-bold text-red-500 neon-text">Bot Logs</CardTitle>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className={`text-sm ${isConnected ? "text-green-400" : "text-red-400"}`}>
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80 overflow-y-auto bg-black/50 border border-red-500/30 rounded-md p-3">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="h-6 w-6 text-red-400 animate-spin" />
              </div>
            ) : logs.length > 0 ? (
              <div className="space-y-2">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm text-gray-300 border-b border-red-900/20 pb-1">
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-red-400">No logs available</div>
            )}
          </div>

          <Button className="w-full bg-red-500 hover:bg-red-600 text-white" onClick={fetchLogs} disabled={isLoading}>
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Logs
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

