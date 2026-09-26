import { useState } from 'react'
import { api } from '../api.js'

function formatMinute(m) {
  const h = Math.floor(m / 60).toString().padStart(2, '0')
  const mm = (m % 60).toString().padStart(2, '0')
  return `${h}:${mm}`
}

const STATUS_STYLE = {
  pending: 'bg-slate-800 text-slate-300',
  approved: 'bg-risk-low/20 text-risk-low',
  rejected: 'bg-risk-critical/20 text-risk-critical',
}

export default function WeeklySchedulerView({ tasks, corridors }) {
  const [blocks, setBlocks] = useState([])
  const [unscheduled, setUnscheduled] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [weekStart, setWeekStart] = useState('2025-04-14')

  const runOptimize = () => {
    setLoading(true)
    setError(null)
    api.optimizeWeekly(tasks, corridors, weekStart)
      .then((data) => {
        setBlocks(data.scheduled_blocks.map((b) => ({ ...b, status: 'pending' })))
        setUnscheduled(data.unscheduled_task_ids)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const decide = (blockId, action) => {
    api.decideBlock({ block_id: blockId, action, decided_by: 'demo-officer' })
      .then((res) => {
        setBlocks((prev) =>
          prev.map((b) => (b.block_id === blockId ? { ...b, status: res.status } : b))
        )
      })
      .catch((e) => setError(e.message))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Weekly Block Schedule</h2>
        <div className="flex items-center gap-2">
          <input
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm text-slate-200 w-32"
          />
          <button
            onClick={runOptimize}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Solving…' : 'Run System 2'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 mb-3">{error}</p>}

      <div className="grid gap-2">
        {blocks
          .slice()
          .sort((a, b) => a.corridor_id.localeCompare(b.corridor_id) || a.start_minute - b.start_minute)
          .map((b) => (
            <div
              key={b.block_id}
              className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-slate-300">{b.block_id}</span>
                  {b.is_merged && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                      merged · {b.departments.join('+')}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLE[b.status]}`}>
                    {b.status}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {b.section} · corridor {b.corridor_id} · {formatMinute(b.start_minute)}–{formatMinute(b.end_minute)}
                </p>
                <p className="text-xs text-slate-500 mt-1">tasks: {b.task_ids.join(', ')}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-100">{b.total_risk_cleared.toFixed(1)}</div>
                  <div className="text-xs text-slate-500">risk cleared</div>
                </div>
                <button
                  onClick={() => decide(b.block_id, 'approve')}
                  disabled={b.status !== 'pending'}
                  className="px-3 py-1.5 text-xs rounded-md bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-30"
                >
                  Approve
                </button>
                <button
                  onClick={() => decide(b.block_id, 'reject')}
                  disabled={b.status !== 'pending'}
                  className="px-3 py-1.5 text-xs rounded-md bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-30"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        {!blocks.length && !loading && (
          <p className="text-slate-500 text-sm">No plan yet — run System 2.</p>
        )}
      </div>

      {!!unscheduled.length && (
        <p className="text-xs text-slate-500 mt-4">
          {unscheduled.length} tasks unscheduled this week (rolled forward): {unscheduled.slice(0, 12).join(', ')}
          {unscheduled.length > 12 ? '…' : ''}
        </p>
      )}
    </div>
  )
}
