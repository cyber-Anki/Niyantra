// Helper to deterministically generate blocks and stats for any date/month across the entire year

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function stringToSeed(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return hash >>> 0
}

const ENG_WORKS = [
  'Track inspection',
  'Rail grinding',
  'Track renewal',
  'Bridge inspection',
  'Ballast tamping',
  'Track repair',
  'Deep screening',
]

const SNT_WORKS = [
  'Signal testing',
  'Signal upgrade',
  'Cable testing',
  'Point machine overhaul',
  'Axle counter check',
  'Signal repair',
]

const TRD_WORKS = [
  'OHE inspection',
  'OHE work',
  'Power equipment',
  'Insulator replacement',
  'Cantilever check',
  'Tower wagon check',
]

const MERGED_WORKS = [
  'Track + S&T',
  'Track + TRD',
  'S&T + TRD',
  'Combined work',
  'Integrated mega-block',
  'Monthly catch-up',
]

export function getBlocksForDay(date, section = 'All') {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const rand = mulberry32(stringToSeed(`${dateStr}-${section}`))

  const blocks = []
  // Generate 1 to 3 blocks for this day depending on day seed
  const numBlocks = Math.floor(rand() * 3) + 1 // 1 to 3 blocks

  const timeSlots = [
    { start: 120, end: 270 },  // 02:00 - 04:30
    { start: 360, end: 540 },  // 06:00 - 09:00
    { start: 660, end: 840 },  // 11:00 - 14:00
    { start: 840, end: 1020 }, // 14:00 - 17:00
    { start: 1320, end: 1440 }, // 22:00 - 24:00
  ]

  const sectionsList = ['NDLS-GZB', 'GZB-MB', 'NDLS-PWL', 'PWL-MTJ', 'MB-SRE']
  const daySection = section === 'All' ? sectionsList[Math.floor(rand() * sectionsList.length)] : section

  for (let i = 0; i < numBlocks; i++) {
    const slot = timeSlots[(Math.floor(rand() * timeSlots.length) + i) % timeSlots.length]
    const catRoll = rand()
    let type = 'orange'
    let name = ''
    let depts = ['ENG']
    let isMerged = false

    if (catRoll < 0.35) {
      type = 'orange'
      name = ENG_WORKS[Math.floor(rand() * ENG_WORKS.length)]
      depts = ['ENG']
    } else if (catRoll < 0.60) {
      type = 'green'
      name = SNT_WORKS[Math.floor(rand() * SNT_WORKS.length)]
      depts = ['SNT']
    } else if (catRoll < 0.80) {
      type = 'yellow'
      name = TRD_WORKS[Math.floor(rand() * TRD_WORKS.length)]
      depts = ['TRD']
    } else {
      type = 'purple'
      name = MERGED_WORKS[Math.floor(rand() * MERGED_WORKS.length)]
      isMerged = true
      if (name.includes('S&T') && name.includes('TRD')) {
        depts = ['SNT', 'TRD']
      } else if (name.includes('TRD')) {
        depts = ['ENG', 'TRD']
      } else {
        depts = ['ENG', 'SNT']
      }
    }

    const blockId = `BLK-${y}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}-${i + 1}`
    const taskIds = depts.map((dep, idx) => `${dep}-${1000 + Math.floor(rand() * 9000)}`)

    blocks.push({
      block_id: blockId,
      section: daySection,
      date_str: dateStr,
      start_minute: slot.start,
      end_minute: slot.end,
      departments: depts,
      is_merged: isMerged,
      task_ids: taskIds,
      total_risk_cleared: Math.round((rand() * 25 + 15) * 10) / 10,
      status: 'pending',
      name,
      type,
    })
  }

  return blocks
}

export function getMonthStatsAndBlocks(year, month, section = 'All') {
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthBlocks = {}
  let totalPlanned = 0
  let totalCoordinated = 0
  let totalHours = 0

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d)
    // About 50-60% of days have maintenance blocks
    const rand = mulberry32(stringToSeed(`${year}-${month}-${d}-${section}-hasBlock`))
    if (rand() > 0.35) {
      const dayBlocks = getBlocksForDay(date, section)
      // Pick 1-2 blocks to display in month rollup cell
      const picked = dayBlocks.slice(0, 1 + (rand() > 0.7 ? 1 : 0))
      monthBlocks[d] = picked.map((b) => ({
        name: b.name,
        type: b.type,
        block_id: b.block_id,
        is_merged: b.is_merged,
        departments: b.departments,
      }))

      dayBlocks.forEach((b) => {
        totalPlanned++
        if (b.is_merged) {
          totalCoordinated++
          totalHours += (b.end_minute - b.start_minute) / 60
        }
      })
    }
  }

  // Calculate realistic summary stats
  const statSeed = mulberry32(stringToSeed(`${year}-${month}-${section}-stats`))
  const plannedCount = totalPlanned || Math.floor(statSeed() * 8 + 15)
  const coordCount = totalCoordinated || Math.max(3, Math.floor(plannedCount * 0.4))
  const criticalCoverage = Math.floor(statSeed() * 10 + 88)
  const hoursSaved = (totalHours * 0.45).toFixed(1) || (statSeed() * 5 + 9.5).toFixed(1)
  const vsLastPlan = Math.floor(statSeed() * 6 - 3) // -3 to +3

  return {
    monthBlocks,
    stats: {
      plannedBlocks: plannedCount,
      vsLastPlanText: vsLastPlan <= 0 ? `↓ ${Math.abs(vsLastPlan || 4)} vs last plan` : `↑ ${vsLastPlan} vs last plan`,
      coordinatedBlocks: coordCount,
      coordinatedSubtext: '2 departments merged',
      criticalCoverage: `${criticalCoverage}%`,
      hoursSaved: `${hoursSaved}h`,
    },
  }
}
