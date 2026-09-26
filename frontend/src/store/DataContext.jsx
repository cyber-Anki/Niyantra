import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'

const DataContext = createContext(null)

const DEFAULT_WEEK_START = '2025-04-14'
const DEFAULT_MONTH_LABEL = '2025-04'

export function DataProvider({ children, userContext }) {
  const [tasks, setTasks] = useState([])
  const [corridors, setCorridors] = useState([])
  const [rankedTasks, setRankedTasks] = useState([])
  const [blocks, setBlocks] = useState([])
  const [unscheduledTaskIds, setUnscheduledTaskIds] = useState([])
  const [monthlyPlan, setMonthlyPlan] = useState(null)
  const [weekStart, setWeekStart] = useState(DEFAULT_WEEK_START)
  const [flaggedBlocksInfo, setFlaggedBlocksInfo] = useState([])

  const [bootLoading, setBootLoading] = useState(true)
  const [priorityLoading, setPriorityLoading] = useState(false)
  const [weeklyLoading, setWeeklyLoading] = useState(false)
  const [monthlyLoading, setMonthlyLoading] = useState(false)
  const [error, setError] = useState(null)

  const runPrioritize = useCallback((taskList) => {
    setPriorityLoading(true)
    setError(null)
    return api
      .prioritize(taskList)
      .then((data) => {
        setRankedTasks(data.tasks)
        return data.tasks
      })
      .catch((e) => {
        setError(e.message)
        return []
      })
      .finally(() => setPriorityLoading(false))
  }, [])

  const runOptimizeWeekly = useCallback((taskList, corridorList, ws) => {
    setWeeklyLoading(true)
    setError(null)
    return api
      .optimizeWeekly(taskList, corridorList, ws)
      .then((data) => {
        setBlocks(data.scheduled_blocks.map((b) => ({ ...b, status: b.status || 'pending' })))
        setUnscheduledTaskIds(data.unscheduled_task_ids)
        return data
      })
      .catch((e) => {
        setError(e.message)
        return null
      })
      .finally(() => setWeeklyLoading(false))
  }, [])

  const runSimulateMonthly = useCallback((taskList, corridorList, monthLabel = DEFAULT_MONTH_LABEL) => {
    setMonthlyLoading(true)
    setError(null)
    return api
      .simulateMonthly(taskList, corridorList, monthLabel)
      .then((data) => {
        setMonthlyPlan(data)
        return data
      })
      .catch((e) => {
        setError(e.message)
        return null
      })
      .finally(() => setMonthlyLoading(false))
  }, [])

  const decideBlock = useCallback((blockId, action, extra = {}) => {
    return api
      .decideBlock({ block_id: blockId, action, decided_by: 'demo-officer', ...extra })
      .then((res) => {
        setBlocks((prev) => {
          if (action === 'remove_task') {
            return prev
              .map((b) => (b.block_id === blockId ? { ...b, task_ids: res.task_ids, status: res.status } : b))
              .filter((b) => b.task_ids.length > 0)
          }
          if (action === 'retime_task') {
            return prev.map((b) =>
              b.block_id === blockId ? { ...b, start_minute: res.start_minute, end_minute: res.end_minute } : b
            )
          }
          return prev.map((b) => (b.block_id === blockId ? { ...b, status: res.status } : b))
        })
        return res
      })
      .catch((e) => setError(e.message))
  }, [])

  const [flaggedTaskIds, setFlaggedTaskIds] = useState(() => new Set())
  const toggleFlag = useCallback((taskId) => {
    setFlaggedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }, [])

  const submitBlockFlag = useCallback((blockId, reason, department) => {
    setFlaggedBlocksInfo((prev) => [
      ...prev,
      { block_id: blockId, reason, department, timestamp: new Date().toISOString() }
    ])
    // Also locally mark the block as flagged for UI feedback
    setBlocks((prev) => prev.map(b => b.block_id === blockId ? { ...b, status: 'flagged' } : b))
  }, [])

  const resolveBlockFlag = useCallback((blockId) => {
    setFlaggedBlocksInfo((prev) => prev.filter(f => f.block_id !== blockId))
    setBlocks((prev) => prev.map(b => b.block_id === blockId ? { ...b, status: 'pending' } : b))
  }, [])

  const commitSimulation = useCallback((simBlocks, simUnscheduled) => {
    setBlocks(simBlocks.map((b) => ({ ...b, status: b.status || 'pending' })))
    setUnscheduledTaskIds(simUnscheduled)
  }, [])

  useEffect(() => {
    api
      .bootstrap()
      .then(async (data) => {
        setTasks(data.tasks)
        setCorridors(data.corridors)
        const ranked = await runPrioritize(data.tasks)
        await runOptimizeWeekly(ranked.length ? ranked : data.tasks, data.corridors, DEFAULT_WEEK_START)
      })
      .catch((e) => setError(e.message))
      .finally(() => setBootLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredTasks = useMemo(() => {
    if (!userContext || userContext.role === 'DRM') return tasks
    return tasks.filter((t) => t.department === userContext.department)
  }, [tasks, userContext])

  const filteredBlocks = useMemo(() => {
    if (!userContext || userContext.role === 'DRM') return blocks
    return blocks.filter((b) => b.departments.includes(userContext.department))
  }, [blocks, userContext])

  const filteredRankedTasks = useMemo(() => {
    if (!userContext || userContext.role === 'DRM') return rankedTasks
    return rankedTasks.filter((t) => t.department === userContext.department)
  }, [rankedTasks, userContext])

  const value = useMemo(
    () => ({
      tasks: filteredTasks,
      corridors,
      rankedTasks: filteredRankedTasks,
      blocks: filteredBlocks,
      unscheduledTaskIds,
      monthlyPlan,
      weekStart,
      setWeekStart,
      bootLoading,
      priorityLoading,
      weeklyLoading,
      monthlyLoading,
      error,
      runPrioritize: () => runPrioritize(tasks),
      runOptimizeWeekly: (ws = weekStart) =>
        runOptimizeWeekly(rankedTasks.length ? rankedTasks : tasks, corridors, ws),
      runSimulateMonthly: (monthLabel) =>
        runSimulateMonthly(tasks, corridors, monthLabel),
      decideBlock,
      flaggedTaskIds,
      toggleFlag,
      flaggedBlocksInfo,
      submitBlockFlag,
      resolveBlockFlag,
      commitSimulation,
    }),
    [
      filteredTasks,
      corridors,
      filteredRankedTasks,
      filteredBlocks,
      unscheduledTaskIds,
      monthlyPlan,
      weekStart,
      bootLoading,
      priorityLoading,
      weeklyLoading,
      monthlyLoading,
      error,
      runPrioritize,
      runOptimizeWeekly,
      runSimulateMonthly,
      decideBlock,
      flaggedTaskIds,
      toggleFlag,
      flaggedBlocksInfo,
      submitBlockFlag,
      resolveBlockFlag,
      commitSimulation,
    ]
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useNiyantraData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useNiyantraData must be used within DataProvider')
  return ctx
}
