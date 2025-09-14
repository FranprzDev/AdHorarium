export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-purple-300/20 rounded w-48 animate-pulse"></div>
        <div className="h-10 bg-purple-300/20 rounded w-32 animate-pulse"></div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card p-6 animate-pulse">
            <div className="h-4 bg-purple-300/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-purple-300/20 rounded w-1/2 mb-4"></div>
            <div className="h-3 bg-purple-300/20 rounded w-full mb-2"></div>
            <div className="h-3 bg-purple-300/20 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
