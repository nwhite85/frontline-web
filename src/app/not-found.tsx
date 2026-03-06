export default function NotFound() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-brand-blue text-sm font-semibold uppercase tracking-widest mb-3">404</p>
        <h1 className="text-3xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-sm text-white/40 mb-6">The page you're looking for doesn't exist.</p>
        <a href="/" className="inline-flex items-center bg-brand-blue hover:bg-brand-blue/85 text-white rounded-full px-5 py-2 text-sm font-medium transition-colors">
          Go home
        </a>
      </div>
    </div>
  )
}
