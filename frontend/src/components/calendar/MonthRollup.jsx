import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { getMonthStatsAndBlocks } from './blockDataGenerator.js'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getTagClass(type) {
  switch (type) {
    case 'orange':
      return 'bg-orange-100/70 border-l-[3px] border-orange-300 text-orange-800'
    case 'green':
      return 'bg-emerald-100/70 border-l-[3px] border-emerald-300 text-emerald-800'
    case 'yellow':
      return 'bg-yellow-100/70 border-l-[3px] border-yellow-300 text-yellow-800'
    case 'purple':
      return 'bg-purple-100/70 border-l-[3px] border-purple-300 text-purple-800'
    default:
      return 'bg-slate-100/70 border-l-[3px] border-slate-300 text-slate-800'
  }
}

export default function MonthRollup({ plan, monthLabel = '2026-09', onSelectDate, section = 'All' }) {
  const [initialYear, initialMonth] = monthLabel.split('-').map(Number)
  const [currentYear, setCurrentYear] = useState(initialYear || new Date().getFullYear())
  const [currentMonthIndex, setCurrentMonthIndex] = useState((initialMonth ? initialMonth - 1 : new Date().getMonth()))
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const dateObj = new Date(currentYear, currentMonthIndex, 1)
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const monthNameOnly = dateObj.toLocaleDateString('en-US', { month: 'long' })

  const handlePrevMonth = () => {
    if (currentMonthIndex === 0) {
      setCurrentMonthIndex(11)
      setCurrentYear((y) => y - 1)
    } else {
      setCurrentMonthIndex((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonthIndex === 11) {
      setCurrentMonthIndex(0)
      setCurrentYear((y) => y + 1)
    } else {
      setCurrentMonthIndex((m) => m + 1)
    }
  }

  // Get dynamic blocks & statistics for this specific month & section
  const { monthBlocks, stats } = useMemo(() => {
    return getMonthStatsAndBlocks(currentYear, currentMonthIndex + 1, section)
  }, [currentYear, currentMonthIndex, section])

  // Calculate calendar grid cells
  const cells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()
    
    // Previous month days to pad
    const prevMonthDays = new Date(currentYear, currentMonthIndex, 0).getDate()
    const firstWeekday = (new Date(currentYear, currentMonthIndex, 1).getDay() + 6) % 7 // Monday-first

    const list = []
    // pad start
    for (let i = 0; i < firstWeekday; i++) {
      const dayNum = prevMonthDays - firstWeekday + i + 1
      const prevDate = new Date(currentYear, currentMonthIndex - 1, dayNum)
      list.push({ day: dayNum, dateObj: prevDate, isCurrentMonth: false })
    }
    // current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(currentYear, currentMonthIndex, d)
      list.push({ day: d, dateObj: curDate, isCurrentMonth: true })
    }
    // pad end
    let nextDay = 1
    while (list.length % 7 !== 0) {
      const nextDate = new Date(currentYear, currentMonthIndex + 1, nextDay)
      list.push({ day: nextDay++, dateObj: nextDate, isCurrentMonth: false })
    }

    // Split into weeks
    const weeks = []
    for (let i = 0; i < list.length; i += 7) {
      weeks.push(list.slice(i, i + 7))
    }
    return weeks
  }, [currentYear, currentMonthIndex])

  return (
    <div className="flex flex-col gap-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Planned Blocks</p>
          <p className="text-3xl font-black text-[#1e3a8a]">{stats.plannedBlocks}</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">{stats.vsLastPlanText}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Coordinated Blocks</p>
          <p className="text-3xl font-black text-[#1e3a8a]">{stats.coordinatedBlocks}</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">{stats.coordinatedSubtext}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Critical Jobs Covered</p>
          <p className="text-3xl font-black text-orange-600">{stats.criticalCoverage}</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">Priority based</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Block Hours Saved</p>
          <p className="text-3xl font-black text-[#1e3a8a]">{stats.hoursSaved}</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">Through coordination</p>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Header with Navigation and Month Picker */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-[#FDF9F1] px-5 py-4 gap-3 relative">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Monthly Strategic Plan <span className="mx-1">•</span> {monthName}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Month & Year Selectors */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Calendar size={15} className="text-slate-500" />
                <span>{monthNameOnly} {currentYear}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-2xl">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Month ({currentYear})</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setCurrentYear(y => y - 1)}
                        className="px-2 py-0.5 text-xs font-bold text-slate-600 rounded hover:bg-slate-100"
                      >
                        {currentYear - 1}
                      </button>
                      <button
                        onClick={() => setCurrentYear(y => y + 1)}
                        className="px-2 py-0.5 text-xs font-bold text-slate-600 rounded hover:bg-slate-100"
                      >
                        {currentYear + 1}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {MONTH_NAMES.map((name, idx) => (
                      <button
                        key={name}
                        onClick={() => {
                          setCurrentMonthIndex(idx)
                          setIsDropdownOpen(false)
                        }}
                        className={`rounded-lg py-2 text-xs font-semibold transition-colors ${
                          idx === currentMonthIndex
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {name.slice(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-white">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={`px-3 py-2.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider ${i < 6 ? 'border-r border-slate-200' : ''}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="bg-slate-200 flex flex-col gap-[1px] border-b border-slate-200">
          {cells.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-[1px]">
              {week.map((cell, ci) => {
                const dayBlocks = cell.isCurrentMonth ? monthBlocks[cell.day] : null
                return (
                  <div
                    key={ci}
                    onClick={() => onSelectDate && onSelectDate(cell.dateObj)}
                    className="bg-white min-h-[110px] p-2 flex flex-col group transition-colors hover:bg-indigo-50/40 cursor-pointer"
                  >
                    <span className={`text-[13px] font-bold mb-1 ${cell.isCurrentMonth ? 'text-slate-900 group-hover:text-indigo-600' : 'text-slate-400'}`}>
                      {cell.day}
                    </span>
                    <div className="flex flex-col gap-1.5 mt-1">
                      {dayBlocks && dayBlocks.map((b, i) => (
                        <div
                          key={i}
                          className={`rounded-r-md px-2 py-1 text-[11px] font-bold truncate ${getTagClass(b.type)}`}
                          title={b.name}
                        >
                          {b.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
