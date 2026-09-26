export function Skeleton({ className = '' }) {
  return (
    <span
      className={`inline-block rounded-md bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 bg-[length:200%_100%] ${className}`}
      style={{ animation: 'shimmer 1.4s ease-in-out infinite' }}
    />
  )
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`rounded-2xl2 border border-slate-200 bg-white p-5 shadow-card ${className}`}>
      <Skeleton className="h-3 w-20 mb-3" />
      <Skeleton className="h-8 w-28 mb-2" />
      <Skeleton className="h-3 w-36" />
    </div>
  )
}

export default Skeleton
