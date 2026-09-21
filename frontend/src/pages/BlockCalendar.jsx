import { useEffect, useMemo, useState } from 'react'
import { useNiyantraData } from '../store/DataContext.jsx'
import DayTimeline from '../components/calendar/DayTimeline.jsx'
import MonthRollup from '../components/calendar/MonthRollup.jsx'
import { dayFromCorridorDay } from '../components/calendar/deptColors.js'

export default function BlockCalendar() {
  const { corridors, blocks, decideBlock, monthlyPlan, runSimulateMonthly, monthlyLoading } = useNiyantraData()
  const [view, setView] = useState('day')
  const [section, setSection] = useState(null)
  const [dayOffset, setDayOffset] = useState(0)

  const sections = useMemo(() => [...new Set(corridors.map((c) => c.section))], [corridors])

  useEffect(() => {
    if (!section && sections.length) setSection(sections[0])
  }, [sections, section])

  useEffect(() => {
    if (view === 'month' && !monthlyPlan) runSimulateMonthly()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const sectionCorridors = useMemo(
    () => corridors.filter((c) => c.section === section),
    [corridors, section]
  )

  // corridors for the currently selected section, ordered by their day offset
  const orderedDays = useMemo(() => {
    const uniqueDayKeys = [...new Set(sectionCorridors.map((c) => c.day))]
    return uniqueDayKeys
      .map((d) => dayFromCorridorDay(d))
      .sort((a, b) => a - b)
  }, [sectionCorridors])

  const dayDate = orderedDays.length ? orderedDays[((dayOffset % orderedDays.length) + orderedDays.length) % orderedDays.length] : new Date()

  const dayCorridorIds = useMemo(() => {
    if (!orderedDays.length) return new Set()
    const targetKey = dayDate.toDateString()
    return new Set(
      sectionCorridors.filter((c) => dayFromCorridorDay(c.day).toDateString() === targetKey).map((c) => c.corridor_id)
    )
  }, [sectionCorridors, dayDate, orderedDays])

  const dayBlocks = useMemo(
    () => blocks.filter((b) => dayCorridorIds.has(b.corridor_id)),
    [blocks, dayCorridorIds]
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 p-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Block Calendar</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-md border border-slate-200 bg-white p-0.5">
            <button
              onClick={() => setView('day')}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                view === 'day' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('month')}
              className={`rounded px-3 py-1 text-xs font-semibold ${
                view === 'month' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Month Rollup
            </button>
          </div>
          {view === 'day' && sections.length > 0 && (
            <select
              value={section || ''}
              onChange={(e) => {
                setSection(e.target.value)
                setDayOffset(0)
              }}
              className="focus-ring rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-900"
            >
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {view === 'day' ? (
        <DayTimeline
          section={section}
          date={dayDate}
          corridors={sectionCorridors.filter((c) => dayCorridorIds.has(c.corridor_id))}
          blocks={dayBlocks}
          onDecide={decideBlock}
          onPrevDay={() => setDayOffset((d) => d - 1)}
          onNextDay={() => setDayOffset((d) => d + 1)}
        />
      ) : (
        <MonthRollup plan={monthlyPlan} loading={monthlyLoading} onRefresh={runSimulateMonthly} />
      )}
    </div>
  )
}
