import { useMemo } from 'react'
import { useNiyantraData } from '../store/DataContext.jsx'
import { useTranslation } from '../store/TranslationContext.jsx'
import { CalendarRange, AlertTriangle, ShieldAlert, CheckCircle, Activity, TrainFront, HardHat, Building2, Map, LayoutDashboard, BarChart3, Clock, GitPullRequestArrow } from 'lucide-react'
import DonutRing from '../components/ui/DonutRing.jsx'
import trainImage from '../assets/vande_bharat_train.jpg'

function formatTimeOfDay(minute) {
  const m = ((minute % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  const mm = (m % 60).toString().padStart(2, '0')
  return `${h24.toString().padStart(2, '0')}:${mm}`
}

function StatBox({ label, value, unit, highlight = false, alert = false, icon: Icon, color = 'blue' }) {
  // Determine color classes
  const colorMap = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-glow-blue',
    emerald: 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-glow-emerald',
    amber: 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-glow-amber',
    red: 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-glow-red',
    indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-glow-indigo',
  }
  
  let appliedColor = colorMap[color] || colorMap.blue
  if (alert) appliedColor = colorMap.red
  if (highlight) appliedColor = colorMap.indigo

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${appliedColor}`}>
      <div className="relative z-10">
        <div className="text-[20px] uppercase font-bold tracking-wide mb-3 opacity-90 leading-snug">{label}</div>
        <div className="text-4xl font-black">{value} {unit && <span className="text-sm font-bold opacity-90">{unit}</span>}</div>
      </div>
      {Icon && (
        <div className="absolute -right-2 -bottom-2 opacity-20 transform rotate-[-15deg] group-hover:scale-110 transition-transform duration-500">
          <Icon size={120} />
        </div>
      )}
    </div>
  )
}

function HeroBanner({ title, subtitle, icon: Icon, nominalText }) {
  return (
    <div className="relative mb-8 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-[#1e293b] to-indigo-600 shadow-card p-8">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent"></div>
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-5 text-white">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 shadow-inner">
            {Icon && <Icon size={32} className="text-amber-500 drop-shadow-glow" />}
          </div>
          <div>
            <h2 className="text-3xl font-serif font-black tracking-wide text-white drop-shadow-sm">{title}</h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-slate-300 font-semibold uppercase tracking-widest">
              {subtitle}
            </p>
          </div>
        </div>
        {nominalText && (
          <div className="bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/20 font-bold uppercase tracking-widest text-xs flex items-center gap-3 shadow-soft">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
            </div>
            {nominalText}
          </div>
        )}
      </div>
    </div>
  )
}

function ActionButton({ title, subtitle, icon: Icon, onClick, primary = false }) {
  return (
    <button onClick={onClick} className={`focus-ring group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${!primary ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-glow-emerald border-none' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-glow-blue border-none'}`}>
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h3 className="font-bold text-lg font-serif">{title}</h3>
          <p className="text-sm mt-1 flex items-center gap-1 font-medium text-white/90">{subtitle} <span className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">&rarr;</span></p>
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
          <Icon size={24} className="text-white" />
        </div>
      </div>
      <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-[-15deg] transition-transform duration-500 group-hover:scale-110">
        <Icon size={100} />
      </div>
    </button>
  )
}

function EngineerDashboard({ userContext, tasks, blocks, setPage }) {
  const { t } = useTranslation()
  const myTasks = tasks.filter(t => t.section === userContext.corridor)
  const myBlocks = blocks.filter(b => b.section === userContext.corridor)
  const pendingCount = myBlocks.filter(b => b.status === 'pending').length
  const criticalTasks = myTasks.filter(task => task.severity === 'critical')
  const healthyPct = myTasks.length ? Math.round(((myTasks.length - criticalTasks.length) / myTasks.length) * 100) : 0

  return (
    <div className="space-y-6 font-sans">
      <HeroBanner 
        title={t('eng.portal')} 
        subtitle={`${t('dash.corridor')}: ${userContext.corridor} | ${t('dash.division')}: ${userContext.division}`} 
        icon={HardHat} 
        nominalText={t('dash.status_online')}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label={t('eng.open_defects')} value={myTasks.length} icon={Activity} color="amber" />
        <StatBox label={t('eng.critical')} value={criticalTasks.length} alert icon={AlertTriangle} />
        <StatBox label={t('eng.pending_blocks')} value={pendingCount} icon={Clock} color="blue" />
        <StatBox label={t('eng.approved_blocks')} value={myBlocks.filter(b => b.status === 'approved').length} icon={CheckCircle} color="emerald" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 shadow-xl rounded-3xl flex flex-col items-center justify-center transition-colors">
          <h3 className="font-bold text-indigo-600 dark:text-amber-500 uppercase mb-6 border-b border-slate-200/50 dark:border-white/10 pb-2 w-full text-center">{t('eng.health')}</h3>
          <div className="relative">
            <DonutRing percentage={healthyPct} size={200} strokeWidth={24} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-800 dark:text-white">{healthyPct}%</span>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t('eng.nominal')}</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 shadow-xl rounded-3xl transition-colors">
          <div className="flex justify-between items-center mb-6 border-b border-slate-200/50 dark:border-white/10 pb-2">
            <h3 className="font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2"><CalendarRange size={20}/> {t('eng.upcoming_schedule')}</h3>
          </div>
          
          {myBlocks.length > 0 ? (
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-indigo-600 dark:text-amber-500 text-xs uppercase tracking-wider rounded-t-xl">
                  <tr>
                    <th className="p-3 rounded-tl-xl">{t('eng.start_time')}</th>
                    <th className="p-3">{t('eng.end_time')}</th>
                    <th className="p-3">{t('eng.departments')}</th>
                    <th className="p-3 rounded-tr-xl">{t('eng.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/50 dark:divide-white/10">
                  {myBlocks.sort((a,b) => a.start_minute - b.start_minute).slice(0, 5).map((b, i) => (
                    <tr key={i} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-3 font-bold text-slate-800 dark:text-white">{formatTimeOfDay(b.start_minute)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{formatTimeOfDay(b.end_minute)}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{b.departments?.join(', ') || 'Various'}</td>
                      <td className="p-3 font-bold text-xs uppercase tracking-wide">
                        <span className={`px-2 py-1 ${b.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'}`}>{b.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400 py-12 bg-white/20 dark:bg-black/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <CalendarRange size={48} className="mb-4 opacity-30" />
              <p className="font-bold uppercase tracking-widest">{t('eng.no_blocks')}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionButton title={t('eng.priority_queue')} subtitle={t('eng.manage_defects')} icon={ShieldAlert} onClick={() => setPage('priority')} />
        <ActionButton title={t('eng.block_calendar')} subtitle={t('eng.view_timeline')} icon={CalendarRange} onClick={() => setPage('calendar')} primary />
      </div>
    </div>
  )
}

function ControllerDashboard({ userContext, blocks, corridors, setPage }) {
  const { t } = useTranslation()
  const pendingRequests = blocks.filter(b => b.status === 'pending').length
  const activeBlocks = blocks.filter(b => b.status === 'approved').length
  const pendingBlocks = blocks.filter(b => b.status === 'pending')

  return (
    <div className="space-y-6 font-sans">
      <HeroBanner 
        title={t('ctrl.dashboard')} 
        subtitle={`${t('dash.division')}: ${userContext.division} | ${t('ctrl.subtitle')}`} 
        icon={Activity} 
        nominalText={t('dash.status_online')}
      />

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatBox label={t('controller.asset_availability')} value="94.2%" highlight icon={Activity} />
        <StatBox label={t('controller.pending_requests')} value={pendingRequests} icon={Clock} color="amber" />
        <StatBox label={t('controller.active_blocks')} value={activeBlocks} icon={CheckCircle} color="emerald" />
        <StatBox label={t('controller.total_corridors')} value="12" icon={TrainFront} color="blue" />
        <StatBox label={t('controller.network_status')} value="Nominal" icon={Activity} color="indigo" />
      </div>

      <div className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 shadow-xl rounded-3xl transition-colors">
        <div className="flex justify-between items-center mb-6 border-b border-slate-200/50 dark:border-white/10 pb-2">
          <h3 className="font-bold text-slate-800 dark:text-white uppercase flex items-center gap-2"><GitPullRequestArrow size={20} className="text-indigo-600 dark:text-amber-500" /> {t('ctrl.live_requests')}</h3>
        </div>
        
        {pendingBlocks.length > 0 ? (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100/50 dark:bg-slate-800/50 text-indigo-600 dark:text-amber-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="p-3 rounded-tl-xl">{t('dash.corridor')}</th>
                  <th className="p-3">{t('eng.start_time')}</th>
                  <th className="p-3">{t('ctrl.duration')}</th>
                  <th className="p-3">{t('ctrl.req_depts')}</th>
                  <th className="p-3 text-center rounded-tr-xl">{t('ctrl.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/50 dark:divide-white/10">
                {pendingBlocks.slice(0, 8).map((b, i) => (
                  <tr key={i} className="hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                    <td className="p-3 font-black text-indigo-600 dark:text-amber-500 text-base">{b.section}</td>
                    <td className="p-3 font-bold text-slate-700 dark:text-slate-300">{formatTimeOfDay(b.start_minute)}</td>
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{b.end_minute - b.start_minute} mins</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{b.departments?.join(', ') || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <span className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase">Pending</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 py-12 bg-white/20 dark:bg-black/20 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
            <CheckCircle size={48} className="mb-4 opacity-30 text-green-600" />
            <p className="font-bold uppercase tracking-widest text-green-700 dark:text-green-500">{t('ctrl.all_resolved')}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionButton title={t('ctrl.master_calendar')} subtitle={t('ctrl.view_all_timelines')} icon={CalendarRange} onClick={() => setPage('calendar')} primary />
      </div>
    </div>
  )
}

function DRMDashboard({ userContext, tasks, blocks, corridors, setPage }) {
  const { t } = useTranslation()
  const pendingBlocks = blocks.filter(b => b.status === 'pending').length
  const criticalCount = tasks.filter(task => task.severity === 'critical').length
  const totalCritical = criticalCount
  const totalPending = pendingBlocks

  const deptData = ['ENG', 'SNT', 'TRD'].map(dept => {
    const dTasks = tasks.filter(t => t.department === dept)
    const crit = dTasks.filter(task => task.severity === 'critical').length
    const healthyPct = dTasks.length ? Math.round(((dTasks.length - crit) / dTasks.length) * 100) : 0
    return { dept, total: dTasks.length, crit, healthyPct }
  })

  return (
    <div className="space-y-6 font-sans">
      <HeroBanner 
        title={t('drm.summary')} 
        subtitle={`${t('dash.division')}: ${userContext.division} | ${t('drm.command_center')}`} 
        icon={Building2} 
        nominalText={t('dash.status_online')}
      />
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label={t('drm.total_critical')} value={totalCritical} alert icon={AlertTriangle} />
        <StatBox label={t('drm.total_pending_blocks')} value={totalPending} icon={Clock} color="amber" />
        <StatBox label={t('drm.system_health')} value="92%" highlight icon={Activity} />
        <StatBox label={t('drm.active_corridors')} value="14" icon={TrainFront} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {deptData.map((d, i) => (
          <div key={i} className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 p-6 shadow-xl rounded-3xl flex flex-col items-center transition-colors">
            <h3 className="font-bold text-indigo-600 dark:text-amber-500 uppercase mb-4 w-full text-center border-b border-slate-200/50 dark:border-white/10 pb-2">{d.dept} {t('eng.departments')}</h3>
            <div className="relative mb-4">
              <DonutRing percentage={d.healthyPct} size={140} strokeWidth={16} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{d.total}</span>
              </div>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 text-center text-sm">
              <div className="bg-white/50 dark:bg-black/20 p-2 rounded-xl border border-white/40 dark:border-white/10">
                <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">{t('drm.total')}</div>
                <div className="font-black text-slate-700 dark:text-white">{d.total}</div>
              </div>
              <div className={`p-2 rounded-xl border ${d.crit > 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400' : 'bg-white/50 dark:bg-black/20 border-white/40 dark:border-white/10 text-slate-700 dark:text-white'}`}>
                <div className="text-[10px] uppercase font-bold">{t('drm.critical')}</div>
                <div className="font-black">{d.crit}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionButton title={t('drm.reports')} subtitle={t('drm.div_kpis')} icon={BarChart3} onClick={() => setPage('reports')} primary />
        <ActionButton title={t('ctrl.master_calendar')} subtitle={t('ctrl.view_all_timelines')} icon={CalendarRange} onClick={() => setPage('calendar')} />
        <ActionButton title={t('drm.whatif')} subtitle={t('drm.forecast')} icon={Clock} onClick={() => setPage('simulator')} />
      </div>
    </div>
  )
}

export default function Overview({ setPage, userContext }) {
  const { tasks, rankedTasks, corridors, blocks } = useNiyantraData()
  const { t } = useTranslation()
  const baseTasks = rankedTasks.length ? rankedTasks : tasks

  if (!userContext) return <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xl">{t('dash.system_offline')}</div>

  if (userContext.role === 'Section Engineer') {
    return <EngineerDashboard userContext={userContext} tasks={baseTasks} blocks={blocks} setPage={setPage} />
  }
  if (userContext.role === 'Controller') {
    return <ControllerDashboard userContext={userContext} blocks={blocks} corridors={corridors} setPage={setPage} />
  }
  return <DRMDashboard userContext={userContext} tasks={baseTasks} blocks={blocks} corridors={corridors} setPage={setPage} />
}
