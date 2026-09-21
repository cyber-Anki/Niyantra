import { useMemo, useState } from 'react'
import { GitMerge, Users, AlertOctagon, Check, Scissors, ShieldAlert, Flag } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import { formatTimeOfDay } from '../components/calendar/deptColors.js'

export default function ConflictResolution({ setPage }) {
  const { rankedTasks, tasks, blocks, unscheduledTaskIds, decideBlock, flaggedTaskIds, toggleFlag } = useNiyantraData()
  const [escalated, setEscalated] = useState(() => new Set())
  const [accepted, setAccepted] = useState(() => new Set())

  const taskById = useMemo(() => {
    const map = {}
    ;(rankedTasks.length ? rankedTasks : tasks).forEach((t) => { map[t.task_id] = t })
    return map
  }, [rankedTasks, tasks])

  const mergedBlocks = useMemo(() => blocks.filter((b) => b.is_merged && b.task_ids.length > 1), [blocks])

  const capacityConflicts = useMemo(() => {
    const bySection = {}
    unscheduledTaskIds.forEach((tid) => {
      const task = taskById[tid]
      if (!task) return
      bySection[task.section] = bySection[task.section] || { section: task.section, losers: [] }
      bySection[task.section].losers.push(task)
    })
    return Object.values(bySection).map((group) => {
      const winners = blocks
        .filter((b) => b.section === group.section)
        .flatMap((b) => b.task_ids.map((tid) => taskById[tid]).filter(Boolean))
        .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
        .slice(0, 3)
      return { ...group, winners, losers: group.losers.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)) }
    })
  }, [unscheduledTaskIds, taskById, blocks])

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm min-h-full">
      <div className="border-b border-slate-200 p-5 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-900">Conflict Resolution</h2>
        <p className="mt-1 text-xs text-slate-500">
          Overlapping requests for the same section/time window, and merged blocks awaiting sign-off
        </p>
      </div>

      <div className="p-5">
        <section className="mb-10">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
            <GitMerge size={16} className="text-amber-600" /> Merged blocks under review
          </h3>
          {mergedBlocks.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 border border-slate-200 bg-slate-50">
              No cross-department merges pending review this week.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {mergedBlocks.map((b) => (
                <div key={b.block_id} className="border border-slate-200 bg-white">
                  <div className="flex items-center justify-between bg-slate-100 px-4 py-2 border-b border-slate-200">
                    <span className="font-mono text-xs font-semibold text-slate-600">{b.block_id}</span>
                    <span className="bg-amber-100 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                      {b.section} · {formatTimeOfDay(b.start_minute)}–{formatTimeOfDay(b.end_minute)}
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    {b.task_ids.map((tid) => {
                      const t = taskById[tid]
                      if (!t) return null
                      return (
                        <div key={tid} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                          <div>
                            <p className="font-mono text-xs text-slate-900 font-semibold">{tid}</p>
                            <p className="text-[11px] capitalize text-slate-500">
                              {t.department} · {t.defect_type.replaceAll('_', ' ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <SeverityBadge severity={t.severity} />
                            {b.task_ids.length > 1 && (
                              <button
                                onClick={() => decideBlock(b.block_id, 'remove_task', { task_id: tid })}
                                title="Split this task out into its own review"
                                className="focus-ring flex items-center gap-1 border border-slate-300 px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-600 hover:bg-slate-50"
                              >
                                <Scissors size={10} /> Split out
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex gap-2">
                    <button
                      onClick={() => decideBlock(b.block_id, 'approve')}
                      disabled={b.status !== 'pending'}
                      className="focus-ring flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800er disabled:opacity-40"
                    >
                      <Check size={13} /> {b.status === 'approved' ? 'Approved' : 'Accept AI merge'}
                    </button>
                    <button
                      onClick={() => setEscalated((prev) => new Set(prev).add(b.block_id))}
                      className={`focus-ring flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold ${
                        escalated.has(b.block_id) ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <ShieldAlert size={13} /> {escalated.has(b.block_id) ? 'Escalated to DRM' : 'Escalate to DRM'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
            <Users size={16} className="text-amber-600" /> Capacity conflicts — tasks bumped this week
          </h3>
          {capacityConflicts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 border border-slate-200 bg-slate-50">
              Every task fit into this week's corridor windows — no capacity conflicts.
            </div>
          ) : (
            <div className="space-y-6">
              {capacityConflicts.map((group) => (
                <div key={group.section} className="border border-slate-200 bg-white">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <AlertOctagon size={14} className="text-amber-600" /> {group.section}
                    <span className="font-normal text-slate-500 text-xs ml-2">
                      ({group.losers.length} rolled forward to next week)
                    </span>
                  </div>
                  
                  {/* Side-by-side comparison table */}
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <div className="p-4 bg-red-50/30">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-red-700 border-b border-red-100 pb-1">Bumped (Lost Slot)</p>
                      <div className="space-y-2">
                        {group.losers.map((t) => (
                          <div key={t.task_id} className="flex flex-col gap-1 border border-red-100 bg-white p-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-slate-900">{t.task_id}</span>
                              <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold">Score: {t.risk_score}</span>
                            </div>
                            <span className="text-[11px] text-slate-600 capitalize">{t.department} · {t.defect_type.replaceAll('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-green-50/30">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-green-700 border-b border-green-100 pb-1">Won Slot Instead</p>
                      <div className="space-y-2">
                        {group.winners.length === 0 && <p className="text-xs text-slate-500">No blocks scheduled here yet.</p>}
                        {group.winners.map((t) => (
                          <div key={t.task_id} className="flex flex-col gap-1 border border-green-100 bg-white p-2">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-slate-900">{t.task_id}</span>
                              <span className="text-[10px] bg-green-100 text-green-800 px-1.5 py-0.5 rounded font-bold">Score: {t.risk_score}</span>
                            </div>
                            <span className="text-[11px] text-slate-600 capitalize">{t.department} · {t.defect_type.replaceAll('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setAccepted((prev) => {
                        const next = new Set(prev)
                        group.losers.forEach((t) => next.add(t.task_id))
                        return next
                      })}
                      className="focus-ring flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      <Check size={13} /> Accept AI resolution
                    </button>
                    <button
                      onClick={() => group.losers.forEach((t) => toggleFlag(t.task_id))}
                      className="focus-ring flex items-center gap-1.5 border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-100"
                    >
                      <Flag size={13} /> Flag section for manual review
                    </button>
                    <button
                      onClick={() => setPage?.('priority')}
                      className="focus-ring ml-auto text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 hover:underline"
                    >
                      View in Queue &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
