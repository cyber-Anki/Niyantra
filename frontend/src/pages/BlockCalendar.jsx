import { useEffect, useMemo, useState } from 'react'
import { useNiyantraData } from '../store/DataContext.jsx'
import DayTimeline from '../components/calendar/DayTimeline.jsx'
import WeekRollup from '../components/calendar/WeekRollup.jsx'
import MonthRollup from '../components/calendar/MonthRollup.jsx'
import { dayFromCorridorDay } from '../components/calendar/deptColors.js'
import { getBlocksForDay } from '../components/calendar/blockDataGenerator.js'
import { useTranslation } from '../store/TranslationContext.jsx'
import { Calendar as CalendarIcon } from 'lucide-react'

export default function BlockCalendar({ userContext }) {
  const { corridors, blocks, decideBlock, submitBlockFlag, monthlyPlan, runSimulateMonthly, monthlyLoading } = useNiyantraData()
  const { t } = useTranslation()
  const [view, setView] = useState('day')
  const [section, setSection] = useState('NDLS-GZB')
  const [selectedDate, setSelectedDate] = useState(() => new Date())
  const [userDecisions, setUserDecisions] = useState({})

  const sections = useMemo(() => {
    const list = [...new Set(corridors.map((c) => c.section))]
    return list.length > 0 ? list : ['NDLS-GZB', 'GZB-MB', 'NDLS-PWL', 'PWL-MTJ', 'MB-SRE']
  }, [corridors])

  useEffect(() => {
    if (!section && sections.length) setSection(sections[0])
  }, [sections, section])

  useEffect(() => {
    if (view === 'month' && !monthlyPlan) runSimulateMonthly()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view])

  const sectionCorridors = useMemo(
    () => section === 'All' ? corridors : corridors.filter((c) => c.section === section),
    [corridors, section]
  )

  // Find blocks for selected date
  const dayBlocks = useMemo(() => {
    const targetKey = selectedDate.toDateString()

    // 1. Try finding blocks from backend store
    const storeMatchingBlocks = blocks.filter((b) => {
      const c = sectionCorridors.find((c) => c.corridor_id === b.corridor_id)
      if (c && c.day) {
        return dayFromCorridorDay(c.day).toDateString() === targetKey
      }
      return false
    })

    // 2. If store has blocks for this day, use them; otherwise generate realistic blocks
    const rawBlocks = storeMatchingBlocks.length > 0 
      ? storeMatchingBlocks 
      : getBlocksForDay(selectedDate, section)

    // 3. Apply any user decisions/flags
    return rawBlocks.map((b) => {
      if (userDecisions[b.block_id]) {
        return { ...b, status: userDecisions[b.block_id] }
      }
      return b
    })
  }, [selectedDate, section, blocks, sectionCorridors, userDecisions])

  const handlePrevDay = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1))
  }

  const handleNextDay = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1))
  }

  const handlePrevWeek = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7))
  }

  const handleNextWeek = () => {
    setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7))
  }

  const handleSelectDate = (date) => {
    setSelectedDate(date)
    setView('day')
  }

  const handleDecide = async (blockId, action) => {
    setUserDecisions((prev) => ({
      ...prev,
      [blockId]: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'flagged'
    }))
    try {
      await decideBlock(blockId, action)
    } catch {
      // Keep local state for mock/dynamically generated blocks
    }
  }

  const handleFlag = (block, reason) => {
    setUserDecisions((prev) => ({
      ...prev,
      [block.block_id]: 'flagged'
    }))
    if (submitBlockFlag) {
      submitBlockFlag(block.block_id, reason, block.departments?.[0])
    }
  }

  const formattedInputDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`

  return (
    <div className="bg-white/60 dark:bg-[#0B1120]/60 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-xl min-h-full transition-colors overflow-hidden">
      <div className="border-b border-slate-200/60 dark:border-white/10 p-6 flex flex-wrap items-center justify-between gap-4 bg-transparent">
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black text-black dark:text-amber-500">{t('bc.title')}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Timeline & possessions for {section === 'All' ? 'All Sections' : section}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Date Selector */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-1.5 shadow-sm dark:bg-black/40 dark:border-white/10">
            <CalendarIcon size={16} className="text-slate-500" />
            <input
              type="date"
              value={formattedInputDate}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number)
                  setSelectedDate(new Date(y, m - 1, d))
                }
              }}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            />
          </div>

          {/* View Toggle */}
          <div className="flex rounded-xl border border-slate-200 bg-white/50 p-1 backdrop-blur-sm shadow-inner dark:bg-black/30 dark:border-white/10">
            <button
              onClick={() => setView('day')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === 'day' ? 'bg-indigo-600 dark:bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-amber-500'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === 'week' ? 'bg-indigo-600 dark:bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-amber-500'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                view === 'month' ? 'bg-indigo-600 dark:bg-amber-500 text-white shadow-md' : 'text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-amber-500'
              }`}
            >
              Month
            </button>
          </div>

          {/* Section Selector */}
          {sections.length > 0 && (
            <select
              value={section || ''}
              onChange={(e) => setSection(e.target.value)}
              className="focus-ring rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:bg-black/40 dark:border-white/10 dark:text-slate-200"
            >
              <option value="All">All Sections</option>
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
            date={selectedDate}
            blocks={dayBlocks}
            onDecide={handleDecide}
            submitBlockFlag={handleFlag}
            userContext={userContext}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
          />
        ) : view === 'week' ? (
          <WeekRollup
            section={section}
            date={selectedDate}
            sectionCorridors={sectionCorridors}
            blocks={blocks}
            onDecide={handleDecide}
            submitBlockFlag={handleFlag}
            userContext={userContext}
            onDaySelect={handleSelectDate}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
          />
        ) : (
          <MonthRollup
            plan={monthlyPlan}
            loading={monthlyLoading}
            monthLabel={`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`}
            section={section}
            onSelectDate={handleSelectDate}
            onRefresh={runSimulateMonthly}
          />
        )}
      </div>
    </div>
  )
}
