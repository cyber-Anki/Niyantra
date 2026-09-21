import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { DEPT_COLOR, blockPrimaryColor, formatTimeOfDay } from './deptColors.js'

const RANGE_START = 0 // 00:00
const RANGE_END = 1440 // 24:00
const HOURS = Array.from({ length: 25 }, (_, i) => i * 60)

function pct(minute) {
  const m = Math.max(RANGE_START, Math.min(minute, RANGE_END))
  return ((m - RANGE_START) / (RANGE_END - RANGE_START)) * 100
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
    const count = 5 + Math.floor(rand(0) * 3)
    const entries = []
    for (let i = 0; i < count; i++) {
      const start = 240 + Math.floor(rand(i + 1) * ((1320 - 240) / 60)) * 60
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

export default function DayTimeline({ date, onPrevDay, onNextDay, blocks, section, onDecide, userContext, submitBlockFlag }) {
  const [openBlockId, setOpenBlockId] = useState(null)
  const [flagReason, setFlagReason] = useState('')
  const [isFlagging, setIsFlagging] = useState(false)
  const dayKey = date.toDateString()
  const traffic = useSyntheticTraffic(dayKey, section)

  const dayBlocks = blocks.filter((b) => b.start_minute >= 0 && b.start_minute <= 1440)

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
            <div className="relative ml-24 h-6 border-b border-slate-200/60 mb-1">
              {HOURS.filter((_, idx) => idx % 2 === 0).map((h) => (
                <span
                  key={h}
                  className="absolute -translate-x-1/2 text-xs font-bold text-slate-400 font-mono"
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
                  className={`absolute top-2.5 flex h-9 items-center justify-center rounded-lg px-2 text-xs font-bold shadow-sm ${
                    tr.isFreight
                      ? 'bg-[#FDF0E1] text-[#D88A58]'
                      : 'bg-[#E4EEFF] text-[#426BB4]'
                  }`}
                  style={{ left: `${pct(tr.start)}%`, width: `${Math.max(pct(tr.end) - pct(tr.start), 4)}%` }}
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
                const blockLeft = pct(b.start_minute)
                const blockWidth = Math.max(pct(b.end_minute) - blockLeft, 6)
                return (
                  <motion.div
                    key={b.block_id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22, delay: i * 0.04 }}
                    className="absolute top-2"
                    style={{ left: `${blockLeft}%`, width: `${blockWidth}%` }}
                  >
                    <button
                      onClick={() => {
                        setOpenBlockId(openBlockId === b.block_id ? null : b.block_id)
                        setIsFlagging(false)
                        setFlagReason('')
                      }}
                      className={`focus-ring block w-full rounded-xl px-3 py-2 text-left text-xs font-bold text-white shadow-md transition-transform hover:scale-[1.01] ${b.status === 'approved' ? 'ring-2 ring-emerald-400 ring-offset-1' : ''}`}
                      style={{
                        backgroundColor: isRejected ? '#94A3B8' : color,
                        backgroundImage: b.is_merged
                          ? `repeating-linear-gradient(45deg, ${DEPT_COLOR.ENG} 0px, ${DEPT_COLOR.ENG} 12px, ${DEPT_COLOR.TRD} 12px, ${DEPT_COLOR.TRD} 24px)`
                          : 'none',
                      }}
                    >
                      <p className="truncate">{b.is_merged ? `${b.departments.join('+')} Block` : `${b.departments[0]} Block`}</p>
                      <p className="text-xs font-medium opacity-90 mt-0.5">
                        {b.status === 'approved' ? '✓ Approved' : b.status === 'rejected' ? '✕ Rejected' : b.status === 'flagged' ? '⚑ Flagged' : 'Pending'}
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
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Status</span>
                              <div className="mt-1">
                                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${b.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : b.status === 'rejected' ? 'bg-slate-200 text-slate-600' : b.status === 'flagged' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {b.status}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mb-6">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Timing</span>
                              <p className="mt-1 font-mono text-sm font-semibold text-slate-700">
                                {formatTimeOfDay(b.start_minute)} - {formatTimeOfDay(b.end_minute)}
                              </p>
                            </div>

                            <div className="mb-6">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Departments</span>
                              <div className="mt-1 flex gap-2">
                                {b.departments.map(d => (
                                  <span key={d} className="rounded-md px-2.5 py-1 text-xs font-bold text-white shadow-sm" style={{ backgroundColor: DEPT_COLOR[d] || '#8B5CF6' }}>
                                    {d}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">AI Reasoning</span>
                              <p className="mt-2 text-sm text-slate-600 font-medium leading-relaxed">
                                {b.is_merged 
                                  ? `Merged ${b.task_ids.length} tasks across ${b.departments.join(' and ')} to optimize track possession and minimize overall traffic downtime by 40 minutes.`
                                  : `Dedicated power block required for urgent rectifications by ${b.departments[0]}. Ensures safe execution of tasks while minimizing traffic disruption.`}
                              </p>
                            </div>

                            <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm border border-slate-100">
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Linked Tasks</span>
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
                              <div className="border-t border-slate-200 pt-4 flex flex-col gap-2">
                                {!isFlagging ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        onDecide(b.block_id, 'approve')
                                        setOpenBlockId(null)
                                      }}
                                      className="focus-ring flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm"
                                    >
                                      Approve Block
                                    </button>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                      <button
                                        onClick={() => setIsFlagging(true)}
                                        className="focus-ring flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                                      >
                                        Flag Block
                                      </button>
                                      <button
                                        onClick={() => {
                                          onDecide(b.block_id, 'reject')
                                          setOpenBlockId(null)
                                        }}
                                        className="focus-ring flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                                      >
                                        Reject Block
                                      </button>
                                    </div>
                                  </>
                                ) : (
                                  <div className="space-y-3 bg-amber-50/60 p-4 rounded-xl border border-amber-200">
                                    <p className="text-xs font-bold text-amber-900">Reason for Flagging:</p>
                                    <textarea
                                      value={flagReason}
                                      onChange={(e) => setFlagReason(e.target.value)}
                                      placeholder="e.g. Traffic conflict, resource unavailability..."
                                      className="focus-ring w-full rounded-lg border border-amber-300 bg-white p-2 text-xs text-slate-800 outline-none"
                                      rows={3}
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          if (submitBlockFlag && flagReason.trim()) {
                                            submitBlockFlag(b, flagReason.trim())
                                          } else if (onDecide) {
                                            onDecide(b.block_id, 'flag')
                                          }
                                          setIsFlagging(false)
                                          setOpenBlockId(null)
                                        }}
                                        disabled={!flagReason.trim()}
                                        className="focus-ring flex-1 rounded-lg bg-amber-600 py-2 text-xs font-bold text-white transition hover:bg-amber-700 disabled:opacity-50"
                                      >
                                        Submit Flag
                                      </button>
                                      <button
                                        onClick={() => setIsFlagging(false)}
                                        className="focus-ring rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
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
    <div className="flex border-b border-slate-200/50 last:border-0 relative items-center">
      <div className="flex w-24 shrink-0 items-center text-xs font-bold tracking-widest text-slate-600 pr-4 z-10 bg-[#FDF9F1]">
        {label}
      </div>
      <div className={`relative flex-1 ${tall ? 'h-24' : 'h-16'}`}>
        {/* hour gridlines */}
        {HOURS.map((h) => (
          <div key={h} className="absolute top-0 h-full w-px bg-slate-200/50 pointer-events-none" style={{ left: `${pct(h)}%` }} />
        ))}
        {children}
      </div>
    </div>
  )
}
