import { useMemo, useState } from 'react'
import { RefreshCw, ChevronDown, Flag, Search, CheckCircle2, ArrowUpDown, ChevronRight, Filter } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import { formatTimeOfDay } from '../components/calendar/deptColors.js'
import { useTranslation } from '../store/TranslationContext.jsx'

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
      className={`flex items-center gap-1 text-left text-xs font-bold transition-colors ${active ? 'text-[#F1C453]' : 'text-slate-300 hover:text-white'} ${className}`}
    >
      {label}
      <ArrowUpDown size={11} className={active ? 'text-[#F1C453]' : 'text-slate-400'} />
    </button>
  )
}

function TaskRow({ task, block, flagged, onToggleFlag, onApprove, onSendToScheduler }) {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const isOverdue = task.overdue_days > 3 // Mock threshold for red "Urg."

  const deptColors = {
    ENG: 'text-orange-500 bg-orange-50 border-orange-200',
    TRD: 'text-purple-600 bg-purple-50 border-purple-200',
    SNT: 'text-blue-500 bg-blue-50 border-blue-200'
  }

  return (
    <>
      <tr className={`border-b border-slate-100 bg-white hover:bg-slate-50 transition-colors ${open ? 'shadow-sm z-10 relative' : ''}`}>
        <td className="py-4 pl-4 pr-2">
          <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-slate-900">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </td>
        <td className="py-4 px-2">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900">{task.task_id}</span>
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{task.section}</span>
          </div>
        </td>
        <td className="py-4 px-2">
          <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-bold ${deptColors[task.department] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
            {task.department}
          </span>
        </td>
        <td className="py-4 px-2">
          <div className="flex flex-col">
            <span className="font-bold text-slate-900 capitalize">{task.defect_type.replaceAll('_', ' ')}</span>
            <span className="text-xs font-medium text-slate-500">{task.duration_minutes || 60} mins • traffic block</span>
          </div>
        </td>
        <td className="py-4 px-2 text-sm text-slate-500">{task.severity === 'critical' ? 40 : task.severity === 'major' ? 35 : 30}</td>
        <td className={`py-4 px-2 text-sm font-medium ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
          {task.overdue_days}d
        </td>
        <td className="py-4 px-2 text-sm text-slate-500">{networkImpact(task)}</td>
        <td className="py-4 px-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F1C453] text-xs font-black text-[#1e3a8a]">
            {task.risk_score}
          </span>
        </td>
        <td className="py-4 px-2 text-xs font-medium text-slate-600 font-mono">
          {block
            ? `11/15/24, ${formatTimeOfDay(block.start_minute)}`
            : '-'}
        </td>
        <td className="py-4 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onToggleFlag(task.task_id)}
              className={`focus-ring p-1 transition-colors ${flagged ? 'text-[#F1C453]' : 'text-slate-300 hover:text-slate-500'}`}
              title="Flag for review"
            >
              <Flag size={14} className={flagged ? 'fill-current' : ''} />
            </button>
            {flagged ? (
              <span className="flex items-center gap-1.5 rounded-lg border border-[#F1C453] bg-[#F1C453]/10 px-3 py-1.5 text-xs font-bold text-amber-600">
                <Flag size={12} className="fill-current" /> Flagged for Review
              </span>
            ) : block?.status === 'approved' ? (
              <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={12} /> Sent to Scheduler
              </span>
            ) : (
              <button
                onClick={() => onApprove(task, block)}
                disabled={!block}
                className="focus-ring rounded-lg bg-[#1e3a8a] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#1e40af] disabled:opacity-50"
              >
                Approve Slot
              </button>
            )}
          </div>
        </td>
      </tr>
      {open && (
        <tr className="bg-[#FDF9F1] border-b border-slate-200 shadow-inner">
          <td colSpan={10} className="p-6">
            <div className="flex gap-12 max-w-4xl">
              <div className="flex-1">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Priority Score Breakdown</h4>
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Criticality (Asset condition)</span>
                      <span>40/50</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-[#1e3a8a]" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Urgency (Overdue penalty)</span>
                      <span>30/30</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-[#F1C453]" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                      <span>Network Impact (Traffic delay risk)</span>
                      <span>25/20</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-200">
                      <div className="h-1.5 rounded-full bg-orange-400" style={{ width: '100%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 border-l border-slate-200 pl-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">AI Recommendation Context</h4>
                <p className="text-sm text-slate-700 font-medium leading-relaxed mb-4">
                  The recommended slot of <span className="font-bold text-slate-900">11/15/2024, 2:30:00 PM</span> targets a low-traffic window.
                </p>
                <div className="flex gap-2">
                  <span className="rounded bg-slate-200/60 px-2 py-1 text-xs font-bold text-slate-600">Asset Criticality: high</span>
                  <span className="rounded bg-slate-200/60 px-2 py-1 text-xs font-bold text-slate-600">Severity: {task.severity}</span>
                </div>
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
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900 capitalize">{value}</p>
    </div>
  )
}

export default function PriorityQueue() {
  const {
    rankedTasks, blocks, priorityLoading, runPrioritize, runOptimizeWeekly,
    flaggedTaskIds, toggleFlag, decideBlock,
  } = useNiyantraData()
  const { t } = useTranslation()
  const [severityFilter, setSeverityFilter] = useState('all')
  const [deptFilter, setDeptFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
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
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((t) => t.task_id.toLowerCase().includes(q) || t.defect_type.toLowerCase().includes(q) || t.section.toLowerCase().includes(q))
    }
    const dir = sortDir === 'desc' ? -1 : 1
    return [...list].sort((a, b) => {
      if (sortBy === 'overdue_days') return dir * (a.overdue_days - b.overdue_days)
      if (sortBy === 'section') return dir * a.section.localeCompare(b.section)
      if (sortBy === 'network') return dir * (networkImpact(a) - networkImpact(b))
      return dir * ((a.risk_score ?? 0) - (b.risk_score ?? 0))
    })
  }, [rankedTasks, severityFilter, deptFilter, statusFilter, searchQuery, sortBy, sortDir, blockByTaskId])

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortBy(key); setSortDir('desc') }
  }

  return (
    <div className="bg-[#FDF9F1] rounded-3xl min-h-full overflow-hidden">
      <div className="p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif font-black text-[#1e3a8a] tracking-tight">AI Priority Queue</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">Unified backlog prioritized by asset criticality and network impact.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search ID or defect..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:outline-none focus:border-[#1e3a8a] focus:ring-1 focus:ring-[#1e3a8a] transition-all"
            />
          </div>
          
          <select 
            value={deptFilter} 
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none hover:bg-slate-50 cursor-pointer"
          >
            <option value="all">All Depts</option>
            <option value="ENG">ENG</option>
            <option value="SNT">SNT</option>
            <option value="TRD">TRD</option>
          </select>
          
          <button
            onClick={() => runPrioritize()}
            disabled={priorityLoading}
            className="focus-ring flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            <RefreshCw size={14} className={priorityLoading ? 'animate-spin' : ''} />
            {priorityLoading ? 'Scoring...' : 'Rerun AI'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto no-scrollbar mx-6 rounded-2xl border border-slate-200 bg-white shadow-sm mb-6">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="bg-[#1e3a8a] text-white">
            <tr>
              <th className="py-3 pl-4 pr-2 w-8"></th>
              <th className="py-3 px-2"><SortHeader label="Asset / Section" sortKey="section" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="!text-white hover:!text-white/80" /></th>
              <th className="py-3 px-2"><SortHeader label="Dept" sortKey="department" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="!text-white hover:!text-white/80" /></th>
              <th className="py-3 px-2 text-xs font-bold text-white">Defect Description</th>
              <th className="py-3 px-2 text-xs font-bold text-white">Crit.</th>
              <th className="py-3 px-2"><SortHeader label="Urg." sortKey="overdue_days" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="!text-white hover:!text-white/80" /></th>
              <th className="py-3 px-2"><SortHeader label="Net." sortKey="network" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="!text-white hover:!text-white/80" /></th>
              <th className="py-3 px-2"><SortHeader label="Total Score" sortKey="risk_score" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} className="!text-white hover:!text-white/80" /></th>
              <th className="py-3 px-2 text-xs font-bold text-white">Rec. Slot</th>
              <th className="py-3 px-4 text-xs font-bold text-white text-right">Actions</th>
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


