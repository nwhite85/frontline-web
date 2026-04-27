import { CheckCircle2 } from 'lucide-react'

export default function SignupSuccessPage() {
  return (
    <div className="min-h-screen text-white flex flex-col relative overflow-hidden" style={{ background: '#0d1f3c' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: '#000000',
        clipPath: 'polygon(0 0, 100% 0, 100% 65%, 0 100%)',
        pointerEvents: 'none',
      }} />
      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <a href="/"><img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} /></a>
        </div>
      </div>
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-white">Payment confirmed!</h2>
            <p className="text-white/50 mt-2">Welcome to Frontline Fitness. Check your email — we&apos;ve sent you a link to set your password and get started.</p>
          </div>
          <div className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-5 flex flex-col gap-4 text-left">
            <p className="text-sm font-semibold text-white">Next steps</p>
            <ol className="flex flex-col gap-3 text-sm text-white/60 list-none p-0 m-0">
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue text-xs font-bold mt-0.5">1</span>
                <span>Check your email and click <strong className="text-white/80">Set your password</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue text-xs font-bold mt-0.5">2</span>
                <span>Download the Frontline Fitness app</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-blue/20 text-brand-blue text-xs font-bold mt-0.5">3</span>
                <span>Book your first session and show up</span>
              </li>
            </ol>
          </div>
          <div className="flex flex-col gap-2.5 w-full">
            <a
              href="https://apps.apple.com/gb/app/frontline-fitness-members/id6758299642"
              className="flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold text-sm h-12 hover:bg-white/90 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Download on the App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.frontline.client"
              className="flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] text-white font-semibold text-sm h-12 hover:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true"><path d="M3.18 23.76c.3.17.64.22.99.14l12.12-6.99-2.81-2.82-10.3 9.67zM.49 1.52C.18 1.86 0 2.38 0 3.06v17.89c0 .68.18 1.2.49 1.53l.08.08 10.01-10.01v-.24L.57 1.44l-.08.08zM20.38 10.3l-2.85-1.64-3.17 3.17 3.17 3.18 2.88-1.66c.82-.47.82-1.24-.03-1.72v-.33zm-19.2 12.5l12.12-6.99-2.81-2.82-9.31 8.73v1.08z"/></svg>
              Get it on Google Play
            </a>
          </div>
        </div>
      </div>
      <div className="relative z-10 h-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
