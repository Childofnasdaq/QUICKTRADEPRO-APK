"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Home, LinkIcon, Settings } from "lucide-react"
import Link from "next/link"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated via localStorage
    const authStatus = localStorage.getItem("isAuthenticated")
    if (authStatus !== "true") {
      router.push("/auth")
    } else {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">{children}</div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="flex h-16 items-center justify-around">
          <Link
            href="/dashboard"
            className={`flex flex-col items-center ${pathname === "/dashboard" ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <Home size={24} />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            href="/dashboard/connect"
            className={`flex flex-col items-center ${pathname.includes("/connect") ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <LinkIcon size={24} />
            <span className="text-xs">Connect</span>
          </Link>
          <Link
            href="/dashboard/settings"
            className={`flex flex-col items-center ${pathname.includes("/settings") ? "text-blue-500" : "text-muted-foreground"}`}
          >
            <Settings size={24} />
            <span className="text-xs">Settings</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

