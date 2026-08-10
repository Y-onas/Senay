import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import {
  LayoutDashboard,
  Image,
  Home,
  FileText,
  Phone,
  Images,
  Newspaper,
  MessageSquareQuote,
  CircleHelp,
  Compass,
  PanelBottom,
  UtensilsCrossed,
  Package,
  Send,
  Users,
  Shield,
  ClipboardList,
  Megaphone,
  Mail,
  Settings,
  Menu,
  Search,
  LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

type NavGroup = {
  title: string
  permissions?: string[]
  items: NavItem[]
}

const navigation: NavGroup[] = [
  {
    title: 'Content',
    permissions: ['overview.read', 'content.read', 'content.manage'],
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/media', label: 'Media Library', icon: Image },
      { to: '/home-sections', label: 'Home', icon: Home },
      { to: '/about', label: 'About Us', icon: FileText },
      { to: '/contact', label: 'Contact Us', icon: Phone },
      { to: '/gallery', label: 'Gallery', icon: Images },
      { to: '/blog', label: 'Blog', icon: Newspaper },
      { to: '/testimonials', label: 'Testimonials', icon: MessageSquareQuote },
      { to: '/faqs', label: 'FAQ', icon: CircleHelp },
    ],
  },
  {
    title: 'Site',
    permissions: ['content.read', 'content.manage'],
    items: [
      { to: '/navigation', label: 'Navigation', icon: Compass },
      { to: '/footer', label: 'Footer', icon: PanelBottom },
      { to: '/menu-items', label: 'Menu Items', icon: UtensilsCrossed },
    ],
  },
  {
    title: 'Catalog',
    permissions: ['services.read', 'services.manage', 'packages.read', 'packages.manage'],
    items: [{ to: '/services', label: 'Services', icon: Package }],
  },
  {
    title: 'Telegram',
    permissions: ['telegram.manage'],
    items: [
      { to: '/telegram', label: 'Bot', icon: Send },
      { to: '/telegram/users', label: 'Users', icon: Users },
    ],
  },
  {
    title: 'System',
    permissions: ['admins.read', 'admins.manage', 'requests.read', 'settings.manage', 'notifications.read'],
    items: [
      { to: '/admins', label: 'Admins', icon: Shield },
      { to: '/requests', label: 'Requests', icon: ClipboardList },
      { to: '/announcements', label: 'Announcements', icon: Megaphone },
      { to: '/contact-messages', label: 'Contact Messages', icon: Mail },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
]

const flatNavItems = navigation.flatMap((group) => group.items)

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { hasPermission } = useAuth()

  const visibleGroups = useMemo(
    () =>
      navigation
        .map((group) => ({
          ...group,
          items: group.items.filter(
            () => !group.permissions || hasPermission(...group.permissions),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [hasPermission],
  )

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-burgundy-dark via-burgundy to-burgundy text-cream">
      <div className="px-3 pb-3 pt-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold-light to-yellow-dark font-display text-sm font-bold text-burgundy">
            S
            <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/25" />
          </div>
          <div className="leading-tight">
            <h1 className="font-display text-sm font-bold tracking-wide">Senay Tela</h1>
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-cream/45">Admin</p>
          </div>
        </div>
      </div>

      <div className="mx-3 mb-1.5 h-px bg-gradient-to-r from-transparent via-cream/15 to-transparent" />

      <nav className="sidebar-scroll flex-1 overflow-y-auto px-2 pb-3">
        {visibleGroups.map((group) => (
          <div key={group.title} className="mb-3">
            <p className="mb-1 px-2.5 text-[9px] font-bold uppercase tracking-[0.16em] text-cream/35">
              {group.title}
            </p>
            <ul className="space-y-px">
              {group.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end ?? item.to === '/'}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px] transition-colors duration-150',
                        isActive
                          ? 'bg-yellow-brand/95 font-semibold text-burgundy'
                          : 'font-medium text-cream/70 hover:bg-cream/[0.07] hover:text-cream',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            isActive ? 'text-burgundy' : 'text-cream/55 group-hover:text-cream/80',
                          )}
                        />
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  )
}

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const currentPage =
    [...flatNavItems]
      .filter((item) => (item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)))
      .sort((a, b) => b.to.length - a.to.length)[0]?.label ?? 'Dashboard'

  return (
    <div className="flex min-h-screen bg-cream text-brown">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-52 shadow-[8px_0_30px_-18px_rgba(44,26,20,0.5)] lg:block">
        <SidebarNav />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:ml-52">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-cream/70 px-4 py-2.5 backdrop-blur-xl sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-52 border-0 p-0 [&>button]:hidden">
                  <SidebarNav onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>

              <div className="min-w-0 lg:hidden">
                <p className="truncate font-display text-base font-bold text-burgundy">{currentPage}</p>
              </div>

              <div className="relative hidden sm:block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brown-muted/70" />
                <input
                  type="search"
                  placeholder="Search..."
                  className="w-56 rounded-full border border-border/70 bg-white/80 py-1.5 pl-8 pr-3 text-sm shadow-sm outline-none transition-all placeholder:text-brown-muted/60 focus:border-yellow-brand/60 focus:bg-white focus:ring-2 focus:ring-yellow-brand/25"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-brown">{admin?.name}</p>
                <p className="text-[11px] capitalize text-brown-muted">{admin?.role?.toLowerCase()}</p>
              </div>
              <Avatar className="h-8 w-8 border border-yellow-brand/30 bg-burgundy text-cream shadow-sm ring-2 ring-yellow-brand/10">
                <AvatarFallback className="bg-transparent text-sm font-semibold text-cream">
                  {admin?.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                title="Sign out"
                className="h-8 w-8 text-brown-muted hover:bg-crimson/10 hover:text-crimson"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="admin-page-shell">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
