// This script prevents pinch-zoom and double-tap zoom gestures

export function disableZoom() {
  // Prevent pinch zoom
  document.addEventListener("gesturestart", (e) => {
    e.preventDefault()
  })

  document.addEventListener("gesturechange", (e) => {
    e.preventDefault()
  })

  document.addEventListener("gestureend", (e) => {
    e.preventDefault()
  })

  // Prevent double-tap zoom
  let lastTouchEnd = 0
  document.addEventListener(
    "touchend",
    (e) => {
      const now = Date.now()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    },
    false,
  )
}

