import { Route, Routes } from 'react-router'
import CmsLoginPage from './CmsLoginPage'
import CmsProtectedLayout from './CmsGuard'
import CmsOverviewPage from './CmsOverviewPage'
import CmsRequestsPage from './CmsRequestsPage'
import CmsRequestDetailPage from './CmsRequestDetailPage'
import CmsServicesPage from './CmsServicesPage'
import CmsServiceDetailPage from './CmsServiceDetailPage'
import CmsTeamPage from './CmsTeamPage'
import CmsTelegramPage from './CmsTelegramPage'
import CmsTelegramUsersPage from './CmsTelegramUsersPage'
import CmsTelegramUserDetailPage from './CmsTelegramUserDetailPage'

/** Operations dashboard — auth-gated; data drives website + Telegram. */
export default function CmsApp() {
  return (
    <Routes>
      <Route path="login" element={<CmsLoginPage />} />
      <Route element={<CmsProtectedLayout />}>
        <Route index element={<CmsOverviewPage />} />
        <Route path="requests" element={<CmsRequestsPage />} />
        <Route path="requests/:id" element={<CmsRequestDetailPage />} />
        <Route path="services" element={<CmsServicesPage />} />
        <Route path="services/:id" element={<CmsServiceDetailPage />} />
        <Route path="telegram" element={<CmsTelegramPage />} />
        <Route path="telegram/users" element={<CmsTelegramUsersPage />} />
        <Route path="telegram/users/:id" element={<CmsTelegramUserDetailPage />} />
        <Route path="team" element={<CmsTeamPage />} />
      </Route>
    </Routes>
  )
}
