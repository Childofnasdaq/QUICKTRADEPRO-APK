import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QuickTradePro",
    short_name: "QuickTradePro",
    description: "Professional trading platform for MetaTrader",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#ff0000",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}

