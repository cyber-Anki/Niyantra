import { useMemo } from 'react'

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

// Static mock data for blocks to match reference image exactly
const MOCK_BLOCKS = {
  1: [{ name: 'Track inspection', type: 'orange' }],
  3: [{ name: 'Signal testing', type: 'green' }],
  7: [{ name: 'Rail grinding', type: 'orange' }],
  9: [{ name: 'OHE inspection', type: 'yellow' }],
  11: [{ name: 'Track + S&T', type: 'purple' }],
  14: [{ name: 'Track + S&T', type: 'purple' }],
  15: [{ name: 'Signal upgrade', type: 'green' }],
  16: [{ name: 'Track renewal', type: 'orange' }],
  17: [{ name: 'OHE work', type: 'yellow' }],
  18: [{ name: 'Track + TRD', type: 'purple' }],
  21: [{ name: 'Bridge inspection', type: 'orange' }],
  22: [{ name: 'Cable testing', type: 'green' }],
  24: [{ name: 'S&T + TRD', type: 'purple' }],
  28: [{ name: 'Power equipment', type: 'yellow' }],
  30: [{ name: 'Monthly catch-up', type: 'purple' }],
}

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

export default function MonthRollup({ plan, monthLabel = '2026-09' }) {
  const [yearStr, monthStr] = monthLabel.split('-')
  const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, 1)
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const monthNameOnly = dateObj.toLocaleDateString('en-US', { month: 'long' })

  // Calculate calendar grid cells
  const cells = useMemo(() => {
    const year = Number(yearStr)
    const month = Number(monthStr) - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    // Previous month days to pad
    const prevMonthDays = new Date(year, month, 0).getDate()
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7 // Monday-first

    const list = []
    // pad start
    for (let i = 0; i < firstWeekday; i++) {
      list.push({ day: prevMonthDays - firstWeekday + i + 1, isCurrentMonth: false })
    }
    // current month days
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ day: d, isCurrentMonth: true })
    }
    // pad end
    let nextDay = 1
    while (list.length % 7 !== 0) {
      list.push({ day: nextDay++, isCurrentMonth: false })
    }

    // Split into weeks
    const weeks = []
    for (let i = 0; i < list.length; i += 7) {
      weeks.push(list.slice(i, i + 7))
    }
    return weeks
  }, [yearStr, monthStr])

  return (
    <div className="flex flex-col gap-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Planned Blocks</p>
          <p className="text-3xl font-black text-[#1e3a8a]">18</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">↓ 4 vs last plan</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Coordinated Blocks</p>
          <p className="text-3xl font-black text-[#1e3a8a]">7</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">2 departments merged</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Critical Jobs Covered</p>
          <p className="text-3xl font-black text-orange-600">92%</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">Priority based</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">Block Hours Saved</p>
          <p className="text-3xl font-black text-[#1e3a8a]">11.5h</p>
          <p className="mt-1 text-[13px] font-medium text-slate-500">Through coordination</p>
        </div>
      </div>

      {/* Main Calendar Grid */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#FDF9F1] px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Monthly Strategic Plan <span className="mx-1">•</span> {monthName}
          </h3>
          <div className="flex items-center gap-1 text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-700">
            <span className="text-[10px]">▼</span> {monthNameOnly} <span className="text-[10px]">▼</span>
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
                const blocks = cell.isCurrentMonth ? MOCK_BLOCKS[cell.day] : null
                return (
                  <div key={ci} className="bg-white min-h-[110px] p-2 flex flex-col group transition-colors hover:bg-slate-50">
                    <span className={`text-[13px] font-bold mb-1 ${cell.isCurrentMonth ? 'text-slate-900' : 'text-slate-400'}`}>
                      {cell.day}
                    </span>
                    <div className="flex flex-col gap-1.5 mt-1">
                      {blocks && blocks.map((b, i) => (
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

