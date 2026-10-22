import { Navigate } from 'react-router'
import { CMS_BASE } from '@/config/cms'
import { getCmsToken } from '@/services/cmsApi'
import CmsLayout from './CmsLayout'

export default function CmsProtectedLayout() {
  if (!getCmsToken()) return <Navigate to={`${CMS_BASE}/login`} replace />
  return <CmsLayout />
}
