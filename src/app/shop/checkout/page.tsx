'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { readCart, writeCart, CartItem } from '@/lib/cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ShopCheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartItem[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const c = readCart()
    if (c.length === 0) { router.replace('/shop'); return }
    setCart(c)
  }, [router])

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/shop-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, items: cart }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to place order')
      writeCart([])
      router.push('/shop/checkout/success')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black flex items-center px-6">
        <a href="/shop">
          <img src="/logos/frontline-logo-blue.png" alt="Frontline Fitness" style={{ height: 20, width: 'auto' }} />
        </a>
        <span className="ml-4 text-white/40 text-sm">Checkout</span>
      </div>

      <div className="flex-1 max-w-lg mx-auto w-full px-6 py-10 flex flex-col gap-8">
        <h1 className="text-2xl font-bold uppercase tracking-tight">Your Order</h1>

        {/* Order summary */}
        <div className="rounded-xl border border-white/10 bg-[#0d1420] p-5 flex flex-col gap-3">
          {cart.map((item, i) => (
            <div key={i} className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{item.product.name}</p>
                <p className="text-xs text-white/40 mt-0.5">
                  {[item.color, item.size, item.qty > 1 ? `×${item.qty}` : null].filter(Boolean).join(' · ')}
                </p>
              </div>
              <span className="text-sm font-semibold text-white shrink-0">
                £{(item.product.price * item.qty).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="border-t border-white/10 pt-3 flex justify-between">
            <span className="text-sm text-white/50">Total</span>
            <span className="text-base font-bold text-white">£{subtotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Contact details */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h2 className="text-lg font-semibold">Your details</h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Full name</label>
            <Input
              value={name} onChange={e => setName(e.target.value)} required
              placeholder="Your name"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/70">Email</label>
            <Input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@email.com"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <p className="text-xs text-white/30">
            Nick will contact you to arrange collection and payment. No card details required.
          </p>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Placing order…' : 'Place Order'}
          </Button>
        </form>
      </div>
    </div>
  )
}
