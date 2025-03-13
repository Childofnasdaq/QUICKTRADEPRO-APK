"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/router"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { validatePortalCredentials, type PortalCredentials, type PortalUser } from "@/lib/portal-auth"
import Image from "next/image"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type AuthScreenProps = {
  onAuthenticated: (user: PortalUser) => void
}

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [credentials, setCredentials] = useState<PortalCredentials>({
    mentorId: "",
    email: "",
    licenseKey: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await validatePortalCredentials(credentials)

      if (result.success && result.user) {
        // Store credentials in localStorage for persistence
        localStorage.setItem("portalCredentials", JSON.stringify(credentials))

        // Call the onAuthenticated callback with the user data
        onAuthenticated(result.user)

        // Navigate to the Home screen
        router.push("/home")
      } else {
        setError(result.error || "Authentication failed. Please check your credentials.")
      }
    } catch (err) {
      console.error("Authentication error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-black p-4">
      <Card className="w-full max-w-md bg-black border border-red-500 glow-border">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-XjQ9UtyKq1KXvIjUOL0ffYCtH5gm1g.png"
              alt="QuickTradePro Logo"
              width={80}
              height={80}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-red-500 neon-text">QUICKTRADE PRO</CardTitle>
          <CardDescription className="text-red-300">
            Enter your credentials to access the trading platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-900/30 border-red-500 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="mentorId" className="text-sm font-medium text-red-300">
                Mentor ID
              </label>
              <Input
                id="mentorId"
                name="mentorId"
                placeholder="Enter your Mentor ID"
                value={credentials.mentorId}
                onChange={handleChange}
                required
                className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-red-300">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={credentials.email}
                onChange={handleChange}
                required
                className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="licenseKey" className="text-sm font-medium text-red-300">
                License Key
              </label>
              <Input
                id="licenseKey"
                name="licenseKey"
                placeholder="Enter your license key"
                value={credentials.licenseKey}
                onChange={handleChange}
                required
                className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
              />
            </div>

            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Login"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-red-400">Need help? Contact support at support@quicktradepro.com</p>
        </CardFooter>
      </Card>
    </div>
  )
}
