"use client"

import type React from "react"

import { Inter } from "next/font/google"
import "./globals.css"
import "./no-zoom.css"
import { ThemeProvider } from "@/components/theme-provider"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    // More aggressive zoom prevention
    function preventZoom(e) {
      if (e.touches && e.touches.length > 1) {
        e.preventDefault()
      }
    }

    function preventDoubleTapZoom(e) {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    let lastTouchEnd = 0

    // Add all event listeners with capture and passive: false
    document.addEventListener("touchstart", preventZoom, { passive: false, capture: true })
    document.addEventListener("touchmove", preventZoom, { passive: false, capture: true })
    document.addEventListener("touchend", preventDoubleTapZoom, { passive: false, capture: true })
    document.addEventListener("gesturestart", (e) => e.preventDefault(), { passive: false, capture: true })
    document.addEventListener("gesturechange", (e) => e.preventDefault(), { passive: false, capture: true })
    document.addEventListener("gestureend", (e) => e.preventDefault(), { passive: false, capture: true })
    document.addEventListener("contextmenu", (e) => e.preventDefault(), { capture: true })

    // Disable text selection
    document.body.style.webkitUserSelect = "none"
    document.body.style.userSelect = "none"
    document.body.style.webkitTouchCallout = "none"

    return () => {
      // Clean up all event listeners
      document.removeEventListener("touchstart", preventZoom, { capture: true })
      document.removeEventListener("touchmove", preventZoom, { capture: true })
      document.removeEventListener("touchend", preventDoubleTapZoom, { capture: true })
      document.removeEventListener("gesturestart", (e) => e.preventDefault(), { capture: true })
      document.removeEventListener("gesturechange", (e) => e.preventDefault(), { capture: true })
      document.removeEventListener("gestureend", (e) => e.preventDefault(), { capture: true })
      document.removeEventListener("contextmenu", (e) => e.preventDefault(), { capture: true })
    }
  }, [])

  return (
    <html lang="en" className="no-context">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body className={inter.className} style={{ touchAction: "none" }}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <main className="min-h-screen bg-background no-context">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}

