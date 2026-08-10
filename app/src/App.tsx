import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router'
import RootLayout from '@/components/layout/RootLayout'

const Home = lazy(() => import('@/pages/Home'))
const AgelgilPage = lazy(() => import('@/pages/AgelgilPage'))
const BaltinaPage = lazy(() => import('@/pages/BaltinaPage'))
const DrinksPage = lazy(() => import('@/pages/DrinksPage'))
const FestivalPage = lazy(() => import('@/pages/FestivalPage'))
const CateringPage = lazy(() => import('@/pages/CateringPage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const BlogDetailPage = lazy(() => import('@/pages/BlogDetailPage'))
const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const MenuPage = lazy(() => import('@/pages/MenuPage'))
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'))
const ConfirmationPage = lazy(() => import('@/pages/ConfirmationPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f8f3eb]" />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<Home />} />
          <Route path="agelgil" element={<AgelgilPage />} />
          <Route path="baltina" element={<BaltinaPage />} />
          <Route path="festival-package" element={<FestivalPage />} />
          <Route path="traditional-drinks" element={<DrinksPage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="shop" element={<DrinksPage />} />
          <Route path="catering" element={<CateringPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<BlogDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="confirmation" element={<ConfirmationPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
