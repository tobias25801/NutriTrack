'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body style={{ margin: 0, background: '#0f1115', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: '#ef4444' }}>500</div>
          <div style={{ fontSize: 20, marginTop: 8, color: '#9ca3af' }}>Something went wrong</div>
          <button
            onClick={reset}
            style={{ marginTop: 24, color: '#7c3aed', background: 'none', border: '1px solid #7c3aed', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
