const STYLES = {
  critical: 'bg-severity-criticalBg text-severity-critical',
  major: 'bg-severity-majorBg text-severity-major',
  moderate: 'bg-severity-majorBg text-severity-major',
  minor: 'bg-severity-minorBg text-severity-minor',
  low: 'bg-severity-minorBg text-severity-minor',
}

export default function SeverityBadge({ severity }) {
  const style = STYLES[severity] || STYLES.minor
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${style}`}>
      {severity}
    </span>
  )
}
