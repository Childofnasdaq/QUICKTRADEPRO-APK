import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Edit } from "lucide-react"

interface ConnectSuccessProps {
  login: string
  server: string
  platform: string
}

export default function ConnectSuccess({ login, server, platform }: ConnectSuccessProps) {
  return (
    <div className="p-4 pb-20">
      <Card className="mx-auto max-w-md">
        <CardHeader className="pb-2">
          <div className="bg-green-100 text-green-700 p-2 rounded-md mb-2">
            <p className="text-sm">Success</p>
            <p className="text-xs">MT5 account connected successfully!</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <div className="h-8 w-8 rounded-full bg-green-500"></div>
            </div>
            <h2 className="text-xl font-bold">MT5 Account Connected!</h2>
            <p className="text-muted-foreground">Welcome aboard, Respect client!</p>
          </div>

          <div className="bg-gray-100 dark:bg-slate-800 p-4 rounded-md space-y-2">
            <div className="flex items-center">
              <div className="w-8 flex justify-center">
                <span className="text-blue-500">👤</span>
              </div>
              <span className="text-sm">Login: {login}</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 flex justify-center">
                <span className="text-blue-500">🖥️</span>
              </div>
              <span className="text-sm">Server: {server}</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 flex justify-center">
                <span className="text-blue-500">📊</span>
              </div>
              <span className="text-sm">Platform: {platform}</span>
            </div>
          </div>

          <Button className="w-full bg-blue-500 hover:bg-blue-600">
            <Edit className="mr-2 h-4 w-4" /> Update MT5 Details
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

