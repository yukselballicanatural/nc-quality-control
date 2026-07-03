export default function EvaluationsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-24 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-9 w-36 bg-gray-100 rounded-xl" />
          <div className="h-9 w-32 bg-gray-100 rounded-xl" />
          <div className="h-9 w-36 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="border-b border-gray-100 bg-gray-50/60 px-4 py-3 flex gap-4">
          {[80, 120, 140, 80, 60, 80, 80, 60].map((w, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: w }} />
          ))}
        </div>

        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b border-gray-50 px-4 py-3.5 flex gap-4 items-center">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-4 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-5 w-12 bg-gray-100 rounded" />
            <div className="h-5 w-16 bg-gray-100 rounded-full" />
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-7 w-16 bg-gray-100 rounded-lg ml-auto" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-36 bg-gray-100 rounded" />
        <div className="flex gap-2">
          <div className="h-8 w-16 bg-gray-100 rounded-xl" />
          <div className="h-8 w-8 bg-gray-200 rounded-lg" />
          <div className="h-8 w-8 bg-gray-100 rounded-lg" />
          <div className="h-8 w-16 bg-gray-100 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
