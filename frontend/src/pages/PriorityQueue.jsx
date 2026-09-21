import { useMemo, useState } from 'react'
import { RefreshCw, ChevronDown, Flag, Send, CheckCircle2, ArrowUpDown, ChevronRight } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import SeverityBadge from '../components/ui/SeverityBadge.jsx'
import { formatTimeOfDay } from '../components/calendar/deptColors.js'

const DEPT_LABEL = { ENG: 'Engineering', SNT: 'Signal & Telecom', TRD: 'Traction/OHE' }
const SEVERITY_FILTERS = ['all', 'critical', 'major', 'minor']
const DEPT_FILTERS = ['all', 'ENG', 'SNT', 'TRD']
const STATUS_FILTERS = ['all', 'scheduled', 'unscheduled']

// Network-impact index: weights same-corridor congestion (co-located open
// defects from other departments) above raw daily traffic volume, since a
// colocated defect is a stronger signal of compounding possession risk.
function networkImpact(task) {
  return Math.round((task.traffic_density || 0) * 1 + (task.colocation_risk || 0) * 15)
}

function SortHeader({ label, sortKey, sortBy, sortDir, onSort, className = '' }) {
  const active = sortBy === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-900 ${className}`}
    >
      {label}
      <ArrowUpDown size={11} className={active ? 'text-gold-dark' : 'text-slate-300'} />
    </button>
  )
}

function TaskRow({ task, block, flagged, onToggleFlag, onApprove, onSendToScheduler }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <tr className="border-b border-slate-100 hover:bg-slate-50">
        <td className="py-2 pl-4 pr-2">
          <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-slate-900">
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        </td>
        <td className="py-2 px-2 font-mono text-xs text-slate-900">{task.task_id}</td>
        <td className="py-2 px-2 text-xs text-slate-500">{DEPT_LABEL[task.department] || task.department}</td>
        <td className="py-2 px-2 text-xs capitalize text-slate-700">{task.defect_type.replaceAll('_', ' ')}</td>
        <td className="py-2 px-2"><SeverityBadge severity={task.severity} /></td>
        <td className="py-2 px-2 text-xs text-slate-600">{task.overdue_days}d</td>
        <td className="py-2 px-2 text-xs text-slate-600">{networkImpact(task)}</td>
        <td className="py-2 px-2 text-xs font-semibold text-slate-900">{task.risk_score}</td>
        <td className="py-2 px-4 text-xs text-slate-500">
          {block
            ? `${formatTimeOfDay(block.start_minute)}–${formatTimeOfDay(block.end_minute)} · ${block.status}`
            : 'Not yet scheduled'}
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50 border-b border-slate-200">
          <td colSpan={9} className="p-4">
            <div className="flex gap-6">
              <div className="flex-1">
                <p className="mb-3 text-xs text-slate-600">{task.reasoning}</p>
                <div className="grid grid-cols-4 gap-4">
                  <Metric label="Severity" value={task.severity} />
                  <Metric label="Urgency ratio" value={`${task.overdue_days}d / 120d cycle`} />
                  <Metric label="Traffic density" value={`${task.traffic_density ?? 0}/day`} />
                  <Metric label="Co-located defects" value={task.colocation_risk ?? 0} />
                </div>
              </div>
              <div className="flex w-64 flex-col gap-2 border-l border-slate-200 pl-6">
                <button
                  onClick={() => onApprove(task, block)}
                  disabled={!block || block.status !== 'pending'}
                  className="focus-ring flex items-center gap-1.5 rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800er disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <CheckCircle2 size={13} /> Approve slot
                </button>
                <button
                  onClick={onSendToScheduler}
                  className="focus-ring flex items-center gap-1.5 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-slate-100"
                >
                  <Send size={13} /> Send to scheduler
                </button>
                <button
                  onClick={() => onToggleFlag(task.task_id)}
                  className={`focus-ring flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium ${
                    flagged ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Flag size={13} /> {flagged ? 'Flagged for review' : 'Flag for review'}
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function Metric({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-900 capitalize">{value}</p>
    </div>
  )
}

export default function PriorityQueue() {
  const {
    rankedTasks, blocks, priorityLoading, runPrioritize, runOptimizeWeekly,
    flaggedTaskIds, toggleFlag, decideBlock,
  } = useNiyantraData()
  const [severityFilter, setSeverityFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('risk_score')
  const [sortDir, setSortDir] = useState('desc')

  const blockByTaskId = useMemo(() => {
    const map = {}
    blocks.forEach((b) => b.task_ids.forEach((tid) => { map[tid] = b }))
    return map
  }, [blocks])

  const filtered = useMemo(() => {
    let list = rankedTasks
    if (severityFilter !== 'all') {
      list = list.filter((t) =>
        severityFilter === 'major' ? t.severity === 'major' || t.severity === 'moderate' :
        severityFilter === 'minor' ? t.severity === 'minor' || t.severity === 'low' :
        t.severity === severityFilter
      )
    }
    if (deptFilter !== 'all') list = list.filter((t) => t.department === deptFilter)
    if (statusFilter !== 'all') {
      list = list.filter((t) => (statusFilter === 'scheduled' ? !!blockByTaskId[t.task_id] : !blockByTaskId[t.task_id]))
    }
    const dir = sortDir === 'desc' ? -1 : 1
    return [...list].sort((a, b) => {
      if (sortBy === 'overdue_days') return dir * (a.overdue_days - b.overdue_days)
      if (sortBy === 'section') return dir * a.section.localeCompare(b.section)
      if (sortBy === 'network') return dir * (networkImpact(a) - networkImpact(b))
      return dir * ((a.risk_score ?? 0) - (b.risk_score ?? 0))
    })
  }, [rankedTasks, severityFilter, deptFilter, statusFilter, sortBy, sortDir, blockByTaskId])

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortBy(key); setSortDir('desc') }
  }

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm min-h-full">
      <div className="border-b border-slate-200 p-5 flex flex-wrap items-center justify-between gap-3 bg-slate-50">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Priority Queue</h2>
        </div>
        <button
          onClick={() => runPrioritize()}
          disabled={priorityLoading}
          className="focus-ring flex items-center gap-2 rounded bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-800er disabled:opacity-50"
        >
          <RefreshCw size={14} className={priorityLoading ? 'animate-spin' : ''} />
          {priorityLoading ? 'Scoring…' : 'Re-run AI Prioritization'}
        </button>
      </div>

      <div className="border-b border-slate-200 p-4 flex flex-wrap items-center gap-6 bg-white">
        <FilterGroup label="Severity" options={SEVERITY_FILTERS} value={severityFilter} onChange={setSeverityFilter} />
        <FilterGroup label="Dept" options={DEPT_FILTERS} value={deptFilter} onChange={setDeptFilter} />
        <FilterGroup label="Status" options={STATUS_FILTERS} value={statusFilter} onChange={setStatusFilter} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-2 pl-4 pr-2 w-8"></th>
              <th className="py-2 px-2 text-xs font-semibold uppercase tracking-wider">Asset ID</th>
              <th className="py-2 px-2 text-xs font-semibold uppercase tracking-wider">Dept</th>
              <th className="py-2 px-2 text-xs font-semibold uppercase tracking-wider">Defect</th>
              <th className="py-2 px-2 text-xs font-semibold uppercase tracking-wider">Criticality</th>
              <th className="py-2 px-2"><SortHeader label="Urgency" sortKey="overdue_days" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-2 px-2"><SortHeader label="Impact" sortKey="network" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-2 px-2"><SortHeader label="Score" sortKey="risk_score" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-2 px-4 text-xs font-semibold uppercase tracking-wider">Recommended Slot</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <TaskRow
                key={t.task_id}
                task={t}
                block={blockByTaskId[t.task_id]}
                flagged={flaggedTaskIds.has(t.task_id)}
                onToggleFlag={toggleFlag}
                onApprove={(task, block) => block && decideBlock(block.block_id, 'approve')}
                onSendToScheduler={() => runOptimizeWeekly()}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!filtered.length && !priorityLoading && (
        <div className="p-12 text-center text-sm text-slate-500">
          No tasks match these filters.
        </div>
      )}
      {priorityLoading && !filtered.length && (
        <div className="p-12 text-center text-sm text-slate-500">
          Scoring tasks with the risk model…
        </div>
      )}
    </div>
  )
}

function FilterGroup({ label, options, value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <div className="flex gap-1">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition border ${
              value === o ? 'border-navy bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
            } ${o === options[0] ? 'rounded-l' : ''} ${o === options[options.length - 1] ? 'rounded-r' : ''} ${o !== options[0] ? '-ml-px' : ''}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}
