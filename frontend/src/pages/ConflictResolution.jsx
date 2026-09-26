import { useMemo, useState } from 'react'
import { GitMerge, Users, AlertOctagon, Check, Scissors, ShieldAlert, Flag } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import { formatTimeOfDay } from '../components/calendar/deptColors.js'
import { useTranslation } from '../store/TranslationContext.jsx'

export default function ConflictResolution({ setPage }) {
  const { rankedTasks, tasks, blocks, unscheduledTaskIds, decideBlock, flaggedTaskIds, toggleFlag } = useNiyantraData()
  const { t } = useTranslation()
  const [escalated, setEscalated] = useState(() => new Set())
  const [accepted, setAccepted] = useState(() => new Set())

  const taskById = useMemo(() => {
    const map = {}
    ;((rankedTasks && rankedTasks.length) ? rankedTasks : (tasks || [])).forEach((t) => { map[t.task_id] = t })
    return map
  }, [rankedTasks, tasks])

  const mergedBlocks = useMemo(() => (blocks || []).filter((b) => b.is_merged && b.task_ids?.length > 1), [blocks])

  const capacityConflicts = useMemo(() => {
    const bySection = {}
    ;(unscheduledTaskIds || []).forEach((tid) => {
      const task = taskById[tid]
      if (!task) return
      bySection[task.section] = bySection[task.section] || { section: task.section, losers: [] }
      bySection[task.section].losers.push(task)
    })
    return Object.values(bySection).map((group) => {
      const winners = (blocks || [])
        .filter((b) => b.section === group.section)
        .flatMap((b) => b.task_ids?.map((tid) => taskById[tid]).filter(Boolean) || [])
        .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
        .slice(0, 3)
      return { ...group, winners, losers: group.losers.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0)) }
    })
  }, [unscheduledTaskIds, taskById, blocks])

  return (
    <div className="bg-[#FDF9F1] rounded-3xl min-h-full overflow-hidden pb-6">
      <div className="p-6">
        <h2 className="text-3xl font-serif font-black text-[#1a2f24] tracking-tight">{t('cr.title')}</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          {t('cr.subtitle')}
        </p>
      </div>

      <div className="px-6">
        <section className="mb-10">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 tracking-tight pb-3">
            <GitMerge size={18} className="text-[#1a2f24]" /> {t('cr.merged_blocks')}
          </h3>
          {mergedBlocks.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500 border border-slate-200 bg-white rounded-2xl shadow-sm">
              {t('cr.no_merged')}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {mergedBlocks.map((b) => (
                <div key={b.block_id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-transform hover:-translate-y-1 flex flex-col">
                  <div className="flex items-center justify-between bg-slate-50 px-5 py-3 border-b border-slate-200">
                    <span className="font-mono text-xs font-bold text-slate-700">{b.block_id}</span>
                    <span className="bg-[#FDF9F1] border border-slate-200 px-2 py-0.5 rounded text-xs font-bold text-[#1a2f24]">
                      {b.section} · {formatTimeOfDay(b.start_minute)}–{formatTimeOfDay(b.end_minute)}
                    </span>
                  </div>
                  <div className="p-5 space-y-3 flex-1">
                    {b.task_ids?.map((tid) => {
                      const t = taskById[tid]
                      if (!t) return null
                      return (
                        <div key={tid} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-mono text-xs text-slate-900 font-bold">{tid}</p>
                            <p className="text-[11px] capitalize text-slate-500 font-semibold">
                              {t.department} · {String(t.defect_type || '').replaceAll('_', ' ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <SeverityBadge severity={t.severity} />
                            {b.task_ids?.length > 1 && (
                              <button
                                onClick={() => decideBlock(b.block_id, 'remove_task', { task_id: tid })}
                                title="Split this task out into its own review"
                                className="focus-ring flex items-center gap-1 border border-slate-200 rounded-lg px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <Scissors size={12} /> {t('cr.split_out')}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap gap-2">
                    <button
                      onClick={() => decideBlock(b.block_id, 'approve')}
                      disabled={b.status !== 'pending'}
                      className="focus-ring flex items-center gap-1.5 bg-[#1a2f24] rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:bg-[#2c4731] disabled:opacity-40 shadow-sm"
                    >
                      <Check size={14} /> {b.status === 'approved' ? t('cr.approved') : t('cr.accept_ai')}
                    </button>
                    <button
                      onClick={() => setEscalated((prev) => new Set(prev).add(b.block_id))}
                      className={`focus-ring flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-colors shadow-sm ${
                        escalated.has(b.block_id) ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <ShieldAlert size={14} /> {escalated.has(b.block_id) ? t('cr.escalated') : t('cr.escalate')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 tracking-tight pb-3">
            <Users size={18} className="text-[#1a2f24]" /> {t('cr.capacity_conflicts')}
          </h3>
          {capacityConflicts.length === 0 ? (
            <div className="p-8 text-center text-sm font-medium text-slate-500 border border-slate-200 bg-white rounded-2xl shadow-sm">
              {t('cr.no_capacity')}
            </div>
          ) : (
            <div className="space-y-6">
              {capacityConflicts.map((group) => (
                <div key={group.section} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <AlertOctagon size={16} className="text-[#1a2f24]" /> {group.section}
                    <span className="font-semibold text-slate-500 text-xs ml-2">
                      ({group.losers.length} rolled forward to next week)
                    </span>
                  </div>
                  
                  {/* Side-by-side comparison table */}
                  <div className="grid grid-cols-2 divide-x divide-slate-200">
                    <div className="p-4 bg-red-50/50">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-red-700 border-b border-red-200/50 pb-1">{t('cr.bumped')}</p>
                      <div className="space-y-2">
                        {group.losers.map((t) => (
                          <div key={t.task_id} className="flex flex-col gap-1 rounded-xl border border-red-200 bg-white p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-slate-900">{t.task_id}</span>
                              <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">{t('cr.score')}: {t.risk_score}</span>
                            </div>
                            <span className="text-[11px] text-slate-600 font-semibold capitalize">{t.department} · {String(t.defect_type || '').replaceAll('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50/50">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-200/50 pb-1">{t('cr.won')}</p>
                      <div className="space-y-2">
                        {group.winners.length === 0 && <p className="text-xs font-medium text-slate-500">No blocks scheduled here yet.</p>}
                        {group.winners.map((t) => (
                          <div key={t.task_id} className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-slate-900">{t.task_id}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{t('cr.score')}: {t.risk_score}</span>
                            </div>
                            <span className="text-[11px] text-slate-600 font-semibold capitalize">{t.department} · {String(t.defect_type || '').replaceAll('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setAccepted((prev) => {
                        const next = new Set(prev)
                        group.losers.forEach((t) => next.add(t.task_id))
                        return next
                      })}
                      className="focus-ring flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Check size={14} /> {t('cr.accept_ai_res')}
                    </button>
                    <button
                      onClick={() => group.losers.forEach((taskObj) => toggleFlag?.(taskObj.task_id))}
                      className="focus-ring flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Flag size={14} /> {t('cr.flag')}
                    </button>
                    <button
                      onClick={() => setPage?.('priority')}
                      className="focus-ring ml-auto text-[11px] font-bold text-[#1a2f24] uppercase tracking-wider hover:underline"
                    >
                      {t('cr.view_queue')} &rarr;
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
