"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { authenticateUser, checkSession } from "@/lib/auth"
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
  const [checkingSession, setCheckingSession] = useState(true)
  const [isCheckingLicense, setIsCheckingLicense] = useState(false)

  useEffect(() => {
    // Get or create device ID
    let storedDeviceId = localStorage.getItem("deviceId")
    if (!storedDeviceId) {
      storedDeviceId = uuidv4()
      localStorage.setItem("deviceId", storedDeviceId)
    }
    setDeviceId(storedDeviceId)

    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      // First check localStorage
      const isAuthenticated = localStorage.getItem("isAuthenticated") === "true"

      if (isAuthenticated) {
        // Verify session is still valid with the server
        const sessionValid = await checkSession()

        if (sessionValid) {
          router.push("/dashboard")
          return
        } else {
          // Session is invalid, clear authentication state
          localStorage.removeItem("isAuthenticated")
          localStorage.removeItem("userData")
        }
      }

      setCheckingSession(false)
    }

    checkAuthStatus()
  }, [router])

  // Function to check if license key is already in use
  const checkLicenseKey = async (licenseKey: string) => {
    try {
      setIsCheckingLicense(true)

      const response = await fetch("/api/check-license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ licenseKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to check license key")
      }

      if (data.found) {
        // If license is already activated on another device, show error
        if (data.isActivated && data.deviceId && data.deviceId !== deviceId) {
          setError(
            "This license key is already in use on another device. Each license key can only be used on one device at a time.",
          )
          return false
        }

        // If license is deactivated, show error
        if (data.isDeactivated) {
          setError("This license key has been deactivated. Please contact support for a new license key.")
          return false
        }
      }

      return true
    } catch (error) {
      console.error("License check error:", error)
      return true // Continue with authentication if license check fails
    } finally {
      setIsCheckingLicense(false)
    }
  }

  const handleAuthenticate = async () => {
    if (!mentorId || !email || !licenseKey) {
      setError("Please fill in all fields")
      return
    }

    setIsLoading(true)
    setError("")

    // First check if license key is already in use
    const licenseValid = await checkLicenseKey(licenseKey)
    if (!licenseValid) {
      setIsLoading(false)
      return
    }

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

  if (checkingSession) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
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
                disabled={isLoading || isCheckingLicense}
              >
                {isLoading || isCheckingLicense ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    {isCheckingLicense ? "Checking License..." : "Authenticating..."}
                  </>
                ) : (
                  "Authenticate"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

