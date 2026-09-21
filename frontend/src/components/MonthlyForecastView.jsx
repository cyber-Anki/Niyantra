import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { api } from '../api.js'

export default function MonthlyForecastView({ tasks, corridors }) {
  const [plan, setPlan] = useState(null)
  const [section, setSection] = useState('__all__')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const runSimulate = () => {
    setLoading(true)
    setError(null)
    api.simulateMonthly(tasks, corridors, '2025-04')
      .then((data) => {
        setPlan(data)
        setSection('__all__')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }

  const buildChartData = () => {
    if (!plan) return []
    const trajectories = plan.section_trajectories
    if (section !== '__all__') {
      return (trajectories[section] || []).map((p) => ({
        week: `W${p.week}`,
        'Status Quo Risk': p.status_quo_risk,
        'AI Optimized Risk': p.ai_optimized_risk,
      }))
    }
    // sum across all sections per week
    const byWeek = {}
    Object.values(trajectories).forEach((points) => {
      points.forEach((p) => {
        byWeek[p.week] = byWeek[p.week] || { week: `W${p.week}`, 'Status Quo Risk': 0, 'AI Optimized Risk': 0 }
        byWeek[p.week]['Status Quo Risk'] += p.status_quo_risk
        byWeek[p.week]['AI Optimized Risk'] += p.ai_optimized_risk
      })
    })
    return Object.values(byWeek).sort((a, b) => a.week.localeCompare(b.week))
  }

  const chartData = buildChartData()
  const sections = plan ? Object.keys(plan.section_trajectories) : []

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-100">4-Week Backlog Forecast</h2>
        <div className="flex items-center gap-2">
          {plan && (
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-sm text-slate-200"
            >
              <option value="__all__">All sections (summed)</option>
              {sections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <button
            onClick={runSimulate}
            disabled={loading}
            className="px-3 py-1.5 text-sm rounded-md bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {loading ? 'Simulating…' : 'Run System 3'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 mb-3">{error}</p>}

      {chartData.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="week" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
              <Legend />
              <Line type="monotone" dataKey="Status Quo Risk" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="AI Optimized Risk" stroke="#22c55e" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {plan && (
        <div className="grid grid-cols-4 gap-3 mt-4">
          {plan.weekly_plans.map((wp, i) => (
            <div key={i} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
              <p className="text-xs text-slate-500">{wp.week_start}</p>
              <p className="text-lg font-semibold text-slate-100">{wp.total_risk_cleared}</p>
              <p className="text-xs text-slate-500">risk cleared · {wp.merge_count} merges</p>
              <p className="text-xs text-slate-600 mt-1">{wp.unscheduled_task_ids.length} rolled forward</p>
            </div>
          ))}
        </div>
      )}

      {!plan && !loading && (
        <p className="text-slate-500 text-sm">No forecast yet — run System 3.</p>
      )}
    </div>
  )
}
