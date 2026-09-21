import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { RefreshCw, Download } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import { useTranslation } from '../store/TranslationContext.jsx'

const DEPTS = ['ENG', 'SNT', 'TRD']

function downloadCsv(filename, rows) {
  const csv = rows.map((r) => r.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsAnalytics() {
  const {
    monthlyPlan, monthlyLoading, runSimulateMonthly, error,
    tasks, rankedTasks, corridors, blocks, unscheduledTaskIds,
  } = useNiyantraData()
  const { t } = useTranslation()
  const [section, setSection] = useState('__all__')

  const sections = monthlyPlan ? Object.keys(monthlyPlan.section_trajectories) : []
  const allTasks = rankedTasks.length ? rankedTasks : tasks

  const chartData = useMemo(() => {
    if (!monthlyPlan) return []
    const trajectories = monthlyPlan.section_trajectories
    if (section !== '__all__') {
      return (trajectories[section] || []).map((p) => ({
        week: `W${p.week}`,
        'Status Quo Risk': p.status_quo_risk,
        'AI Optimized Risk': p.ai_optimized_risk,
      }))
    }
    const byWeek = {}
    Object.values(trajectories).forEach((points) => {
      points.forEach((p) => {
        byWeek[p.week] = byWeek[p.week] || { week: `W${p.week}`, 'Status Quo Risk': 0, 'AI Optimized Risk': 0 }
        byWeek[p.week]['Status Quo Risk'] += p.status_quo_risk
        byWeek[p.week]['AI Optimized Risk'] += p.ai_optimized_risk
      })
    })
    return Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week))
  }, [monthlyPlan, section])

  const riskAvoided = useMemo(() => {
    if (!chartData.length) return null
    const last = chartData[chartData.length - 1]
    return Math.round(last['Status Quo Risk'] - last['AI Optimized Risk'])
  }, [chartData])

  const downtimeTrend = useMemo(() => {
    if (!monthlyPlan) return []
    return monthlyPlan.weekly_plans.map((wp, i) => ({
      week: `W${i + 1}`,
      'Avg Downtime (mins)': wp.scheduled_blocks.length
        ? Math.round(wp.scheduled_blocks.reduce((s, b) => s + (b.end_minute - b.start_minute), 0) / wp.scheduled_blocks.length)
        : 0,
    }))
  }, [monthlyPlan])

  const deptStats = useMemo(() => {
    const scheduledIds = new Set(blocks.flatMap((b) => b.task_ids))
    return DEPTS.map((dept) => {
      const deptTasks = allTasks.filter((t) => t.department === dept)
      const resolved = deptTasks.filter((t) => scheduledIds.has(t.task_id)).length
      const pending = deptTasks.length - resolved
      return {
        dept,
        raised: deptTasks.length,
        resolved,
        pending,
        sla: deptTasks.length ? Math.round((resolved / deptTasks.length) * 100) : 0,
      }
    })
  }, [allTasks, blocks])

  const utilization = useMemo(() => {
    const planned = corridors.reduce((s, c) => s + Math.max(0, c.window_minutes - c.buffer_minutes), 0)
    const actual = blocks.reduce((s, b) => s + (b.end_minute - b.start_minute), 0)
    return { planned, actual, pct: planned ? Math.min(100, Math.round((actual / planned) * 100)) : 0 }
  }, [corridors, blocks])

  const exportCsv = () => {
    const rows = [
      ['task_id', 'department', 'section', 'defect_type', 'severity', 'overdue_days', 'risk_score', 'scheduled'],
      ...allTasks.map((t) => [
        t.task_id, t.department, t.section, t.defect_type, t.severity, t.overdue_days, t.risk_score,
        blocks.some((b) => b.task_ids.includes(t.task_id)) ? 'yes' : 'no',
      ]),
    ]
    downloadCsv(`niyantran-priority-queue-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-sm min-h-full transition-colors">
      <div className="border-b-4 border-indigo-600 p-5 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-amber-500 uppercase tracking-wide">
            {t('rep.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="focus-ring flex items-center gap-2 rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Download size={14} /> {t('rep.export')}
          </button>
          <button
            onClick={() => runSimulateMonthly()}
            disabled={monthlyLoading}
            className="focus-ring flex items-center gap-2 rounded-2xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            <RefreshCw size={14} className={monthlyLoading ? 'animate-spin' : ''} />
            {monthlyLoading ? t('rep.simulating') : t('rep.run_forecast')}
          </button>
        </div>
      </div>

      <div className="p-5">
        {error && <p className="mb-3 text-sm font-bold text-red-600 dark:text-red-400">{error}</p>}

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('rep.efficiency')}</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{utilization.pct}%</p>
            <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">{utilization.actual}m {t('rep.used_of')} {utilization.planned}m {t('rep.available')}</p>
          </div>
          <div className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('rep.rolled_forward')}</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{unscheduledTaskIds.length}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">{t('rep.of')} {allTasks.length} {t('rep.total_backlog')}</p>
          </div>
          <div className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t('rep.merges')}</p>
            <p className="mt-2 text-3xl font-black text-slate-900 dark:text-white">{blocks.filter((b) => b.is_merged).length}</p>
            <p className="mt-1 text-xs font-semibold text-slate-400 dark:text-slate-500">{t('rep.of')} {blocks.length} {t('rep.scheduled_blocks')}</p>
          </div>
        </div>

        {/* 4-week forecast section */}
        <div className="mb-8 border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-200 dark:border-slate-700 pb-3">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">4-Week Backlog &amp; Risk Trajectory</h3>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Comparing status-quo accumulation vs. AI-optimized clearance</p>
            </div>
            {monthlyPlan && (
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="focus-ring rounded-2xl border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="__all__">All Sections (Aggregate)</option>
                {sections.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            )}
          </div>

          {chartData.length > 0 && (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
                  <XAxis dataKey="week" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={{ background: '#ffffff', border: '2px solid #cbd5e1' }} />
                  <Legend />
                  <Line type="monotone" dataKey="Status Quo Risk" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="AI Optimized Risk" stroke="#16311F" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {riskAvoided !== null && (
            <p className="mt-3 text-xs font-bold text-forest">
              Estimated net risk avoided over 4 weeks: {riskAvoided} points
            </p>
          )}

          {!monthlyPlan && !monthlyLoading && (
            <p className="text-xs font-semibold text-slate-400">Run forecast above to populate risk trajectory.</p>
          )}
        </div>

        {/* SLA table */}
        <div className="border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white border-b-2 border-slate-200 dark:border-slate-700 pb-2">
            Department SLA Compliance
          </h3>
          <table className="w-full text-left">
            <thead className="bg-slate-100 dark:bg-slate-700 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <tr>
                <th className="p-2.5">Department</th>
                <th className="p-2.5">Total Raised</th>
                <th className="p-2.5">Scheduled / Resolved</th>
                <th className="p-2.5">Pending</th>
                <th className="p-2.5">Weekly Clearance %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
              {deptStats.map((d) => (
                <tr key={d.dept} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white">{d.dept}</td>
                  <td className="p-2.5">{d.raised}</td>
                  <td className="p-2.5">{d.resolved}</td>
                  <td className="p-2.5">{d.pending}</td>
                  <td className="p-2.5 font-bold text-indigo-600 dark:text-amber-500">{d.sla}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
