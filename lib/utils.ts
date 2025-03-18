import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const generateLicenseKey = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let key = ""
  for (let i = 0; i < 24; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch (error) {
    console.error("Error formatting date:", error)
    return "Invalid Date"
  }
}

export const getDaysRemaining = (dateString: string): number => {
  try {
    const expiryDate = new Date(dateString)
    const now = new Date()
    const diff = expiryDate.getTime() - now.getTime()
    return Math.ceil(diff / (1000 * 3600 * 24))
  } catch (error) {
    console.error("Error calculating days remaining:", error)
    return -1 // Indicate an error
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

