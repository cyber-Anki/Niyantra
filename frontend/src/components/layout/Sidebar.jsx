import {
  LayoutGrid, ListChecks, CalendarRange, BarChart3,
  ChevronLeft, ChevronRight, GitPullRequestArrow, FlaskConical,
} from 'lucide-react'
import logoMark from '../../assets/logo-mark.png'
import { useTranslation } from '../../store/TranslationContext.jsx'

export default function Sidebar({ page, setPage, collapsed, setCollapsed, userContext }) {
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
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className={`relative shrink-0 bg-slate-900 text-slate-300 transition-[width] duration-200 h-full ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="focus-ring absolute -right-3 top-9 z-10 hidden h-6 w-6 items-center justify-center rounded-full bg-gold text-slate-900 shadow-card hover:bg-gold-dark md:flex"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex h-16 items-center gap-3 border-b border-navy-light px-5">
        <img src={logoMark} alt="Niyantran" className="h-8 w-8 object-contain shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden whitespace-nowrap">
            <h1 className="font-serif text-lg font-bold tracking-wide text-white">Niyantran</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Indian Railways</p>
          </div>
        )}
      </div>

      <nav className="space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = page === item.id
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`focus-ring flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition ${
                active
                  ? 'bg-gold text-slate-900 font-semibold shadow-card'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
