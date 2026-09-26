import { useEffect, useState } from 'react'
import { api } from '../api.js'

const SEVERITY_COLOR = {
  low: 'bg-risk-low/20 text-risk-low border-risk-low/40',
  moderate: 'bg-risk-moderate/20 text-risk-moderate border-risk-moderate/40',
  high: 'bg-risk-high/20 text-risk-high border-risk-high/40',
  critical: 'bg-risk-critical/20 text-risk-critical border-risk-critical/40',
}

export default function PrioritizationView({ tasks }) {
  const [ranked, setRanked] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runPrioritize = () => {
    setLoading(true)
    setError(null)
    api.prioritize(tasks)
      .then((data) => setRanked(data.tasks))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (tasks.length) runPrioritize()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">Task Priority Ranking</h2>
        <button
          onClick={runPrioritize}
          disabled={loading}
          className="px-3 py-1.5 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
        >
          {loading ? 'Scoring…' : 'Re-run System 1'}
        </button>
      </div>

      {error && <p className="text-red-400 mb-3">{error}</p>}

      <div className="space-y-2">
        {ranked.map((t) => (
          <div
            key={t.task_id}
            className="rounded-lg border border-slate-800 bg-slate-900 p-4 flex items-start justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-slate-300">{t.task_id}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${SEVERITY_COLOR[t.severity] || ''}`}
                >
                  {t.severity}
                </span>
                <span className="text-xs text-slate-500">{t.department} · {t.section}</span>
              </div>
              <p className="text-sm text-slate-400 mt-1">{t.defect_type.replaceAll('_', ' ')}</p>
              <p className="text-xs text-slate-500 mt-2 max-w-2xl">{t.reasoning}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-semibold text-slate-100">{t.risk_score}</div>
              <div className="text-xs text-slate-500">risk score</div>
            </div>
          </div>
        ))}
        {!ranked.length && !loading && (
          <p className="text-slate-500 text-sm">No scored tasks yet.</p>
        )}
      </div>
    </div>
  )
}
