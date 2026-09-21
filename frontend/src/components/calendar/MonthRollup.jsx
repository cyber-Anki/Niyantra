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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
        <h3 className="font-serif text-lg font-semibold text-slate-900">
          Blocks Planned vs Backlog ({monthName})
        </h3>
        {weeklyData.length ? (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EEE4" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: 8, color: '#fff' }} />
                <Bar yAxisId="left" dataKey="planned" fill="#16311F" radius={[4, 4, 0, 0]} name="Planned blocks" />
                <Bar yAxisId="left" dataKey="backlog" fill="#EF4444" radius={[4, 4, 0, 0]} name="Backlog rolled forward" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center text-sm text-slate-400">
            No forecast data.
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {totals && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
            <h4 className="text-xs uppercase tracking-wider text-slate-400">Month Summary</h4>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{totals.totalScheduled}</p>
                <p className="text-xs text-slate-500">Planned blocks</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-forest">{totals.mergedEfficiency}%</p>
                <p className="text-xs text-slate-500">Merge efficiency</p>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
          <h4 className="text-xs uppercase tracking-wider text-slate-400">{monthName} Calendar</h4>
          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-400">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="mt-2 space-y-1">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-7 gap-1 text-center text-xs">
                {r.map((d, di) => (
                  <div
                    key={di}
                    className={`flex h-8 items-center justify-center rounded-md font-medium ${
                      d === null
                        ? 'text-transparent'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
