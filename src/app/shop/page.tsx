'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ShoppingBag, X, Plus, Minus } from 'lucide-react'
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import { readCart, writeCart, CartItem } from '@/lib/cart'

interface ShopProduct {
  id: string
  name: string
  price: number
  category: string
  image_url: string | null
  colors: string[] | null
  sizes: string[] | null
  description: string | null
  created_at: string
}

const isNew = (createdAt: string) => {
  const created = new Date(createdAt)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
  return created > threeMonthsAgo
}

export default function ShopPage() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    setCart(readCart())
  }, [])

  useEffect(() => {
    writeCart(cart)
  }, [cart])

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase
        .from('shop_products')
        .select('id, name, price, category, image_url, colors, sizes, description, created_at')
        .eq('active', true)
      setProducts(data ?? [])
      setLoading(false)
    }
    fetchProducts()
  }, [])

  const categories = ['All', "Men's", "Women's"]
  const filtered = category === 'All' ? products : products.filter(p => p.category === category)

  function removeFromCart(idx: number) {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  function changeQty(idx: number, delta: number) {
    setCart(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], qty: next[idx].qty + delta }
      if (next[idx].qty <= 0) return next.filter((_, i) => i !== idx)
      return next
    })
  }

  const cartCount = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0)

  return (
    <div className="min-h-screen bg-black text-white flex flex-col relative overflow-hidden">
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '50%',
        background: '#000000',
        clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)',
        pointerEvents: 'none',
      }} />

      <div className="fixed inset-0 pointer-events-none z-40">
        <div className="max-w-6xl mx-auto h-full border-x border-[rgba(255,255,255,0.06)]" />
      </div>

      {/* Nav */}
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center justify-between">
          <a href="/">
            <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-white opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Open cart"
          >
            <ShoppingBag size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-brand-blue text-white text-[10px] font-bold flex items-center justify-center px-1">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60" onClick={() => setCartOpen(false)} />
          <div className="w-full max-w-sm bg-[#0a0f1a] border-l border-white/10 flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h2 className="font-semibold text-white text-lg">Your basket</h2>
              <button onClick={() => setCartOpen(false)} className="text-white opacity-50 hover:opacity-100 transition-opacity">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
                  <ShoppingBag size={40} className="opacity-20 text-white" />
                  <p className="text-sm">Your basket is empty</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="w-16 h-16 rounded-lg bg-[#0d1420] flex-shrink-0 overflow-hidden">
                      {item.product.image_url && (
                        <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.product.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {[item.size, item.color].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-sm font-bold text-brand-blue mt-1">£{(item.product.price * item.qty).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => changeQty(idx, -1)} className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm text-white w-4 text-center">{item.qty}</span>
                      <button onClick={() => changeQty(idx, 1)} className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-colors">
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(idx)} className="ml-1 text-white opacity-30 hover:text-red-400 hover:opacity-100 transition-all">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="px-5 py-4 border-t border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Subtotal</span>
                  <span className="font-bold text-white">£{subtotal.toFixed(2)}</span>
                </div>
                <a href="/checkout" className="block">
                  <Button size="xl" className="w-full">Checkout</Button>
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero banner — full-width bg, image capped at 80rem */}
      <div className="relative overflow-hidden w-full" style={{ height: '340px', background: 'radial-gradient(ellipse 70% 80% at 50% 0%, #444444 0%, #383838 40%, #282838 100%)' }}>
        {/* Image container capped at 80rem, centred */}
        <div className="absolute inset-0 flex justify-center">
          <div className="relative h-full w-full" style={{ maxWidth: '75rem' }}>
            <img src="/photos/img_levels_logos_transparent.webp" alt="Frontline Shop" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 20%' }} />
          </div>
        </div>
        {/* Edge fades on outer container */}
        <div className="absolute inset-y-0 left-0 w-20 sm:w-64 xl:w-96 bg-gradient-to-r from-black to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-20 sm:w-64 xl:w-96 bg-gradient-to-l from-black to-transparent pointer-events-none z-10" />
        {/* Text */}
        <div className="absolute bottom-0 left-0 right-0 z-20 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pb-8">
          <p className="text-brand-blue text-xs font-semibold uppercase tracking-widest mb-1">Frontline Fitness</p>
          <h1 className="text-4xl font-bold uppercase text-white tracking-tight">Shop</h1>
        </div>
      </div>

      {/* Coming soon */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center py-24 px-6 text-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 border border-white/10">
          <ShoppingBag size={36} className="text-white opacity-30" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-2">Coming Soon</p>
          <h2 className="text-3xl font-bold uppercase text-white tracking-tight mb-3">Shop Opening Soon</h2>
          <p className="text-white/40 text-sm max-w-xs mx-auto">Frontline branded kit and gear will be available here shortly. Check back soon.</p>
        </div>
      </div>

      <div className="relative z-10 h-14 border-t border-white/10">
        <div className="max-w-6xl mx-auto pl-[13px] sm:pl-[21px] lg:pl-[29px] pr-4 sm:pr-6 lg:pr-8 h-full flex items-center gap-6">
          <span className="text-xs text-white/30">© Frontline Fitness</span>
          <a href="/privacy" className="text-xs text-white/30 hover:text-white/60 transition-colors">Privacy &amp; Terms</a>
        </div>
      </div>
    </div>
  )
}
