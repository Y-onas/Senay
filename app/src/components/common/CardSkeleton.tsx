/** Lightweight placeholder grid shown while catalogue data loads. */
export default function CardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-3xl bg-white shadow-sm"
        >
          <div className="h-52 animate-pulse bg-cream-warm" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-cream-warm" />
            <div className="h-4 w-full animate-pulse rounded bg-cream-warm" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-cream-warm" />
          </div>
        </div>
      ))}
    </div>
  )
}
