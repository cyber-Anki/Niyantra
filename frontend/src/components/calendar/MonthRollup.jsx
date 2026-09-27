import { useMemo } from 'react'
import { Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function buildMonthGrid(monthLabel) {
  const [yearStr, monthStr] = monthLabel.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr) - 1
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  // Monday-first offset
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7

  const cells = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const rows = []
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
  return { rows, monthName: firstOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) }
}

export default function MonthRollup({ plan, monthLabel = '2025-04' }) {
  const weeklyData = useMemo(() => {
    if (!plan) return []
    return plan.weekly_plans.map((wp, i) => ({
      label: `Week ${i + 1}`,
      planned: wp.scheduled_blocks.length,
      backlog: wp.unscheduled_task_ids.length,
    }))
  }, [plan])

  const totals = useMemo(() => {
    if (!plan) return null
    const totalScheduled = plan.weekly_plans.reduce((s, w) => s + w.scheduled_blocks.length, 0)
    const totalMerged = plan.weekly_plans.reduce((s, w) => s + w.merge_count, 0)
    return {
      totalScheduled,
      mergedEfficiency: totalScheduled ? Math.round((totalMerged / totalScheduled) * 100) : 0,
    }
  }, [plan])

  const { rows, monthName } = useMemo(() => buildMonthGrid(monthLabel), [monthLabel])

  const daysWithBlocks = useMemo(() => {
    if (!plan) return new Set()
    const set = new Set()
    
    plan.weekly_plans.forEach(wp => {
      wp.scheduled_blocks.forEach(b => {
        if (b.corridor && b.corridor.day) {
          const [base, offsetStr] = String(b.corridor.day).split('+')
          const offset = Number(offsetStr || 0)
          const d = new Date(`${base}T00:00:00`)
          d.setDate(d.getDate() + offset)
          
          const [yearStr, monthStr] = monthLabel.split('-')
          if (d.getFullYear() === Number(yearStr) && d.getMonth() === Number(monthStr) - 1) {
            set.add(d.getDate())
          }
        }
      })
    })
    return set
  }, [plan, monthLabel])

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 shadow-sm">
          <h4 className="font-serif text-xl font-bold text-indigo-600 dark:text-amber-500">Calendar Grid</h4>
          <div className="mt-6 grid grid-cols-7 gap-2 text-center text-sm font-bold text-[#5F738C]">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 text-center text-sm">
                {r.map((d, di) => {
                  if (d === null) return <div key={di} className="h-16" />
                  
                  const hasBlocks = daysWithBlocks.has(d);
                  
                  return (
                    <div
                      key={di}
                      className={`flex h-20 flex-col items-center justify-center rounded-xl transition ${
                        hasBlocks
                          ? 'bg-indigo-50 dark:bg-amber-500/20 font-bold text-indigo-900 dark:text-amber-400 shadow-sm relative'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-white/5 font-medium'
                      }`}
                    >
                      <span>{d}</span>
                      {hasBlocks && (
                        <div className="absolute bottom-3 h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-amber-500" />
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-black/20 backdrop-blur-md p-6 shadow-sm">
          <h3 className="font-serif text-2xl font-bold text-indigo-600 dark:text-amber-500 mb-2">Monthly plan</h3>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-6 border-l-4 border-indigo-600 dark:border-amber-500 pl-3">
            What maintenance should happen over the whole month?
          </p>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3">
            This helps railway officials plan:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-700 dark:text-slate-300 space-y-2 font-medium">
            <li>Major maintenance</li>
            <li>Overdue work</li>
            <li>Critical defects</li>
            <li>Future blocks</li>
            <li>Department coordination</li>
          </ul>
        </div>

        {totals && (
          <div className="rounded-2xl border border-indigo-200 dark:border-amber-500/30 bg-indigo-50/80 dark:bg-amber-500/10 p-6 shadow-sm backdrop-blur-md">
            <h4 className="font-serif text-xl font-bold text-indigo-900 dark:text-amber-400">Month Summary</h4>
            <div className="mt-6 flex flex-col gap-6">
              <div>
                <p className="text-xs font-medium text-indigo-900/80 dark:text-amber-400/80 mb-1">Total Blocks Scheduled</p>
                <p className="font-serif text-4xl font-black text-indigo-900 dark:text-amber-400">{totals.totalScheduled}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-indigo-900/80 dark:text-amber-400/80 mb-1">Merged Efficiency</p>
                <p className="font-serif text-4xl font-black text-indigo-900 dark:text-amber-400">{totals.mergedEfficiency}%</p>
              </div>
            </div>
            <button className="focus-ring mt-8 w-full rounded-lg bg-indigo-600 dark:bg-amber-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 dark:hover:bg-amber-700">
              Generate Official Plan PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
