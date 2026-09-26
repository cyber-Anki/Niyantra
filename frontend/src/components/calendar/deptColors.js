export const DEPT_COLOR = {
  ENG: '#F59E0B',
  SNT: '#3B82F6',
  TRD: '#8B5CF6',
  merged: '#10B981',
}

export const DEPT_BORDER = {
  ENG: '#D9A62B',
  SNT: '#2563EB',
  TRD: '#7C3AED',
}

export function blockPrimaryColor(departments) {
  if (!departments || !departments.length) return '#8B5CF6'
  if (departments.length > 1) return DEPT_COLOR.merged
  return DEPT_COLOR[departments[0]] || '#8B5CF6'
}

export function dayFromCorridorDay(corridorDay) {
  // corridor.day looks like "2025-04-14+3" — base date plus day offset
  const [base, offsetStr] = String(corridorDay).split('+')
  const offset = Number(offsetStr || 0)
  const d = new Date(`${base}T00:00:00`)
  d.setDate(d.getDate() + offset)
  return d
}

export function formatTimeOfDay(minute) {
  const h = Math.floor(minute / 60)
  const m = minute % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`
}
