export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className="w-9 h-9 rounded-xl bg-gray-100 mb-4" />
            <div className="h-7 w-14 bg-gray-100 rounded-lg mb-2" />
            <div className="h-3.5 w-24 bg-gray-100 rounded mb-1.5" />
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Row 2: table + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table skeleton */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <div className="h-4 w-36 bg-gray-100 rounded" />
          </div>
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-5 py-3.5 flex items-center gap-4">
                <div className="h-3.5 flex-1 bg-gray-100 rounded" />
                <div className="h-3.5 w-24 bg-gray-100 rounded" />
                <div className="h-6 w-20 bg-gray-100 rounded-md" />
                <div className="h-6 w-16 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        {/* Chart skeleton */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="h-4 w-36 bg-gray-100 rounded mb-6" />
          <div className="flex items-end gap-6 h-40 px-4">
            <div className="flex-1 bg-gray-100 rounded-t-lg" style={{ height: '70%' }} />
            <div className="flex-1 bg-gray-100 rounded-t-lg" style={{ height: '55%' }} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full bg-gray-100 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
          </div>
        </div>
      </div>

      {/* Consultant table skeleton */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <div className="h-4 w-44 bg-gray-100 rounded" />
        </div>
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3.5 flex items-center gap-4">
              <div className="h-3.5 w-6 bg-gray-100 rounded" />
              <div className="h-3.5 flex-1 bg-gray-100 rounded" />
              <div className="h-3.5 w-10 bg-gray-100 rounded" />
              <div className="h-6 w-20 bg-gray-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
