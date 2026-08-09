import { lazy, Suspense } from 'react'
import { Outlet, useLocation } from 'react-router'
import { useTelegramWebApp } from '@/lib/telegramWebApp'

const Navbar = lazy(() => import('./Navbar'))
const Footer = lazy(() => import('./Footer'))
const ScrollToTop = lazy(() => import('./ScrollToTop'))
const CartDrawer = lazy(() => import('@/components/shop/CartDrawer'))

/** App shell: persistent nav, footer, cart drawer and route outlet. */
export default function RootLayout() {
  const { search } = useLocation()
  const telegram = useTelegramWebApp(search)

  return (
    <div className={`flex min-h-screen flex-col ${telegram ? 'bg-[#f8f3eb]' : 'bg-cream'}`}>
      {!telegram && (
        <Suspense fallback={null}>
          <ScrollToTop />
          <Navbar />
        </Suspense>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      {!telegram && (
        <Suspense fallback={null}>
          <Footer />
          <CartDrawer />
        </Suspense>
      )}
    </div>
  )
}
