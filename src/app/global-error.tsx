'use client'

import { useEffect } from 'react'

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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!isStaleChunkError(error)) return
    const last = Number(window.sessionStorage.getItem(RELOAD_GUARD_KEY) ?? '0')
    const now = Date.now()
    if (now - last > 20000) {
      window.sessionStorage.setItem(RELOAD_GUARD_KEY, String(now))
      window.location.reload()
    }
  }, [error])

  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, sans-serif', background: '#f9fafb' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            padding: 16,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: '#fffbeb',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            !
          </div>
          <div style={{ maxWidth: 380 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: '0 0 6px' }}>
              Bir şeyler ters gitti
            </h2>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              Beklenmeyen bir sorun oluştu. Sayfayı yenilemek genellikle sorunu çözer.
            </p>
          </div>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload()
            }}
            style={{
              background: '#1B4332',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Sayfayı Yenile
          </button>
        </div>
      </body>
    </html>
  )
}
