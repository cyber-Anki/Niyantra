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
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
        <h3 className="font-serif text-2xl font-bold text-[#1e3a8a]">
          Blocks Planned vs Backlog ({monthName})
        </h3>
        {weeklyData.length ? (
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={weeklyData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1EEE4" vertical={false} />
                <XAxis dataKey="label" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#94A3B8" tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#64748B" tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#0A261A', border: 'none', borderRadius: 8, color: '#FDF9F1' }} />
                <Bar yAxisId="left" dataKey="planned" fill="#1e3a8a" radius={[0, 0, 0, 0]} name="Planned blocks" />
                <Bar yAxisId="right" dataKey="backlog" fill="#F1C453" radius={[0, 0, 0, 0]} name="Backlog rolled forward" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-80 items-center justify-center text-sm text-slate-400">
            No forecast data.
          </div>
        )}
        </div>
        <div className="rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <h4 className="font-serif text-xl font-bold text-[#1e3a8a]">Calendar Grid</h4>
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
                          ? 'bg-[#FDF9F1] font-bold text-[#1e3a8a] shadow-sm relative'
                          : 'text-[#1e3a8a] hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <span>{d}</span>
                      {hasBlocks && (
                        <div className="absolute bottom-3 h-1.5 w-1.5 rounded-full bg-[#1e3a8a]" />
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
        {totals && (
          <div className="rounded-2xl border border-[#F1C453] bg-[#F9E28C] p-6 shadow-sm">
            <h4 className="font-serif text-xl font-bold text-[#1e3a8a]">Month Summary</h4>
            <div className="mt-6 flex flex-col gap-6">
              <div>
                <p className="text-xs font-medium text-[#1e3a8a]/80 mb-1">Total Blocks Scheduled</p>
                <p className="font-serif text-4xl font-black text-[#1e3a8a]">{totals.totalScheduled}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#1e3a8a]/80 mb-1">Merged Efficiency</p>
                <p className="font-serif text-4xl font-black text-[#1e3a8a]">{totals.mergedEfficiency}%</p>
              </div>
            </div>
            <button className="focus-ring mt-8 w-full rounded-lg bg-[#1e3a8a] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#1e40af]">
              Generate Official Plan PDF
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
