// Types for portal authentication
export type PortalCredentials = {
  mentorId: string
  email: string
  licenseKey: string
}

export type AllowedSymbol = {
  symbol: string
  minLotSize: number
  maxTrades: number
}

export type PortalUser = {
  mentorId: string
  email: string
  username?: string
  avatar?: string // Profile picture from portal
  robotName: string // Robot name set by user on portal
  isActive: boolean
  licenseExpiry: string
  allowedSymbols: AllowedSymbol[]
}

