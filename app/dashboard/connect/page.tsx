"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { User, Lock, Server, LinkIcon } from "lucide-react"
import ConnectSuccess from "@/components/connect-success"

export default function ConnectPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [platform, setPlatform] = useState<"MT5" | "MT4">("MT5")
  const [login, setLogin] = useState("208129800")
  const [password, setPassword] = useState("•••••••")
  const [server, setServer] = useState("Exness-MT5Trial9")

  const handleConnect = () => {
    // Simulate connection
    setTimeout(() => {
      setIsConnected(true)
    }, 1000)
  }

  if (isConnected) {
    return <ConnectSuccess login={login} server={server} platform={platform} />
  }

  return (
    <div className="p-4 pb-20">
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Connect MT5 Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">Select Platform:</p>
            <div className="flex mt-2 space-x-2">
              <Button
                className={`flex-1 ${platform === "MT5" ? "bg-blue-500" : "bg-transparent border border-gray-300"}`}
                onClick={() => setPlatform("MT5")}
              >
                MT5
              </Button>
              <Button
                className={`flex-1 ${platform === "MT4" ? "bg-blue-500" : "bg-transparent border border-gray-300"}`}
                onClick={() => setPlatform("MT4")}
              >
                MT4
              </Button>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md flex items-center">
            <User className="text-gray-500 mr-2" size={18} />
            <Input
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md flex items-center">
            <Lock className="text-gray-500 mr-2" size={18} />
            <Input
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-3 rounded-md flex items-center">
            <Server className="text-gray-500 mr-2" size={18} />
            <Input
              className="border-0 bg-transparent focus-visible:ring-0 p-0"
              value={server}
              onChange={(e) => setServer(e.target.value)}
            />
          </div>

          <Button className="w-full bg-blue-500 hover:bg-blue-600" onClick={handleConnect}>
            <LinkIcon className="mr-2 h-4 w-4" /> Connect
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

