import { useMemo, useState } from 'react'
import { GitMerge, Users, AlertOctagon, Check, X, Scissors, ShieldAlert, Flag, Pencil, Clock, ArrowUpDown, SplitSquareVertical, MessageSquare } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import { formatTimeOfDay } from '../components/calendar/deptColors.js'
import { useTranslation } from '../store/TranslationContext.jsx'

/* ── Manual Override Modal ── */
function ManualOverrideModal({ block, taskById, onClose, decideBlock, t }) {
  const [remarks, setRemarks] = useState('')
  const [selectedAction, setSelectedAction] = useState(null)
  const [newStartTime, setNewStartTime] = useState('08:00')
  const [newEndTime, setNewEndTime] = useState('09:00')
  const [priorityWinner, setPriorityWinner] = useState(null) // task_id of the one chosen as higher priority
  const [splitSelection, setSplitSelection] = useState(() => new Set()) // task_ids to split out

  const blockTasks = (block.task_ids || []).map((tid) => taskById[tid]).filter(Boolean)

  const overrideActions = [
    { id: 'reassign_time', icon: Clock, label: 'Reassign Time Slot', desc: 'Move this block to a different time window', color: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100' },
    { id: 'change_priority', icon: ArrowUpDown, label: 'Change Priority Order', desc: 'Select which task gets higher priority', color: 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' },
    { id: 'split_separate', icon: SplitSquareVertical, label: 'Split to Separate Blocks', desc: 'Choose tasks to un-merge into their own blocks', color: 'text-purple-600 bg-purple-50 border-purple-200 hover:bg-purple-100' },
  ]

  const toggleSplit = (taskId) => {
    setSplitSelection((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const handleSubmit = () => {
    if (selectedAction === 'split_separate' && splitSelection.size > 0) {
      splitSelection.forEach((tid) => decideBlock?.(block.block_id, 'remove_task', { task_id: tid }))
    } else if (selectedAction === 'change_priority' && priorityWinner) {
      decideBlock?.(block.block_id, 'override', { action: 'change_priority', priority_task: priorityWinner, remarks })
    } else if (selectedAction === 'reassign_time') {
      decideBlock?.(block.block_id, 'override', { action: selectedAction, remarks, newStartTime, newEndTime })
    }
    onClose()
  }

  const canApply =
    (selectedAction === 'reassign_time') ||
    (selectedAction === 'change_priority' && priorityWinner) ||
    (selectedAction === 'split_separate' && splitSelection.size > 0)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1a2f24] to-[#2c4731] px-6 py-4 sticky top-0 z-10">
          <div>
            <h3 className="text-base font-black text-white tracking-tight flex items-center gap-2">
              <Pencil size={16} /> Manual Override
            </h3>
            <p className="text-[11px] text-white/70 font-semibold mt-0.5">
              {block.block_id} · {block.section}
            </p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Actions Grid */}
        <div className="p-5 space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Override Action</p>
          <div className="grid grid-cols-3 gap-3">
            {overrideActions.map((action) => (
              <button
                key={action.id}
                onClick={() => { setSelectedAction(action.id); setPriorityWinner(null); setSplitSelection(new Set()); }}
                className={`flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                  selectedAction === action.id
                    ? `${action.color} ring-2 ring-offset-1 ring-current scale-[1.02] shadow-md`
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <action.icon size={20} className={selectedAction === action.id ? '' : 'text-slate-400'} />
                <div>
                  <p className="text-xs font-bold">{action.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{action.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Sub-panel: Reassign Time Slot ── */}
          {selectedAction === 'reassign_time' && (
            <div className="mt-3 p-4 rounded-2xl border border-blue-200 bg-blue-50/50 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600">New Time Window</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Start</label>
                  <input
                    type="time"
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">End</label>
                  <input
                    type="time"
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-full border border-blue-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Sub-panel: Change Priority Order ── */}
          {selectedAction === 'change_priority' && (
            <div className="mt-3 p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Select the task that should get higher priority</p>
              <div className="space-y-2">
                {blockTasks.map((task) => (
                  <button
                    key={task.task_id}
                    onClick={() => setPriorityWinner(task.task_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      priorityWinner === task.task_id
                        ? 'border-amber-400 bg-amber-100 ring-2 ring-amber-300/50 shadow-md'
                        : 'border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200'
                    }`}
                  >
                    {/* Radio indicator */}
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      priorityWinner === task.task_id ? 'border-amber-500 bg-amber-500' : 'border-slate-300 bg-white'
                    }`}>
                      {priorityWinner === task.task_id && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{task.task_id}</span>
                        <SeverityBadge severity={task.severity} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold capitalize mt-0.5">
                        {task.department} · {String(task.defect_type || '').replaceAll('_', ' ')}
                      </p>
                      {task.risk_score != null && (
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Risk Score: {task.risk_score}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {priorityWinner && (
                <p className="text-[10px] font-bold text-amber-700 bg-amber-100 rounded-lg px-3 py-2 border border-amber-200">
                  ✓ <span className="font-mono">{priorityWinner}</span> will be scheduled first in this block
                </p>
              )}
            </div>
          )}

          {/* ── Sub-panel: Split to Separate Blocks ── */}
          {selectedAction === 'split_separate' && (
            <div className="mt-3 p-4 rounded-2xl border border-purple-200 bg-purple-50/50 space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-purple-600">Select tasks to split into separate blocks</p>
              <div className="space-y-2">
                {blockTasks.map((task) => (
                  <button
                    key={task.task_id}
                    onClick={() => toggleSplit(task.task_id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all duration-200 ${
                      splitSelection.has(task.task_id)
                        ? 'border-purple-400 bg-purple-100 ring-2 ring-purple-300/50 shadow-md'
                        : 'border-slate-200 bg-white hover:bg-purple-50 hover:border-purple-200'
                    }`}
                  >
                    {/* Checkbox indicator */}
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      splitSelection.has(task.task_id) ? 'border-purple-500 bg-purple-500' : 'border-slate-300 bg-white'
                    }`}>
                      {splitSelection.has(task.task_id) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900">{task.task_id}</span>
                        <SeverityBadge severity={task.severity} />
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold capitalize mt-0.5">
                        {task.department} · {String(task.defect_type || '').replaceAll('_', ' ')}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {splitSelection.size > 0 && (
                <p className="text-[10px] font-bold text-purple-700 bg-purple-100 rounded-lg px-3 py-2 border border-purple-200">
                  ✓ {splitSelection.size} task{splitSelection.size > 1 ? 's' : ''} will be split into separate block{splitSelection.size > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          {/* Remarks */}
          <div className="mt-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <MessageSquare size={12} /> Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add justification or notes for this override..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#1a2f24]/30 focus:border-[#1a2f24] resize-none placeholder-slate-400 transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3 sticky bottom-0 bg-white/90 backdrop-blur-sm pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canApply}
            className="flex-1 py-2.5 rounded-xl bg-[#1a2f24] text-xs font-bold text-white hover:bg-[#2c4731] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Apply Override
          </button>
        </div>
      </div>
    </div>
  )
}


export default function ConflictResolution({ setPage }) {
  const { rankedTasks, tasks, blocks, unscheduledTaskIds, decideBlock, flaggedTaskIds, toggleFlag } = useNiyantraData()
  const { t } = useTranslation()
  const [escalated, setEscalated] = useState(() => new Set())
  const [rejected, setRejected] = useState(() => new Set())
  const [accepted, setAccepted] = useState(() => new Set())
  const [overrideBlock, setOverrideBlock] = useState(null) // block object for the modal

  const taskById = useMemo(() => {
    const map = {}
    ;((rankedTasks && rankedTasks.length) ? rankedTasks : (tasks || [])).forEach((tk) => { map[tk.task_id] = tk })
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
      {/* Manual Override Modal */}
      {overrideBlock && (
        <ManualOverrideModal
          block={overrideBlock}
          taskById={taskById}
          onClose={() => setOverrideBlock(null)}
          decideBlock={decideBlock}
          t={t}
        />
      )}

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
                      const task = taskById[tid]
                      if (!task) return null
                      return (
                        <div key={tid} className="flex items-center justify-between border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="font-mono text-xs text-slate-900 font-bold">{tid}</p>
                            <p className="text-[11px] capitalize text-slate-500 font-semibold">
                              {task.department} · {String(task.defect_type || '').replaceAll('_', ' ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <SeverityBadge severity={task.severity} />
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

                  {/* ── 3-Button Footer ── */}
                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap gap-2">
                    {/* 1. Accept AI Merge */}
                    <button
                      onClick={() => decideBlock(b.block_id, 'approve')}
                      disabled={b.status !== 'pending'}
                      className="focus-ring flex items-center gap-1.5 bg-[#1a2f24] rounded-lg px-4 py-2 text-xs font-bold text-white transition hover:bg-[#2c4731] disabled:opacity-40 shadow-sm"
                    >
                      <Check size={14} /> {b.status === 'approved' ? t('cr.approved') : t('cr.accept_ai')}
                    </button>

                    {/* 2. Reject AI Merge */}
                    <button
                      onClick={() => {
                        setRejected((prev) => new Set(prev).add(b.block_id))
                        decideBlock?.(b.block_id, 'reject')
                      }}
                      disabled={rejected.has(b.block_id)}
                      className={`focus-ring flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-bold transition-colors shadow-sm ${
                        rejected.has(b.block_id)
                          ? 'border-red-300 bg-red-50 text-red-700 cursor-default'
                          : 'border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300'
                      }`}
                    >
                      <X size={14} /> {rejected.has(b.block_id) ? 'Rejected' : 'Reject AI Merge'}
                    </button>

                    {/* 3. Manual Override */}
                    <button
                      onClick={() => setOverrideBlock(b)}
                      className="focus-ring flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 hover:border-amber-300 transition-colors shadow-sm"
                    >
                      <Pencil size={14} /> Manual Override
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
                        {group.losers.map((task) => (
                          <div key={task.task_id} className="flex flex-col gap-1 rounded-xl border border-red-200 bg-white p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-slate-900">{task.task_id}</span>
                              <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">{t('cr.score')}: {task.risk_score}</span>
                            </div>
                            <span className="text-[11px] text-slate-600 font-semibold capitalize">{task.department} · {String(task.defect_type || '').replaceAll('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 bg-emerald-50/50">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-200/50 pb-1">{t('cr.won')}</p>
                      <div className="space-y-2">
                        {group.winners.length === 0 && <p className="text-xs font-medium text-slate-500">No blocks scheduled here yet.</p>}
                        {group.winners.map((task) => (
                          <div key={task.task_id} className="flex flex-col gap-1 rounded-xl border border-emerald-200 bg-white p-3 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="font-mono text-xs font-bold text-slate-900">{task.task_id}</span>
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">{t('cr.score')}: {task.risk_score}</span>
                            </div>
                            <span className="text-[11px] text-slate-600 font-semibold capitalize">{task.department} · {String(task.defect_type || '').replaceAll('_', ' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setAccepted((prev) => {
                        const next = new Set(prev)
                        group.losers.forEach((tk) => next.add(tk.task_id))
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
