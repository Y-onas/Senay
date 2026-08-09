import { useEffect } from 'react'
import { useLocation } from 'react-router'

/** Resets scroll position to top whenever the route path changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}
