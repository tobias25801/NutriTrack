import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-nt-bg">
      <div className="text-center space-y-4">
        <div className="text-8xl font-black text-nt-accent">404</div>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-nt-text-secondary">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="inline-block mt-4 bg-nt-accent hover:bg-nt-accent-hover text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
