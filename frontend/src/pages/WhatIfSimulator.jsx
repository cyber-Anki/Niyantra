import { useMemo, useState } from 'react'
import { Plus, X, Play, Check, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import { api } from '../api.js'

const DEFECTS_BY_DEPT = {
  ENG: ['rail_crack', 'internal_flaw_head', 'transverse_fracture', 'ballast_deficiency', 'fish_plate_wear', 'formation_defect'],
  SNT: ['cable_fault', 'signal_relay_fault'],
  TRD: ['ohe_wire_wear', 'insulator_damage'],
}

let simCounter = 0

function StatDelta({ label, before, after, invert = false, suffix = '' }) {
  const diff = after - before
  const good = invert ? diff < 0 : diff > 0
  const Icon = diff === 0 ? Minus : good ? TrendingUp : TrendingDown
  const color = diff === 0 ? 'text-slate-400' : good ? 'text-forest' : 'text-severity-critical'
  return (
    <div className="border border-slate-200 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-sm font-medium text-slate-400 line-through">{before}{suffix}</span>
        <span className="text-xl font-bold text-slate-900">{after}{suffix}</span>
      </div>
      <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon size={12} /> {diff > 0 ? '+' : ''}{diff}{suffix}
      </p>
    </div>
  )
}

export default function WhatIfSimulator() {
  const { tasks, rankedTasks, corridors, blocks, unscheduledTaskIds, weekStart, commitSimulation } = useNiyantraData()
  const [stagedDefects, setStagedDefects] = useState([])
  const [surgeSection, setSurgeSection] = useState('')
  const [surgePct, setSurgePct] = useState(25)
  const [surges, setSurges] = useState([])
  const [running, setRunning] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const [simError, setSimError] = useState(null)

  const sections = useMemo(() => [...new Set(corridors.map((c) => c.section))], [corridors])
  const baseTasks = rankedTasks.length ? rankedTasks : tasks

  const [form, setForm] = useState({
    department: 'ENG', defect_type: 'rail_crack', section: sections[0] || '', chainage_km: 10,
    overdue_days: 30, duration_minutes: 60,
  })

  const addDefect = () => {
    simCounter += 1
    setStagedDefects((prev) => [...prev, {
      task_id: `sim-defect-${simCounter}`,
      department: form.department,
      defect_type: form.defect_type,
      section: form.section || sections[0],
      chainage_km: Number(form.chainage_km) || 0,
      overdue_days: Number(form.overdue_days) || 0,
      duration_minutes: Number(form.duration_minutes) || 60,
      traffic_density: 20,
      colocation_risk: 0,
    }])
  }

  const addSurge = () => {
    if (!surgeSection) return
    setSurges((prev) => [...prev.filter((s) => s.section !== surgeSection), { section: surgeSection, pct: surgePct }])
  }

  const runSimulation = async () => {
    setRunning(true)
    setSimError(null)
    try {
      const simTasks = [...baseTasks, ...stagedDefects]
      const simCorridors = corridors.map((c) => {
        const surge = surges.find((s) => s.section === c.section)
        if (!surge) return c
        return { ...c, window_minutes: Math.max(30, Math.round(c.window_minutes * (1 - surge.pct / 100))) }
      })
      const result = await api.optimizeWeekly(simTasks, simCorridors, weekStart)
      setSimResult(result)
    } catch (e) {
      setSimError(e.message)
    } finally {
      setRunning(false)
    }
  }

  const commit = () => {
    if (!simResult) return
    commitSimulation(simResult.scheduled_blocks, simResult.unscheduled_task_ids)
    discard()
  }

  const discard = () => {
    setSimResult(null)
    setStagedDefects([])
    setSurges([])
  }

  const beforeAvgDowntime = blocks.length
    ? Math.round(blocks.reduce((s, b) => s + (b.end_minute - b.start_minute), 0) / blocks.length)
    : 0
  const afterAvgDowntime = simResult?.scheduled_blocks.length
    ? Math.round(simResult.scheduled_blocks.reduce((s, b) => s + (b.end_minute - b.start_minute), 0) / simResult.scheduled_blocks.length)
    : 0

  const shiftedTasks = useMemo(() => {
    if (!simResult) return { newlyScheduled: [], newlyUnscheduled: [] }
    const beforeScheduled = new Set(blocks.flatMap((b) => b.task_ids))
    const afterScheduled = new Set(simResult.scheduled_blocks.flatMap((b) => b.task_ids))
    return {
      newlyScheduled: [...afterScheduled].filter((tid) => !beforeScheduled.has(tid)),
      newlyUnscheduled: [...beforeScheduled].filter((tid) => !afterScheduled.has(tid)),
    }
  }, [simResult, blocks])

  const sectionsImpacted = useMemo(() => {
    if (!simResult) return []
    const beforeCount = {}
    blocks.forEach((b) => { beforeCount[b.section] = (beforeCount[b.section] || 0) + 1 })
    const afterCount = {}
    simResult.scheduled_blocks.forEach((b) => { afterCount[b.section] = (afterCount[b.section] || 0) + 1 })
    const allSections = new Set([...Object.keys(beforeCount), ...Object.keys(afterCount)])
    return [...allSections].filter((s) => (beforeCount[s] || 0) !== (afterCount[s] || 0))
  }, [simResult, blocks])

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 bg-slate-50 p-5">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">What-If Simulator</h2>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">Add a new defect</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value, defect_type: DEFECTS_BY_DEPT[e.target.value][0] }))}
                className="focus-ring w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              >
                {Object.keys(DEFECTS_BY_DEPT).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Defect type">
              <select
                value={form.defect_type}
                onChange={(e) => setForm((f) => ({ ...f, defect_type: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              >
                {DEFECTS_BY_DEPT[form.department].map((d) => <option key={d} value={d}>{d.replaceAll('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label="Section">
              <select
                value={form.section || sections[0]}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              >
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Chainage (km)">
              <input
                type="number" value={form.chainage_km}
                onChange={(e) => setForm((f) => ({ ...f, chainage_km: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              />
            </Field>
            <Field label="Urgency (days overdue)">
              <input
                type="number" value={form.overdue_days}
                onChange={(e) => setForm((f) => ({ ...f, overdue_days: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              />
            </Field>
            <Field label="Duration (mins)">
              <input
                type="number" value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className="focus-ring w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              />
            </Field>
          </div>
          <button
            onClick={addDefect}
            className="focus-ring mt-3 flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-light"
          >
            <Plus size={13} /> Add defect to simulation
          </button>

          {stagedDefects.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {stagedDefects.map((d) => (
                <div key={d.task_id} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  <span className="capitalize text-slate-900">{d.department} &middot; {d.defect_type.replaceAll('_', ' ')} &middot; {d.section}</span>
                  <button onClick={() => setStagedDefects((prev) => prev.filter((x) => x.task_id !== d.task_id))} className="text-slate-400 hover:text-severity-critical">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-slate-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">Add a freight-forecast surge</h3>
          <p className="mb-3 text-xs text-slate-500">
            Shrinks that section's maintenance windows to model less possession time from a freight demand spike.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Section">
              <select
                value={surgeSection}
                onChange={(e) => setSurgeSection(e.target.value)}
                className="focus-ring w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
              >
                <option value="">Select a section</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={`Window reduction (${surgePct}%)`}>
              <input
                type="range" min="10" max="60" step="5" value={surgePct}
                onChange={(e) => setSurgePct(Number(e.target.value))}
                className="w-full accent-gold-dark"
              />
            </Field>
          </div>
          <button
            onClick={addSurge}
            disabled={!surgeSection}
            className="focus-ring mt-3 flex items-center gap-1.5 rounded-lg bg-forest px-3 py-1.5 text-xs font-medium text-white hover:bg-forest-light disabled:opacity-40"
          >
            <Plus size={13} /> Add surge to simulation
          </button>
          {surges.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {surges.map((s) => (
                <div key={s.section} className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs">
                  <span className="text-slate-900">{s.section} &middot; -{s.pct}% window</span>
                  <button onClick={() => setSurges((prev) => prev.filter((x) => x.section !== s.section))} className="text-slate-400 hover:text-severity-critical">
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <button
          onClick={runSimulation}
          disabled={running || (!stagedDefects.length && !surges.length)}
          className="focus-ring flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-gold-dark disabled:opacity-40"
        >
          <Play size={14} /> {running ? 'Running simulation…' : 'Run simulation'}
        </button>
        {(stagedDefects.length > 0 || surges.length > 0) && (
          <button onClick={discard} className="focus-ring flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-900">
            <RotateCcw size={12} /> Clear staged changes
          </button>
        )}
        {simError && <p className="text-sm text-severity-critical">{simError}</p>}
      </div>

      {simResult && (
        <div className="border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">Before / After this week's schedule</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatDelta label="Scheduled blocks" before={blocks.length} after={simResult.scheduled_blocks.length} />
            <StatDelta label="Unscheduled tasks" before={unscheduledTaskIds.length} after={simResult.unscheduled_task_ids.length} invert />
            <StatDelta label="Total risk cleared" before={Math.round(blocks.reduce((s, b) => s + b.total_risk_cleared, 0))} after={Math.round(simResult.total_risk_cleared)} />
            <StatDelta label="Avg downtime" before={beforeAvgDowntime} after={afterAvgDowntime} suffix="m" invert />
          </div>

          {sectionsImpacted.length > 0 && (
            <p className="mt-4 text-sm text-slate-500">
              Sections impacted: <span className="font-medium text-slate-900">{sectionsImpacted.join(', ')}</span>
            </p>
          )}

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-400">Newly scheduled</p>
              {shiftedTasks.newlyScheduled.length === 0 && <p className="text-xs text-slate-400">None</p>}
              <div className="space-y-1">
                {shiftedTasks.newlyScheduled.map((tid) => (
                  <div key={tid} className="rounded-lg bg-slate-50 px-2.5 py-1.5 font-mono text-xs text-slate-900">{tid}</div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-400">Bumped by this scenario</p>
              {shiftedTasks.newlyUnscheduled.length === 0 && <p className="text-xs text-slate-400">None</p>}
              <div className="space-y-1">
                {shiftedTasks.newlyUnscheduled.map((tid) => (
                  <div key={tid} className="rounded-lg bg-severity-criticalBg px-2.5 py-1.5 font-mono text-xs text-severity-critical">{tid}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={commit}
              className="focus-ring flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white hover:bg-forest-light"
            >
              <Check size={14} /> Commit to live schedule
            </button>
            <button
              onClick={discard}
              className="focus-ring rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Discard
            </button>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">
            Note: running a simulation does call the live optimizer, so it's written to the backend as pending blocks — it just won't appear in your workspace views unless you commit it here.
          </p>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      {children}
    </label>
  )
}
