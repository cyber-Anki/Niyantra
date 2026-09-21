import { useMemo, useState } from 'react'
import { Plus, X, Play, Check, RotateCcw, TrendingUp, TrendingDown, Minus, FlaskConical, ArrowRight } from 'lucide-react'
import { useNiyantraData } from '../store/DataContext.jsx'
import { useTranslation } from '../store/TranslationContext.jsx'
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
    <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-sm font-medium text-slate-400 line-through">{before}{suffix}</span>
        <span className="text-xl font-black text-[#1a2f24]">{after}{suffix}</span>
      </div>
      <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${color}`}>
        <Icon size={12} /> {diff > 0 ? '+' : ''}{diff}{suffix}
      </p>
    </div>
  )
}

export default function WhatIfSimulator() {
  const { tasks, rankedTasks, corridors, blocks, unscheduledTaskIds, weekStart, commitSimulation } = useNiyantraData()
  const { t } = useTranslation()
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
    <div className="bg-[#FDF9F1] rounded-3xl min-h-full overflow-hidden pb-6">
      <div className="mb-6 p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-serif font-black text-[#1a2f24] tracking-tight flex items-center gap-3">
            <FlaskConical size={32} className="text-[#1a2f24]" /> {t('sim.title')}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={discard}
            disabled={!stagedDefects.length && !surges.length && !simResult}
            className="focus-ring flex items-center gap-1.5 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            <X size={14} /> {t('sim.clear')}
          </button>
          <button
            onClick={runSimulation}
            disabled={running || (!stagedDefects.length && !surges.length)}
            className="focus-ring flex items-center gap-2 rounded-xl bg-[#1a2f24] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#2c4731] disabled:opacity-50 shadow-sm"
          >
            <Play size={16} className={running ? 'animate-pulse text-[#F1C453]' : ''} />
            {running ? t('sim.running') : t('sim.run_sim')}
          </button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2 px-6">
        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm transition-transform hover:-translate-y-1 flex flex-col h-full">
          <h3 className="mb-5 text-lg font-bold text-slate-900 tracking-tight pb-3 flex items-center gap-2">
            <Plus size={18} className="text-[#1a2f24]" /> {t('sim.add_defect')}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department">
              <select
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value, defect_type: DEFECTS_BY_DEPT[e.target.value][0] }))}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none"
              >
                {Object.keys(DEFECTS_BY_DEPT).map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Defect type">
              <select
                value={form.defect_type}
                onChange={(e) => setForm((f) => ({ ...f, defect_type: e.target.value }))}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none"
              >
                {DEFECTS_BY_DEPT[form.department].map((d) => <option key={d} value={d}>{d.replaceAll('_', ' ')}</option>)}
              </select>
            </Field>
            <Field label={t('sim.section')}>
              <select
                value={form.section || sections[0]}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none"
              >
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={t('sim.chainage')}>
              <input
                type="number" value={form.chainage_km}
                onChange={(e) => setForm((f) => ({ ...f, chainage_km: e.target.value }))}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none"
              />
            </Field>
            <Field label={t('sim.urgency')}>
              <input
                type="number" value={form.overdue_days}
                onChange={(e) => setForm((f) => ({ ...f, overdue_days: e.target.value }))}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none"
              />
            </Field>
            <Field label={t('sim.duration')}>
              <input
                type="number" value={form.duration_minutes}
                onChange={(e) => setForm((f) => ({ ...f, duration_minutes: e.target.value }))}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none"
              />
            </Field>
          </div>
          <button
            onClick={addDefect}
            className="focus-ring mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <Plus size={14} /> {t('sim.add_sim_defect')}
          </button>

          {stagedDefects.length > 0 && (
            <div className="mt-4 space-y-2">
              {stagedDefects.map((d) => (
                <div key={d.task_id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm shadow-sm">
                  <span className="capitalize text-slate-900 font-bold">{d.department} &middot; {d.defect_type.replaceAll('_', ' ')} &middot; {d.section}</span>
                  <button onClick={() => setStagedDefects((prev) => prev.filter((x) => x.task_id !== d.task_id))} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm transition-transform hover:-translate-y-1 flex flex-col h-full">
          <h3 className="mb-5 text-lg font-bold text-slate-900 tracking-tight pb-3 flex items-center gap-2">
            <TrendingDown size={18} className="text-[#1a2f24]" /> {t('sim.add_surge')}
          </h3>
          <p className="mb-4 text-sm font-medium text-slate-500">
            {t('sim.surge_desc')}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('sim.section')}>
              <select
                value={surgeSection}
                onChange={(e) => setSurgeSection(e.target.value)}
                className="focus-ring w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900 outline-none"
              >
                <option value="">{t('sim.select_section')}</option>
                {sections.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <Field label={`${t('sim.window_reduction')} (${surgePct}%)`}>
              <input
                type="range" min="10" max="60" step="5" value={surgePct}
                onChange={(e) => setSurgePct(Number(e.target.value))}
                className="w-full accent-[#1a2f24] mt-2"
              />
            </Field>
          </div>
          <button
            onClick={addSurge}
            disabled={!surgeSection}
            className="focus-ring mt-5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 shadow-sm"
          >
            <Plus size={14} /> {t('sim.add_sim_surge')}
          </button>
          {surges.length > 0 && (
            <div className="mt-4 space-y-2">
              {surges.map((s) => (
                <div key={s.section} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm shadow-sm">
                  <span className="text-slate-900 font-bold">{s.section} &middot; -{s.pct}% window</span>
                  <button onClick={() => setSurges((prev) => prev.filter((x) => x.section !== s.section))} className="text-slate-400 hover:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {simError && <p className="mx-6 mb-6 text-sm font-semibold text-severity-critical">{simError}</p>}

      {simResult && (
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm mx-6 mb-6">
          <h3 className="mb-6 text-lg font-bold text-slate-900 tracking-tight pb-3 border-b border-slate-100">{t('sim.before_after')}</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-center items-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('sim.scheduled_blocks')}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-400 line-through">{blocks.length}</span>
                <ArrowRight size={16} className="text-slate-400" />
                <span className="text-2xl font-black text-[#1a2f24]">{simResult.scheduled_blocks.length}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-center items-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('sim.unscheduled_tasks')}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-400 line-through">{unscheduledTaskIds.length}</span>
                <ArrowRight size={16} className="text-slate-400" />
                <span className="text-2xl font-black text-[#1a2f24]">{simResult.unscheduled_task_ids.length}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-center items-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('sim.total_risk')}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-400 line-through">{Math.round(blocks.reduce((s, b) => s + b.total_risk_cleared, 0))}</span>
                <ArrowRight size={16} className="text-slate-400" />
                <span className="text-2xl font-black text-[#1a2f24]">{Math.round(simResult.total_risk_cleared)}</span>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 flex flex-col justify-center items-center shadow-sm">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{t('sim.avg_downtime')}</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-400 line-through">{beforeAvgDowntime}m</span>
                <ArrowRight size={16} className="text-slate-400" />
                <span className="text-2xl font-black text-[#1a2f24]">{afterAvgDowntime}m</span>
              </div>
            </div>
          </div>

          {sectionsImpacted.length > 0 && (
            <p className="mt-5 text-sm font-semibold text-slate-500">
              Sections impacted: <span className="font-bold text-[#1a2f24]">{sectionsImpacted.join(', ')}</span>
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Newly scheduled</p>
              {shiftedTasks.newlyScheduled.length === 0 && <p className="text-sm font-medium text-slate-400">None</p>}
              <div className="space-y-2">
                {shiftedTasks.newlyScheduled.map((tid) => (
                  <div key={tid} className="rounded-xl border border-[#1a2f24]/20 bg-white px-3 py-2 font-mono text-sm font-bold text-[#1a2f24]">{tid}</div>
                ))}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl shadow-sm">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Bumped by this scenario</p>
              {shiftedTasks.newlyUnscheduled.length === 0 && <p className="text-sm font-medium text-slate-400">None</p>}
              <div className="space-y-2">
                {shiftedTasks.newlyUnscheduled.map((tid) => (
                  <div key={tid} className="rounded-xl border border-red-200 bg-white px-3 py-2 font-mono text-sm font-bold text-red-600">{tid}</div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 p-6 bg-[#FDF9F1] rounded-3xl border border-slate-200">
            <span className="mr-auto text-sm font-bold text-[#1a2f24]">
              {t('sim.note')}
            </span>
            <button
              onClick={commit}
              className="focus-ring rounded-xl bg-[#1a2f24] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#2c4731] shadow-sm"
            >
              {t('sim.commit')}
            </button>
            <button
              onClick={discard}
              className="focus-ring rounded-xl border border-slate-200 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 shadow-sm"
            >
              {t('sim.discard')}
            </button>
          </div>
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
