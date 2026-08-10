import { Navigate, Route, Routes } from 'react-router'
import AdminLayout from '@/components/layout/AdminLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { MediaLibraryPage } from '@/features/media/MediaLibraryPage'
import { HomeSectionsPage } from '@/features/home/HomeSectionsPage'
import { AboutPage } from '@/features/pages/AboutPage'
import { PagesPage } from '@/features/pages/PagesPage'
import { PageDetailPage } from '@/features/pages/PageDetailPage'
import { ContactPage } from '@/features/contact/ContactPage'
import { GalleryPage } from '@/features/pages/GalleryPage'
import { BlogPage } from '@/features/blog/BlogPage'
import { TestimonialsPage } from '@/features/pages/TestimonialsPage'
import { FaqsPage } from '@/features/pages/FaqsPage'
import { NavigationPage } from '@/features/navigation/NavigationPage'
import { FooterPage } from '@/features/footer/FooterPage'
import { MenuItemsPage } from '@/features/menu/MenuItemsPage'
import { ServicesPage } from '@/features/services/ServicesPage'
import { ServiceDetailPage } from '@/features/services/ServiceDetailPage'
import { TelegramPage } from '@/features/telegram/TelegramPage'
import { TelegramUsersPage } from '@/features/telegram/TelegramUsersPage'
import { TelegramUserDetailPage } from '@/features/telegram/TelegramUserDetailPage'
import { AdminsPage } from '@/features/settings/AdminsPage'
import { RequestsPage } from '@/features/requests/RequestsPage'
import { RequestDetailPage } from '@/features/requests/RequestDetailPage'
import { AnnouncementsPage } from '@/features/announcements/AnnouncementsPage'
import { ContactMessagesPage } from '@/features/contact/ContactMessagesPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="media" element={<MediaLibraryPage />} />
          <Route path="pages" element={<PagesPage />} />
          <Route path="pages/:id" element={<PageDetailPage />} />
          <Route path="home-sections" element={<HomeSectionsPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="testimonials" element={<TestimonialsPage />} />
          <Route path="faqs" element={<FaqsPage />} />
          <Route path="navigation" element={<NavigationPage />} />
          <Route path="footer" element={<FooterPage />} />
          <Route path="menu-items" element={<MenuItemsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="services/:id" element={<ServiceDetailPage />} />
          <Route path="telegram" element={<TelegramPage />} />
          <Route path="telegram/users" element={<TelegramUsersPage />} />
          <Route path="telegram/users/:id" element={<TelegramUserDetailPage />} />
          <Route path="admins" element={<AdminsPage />} />
          <Route path="requests" element={<RequestsPage />} />
          <Route path="requests/:id" element={<RequestDetailPage />} />
          <Route path="announcements" element={<AnnouncementsPage />} />
          <Route path="contact-messages" element={<ContactMessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Route>
    </Routes>
  )
}
