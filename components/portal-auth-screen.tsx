"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { validatePortalCredentials, type PortalCredentials, type PortalUser } from "@/lib/portal-auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"

interface PortalAuthScreenProps {
  onAuthSuccess: (user: PortalUser) => void
}

export function PortalAuthScreen({ onAuthSuccess }: PortalAuthScreenProps) {
  const [credentials, setCredentials] = useState<PortalCredentials>({
    mentorId: "",
    email: "",
    licenseKey: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

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
        // Store user data in localStorage for persistence
        localStorage.setItem("portal_user", JSON.stringify(result.user))

        // Call the onAuthSuccess callback with the user data
        onAuthSuccess(result.user)
      } else {
        setError(result.error || "Authentication failed. Please check your credentials.")
      }
    } catch (error) {
      console.error("Authentication error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="bg-black border border-red-500 glow-border">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-red-500 neon-text">QUICKTRADE PRO</CardTitle>
          <CardDescription className="text-center text-red-300">
            Enter your portal credentials to continue
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
              <Input
                id="mentorId"
                name="mentorId"
                placeholder="Mentor ID"
                value={credentials.mentorId}
                onChange={handleChange}
                className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                value={credentials.email}
                onChange={handleChange}
                className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Input
                id="licenseKey"
                name="licenseKey"
                placeholder="License Key"
                value={credentials.licenseKey}
                onChange={handleChange}
                className="bg-black/50 border-red-500/50 focus:border-red-500 text-white"
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full bg-red-500 hover:bg-red-600 text-white" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Authenticate"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 border-t border-red-900/30 pt-4">
          <div className="text-center text-red-400 text-sm">
            <p>Need help? Contact support at support@quicktradepro.com</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

