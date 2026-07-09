'use client'

import { useEffect } from 'react'

// After a new deploy, an already-open tab holds references to old build
// chunks that no longer exist on the server. Client-side navigation then
// fails with "ChunkLoadError". A full reload picks up the new build's
// manifest and fixes it — this just automates the manual hard-refresh.
export function ChunkErrorReload() {
  useEffect(() => {
    const RELOAD_FLAG = 'nc_chunk_reload_at'

    function isChunkError(message: string) {
      return /Loading chunk [\d]+ failed|ChunkLoadError/i.test(message)
    }

    function reloadOnce() {
      const last = sessionStorage.getItem(RELOAD_FLAG)
      const now = Date.now()
      if (last && now - Number(last) < 10000) return // avoid reload loops
      sessionStorage.setItem(RELOAD_FLAG, String(now))
      window.location.reload()
    }

    function handleError(event: ErrorEvent) {
      if (isChunkError(event.message)) reloadOnce()
    }

    function handleRejection(event: PromiseRejectionEvent) {
      const message = event.reason?.message ?? String(event.reason ?? '')
      if (isChunkError(message)) reloadOnce()
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  return null
}
