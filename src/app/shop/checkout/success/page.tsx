'use client'

export default function ShopOrderSuccessPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 text-center gap-6">
      <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" style={{ height: 24, width: 'auto' }} />
      <div className="flex flex-col gap-3">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Order received!</h1>
        <p className="text-white/50 max-w-sm">
          Thanks — Nick will be in touch to arrange collection and payment.
        </p>
      </div>
      <a
        href="/shop"
        className="text-sm text-brand-blue hover:opacity-80 transition-opacity"
      >
        Back to shop
      </a>
    </div>
  )
}
