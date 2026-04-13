'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { EmptyState } from '@/components/ui/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { Search, Plus, MoreHorizontal, ShoppingBag, Tag, ShoppingCart, Image, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  product_code?: string
  price: number
  category: 'mens' | 'womens' | 'unisex' | 'accessories'
  type: 'hoodie' | 'vest' | 'tshirt' | 'shorts' | 'jacket' | 'leggings' | 'bra' | 'cap' | 'other'
  colors: string[]
  sizes: string[]
  description: string
  image_url?: string
  image_urls?: string[]
  active: boolean
  purchasable: boolean
  hidden: boolean
  trainer_id: string
  created_at: string
}

const CATEGORY_LABELS: Record<string, string> = {
  mens: "Men's",
  womens: "Women's",
  unisex: 'Unisex',
  accessories: 'Accessories',
}

const TYPE_LABELS: Record<string, string> = {
  hoodie: 'Hoodie',
  vest: 'Vest',
  tshirt: 'T-Shirt',
  shorts: 'Shorts',
  jacket: 'Jacket',
  leggings: 'Leggings',
  bra: 'Sports Bra',
  cap: 'Cap',
  other: 'Other',
}

const COLOR_OPTIONS = ['Black', 'White', 'Navy', 'Grey', 'Red', 'Blue']
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const EMPTY_FORM = {
  name: '',
  product_code: '',
  price: '',
  category: 'mens' as Product['category'],
  type: 'tshirt' as Product['type'],
  colors: [] as string[],
  sizes: [] as string[],
  description: '',
  image_url: '',
  image_urls: [] as string[],
  active: true,
  purchasable: true,
  hidden: false,
}

const ORDER_STATUSES = [
  { key: 'ordered',          label: 'Order Placed',     style: { border: '1px solid #eab308', color: '#713f12', background: '#fefce8' } },
  { key: 'supplies_ordered', label: 'Supplies Ordered', style: { border: '1px solid #3b82f6', color: '#1e3a8a', background: '#eff6ff' } },
  { key: 'ready',            label: 'Ready to Deliver', style: { border: '1px solid #f97316', color: '#7c2d12', background: '#fff7ed' } },
  { key: 'delivered',        label: 'Delivered',        style: { border: '1px solid #22c55e', color: '#14532d', background: '#f0fdf4' } },
] as const

function OrdersTab({ orders, loading, onLoad, statuses, onStatusChange }: {
  orders: Array<{ id: string; name: string; email: string; total: number; items: Array<{ name: string; color?: string | null; size?: string | null; qty: number; price: number }>; created: number; payment_status: string }>
  loading: boolean
  onLoad: () => void
  statuses: Record<string, string>
  onStatusChange: (sessionId: string, status: string) => Promise<void>
}) {
  const [refunding, setRefunding] = useState<string | null>(null)
  const [refunded, setRefunded] = useState<Set<string>>(new Set())
  const [refundError, setRefundError] = useState<Record<string, string>>({})

  useEffect(() => { onLoad() }, [])

  const handleRefund = async (sessionId: string) => {
    if (!confirm('Issue a full refund for this order?')) return
    setRefunding(sessionId)
    setRefundError(prev => { const n = { ...prev }; delete n[sessionId]; return n })
    try {
      const res = await fetch('/api/shop-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setRefunded(prev => new Set(prev).add(sessionId))
    } catch (e: any) {
      setRefundError(prev => ({ ...prev, [sessionId]: e.message }))
    } finally {
      setRefunding(null)
    }
  }

  const [markingAll, setMarkingAll] = useState(false)

  // Aggregate items from all "ordered" status orders
  const pendingOrders = orders.filter(o =>
    !refunded.has(o.id) && o.payment_status !== 'refunded' && (statuses[o.id] ?? 'ordered') === 'ordered'
  )
  const supplierLines = (() => {
    const map: Record<string, { name: string; product_code?: string; category?: string; color?: string | null; size?: string | null; qty: number }> = {}
    for (const order of pendingOrders) {
      for (const item of order.items) {
        const key = [(item as any).category, item.name, item.color, item.size].filter(Boolean).join('|')
        if (map[key]) map[key].qty += item.qty
        else map[key] = { name: item.name, product_code: (item as any).product_code, category: (item as any).category, color: item.color, size: item.size, qty: item.qty }
      }
    }
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name))
  })()

  const handleMarkAllOrdered = async () => {
    if (!pendingOrders.length) return
    setMarkingAll(true)
    await Promise.all(pendingOrders.map(o => onStatusChange(o.id, 'supplies_ordered')))
    setMarkingAll(false)
  }

  if (loading) return (
    <div className="flex flex-col gap-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>
  )

  if (orders.length === 0) return (
    <EmptyState icon={ShoppingCart} title="No orders yet" description="Paid shop orders will appear here." />
  )

  return (
    <div className="flex flex-col gap-3">
      {/* Supplier summary card */}
      {pendingOrders.length > 0 && (
        <Card className="py-0 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">Awaiting Order</p>
                <p className="text-xs text-muted-foreground">{pendingOrders.length} order{pendingOrders.length !== 1 ? 's' : ''} waiting on supplies</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 shrink-0"
                onClick={handleMarkAllOrdered}
                disabled={markingAll}
              >
                {markingAll ? 'Updating…' : 'Mark all as Supplies Ordered'}
              </Button>
            </div>
            <div className="border-t pt-3 flex flex-col gap-1.5">
              {supplierLines.map((line, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground">
                    {line.name}{[line.color, line.size].filter(Boolean).length > 0 ? ` — ${[line.color, line.size].filter(Boolean).join(' / ')}` : ''}
                    {line.product_code && <span className="text-muted-foreground ml-1.5">({line.product_code})</span>}
                    {line.category && <span className="text-muted-foreground ml-1.5 capitalize">[{CATEGORY_LABELS[line.category] ?? line.category}]</span>}
                  </span>
                  <span className="font-semibold tabular-nums ml-4">×{line.qty}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {orders.map(order => {
        const currentStatus = statuses[order.id] ?? 'ordered'
        const statusMeta = ORDER_STATUSES.find(s => s.key === currentStatus) ?? ORDER_STATUSES[0]
        const isRefunded = refunded.has(order.id) || order.payment_status === 'refunded'
        return (
          <Card key={order.id} className="py-0">
            <CardContent className="p-4 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{order.name}</p>
                  <p className="text-xs text-muted-foreground">{order.email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold">£{order.total.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  {!isRefunded && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {ORDER_STATUSES.filter(s => s.key !== currentStatus).map(s => (
                          <DropdownMenuItem key={s.key} className="text-xs" onClick={() => onStatusChange(order.id, s.key)}>
                            <ChevronRight className="h-3 w-3 mr-1.5 opacity-50" />
                            {s.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-xs text-destructive focus:text-destructive"
                          disabled={refunding === order.id}
                          onClick={() => handleRefund(order.id)}
                        >
                          {refunding === order.id ? 'Refunding…' : 'Refund'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                {order.items.map((item, i) => (
                  <p key={i} className="text-xs text-muted-foreground">
                    {item.name}{[item.color, item.size].filter(Boolean).length > 0 ? ` — ${[item.color, item.size].filter(Boolean).join(' / ')}` : ''}{item.qty > 1 ? ` ×${item.qty}` : ''}{(item as any).category && <span className="text-muted-foreground ml-1"> [{CATEGORY_LABELS[(item as any).category] ?? (item as any).category}]</span>}
                  </p>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {isRefunded ? (
                  <span className="text-xs text-muted-foreground">Refunded ✓</span>
                ) : (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={statusMeta.style}>
                    {statusMeta.label}
                  </span>
                )}
              </div>
              {refundError[order.id] && <p className="text-xs text-destructive">{refundError[order.id]}</p>}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export default function ShopPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch, setHeaderTabs } = usePageActions()

  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Shop orders
  const [orders, setOrders] = useState<Array<{
    id: string; name: string; email: string; total: number;
    items: Array<{ name: string; color?: string | null; size?: string | null; qty: number; price: number }>;
    created: number; payment_status: string;
  }>>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({})

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [pendingImageFiles, setPendingImageFiles] = useState<File[]>([])
  const [pendingImagePreviews, setPendingImagePreviews] = useState<string[]>([])
  const [savedImageUrls, setSavedImageUrls] = useState<string[]>([])

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Inject top bar actions + search
  useEffect(() => {
    const label = activeTab === 'products' ? 'Add Product' : activeTab === 'categories' ? 'Add Category' : ''
    setActions(
      label ? (
        <Button variant="outline" className="bg-card" onClick={activeTab === 'products' ? handleOpenAdd : undefined}>
          <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
          <span className="hidden lg:inline">{label}</span>
        </Button>
      ) : null
    )
    setHeaderTabs(
      <div className="inline-flex items-center rounded-md bg-muted/50 p-1 gap-0.5" data-tab-pill style={{ height: 'var(--tab-pill-h)' }}>
        {([['products', 'Products'], ['categories', 'Categories'], ['orders', 'Orders']] as [string, string][]).map(([val, lbl]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={cn('inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-sm transition-all',
              activeTab === val ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >{lbl}</button>
        ))}
      </div>
    )
    return () => { setActions(null); setHeaderTabs(null) }
  }, [setActions, setHeaderTabs, activeTab])

  useEffect(() => {
    if (activeTab !== 'products') {
      setHeaderSearch(null)
      return
    }
    setHeaderSearch(
      <div className="flex items-center gap-2">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search"
            className="pl-8 h-8 text-sm w-24 lg:w-48 bg-card"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-20 lg:w-32 h-8 text-sm bg-card">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="mens">Men&apos;s</SelectItem>
            <SelectItem value="womens">Women&apos;s</SelectItem>
            <SelectItem value="unisex">Unisex</SelectItem>
            <SelectItem value="accessories">Accessories</SelectItem>
          </SelectContent>
        </Select>
      </div>
    )
    return () => setHeaderSearch(null)
  }, [setHeaderSearch, activeTab, searchQuery, categoryFilter])

  // Fetch products
  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('shop_products')
          .select('*')
          .eq('trainer_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error
        setProducts(data || [])
      } catch (err) {
        logger.error('Error fetching products:', err)
        setError(getErrorMessage(err) || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  const filteredProducts = products.filter(p => {
    const matchSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchCat = categoryFilter === 'all' || p.category === categoryFilter
    return matchSearch && matchCat
  })

  const resetForm = () => {
    setForm({ ...EMPTY_FORM })
    setFormError(null)
    setPendingImageFiles([])
    setPendingImagePreviews([])
    setSavedImageUrls([])
    setEditingProduct(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setSheetOpen(true)
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    const existingUrls = product.image_urls?.length
      ? product.image_urls
      : product.image_url ? [product.image_url] : []
    setForm({
      name: product.name,
      product_code: product.product_code || '',
      price: product.price.toString(),
      category: product.category,
      type: product.type,
      colors: product.colors || [],
      sizes: product.sizes || [],
      description: product.description || '',
      image_url: product.image_url || '',
      image_urls: existingUrls,
      active: product.active,
      purchasable: product.purchasable ?? true,
      hidden: product.hidden ?? false,
    } as any)
    setFormError(null)
    setPendingImageFiles([])
    setPendingImagePreviews([])
    setSavedImageUrls(existingUrls)
    setSheetOpen(true)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const total = savedImageUrls.length + pendingImagePreviews.length + files.length
    if (total > 5) { setFormError('Maximum 5 images per product'); return }
    const invalid = files.find(f => !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024)
    if (invalid) { setFormError('Images must be JPG/PNG under 5MB each'); return }
    setPendingImageFiles(prev => [...prev, ...files])
    setPendingImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))])
    setFormError(null)
    e.target.value = ''
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `gear-products/${user!.id}/${fileName}`
      const { error } = await supabase.storage.from('gear-images').upload(filePath, file, { upsert: true })
      if (error) throw error
      const { data: publicUrlData } = supabase.storage.from('gear-images').getPublicUrl(filePath)
      return publicUrlData.publicUrl
    } catch (err) {
      logger.error('Upload error:', err)
      return null
    }
  }

  const removeSavedImage = (idx: number) => {
    setSavedImageUrls(prev => prev.filter((_, i) => i !== idx))
  }

  const removePendingImage = (idx: number) => {
    setPendingImageFiles(prev => prev.filter((_, i) => i !== idx))
    setPendingImagePreviews(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async () => {
    setFormError(null)
    if (!form.name || !form.price) { setFormError('Product name and price are required'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price <= 0) { setFormError('Enter a valid price'); return }

    setSubmitting(true)
    setUploadingImage(pendingImageFiles.length > 0)
    try {
      // Upload any pending new images
      const uploadedUrls: string[] = []
      for (const file of pendingImageFiles) {
        const url = await uploadImage(file)
        if (url) uploadedUrls.push(url)
        else { setFormError('Failed to upload one or more images'); setSubmitting(false); setUploadingImage(false); return }
      }
      setUploadingImage(false)

      const allImageUrls = [...savedImageUrls, ...uploadedUrls]
      const primaryImageUrl = allImageUrls[0] || ''

      const payload = {
        name: form.name,
        product_code: (form as any).product_code?.trim() || null,
        price,
        category: form.category,
        type: form.type,
        colors: form.colors,
        sizes: form.sizes,
        description: form.description,
        image_url: primaryImageUrl,
        image_urls: allImageUrls,
        active: form.active,
        purchasable: form.purchasable,
        hidden: form.hidden,
        trainer_id: user!.id,
      }

      if (editingProduct) {
        const { data, error } = await supabase
          .from('shop_products')
          // @ts-ignore
          .update(payload)
          .eq('id', editingProduct.id)
          .select()
          .single()
        if (error) throw error
        setProducts(prev => prev.map(p => p.id === editingProduct.id ? data as Product : p))
        toast.success('Product updated')
      } else {
        const { data, error } = await supabase
          .from('shop_products')
          // @ts-ignore
          .insert([payload])
          .select()
          .single()
        if (error) throw error
        setProducts(prev => [data as Product, ...prev])
        toast.success('Product added')
      }
      setSheetOpen(false)
      resetForm()
    } catch (err) {
      logger.error('Error saving product:', err)
      setFormError(getErrorMessage(err) || 'Failed to save product')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('shop_products').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
      toast.success('Product deleted')
      setDeleteTarget(null)
      if (sheetOpen) { setSheetOpen(false); resetForm() }
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const toggleColor = (color: string) => {
    setForm(prev => ({
      ...prev,
      colors: prev.colors.includes(color) ? prev.colors.filter(c => c !== color) : [...prev.colors, color],
    }))
  }

  const toggleSize = (size: string) => {
    setForm(prev => ({
      ...prev,
      sizes: prev.sizes.includes(size) ? prev.sizes.filter(s => s !== size) : [...prev.sizes, size],
    }))
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {/* Products tab */}
      {activeTab === 'products' && (<>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No products yet"
              description="Add products to your shop to start selling to your clients."
              action={
                <Button variant="outline" onClick={handleOpenAdd}>
                  <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
                  Add Product
                </Button>
              }
            />
          ) : filteredProducts.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No products match"
              description="Try adjusting your search or category filter."
            />
          ) : (
            <Card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
              <CardContent className="p-0">
                <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-medium w-14">Image</TableHead>
                    <TableHead className="text-xs font-medium">Name</TableHead>
                    <TableHead className="text-xs font-medium">Code</TableHead>
                    <TableHead className="text-xs font-medium">Category</TableHead>
                    <TableHead className="text-xs font-medium">Price</TableHead>
                    <TableHead className="text-xs font-medium">Sizes</TableHead>
                    <TableHead className="text-xs font-medium">Active</TableHead>
                    <TableHead className="text-xs font-medium">Purchasable</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map(product => (
                    <TableRow key={product.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleOpenEdit(product)}>
                      <TableCell className="py-2">
                        {product.image_url ? (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded-md border border-border"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                            <Image className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="py-2">
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{TYPE_LABELS[product.type] || product.type}</p>
                      </TableCell>
                      <TableCell className="py-2 text-xs text-muted-foreground font-mono">{product.product_code || '—'}</TableCell>
                      <TableCell className="py-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {CATEGORY_LABELS[product.category] ?? product.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-sm font-medium">£{product.price.toFixed(2)}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {(product.sizes || []).slice(0, 3).map(s => (
                            <Badge key={s} variant="outline" className="bg-card text-xs">{s}</Badge>
                          ))}
                          {(product.sizes || []).length > 3 && (
                            <span className="text-xs text-muted-foreground">+{product.sizes.length - 3}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2" onClick={e => e.stopPropagation()}>
                        <Switch
                          checked={product.active}
                          onCheckedChange={async (checked) => {
                            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: checked } : p))
                            const { error } = await supabase.from('shop_products')
                              // @ts-ignore
                              .update({ active: checked }).eq('id', product.id)
                            if (error) {
                              setProducts(prev => prev.map(p => p.id === product.id ? { ...p, active: !checked } : p))
                              toast.error('Failed to update status')
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-2" onClick={e => e.stopPropagation()}>
                        <Switch
                          checked={product.purchasable ?? true}
                          onCheckedChange={async (checked) => {
                            setProducts(prev => prev.map(p => p.id === product.id ? { ...p, purchasable: checked } : p))
                            const { error } = await supabase.from('shop_products')
                              // @ts-ignore
                              .update({ purchasable: checked }).eq('id', product.id)
                            if (error) {
                              setProducts(prev => prev.map(p => p.id === product.id ? { ...p, purchasable: !checked } : p))
                              toast.error('Failed to update purchasable')
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="py-2" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleOpenEdit(product)}>Edit</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </CardContent>
            </Card>
          )}
        </>)}

      {/* Categories tab */}
      {activeTab === 'categories' && (<>
          <EmptyState
            icon={Tag}
            title="Categories"
            description="Products are currently categorised by Men's and Women's. Custom categories coming soon."
          />
        </>)}

      {/* Orders tab */}
      {activeTab === 'orders' && (<>
          <OrdersTab
            orders={orders}
            loading={ordersLoading}
            statuses={orderStatuses}
            onStatusChange={async (sessionId, status) => {
              setOrderStatuses(prev => ({ ...prev, [sessionId]: status }))
              await (supabase as any).from('shop_order_statuses').upsert(
                { session_id: sessionId, trainer_id: user?.id, status, updated_at: new Date().toISOString() },
                { onConflict: 'session_id' }
              )
            }}
            onLoad={async () => {
              if (orders.length > 0 || ordersLoading) return
              setOrdersLoading(true)
              try {
                const res = await fetch('/api/shop-orders')
                if (res.ok) {
                  const data = await res.json()
                  setOrders(data)
                  // Load statuses for these orders
                  if (data.length && user?.id) {
                    const ids = data.map((o: any) => o.id)
                    const { data: rows } = await (supabase as any)
                      .from('shop_order_statuses')
                      .select('session_id, status')
                      .in('session_id', ids)
                    if (rows) {
                      const map: Record<string, string> = {}
                      for (const r of rows) map[r.session_id] = r.status
                      setOrderStatuses(map)
                    }
                  }
                }
              } catch { /* ignore */ } finally { setOrdersLoading(false) }
            }}
          />
        </>)}

      {/* Product Sheet */}
      <Sheet open={sheetOpen} onOpenChange={open => { if (!open) { setSheetOpen(false); resetForm() } else setSheetOpen(true) }}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingProduct ? 'Edit Product' : 'Add Product'}</SheetTitle>
          </SheetHeader>

          <SheetBody>
            {formError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</div>
            )}

            {/* Images */}
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Product Images</Label>
                <span className="text-xs text-muted-foreground">{savedImageUrls.length + pendingImagePreviews.length}/5</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Saved images */}
                {savedImageUrls.map((url, idx) => (
                  <div key={url} className="relative w-20 aspect-[2/3] rounded-lg border border-border bg-muted overflow-hidden shrink-0">
                    <img src={url} alt={`Image ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    {idx === 0 && <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-black/60 text-white py-0.5">Primary</span>}
                    <button type="button" onClick={() => removeSavedImage(idx)} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center shadow">×</button>
                  </div>
                ))}
                {/* Pending (not yet uploaded) */}
                {pendingImagePreviews.map((url, idx) => (
                  <div key={idx} className="relative w-20 aspect-[2/3] rounded-lg border border-border bg-muted overflow-hidden shrink-0 opacity-70">
                    <img src={url} alt={`Pending ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                    <span className="absolute bottom-0 inset-x-0 text-center text-[9px] bg-black/60 text-white py-0.5">Pending</span>
                    <button type="button" onClick={() => removePendingImage(idx)} className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center shadow">×</button>
                  </div>
                ))}
                {/* Add button */}
                {savedImageUrls.length + pendingImagePreviews.length < 5 && (
                  <label htmlFor="product-image-upload" className="w-20 aspect-[2/3] rounded-lg border border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-muted transition-colors shrink-0">
                    <Image className="h-4 w-4 text-muted-foreground/50" />
                    <span className="text-[10px] text-muted-foreground/60">Add</span>
                  </label>
                )}
              </div>
              <input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" id="product-image-upload" />
              <p className="text-xs text-muted-foreground">Up to 5 images · PNG/JPG under 5MB · Best: 1024×1536px (2:3)</p>
            </div>

            <Separator />

            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5 col-span-2">
                  <Label className="text-xs">Product Name *</Label>
                  <Input
                    placeholder="e.g. Training Hoodie"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Product Code</Label>
                  <Input
                    placeholder="e.g. FL-HOD-001"
                    value={(form as any).product_code || ''}
                    onChange={e => setForm(p => ({ ...p, product_code: e.target.value }))}
                    className="h-8 text-sm font-mono"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Price (£) *</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 45.00"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={val => setForm(p => ({ ...p, category: val as any }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mens">Men&apos;s</SelectItem>
                      <SelectItem value="womens">Women&apos;s</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                      <SelectItem value="accessories">Accessories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Type</Label>
                  <Select value={form.type} onValueChange={val => setForm(p => ({ ...p, type: val as any }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoodie">Hoodie</SelectItem>
                      <SelectItem value="vest">Vest</SelectItem>
                      <SelectItem value="tshirt">T-Shirt</SelectItem>
                      <SelectItem value="shorts">Shorts</SelectItem>
                      <SelectItem value="jacket">Jacket</SelectItem>
                      <SelectItem value="leggings">Leggings</SelectItem>
                      <SelectItem value="bra">Sports Bra</SelectItem>
                      <SelectItem value="cap">Cap</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Available Colours</Label>
                <div className="flex flex-wrap gap-1.5">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleColor(c)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${form.colors.includes(c) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Available Sizes</Label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZE_OPTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSize(s)}
                      className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${form.sizes.includes(s) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-muted-foreground hover:border-primary/50'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-xs">Description</Label>
                <Textarea
                  placeholder="Product description..."
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  className="text-sm resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="product-active"
                  checked={form.active}
                  onCheckedChange={val => setForm(p => ({ ...p, active: val }))}
                />
                <Label htmlFor="product-active" className="text-sm">
                  {form.active ? 'Active (visible in shop)' : 'Inactive (hidden from shop)'}
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="product-hidden"
                  checked={form.hidden}
                  onCheckedChange={val => setForm(p => ({ ...p, hidden: val }))}
                />
                <Label htmlFor="product-hidden" className="text-sm">
                  {form.hidden ? 'Hidden (completely invisible everywhere)' : 'Hide product'}
                </Label>
              </div>
            </div>
          </SheetBody>

          <SheetFooter className="flex-col gap-2 sm:flex-row">
            {editingProduct && (
              <Button
                variant="destructive"
                className="sm:mr-auto"
                onClick={() => { setSheetOpen(false); setDeleteTarget({ id: editingProduct.id, name: editingProduct.name }) }}
              >
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => { setSheetOpen(false); resetForm() }}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || uploadingImage}>
              {uploadingImage ? 'Uploading…' : submitting ? 'Saving…' : editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        itemName={deleteTarget?.name ?? ''}
        itemKind="product"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
