"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { authenticateUser } from "@/lib/auth"
import { toast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { v4 as uuidv4 } from "uuid"

export default function AuthPage() {
  const router = useRouter()
  const [mentorId, setMentorId] = useState("")
  const [email, setEmail] = useState("")
  const [licenseKey, setLicenseKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [deviceId, setDeviceId] = useState("")

  useEffect(() => {
    // Get or create device ID
    let storedDeviceId = localStorage.getItem("deviceId")
    if (!storedDeviceId) {
      storedDeviceId = uuidv4()
      localStorage.setItem("deviceId", storedDeviceId)
    }
    setDeviceId(storedDeviceId)
  }, [])

  const handleAuthenticate = async () => {
    if (!mentorId || !email || !licenseKey) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Attempt authentication
      const userData = await authenticateUser(mentorId, email, licenseKey, deviceId)

      // Store user data in localStorage
      localStorage.setItem("userData", JSON.stringify(userData))
      localStorage.setItem("isAuthenticated", "true")

      toast({
        title: "Authentication successful",
        description: "Welcome to QUICKTRADE PRO",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error("Auth error:", error)
      setError(error instanceof Error ? error.message : "Authentication failed. Please check your credentials.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-47xeYJouFgkAhOYeLZmL50aOqv5JfW.png"
              alt="QUICKTRADE PRO Logo"
              width={120}
              height={120}
              className="mb-4"
              priority
            />
            <h1 className="text-2xl font-bold">Bot Access</h1>
            <p className="text-center text-muted-foreground">Enter your credentials to access the bot details</p>

            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="w-full space-y-4">
              <Input placeholder="Mentor ID" value={mentorId} onChange={(e) => setMentorId(e.target.value)} />
              <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Input
                placeholder="License Key"
                type="password"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
              />
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleAuthenticate}
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Authenticate"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

