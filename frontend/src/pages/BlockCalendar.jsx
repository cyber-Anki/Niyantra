import { useEffect, useMemo, useState } from 'react'
import { useNiyantraData } from '../store/DataContext.jsx'
import DayTimeline from '../components/calendar/DayTimeline.jsx'
import MonthRollup from '../components/calendar/MonthRollup.jsx'
import { dayFromCorridorDay } from '../components/calendar/deptColors.js'
import { useTranslation } from '../store/TranslationContext.jsx'

export default function BlockCalendar() {
  const { corridors, blocks, decideBlock, monthlyPlan, runSimulateMonthly, monthlyLoading } = useNiyantraData()
  const { t } = useTranslation()
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
    <div className="bg-[#FDF9F1] rounded-3xl border border-slate-200/60 shadow-xl min-h-full transition-colors overflow-hidden">
      <div className="border-b border-slate-200/60 p-6 flex flex-wrap items-center justify-between gap-3 bg-[#FDF9F1]">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-[#1a2f24]">{t('bc.title')}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Timeline & possessions for {section}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl border border-slate-200 bg-white/50 p-1 backdrop-blur-sm shadow-inner">
            <button
              onClick={() => setView('day')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === 'day' ? 'bg-[#1a2f24] text-white shadow-md' : 'text-slate-600 hover:text-[#1a2f24]'
              }`}
            >
              {t('bc.day')}
            </button>
            <button
              onClick={() => setView('month')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === 'month' ? 'bg-[#1a2f24] text-white shadow-md' : 'text-slate-600 hover:text-[#1a2f24]'
              }`}
            >
              {t('bc.month_rollup')}
            </button>
          </div>
          {view === 'day' && sections.length > 0 && (
            <select
              value={section || ''}
              onChange={(e) => {
                setSection(e.target.value)
                setDayOffset(0)
              }}
              className="focus-ring rounded-xl border border-slate-200 bg-white/50 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm"
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

      <div className="p-6">

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
    </div>
  )
}
