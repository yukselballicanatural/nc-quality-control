export default function SettingsLoading() {
  return (
    <div className="p-6 animate-pulse">
      <div className="h-8 w-32 bg-gray-200 rounded-lg mb-2" />
      <div className="h-4 w-48 bg-gray-100 rounded mb-6" />
      <div className="h-10 w-80 bg-gray-100 rounded-xl mb-6" />
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-1.5">
          <div className="h-5 w-28 bg-gray-200 rounded" />
          <div className="h-3.5 w-20 bg-gray-100 rounded" />
        </div>
        <div className="h-9 w-36 bg-gray-200 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 rounded-full bg-gray-200 flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-36 bg-gray-200 rounded" />
              <div className="h-3 w-48 bg-gray-100 rounded" />
            </div>
            <div className="h-5 w-20 bg-gray-100 rounded-full" />
            <div className="h-4 w-16 bg-gray-100 rounded" />
            <div className="h-5 w-9 bg-gray-200 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}
