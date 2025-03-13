import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QUICKTRADE PRO",
    short_name: "QUICKTRADE",
    description: "Professional Trading Platform",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e11d48", // Changed to red
    icons: [
      {
        src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-oQcq5flx43wbyIHPKlWIJhUxR79naI.png", // Using the bull icon
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/304fc277-f835-46c7-ba23-d07c855074f2_20250303_233002_0000-oQcq5flx43wbyIHPKlWIJhUxR79naI.png", // Using the bull icon
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}

