import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrevDay}
            className="focus-ring flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            <ChevronLeft size={16} />
          </button>
          <h3 className="font-serif text-lg font-semibold text-slate-900">{date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</h3>
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
              className="h-2.5 w-2.5 rounded-sm"
              style={{
                backgroundImage: `repeating-linear-gradient(45deg, ${DEPT_COLOR.ENG} 0, ${DEPT_COLOR.ENG} 2px, ${DEPT_COLOR.TRD} 2px, ${DEPT_COLOR.TRD} 4px)`,
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
                  className="absolute -translate-x-1/2 text-[11px] text-slate-400"
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
                  className={`absolute top-1 flex h-10 items-center justify-center rounded-md border px-1 text-[11px] font-semibold ${
                    tr.isFreight
                      ? 'border-[#AB5A3E]/40 bg-[#FCFEDA] text-[#AB5A3E]'
                      : 'border-[#4863BC]/30 bg-[#DFEBFB] text-[#4863BC]'
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
                      className="focus-ring block w-full rounded-lg border-2 px-2 py-2 text-left text-[11px] font-semibold text-white shadow-card"
                      style={{
                        backgroundColor: isRejected ? '#94A3B8' : color,
                        backgroundImage: isPending
                          ? `repeating-linear-gradient(45deg, ${color} 0px, ${color} 8px, ${b.is_merged ? DEPT_COLOR.TRD : '#D9A62B'} 8px, ${b.is_merged ? DEPT_COLOR.TRD : '#D9A62B'} 16px)`
                          : 'none',
                        borderColor: b.status === 'approved' ? DEPT_COLOR.merged || '#10B981' : 'transparent',
                      }}
                    >
                      <p className="truncate">{b.is_merged ? `${b.departments.join('+')} Block` : `${b.departments[0]} Block`}</p>
                      <p className="text-[10px] font-normal opacity-90">
                        {b.status === 'approved' ? '✓ Approved' : b.status === 'rejected' ? '✕ Rejected' : 'Pending'}
                      </p>
                    </button>

                    <AnimatePresence>
                      {openBlockId === b.block_id && (
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.97 }}
                          transition={{ duration: 0.15 }}
                          className="absolute z-20 mt-1 w-56 rounded-2xl border border-slate-100 bg-white p-3 text-xs text-slate-600 shadow-card"
                        >
                          <p className="font-mono text-slate-900">{b.block_id}</p>
                          <p className="mt-1">{b.section} · {formatTimeOfDay(b.start_minute)}–{formatTimeOfDay(b.end_minute)}</p>
                          <p className="mt-1 text-slate-400">tasks: {b.task_ids.join(', ')}</p>
                          <p className="mt-1 text-slate-400">risk cleared: {b.total_risk_cleared?.toFixed?.(1) ?? b.total_risk_cleared}</p>
                          {b.status === 'pending' && (
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => { onDecide(b.block_id, 'approve'); setOpenBlockId(null) }}
                                className="flex-1 rounded-md bg-forest px-2 py-1 text-white hover:bg-forest-light"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => { onDecide(b.block_id, 'reject'); setOpenBlockId(null) }}
                                className="flex-1 rounded-md bg-severity-critical px-2 py-1 text-white hover:opacity-90"
                              >
                                Reject
                              </button>
                            </div>
                          )}
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
    <div className="flex border-b border-slate-50 last:border-0">
      <div className="flex w-24 shrink-0 items-center text-[11px] font-semibold tracking-wide text-slate-400">
        {label}
      </div>
      <div className={`relative flex-1 ${tall ? 'h-20' : 'h-14'}`}>
        {/* hour gridlines */}
        {HOURS.map((h) => (
          <div key={h} className="absolute top-0 h-full w-px bg-slate-50" style={{ left: `${pct(h)}%` }} />
        ))}
        {children}
      </div>
    </div>
  )
}
