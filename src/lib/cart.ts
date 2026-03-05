export const CART_KEY = 'frontline_cart'

export interface CartProduct {
  id: string
  name: string
  price: number
  category: string
  image_url: string | null
  colors: string[] | null
  sizes: string[] | null
  description: string | null
}

export interface CartItem {
  product: CartProduct
  size: string | null
  color: string | null
  qty: number
}

export function readCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? (JSON.parse(raw) as CartItem[]) : []
  } catch {
    return []
  }
}

export function writeCart(cart: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CART_KEY, JSON.stringify(cart))
}
