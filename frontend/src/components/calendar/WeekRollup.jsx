import { useMemo } from 'react'
import { formatTimeOfDay } from './deptColors.js'
import SeverityBadge from '../ui/SeverityBadge.jsx'

export default function WeekRollup({ section, date, sectionCorridors, blocks, onDecide, submitBlockFlag, userContext, onDaySelect }) {
  // Generate 7 days starting from `date` (or the nearest Monday)
  const days = useMemo(() => {
    const list = []
    const start = new Date(date)
    // start on Monday
    const day = start.getDay()
    const diff = start.getDate() - day + (day === 0 ? -6 : 1)
    start.setDate(diff)

    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      list.push(d)
    }
    return list
  }, [date])

  const blocksByDay = useMemo(() => {
    const map = {}
    days.forEach((d) => (map[d.toDateString()] = []))
    
    blocks.forEach((b) => {
      const c = sectionCorridors.find((c) => c.corridor_id === b.corridor_id)
      if (c && c.day) {
        const [base, offsetStr] = String(c.day).split('+')
        const offset = Number(offsetStr || 0)
        const d = new Date(`${base}T00:00:00`)
        d.setDate(d.getDate() + offset)
        const key = d.toDateString()
        if (map[key]) map[key].push(b)
      }
    })
    return map
  }, [days, blocks, sectionCorridors])

  return (
    <div className="grid grid-cols-7 gap-4">
      {days.map((d) => {
        const key = d.toDateString()
        const dayBlocks = blocksByDay[key]
        return (
          <div key={key} className="flex flex-col gap-3 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-black/20 p-4 backdrop-blur-md shadow-sm transition-transform hover:-translate-y-1">
            <div className="flex flex-col items-center pb-2 border-b border-slate-200/60 dark:border-white/10 cursor-pointer" onClick={() => onDaySelect(d)}>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
              <span className="text-xl font-black text-indigo-600 dark:text-amber-500">{d.getDate()}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[60vh] no-scrollbar">
              {dayBlocks.length === 0 ? (
                <p className="text-xs text-center font-medium text-slate-400 dark:text-slate-500 py-4">No blocks</p>
              ) : (
                dayBlocks.map((b) => (
                  <div key={b.block_id} className="rounded-xl bg-white/60 dark:bg-white/10 p-3 border border-slate-200 dark:border-white/5 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">{b.block_id}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-indigo-100 text-indigo-700 dark:bg-amber-500/20 dark:text-amber-400">
                        {formatTimeOfDay(b.start_minute)}
                      </span>
                    </div>
                    {b.task_ids.length > 0 && (
                      <div className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        {b.task_ids.length} task(s)
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
