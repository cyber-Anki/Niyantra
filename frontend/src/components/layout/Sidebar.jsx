import {
  LayoutGrid, ListChecks, CalendarRange, BarChart3,
  ChevronLeft, ChevronRight, GitPullRequestArrow, FlaskConical,
  LogOut,
} from 'lucide-react'
import logoMark from '../../assets/logo-mark.png'
import { useTranslation } from '../../store/TranslationContext.jsx'

export default function Sidebar({ page, setPage, collapsed, setCollapsed, userContext, onLogout }) {
  const { t } = useTranslation()

  const NAV_ITEMS = [
    { id: 'overview', label: t('sidebar.overview'), icon: LayoutGrid },
    { id: 'priority', label: t('sidebar.priority'), icon: ListChecks },
    { id: 'calendar', label: t('sidebar.calendar'), icon: CalendarRange },
    ...(userContext?.role === 'DRM' ? [{ id: 'conflicts', label: t('sidebar.conflicts'), icon: GitPullRequestArrow }] : []),
    { id: 'simulator', label: t('sidebar.simulator'), icon: FlaskConical },
    { id: 'reports', label: t('sidebar.reports'), icon: BarChart3 },
  ]

  return (
    <aside
      className={`relative shrink-0 bg-slate-900 border-r border-slate-800 text-slate-300 transition-[width] duration-200 h-full flex flex-col ${
        collapsed ? 'w-24' : 'w-80'
      }`}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="focus-ring absolute -right-3 top-9 z-10 hidden h-7 w-7 items-center justify-center rounded-full bg-gold text-slate-900 shadow-card hover:bg-gold-dark md:flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
      </button>

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5 shrink-0">
        <img src={logoMark} alt="Niyantran" className="h-9 w-9 object-contain shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-serif text-lg font-bold tracking-wide text-white">Niyantran</h1>
            <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Indian Railways</p>
          </div>
        )}
      </div>

      {/* Navigation - grows to fill available space */}
      <nav className="space-y-1 p-3 flex-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`focus-ring flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-semibold transition ${
                active
                  ? 'bg-gold text-slate-900 shadow-md font-bold'
                  : 'text-slate-200 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>

      {/* Logout Button - pinned at bottom */}
      <div className="shrink-0 border-t border-slate-800 p-3">
        <button
          onClick={onLogout}
          className="focus-ring flex w-full items-center gap-3 rounded-xl px-4 py-3 text-[0.95rem] font-semibold text-red-400 hover:bg-red-500/20 hover:text-red-300 transition"
        >
          <LogOut size={20} className="shrink-0" />
          {!collapsed && <span className="truncate">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
