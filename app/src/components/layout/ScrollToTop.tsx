import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Resets scroll position to top whenever the route path changes. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1)
      const scrollToHash = () => document.getElementById(id)?.scrollIntoView()
      scrollToHash()
      // Lazy routes may mount after this effect; retry on the next frame.
      requestAnimationFrame(scrollToHash)
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, hash])

  return null
}
