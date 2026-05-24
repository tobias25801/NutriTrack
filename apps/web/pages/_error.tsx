function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#0f1115', color: '#fff', fontFamily: 'sans-serif',
    }}>
      <div style={{ fontSize: 80, fontWeight: 900, color: statusCode === 404 ? '#7c3aed' : '#ef4444' }}>
        {statusCode ?? 'Error'}
      </div>
      <div style={{ fontSize: 20, marginTop: 8, color: '#9ca3af' }}>
        {statusCode === 404 ? 'Page not found' : 'An error occurred'}
      </div>
      <a href="/" style={{ marginTop: 24, color: '#7c3aed', textDecoration: 'none', fontSize: 14 }}>
        ← Back to home
      </a>
    </div>
  )
}

ErrorPage.getInitialProps = ({ res, err }: { res?: { statusCode: number }; err?: { statusCode: number } }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default ErrorPage
