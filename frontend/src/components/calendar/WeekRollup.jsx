import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getBlocksForDay } from './blockDataGenerator.js'

export default function WeekRollup({ section, date, sectionCorridors, blocks = [], onDaySelect, onPrevWeek, onNextWeek }) {
  // Generate 7 days starting from Monday of `date`'s week
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

  const tableData = useMemo(() => {
    const rows = []
    days.forEach((d) => {
      const key = d.toDateString()
      // Check real store blocks first
      const storeBlocks = blocks.filter((b) => {
        const c = sectionCorridors?.find((c) => c.corridor_id === b.corridor_id)
        if (c && c.day) {
          const [base, offsetStr] = String(c.day).split('+')
          const offset = Number(offsetStr || 0)
          const blockDate = new Date(`${base}T00:00:00`)
          blockDate.setDate(blockDate.getDate() + offset)
          return blockDate.toDateString() === key
        }
        return false
      })

      // If store blocks exist for this date, map them; otherwise use dynamic generator
      const activeBlocks = storeBlocks.length > 0 ? storeBlocks : getBlocksForDay(d, section)

      activeBlocks.forEach((b) => {
        let work = b.name || 'General track maintenance'
        let deptStr = 'Engineering'

        if (b.is_merged) {
          deptStr = 'Engg + S&T'
          if (b.departments?.includes('TRD') && b.departments?.includes('SNT')) deptStr = 'S&T + Electrical'
          else if (b.departments?.includes('TRD')) deptStr = 'Engg + Electrical'
        } else if (b.departments?.includes('SNT')) {
          deptStr = 'S&T'
        } else if (b.departments?.includes('TRD')) {
          deptStr = 'Electrical'
        } else {
          deptStr = 'Engineering'
        }

        rows.push({
          dateObj: d,
          day: d.toLocaleDateString('en-US', { weekday: 'short' }),
          dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          section: b.section || (section === 'All' ? 'NDLS-GZB' : section),
          work,
          department: deptStr,
          status: b.status || 'pending',
          block_id: b.block_id,
        })
      })
    })

    return rows
  }, [days, blocks, sectionCorridors, section])

  return (
    <div className="rounded-2xl border border-slate-200/60 dark:border-white/10 bg-white/40 dark:bg-black/20 p-8 backdrop-blur-md shadow-sm min-h-full">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="font-serif text-3xl font-bold text-black dark:text-amber-500">
            Weekly Plan
          </h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Maintenance schedule & section occupations for this week
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevWeek}
            title="Previous Week"
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {days[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button
            onClick={onNextWeek}
            title="Next Week"
            className="focus-ring flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/80 dark:bg-white/10 text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/10">Day</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/10">Date</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/10">Section</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/10">Work</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/10">Department</th>
              <th className="px-6 py-4 font-bold border-b border-slate-200 dark:border-white/10">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
            {tableData.map((row, i) => (
              <tr 
                key={i} 
                className="transition-colors hover:bg-indigo-50/50 dark:hover:bg-white/10 cursor-pointer group"
                onClick={() => onDaySelect && onDaySelect(row.dateObj)}
                title="Click to view detailed day timeline"
              >
                <td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-amber-400">{row.day}</td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400">{row.dateFormatted}</td>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{row.section}</td>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{row.work}</td>
                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">{row.department}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                    row.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : row.status === 'rejected'
                      ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      : row.status === 'flagged'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

