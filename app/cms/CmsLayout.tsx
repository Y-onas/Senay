import { NavLink, Outlet, useNavigate, useLocation } from 'react-router'
import {
  LayoutDashboard,
  ClipboardList,
  UtensilsCrossed,
  Send,
  Users,
  LogOut,
} from 'lucide-react'
import { CMS_BASE } from '@/config/cms'
import { clearCmsSession, getCmsAdmin } from '@/services/cmsApi'
import { cn } from '@/lib/utils'

const nav = [
  { to: '', end: true, label: 'Overview', icon: LayoutDashboard },
  { to: 'requests', label: 'Requests', icon: ClipboardList },
  { to: 'services', label: 'Services', icon: UtensilsCrossed, matchPrefix: true },
  { to: 'telegram', label: 'Telegram', icon: Send, matchPrefix: true },
  { to: 'team', label: 'Team', icon: Users },
] as const

function navIsActive(
  item: (typeof nav)[number],
  pathname: string,
  isActive: boolean,
) {
  if (isActive) return true
  if ('matchPrefix' in item && item.matchPrefix && item.to) {
    return pathname.startsWith(`${CMS_BASE}/${item.to}`)
  }
  return false
}

export default function CmsLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const admin = getCmsAdmin()

  const logout = () => {
    clearCmsSession()
    navigate(`${CMS_BASE}/login`)
  }

  return (
    <div className="flex min-h-screen bg-[#f6f1ea] text-gray-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-burgundy/10 bg-burgundy text-cream md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="font-display text-lg tracking-wide text-white">SENAY TELA</p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Control center
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to ? `${CMS_BASE}/${item.to}` : CMS_BASE}
              end={'end' in item ? item.end : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition',
                  navIsActive(item, location.pathname, isActive)
                    ? 'bg-white/15 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="text-sm font-medium text-white">{admin?.name}</p>
          <p className="text-xs text-white/50">{admin?.role}</p>
          <button
            type="button"
            onClick={logout}
            className="mt-3 flex items-center gap-2 text-xs text-white/60 hover:text-white"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-burgundy/10 bg-white px-4 py-3 md:px-8">
          <div className="flex gap-2 overflow-x-auto md:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to ? `${CMS_BASE}/${item.to}` : CMS_BASE}
                end={'end' in item ? item.end : undefined}
                className={({ isActive }) =>
                  cn(
                    'whitespace-nowrap rounded-full px-3 py-1.5 text-xs',
                    navIsActive(item, location.pathname, isActive)
                      ? 'bg-burgundy text-white'
                      : 'bg-burgundy/5',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
          <p className="hidden text-sm text-gray-500 md:block">
            Single source of truth for website + Telegram · secured by login &
            roles
          </p>
          <button
            type="button"
            onClick={logout}
            className="text-xs text-burgundy md:hidden"
          >
            Sign out
          </button>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
