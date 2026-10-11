import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  FileCog,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Search,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getAuthorityUser, logoutAuthority } from '../../services/authService'
import LanguageToggle from '../LanguageToggle'
import { useLanguage } from '../../context/LanguageContext'

const roles = {
  en: { super_admin: 'Super Administrator', service_provider: 'Department Officer' },
  sw: { super_admin: 'Msimamizi Mkuu', service_provider: 'Afisa wa Idara' },
}

const labels = {
  en: {
    overview: 'Overview', department: 'Department Workspace', incidents: 'Incidents', map: 'Incident Map',
    departments: 'Departments', reportTypes: 'Report Types', analytics: 'Analytics', search: 'Search incidents', alerts: 'Critical incidents',
    signOut: 'Sign out', subtitle: 'Infrastructure Response', user: 'Authorized User', portal: 'Portal User',
  },
  sw: {
    overview: 'Muhtasari', department: 'Eneo la Idara', incidents: 'Matukio', map: 'Ramani ya Matukio',
    departments: 'Idara', reportTypes: 'Aina za Taarifa', analytics: 'Takwimu', search: 'Tafuta matukio', alerts: 'Matukio hatarishi',
    signOut: 'Toka', subtitle: 'Mwitikio wa Miundombinu', user: 'Mtumiaji Aliyeruhusiwa', portal: 'Mtumiaji wa Portal',
  },
}

function TopNavigation({ activePage = 'overview', criticalCount = 0 }) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = getAuthorityUser()
  const ref = useRef(null)
  const { language } = useLanguage()
  const t = labels[language]

  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isProvider = user?.role === 'service_provider'
  const isSuperAdmin = user?.role === 'super_admin'

  const navigation = useMemo(() => {
    const items = [
      {
        label: isProvider ? t.department : t.overview,
        icon: LayoutDashboard,
        path: '/dashboard',
        active: location.pathname === '/dashboard' || activePage === 'overview',
      },
      {
        label: t.incidents,
        icon: FileText,
        path: '/incidents',
        active: location.pathname.startsWith('/incidents') || activePage === 'incidents',
      },
      {
        label: t.map,
        icon: Map,
        path: '/operations/live-map',
        active: location.pathname.startsWith('/operations/live-map'),
      },
      {
        label: t.analytics,
        icon: BarChart3,
        path: '/analytics',
        active: location.pathname.startsWith('/analytics') || activePage === 'analytics',
      },
    ]

    if (isSuperAdmin) {
      items.push(
        {
          label: t.departments,
          icon: Building2,
          path: '/administration/service-providers',
          active: location.pathname.startsWith('/administration/service-providers'),
        },
        {
          label: t.reportTypes,
          icon: FileCog,
          path: '/administration/report-types',
          active: location.pathname.startsWith('/administration/report-types'),
        },
      )
    }
    return items
  }, [activePage, isProvider, isSuperAdmin, location.pathname, t])

  useEffect(() => {
    function outside(event) {
      if (ref.current && !ref.current.contains(event.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [])

  function go(path) {
    setMobileOpen(false)
    setProfileOpen(false)
    navigate(path)
  }

  function logout() {
    logoutAuthority()
    navigate('/login', { replace: true })
  }

  function initials(name) {
    if (!name) return 'MF'
    return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  }

  return (
    <header ref={ref} className="sticky top-0 z-50 border-b border-[#dde3df] bg-white/96 backdrop-blur-xl">
      <div className="mx-auto flex h-[70px] max-w-[1600px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={() => go('/dashboard')} className="flex min-w-0 shrink-0 items-center gap-3 text-left">
          <img src="/mtaafix-mark.svg" alt="MtaaFix" className="h-10 w-10 rounded-[12px]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-semibold tracking-[-.025em] text-[#26372f]">MtaaFix</span>
              <span className="hidden rounded-full bg-[#eef6f2] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[.11em] text-[#167663] sm:inline">OPS</span>
            </div>
            <span className="hidden text-[11px] font-normal text-[#7e8b84] md:block">{t.subtitle}</span>
          </div>
        </button>

        <div className="hidden h-7 w-px bg-[#e3e8e5] lg:block" />

        <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <button
                type="button"
                key={item.label}
                onClick={() => go(item.path)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium transition ${item.active ? 'bg-[#eef6f2] text-[#167663]' : 'text-[#607068] hover:bg-[#f6f8f6] hover:text-[#26372f]'}`}
              >
                <Icon size={14} strokeWidth={2} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" onClick={() => go('/incidents')} className="hidden h-9 items-center gap-2 rounded-full border border-[#dce2de] bg-white px-3 text-[12px] font-normal text-[#687870] transition hover:border-[#b9c9c0] hover:text-[#26372f] xl:flex">
            <Search size={14} /> {t.search}
          </button>
          <LanguageToggle compact />
          <button type="button" title={t.alerts} onClick={() => go('/incidents?priority=critical')} className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#dce2de] bg-white text-[#5d6d65]">
            <Bell size={15} />
            {criticalCount > 0 && <span className="absolute -right-1 -top-1 flex min-h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#bd5246] px-1 text-[9px] font-semibold text-white">{criticalCount}</span>}
          </button>

          <div className="relative hidden sm:block">
            <button type="button" onClick={() => setProfileOpen((value) => !value)} className="flex items-center gap-2 rounded-full border border-transparent px-1.5 py-1 transition hover:border-[#e1e6e3] hover:bg-[#f8f9f8]">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#1d8a6c] to-[#126f69] text-[11px] font-semibold text-white">{initials(user?.fullName)}</div>
              <div className="hidden max-w-[160px] text-left xl:block">
                <p className="m-0 truncate text-[12px] font-medium text-[#304139]">{user?.fullName || t.user}</p>
                <p className="m-0 mt-0.5 truncate text-[10px] font-normal text-[#88938e]">{roles[language][user?.role] || t.portal}</p>
              </div>
              <ChevronDown size={12} className="text-[#87958e]" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[46px] w-64 overflow-hidden rounded-[16px] border border-[#dfe5e1] bg-white shadow-[0_18px_48px_rgba(38,55,47,.13)]">
                <div className="border-b border-[#e9eeeb] px-4 py-4">
                  <p className="m-0 text-[12px] font-medium text-[#26372f]">{user?.fullName || t.user}</p>
                  <p className="m-0 mt-1 text-[11px] font-normal text-[#839089]">{roles[language][user?.role] || user?.role}</p>
                </div>
                <button type="button" onClick={logout} className="flex w-full items-center gap-2 px-4 py-3 text-left text-[12px] font-medium text-[#a24a42] hover:bg-[#fff7f6]">
                  <LogOut size={14} /> {t.signOut}
                </button>
              </div>
            )}
          </div>

          <button type="button" onClick={() => setMobileOpen((value) => !value)} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dce2de] text-[#26372f] lg:hidden">
            {mobileOpen ? <X size={17} /> : <Menu size={17} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#e5eae7] bg-white px-4 py-3 lg:hidden">
          <div className="grid gap-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <button type="button" key={item.label} onClick={() => go(item.path)} className={`flex items-center gap-3 rounded-lg px-3 py-3 text-left text-[12px] font-medium ${item.active ? 'bg-[#eef6f2] text-[#167663]' : 'text-[#5c6d64]'}`}>
                  <Icon size={16} /> {item.label}
                </button>
              )
            })}
            <button type="button" onClick={logout} className="mt-2 flex items-center gap-3 border-t border-[#edf1ef] px-3 py-3 text-left text-[12px] font-medium text-[#a24a42]">
              <LogOut size={16} /> {t.signOut}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}

export default TopNavigation
