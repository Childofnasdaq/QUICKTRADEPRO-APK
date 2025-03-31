"use client"

import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import "./native-app.css"
import { ThemeProvider } from "@/components/theme-provider"
import { disableZoom } from "./disable-zoom"
import { useEffect } from "react"

const inter = Inter({ subsets: ["latin"] })

export default function ClientRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  useEffect(() => {
    disableZoom()
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
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark">
          <main className="min-h-screen bg-background no-context">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}

