export default function ReportsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-28 bg-gray-200 rounded-lg" />
          <div className="h-4 w-36 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl" />
      </div>

      {/* Filter panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <div className="h-9 w-36 bg-gray-100 rounded-xl" />
          <div className="h-9 w-4 bg-gray-100 rounded" />
          <div className="h-9 w-36 bg-gray-100 rounded-xl" />
          <div className="h-9 w-40 bg-gray-100 rounded-xl" />
          <div className="h-9 w-32 bg-gray-100 rounded-xl" />
          <div className="h-9 w-36 bg-gray-100 rounded-xl" />
          <div className="h-9 w-32 bg-gray-100 rounded-xl" />
        </div>
      </div>

      {/* Tab panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100 px-1 py-1 gap-1">
          {[160, 148, 152, 160].map((w, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-lg" style={{ width: w }} />
          ))}
        </div>

        {/* Table skeleton */}
        <div>
          {/* Header row */}
          <div className="bg-gray-50/60 border-b border-gray-100 px-4 py-3 flex gap-8">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded ml-auto" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
          {/* Data rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-b border-gray-50 px-4 py-3.5 flex gap-8 items-center"
            >
              <div className="h-4 w-36 bg-gray-100 rounded" />
              <div className="h-4 w-10 bg-gray-100 rounded ml-auto" />
              <div className="h-5 w-16 bg-gray-100 rounded" />
              <div className="h-4 w-8 bg-gray-100 rounded" />
              <div className="h-4 w-10 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
