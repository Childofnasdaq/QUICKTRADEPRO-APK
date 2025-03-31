import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "./native-app.css"
import AppLayout from "./app-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "QUICKTRADE PRO",
  description: "Trading automation platform",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <AppLayout>{children}</AppLayout>
}

import "./globals.css"



import './globals.css'