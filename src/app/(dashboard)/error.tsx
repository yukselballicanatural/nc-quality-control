'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

// Detects the class of errors caused by a browser holding on to an old build's
// JS after a new deploy: the dynamic import() for a route/component points at a
// chunk filename that no longer exists on the server.
function isStaleChunkError(error: Error): boolean {
  const name = error?.name ?? ''
  const message = error?.message ?? ''
  return (
    name === 'ChunkLoadError' ||
    /loading chunk [\w-]+ failed/i.test(message) ||
    /loading css chunk/i.test(message) ||
    /failed to fetch dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message) ||
    /'text\/html' is not a valid javascript mime type/i.test(message)
  )
}

const RELOAD_GUARD_KEY = 'nc-chunk-reload-at'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isStaleChunkError(error)) return

    // Guard against an infinite reload loop: only auto-reload if we haven't
    // already tried within the last 20 seconds.
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? '0')
    const now = Date.now()
    if (now - last > 20000) {
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(now))
      setRecovering(true)
      // Hard reload so the browser re-fetches the current HTML + chunks.
      window.location.reload()
    }
  }, [error])

  if (recovering) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <RotateCcw className="h-8 w-8 animate-spin text-[#1B4332]" />
        <p className="text-sm font-medium text-gray-500">Güncelleniyor, lütfen bekleyin…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-gray-900">Bir şeyler ters gitti</h2>
        <p className="max-w-sm text-sm text-gray-500">
          Bu sayfa yüklenirken beklenmeyen bir sorun oluştu. Genellikle sayfayı yenilemek sorunu çözer.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            if (typeof window !== 'undefined') window.location.reload()
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1B4332] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#163728]"
        >
          <RotateCcw className="h-4 w-4" />
          Sayfayı Yenile
        </button>
        <button
          onClick={() => reset()}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
        >
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
