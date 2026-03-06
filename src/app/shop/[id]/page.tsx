'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { ShoppingBag, ArrowLeft, Plus, Minus } from 'lucide-react'
import { readCart, writeCart } from '@/lib/cart'

interface ShopProduct {
  id: string
  name: string
  price: number
  category: string
  image_url: string | null
  colors: string[] | null
  sizes: string[] | null
  description: string | null
}

export default function ProductPage() {
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<ShopProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    async function fetchProduct() {
      const { data } = await supabase
        .from('shop_products')
        .select('*')
        .eq('id', params.id)
        .single()
      setProduct(data)
      setLoading(false)
    }
    fetchProduct()
  }, [params.id])

  function addToCart() {
    if (!product) return
    const cart = readCart()
    const idx = cart.findIndex(
      i => i.product.id === product.id && i.size === selectedSize && i.color === selectedColor
    )
    if (idx >= 0) {
      cart[idx].qty += qty
    } else {
      cart.push({ product, size: selectedSize, color: selectedColor, qty })
    }
    writeCart(cart)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-brand-blue animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white/40">
        <ShoppingBag size={48} className="opacity-20" />
        <p className="text-base">Product not found</p>
        <a href="/shop" className="text-brand-blue text-sm hover:underline">← Back to shop</a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <div className="sticky top-0 z-30 h-16 border-b border-white/10 bg-black">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 h-full flex items-center">
          <a href="/">
            <img src="/logos/frontline-logo-blue.svg" alt="Frontline Fitness" width="80" height="20" style={{ height: '20px', width: 'auto' }} />
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        <a
          href="/shop"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to shop
        </a>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          {/* Image */}
          <div className="rounded-xl bg-[#0d1420] border border-white/10 overflow-hidden mb-8 lg:mb-0">
            <div className="relative aspect-[2/3] w-full">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-white/10">
                  <ShoppingBag size={60} />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold uppercase text-white tracking-tight leading-tight">
                {product.name}
              </h1>
              <p className="text-2xl font-bold text-brand-blue mt-3">£{product.price.toFixed(2)}</p>
              {product.description && (
                <p className="text-white/60 mt-4 leading-relaxed">{product.description}</p>
              )}
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Size</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(prev => prev === size ? null : size)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        selectedSize === size
                          ? 'bg-brand-blue border-brand-blue text-white'
                          : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Colours */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Colour</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(prev => prev === color ? null : color)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        selectedColor === color
                          ? 'bg-brand-blue border-brand-blue text-white'
                          : 'border-white/20 text-white/60 hover:text-white hover:border-white/40'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <p className="text-sm font-semibold text-white mb-3 uppercase tracking-wide">Quantity</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="text-white font-semibold w-8 text-center text-lg">{qty}</span>
                <button
                  onClick={() => setQty(q => q + 1)}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Add to basket */}
            <Button
              size="xl"
              className={`w-full transition-all ${added ? 'bg-green-600 hover:bg-green-600 border-green-600' : ''}`}
              onClick={addToCart}
            >
              {added ? 'Added to basket ✓' : 'Add to basket'}
            </Button>

            <a
              href="/shop"
              className="text-sm text-white/40 hover:text-white/70 transition-colors text-center"
            >
              Continue shopping
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
