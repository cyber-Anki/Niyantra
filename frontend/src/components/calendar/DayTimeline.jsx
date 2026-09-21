import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { DEPT_COLOR, blockPrimaryColor, formatTimeOfDay } from './deptColors.js'

const RANGE_START = 300 // 05:00
const RANGE_END = 1380 // 23:00
const HOURS = Array.from({ length: (RANGE_END - RANGE_START) / 60 + 1 }, (_, i) => RANGE_START + i * 60)

function pct(minute) {
  return ((minute - RANGE_START) / (RANGE_END - RANGE_START)) * 100
}

function seedFromString(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

function useSyntheticTraffic(dayKey, section) {
  return useMemo(() => {
    const seed = seedFromString(`${dayKey}-${section}`)
    const rand = (i) => {
      const x = Math.sin(seed + i * 999) * 10000
      return x - Math.floor(x)
    }
    const count = 4 + Math.floor(rand(0) * 2)
    const entries = []
    for (let i = 0; i < count; i++) {
      const start = RANGE_START + Math.floor(rand(i + 1) * ((RANGE_END - RANGE_START) / 60 - 2)) * 60
      const duration = 30 + Math.floor(rand(i + 5) * 4) * 15
      const isFreight = rand(i + 10) > 0.75
      entries.push({
        id: isFreight ? `FR-${8800 + Math.floor(rand(i + 20) * 200)}` : `TR-${12000 + Math.floor(rand(i + 20) * 20)}`,
        start,
        end: start + duration,
        isFreight,
      })
    }
    return entries.sort((a, b) => a.start - b.start)
  }, [dayKey, section])
}

export default function DayTimeline({ date, onPrevDay, onNextDay, blocks, section, onDecide }) {
  const [openBlockId, setOpenBlockId] = useState(null)
  const dayKey = date.toDateString()
  const traffic = useSyntheticTraffic(dayKey, section)

  const dayBlocks = blocks.filter((b) => b.start_minute >= RANGE_START - 240 && b.start_minute <= RANGE_END)

  return (
    <div className="rounded-2xl bg-[#FDF9F1] p-6 h-full relative overflow-hidden">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevDay}
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="font-serif text-2xl font-black text-[#1a2f24] tracking-tight">{date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
          <button
            onClick={onNextDay}
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <Legend swatch={DEPT_COLOR.ENG} label="ENG" />
          <Legend swatch={DEPT_COLOR.SNT} label="SNT" />
          <Legend swatch={DEPT_COLOR.TRD} label="TRD" />
          <span className="flex items-center gap-1.5">
            <span
              className="h-3 w-3 rounded-sm"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${DEPT_COLOR.ENG} 0, ${DEPT_COLOR.ENG} 6px, ${DEPT_COLOR.TRD} 6px, ${DEPT_COLOR.TRD} 12px)`,
              }}
            />
            Merged
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={dayKey}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18 }}
          className="overflow-x-auto"
        >
          <div className="min-w-[900px]">
            {/* hour ruler */}
            <div className="relative ml-24 h-6 border-b border-slate-100">
              {HOURS.map((h) => (
                <span
                  key={h}
                  className="absolute -translate-x-1/2 text-[10px] font-bold text-slate-400 font-mono"
                  style={{ left: `${pct(h)}%` }}
                >
                  {String(Math.floor(h / 60)).padStart(2, '0')}:00
                </span>
              ))}
            </div>

            {/* TRAFFIC row */}
            <Row label="TRAFFIC">
              {traffic.map((tr, i) => (
                <motion.div
                  key={tr.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, delay: i * 0.03 }}
                  title={`${tr.id} · ${formatTimeOfDay(tr.start)}–${formatTimeOfDay(tr.end)}`}
                  className={`absolute top-2 flex h-9 items-center justify-center rounded-lg px-2 text-[11px] font-bold shadow-sm ${
                    tr.isFreight
                      ? 'bg-[#FDF0E1] text-[#D88A58]'
                      : 'bg-[#E4EEFF] text-[#426BB4]'
                  }`}
                  style={{ left: `${pct(tr.start)}%`, width: `${pct(tr.end) - pct(tr.start)}%` }}
                >
                  <span className="truncate">{tr.id}</span>
                </motion.div>
              ))}
            </Row>

            {/* BLOCKS row */}
            <Row label="BLOCKS" tall>
              {dayBlocks.map((b, i) => {
                const color = blockPrimaryColor(b.departments)
                const isPending = b.status === 'pending'
                const isRejected = b.status === 'rejected'
                return (
                  <motion.div
                    key={b.block_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.04 }}
                    className="absolute top-2"
                    style={{ left: `${pct(b.start_minute)}%`, width: `${Math.max(pct(b.end_minute) - pct(b.start_minute), 6)}%` }}
                  >
                    <button
                      onClick={() => setOpenBlockId(openBlockId === b.block_id ? null : b.block_id)}
                      className={`focus-ring block w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-white shadow-md transition-transform hover:scale-[1.01] ${b.status === 'approved' ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
                      style={{
                        backgroundColor: isRejected ? '#94A3B8' : color,
                        backgroundImage: b.is_merged
                          ? `repeating-linear-gradient(45deg, ${DEPT_COLOR.ENG} 0px, ${DEPT_COLOR.ENG} 12px, ${DEPT_COLOR.TRD} 12px, ${DEPT_COLOR.TRD} 24px)`
                          : 'none',
                      }}
                    >
                      <p className="truncate">{b.is_merged ? `${b.departments.join('+')} Block` : `${b.departments[0]} Block`}</p>
                      <p className="text-[10px] font-medium opacity-90 mt-0.5">
                        {b.status === 'approved' ? '✓ Approved' : b.status === 'rejected' ? '✕ Rejected' : 'Pending'}
                      </p>
                    </button>

                    <AnimatePresence>
                      {openBlockId === b.block_id && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="fixed right-0 top-0 z-50 flex h-full w-80 flex-col bg-[#FDF9F1] shadow-2xl border-l border-slate-200/60"
                        >
                          <div className="flex items-center justify-between bg-[#0A261A] p-5 text-white">
                            <h2 className="font-serif text-xl font-bold tracking-tight">Block Details</h2>
                            <button onClick={() => setOpenBlockId(null)} className="text-white/70 hover:text-white transition">
                              <X size={20} />
                            </button>
                          </div>
                          <div className="flex-1 overflow-y-auto p-5">
                            <div className="mb-6">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</span>
                              <div className="mt-1">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${b.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : b.status === 'rejected' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-6">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Timing</span>
                              <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                                {formatTimeOfDay(b.start_minute)} - {formatTimeOfDay(b.end_minute)}
                              </p>
                            </div>

                            <div className="mb-6">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Departments</span>
                              <div className="mt-1 flex gap-2">
                                {b.departments.map(d => (
                                  <span key={d} className="rounded-md px-2 py-1 text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: DEPT_COLOR[d] || '#8B5CF6' }}>
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Reasoning</span>
                              <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
                                Dedicated power block required for urgent rectifications in this section. Ensures safe execution of tasks while minimizing traffic disruption.
                              </p>
                            </div>

                            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Linked Tasks</span>
                              <div className="mt-2 space-y-2">
                                {b.task_ids.map(tid => (
                                  <div key={tid} className="border-l-2 border-slate-300 pl-3">
                                    <p className="font-bold text-slate-800 text-sm">{tid}</p>
                                    <p className="text-xs text-slate-500 font-medium">Scheduled task</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {b.status === 'pending' && (
                              <div className="mt-8 flex gap-3">
                                <button
                                  onClick={() => { onDecide(b.block_id, 'approve'); setOpenBlockId(null) }}
                                  className="flex-1 rounded-xl bg-[#0A261A] px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#133c2a]"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => { onDecide(b.block_id, 'reject'); setOpenBlockId(null) }}
                                  className="flex-1 rounded-xl bg-white border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })}
            </Row>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function Legend({ swatch, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: swatch }} />
      {label}
    </span>
  )
}

function Row({ label, children, tall }) {
  return (
    <div className="flex border-b border-slate-200/50 last:border-0 relative">
      <div className="flex w-24 shrink-0 items-center text-[11px] font-bold tracking-widest text-slate-500">
        {label}
      </div>
      <div className={`relative flex-1 ${tall ? 'h-20' : 'h-14'}`}>
        {/* hour gridlines */}
        {HOURS.map((h) => (
          <div key={h} className="absolute top-0 h-full w-px bg-slate-200/50" style={{ left: `${pct(h)}%` }} />
        ))}
        {children}
      </div>
    </div>
  )
}
