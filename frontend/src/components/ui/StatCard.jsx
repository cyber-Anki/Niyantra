import { motion } from 'framer-motion'
import { Skeleton } from './Skeleton.jsx'

export default function StatCard({ label, value, unit, highlight = false, dotColor, loading = false }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={`rounded-2xl border p-5 shadow-card ${
        highlight ? 'border-gold/40 bg-amber-500/10' : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex items-center gap-1.5">
        <p className="text-sm text-slate-500">{label}</p>
        {dotColor && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dotColor }} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <span className="text-2xl font-bold text-slate-900">{value}</span>
            {unit && <span className="text-xs text-slate-400">{unit}</span>}
          </>
        )}
      </div>
    </motion.div>
  )
}
