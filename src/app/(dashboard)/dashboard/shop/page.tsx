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
import { Search, Plus, MoreHorizontal, ShoppingBag, Tag, ShoppingCart, Image } from 'lucide-react'
import { toast } from 'sonner'

interface Product {
  id: string
  name: string
  price: number
  category: 'mens' | 'womens' | 'unisex' | 'accessories'
  type: 'hoodie' | 'vest' | 'tshirt' | 'shorts' | 'jacket' | 'leggings' | 'bra' | 'cap' | 'other'
  colors: string[]
  sizes: string[]
  description: string
  image_url?: string
  active: boolean
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
  price: '',
  category: 'mens' as Product['category'],
  type: 'tshirt' as Product['type'],
  colors: [] as string[],
  sizes: [] as string[],
  description: '',
  image_url: '',
  active: true,
}

export default function ShopPage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch, setHeaderTabs } = usePageActions()

  const [activeTab, setActiveTab] = useState('products')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

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
    setImageFile(null)
    setImagePreview(null)
    setEditingProduct(null)
  }

  const handleOpenAdd = () => {
    resetForm()
    setSheetOpen(true)
  }

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product)
    setForm({
      name: product.name,
      price: product.price.toString(),
      category: product.category,
      type: product.type,
      colors: product.colors || [],
      sizes: product.sizes || [],
      description: product.description || '',
      image_url: product.image_url || '',
      active: product.active,
    })
    setFormError(null)
    setImageFile(null)
    setImagePreview(product.image_url || null)
    setSheetOpen(true)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setFormError('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { setFormError('Image must be less than 5MB'); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setFormError(null)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
      const filePath = `gear-products/${user!.id}/${fileName}`

      const { error } = await supabase.storage
        .from('gear-images')
        .upload(filePath, file, { upsert: true })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from('gear-images')
        .getPublicUrl(filePath)

      return publicUrlData.publicUrl
    } catch (err) {
      logger.error('Upload error:', err)
      setFormError('Failed to upload image. Please try again.')
      return null
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSubmit = async () => {
    setFormError(null)
    if (!form.name || !form.price) { setFormError('Product name and price are required'); return }
    const price = parseFloat(form.price)
    if (isNaN(price) || price <= 0) { setFormError('Enter a valid price'); return }

    setSubmitting(true)
    try {
      let imageUrl = form.image_url
      if (imageFile) {
        const uploaded = await uploadImage(imageFile)
        if (uploaded) imageUrl = uploaded
        else { setSubmitting(false); return }
      }

      const payload = {
        name: form.name,
        price,
        category: form.category,
        type: form.type,
        colors: form.colors,
        sizes: form.sizes,
        description: form.description,
        image_url: imageUrl,
        active: form.active,
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
                    <TableHead className="text-xs font-medium">Category</TableHead>
                    <TableHead className="text-xs font-medium">Price</TableHead>
                    <TableHead className="text-xs font-medium">Sizes</TableHead>
                    <TableHead className="text-xs font-medium">Status</TableHead>
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
                      <TableCell className="py-2">
                        <Badge variant={product.active ? 'default' : 'secondary'} className="text-xs">
                          {product.active ? 'Active' : 'Inactive'}
                        </Badge>
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
          <EmptyState
            icon={ShoppingCart}
            title="No orders yet"
            description="When clients purchase products from your shop, orders will appear here."
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

            {/* Image */}
            <div className="grid gap-1.5">
              <Label className="text-xs">Product Image</Label>
              <div className="flex gap-4 items-start">
                {/* 2:3 portrait preview */}
                <div className="relative w-28 aspect-[2/3] rounded-lg border border-border bg-muted overflow-hidden shrink-0">
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => { setImageFile(null); setImagePreview(null); setForm(p => ({ ...p, image_url: '' })) }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center shadow"
                      >×</button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 pt-1">
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="product-image-upload" />
                  <label htmlFor="product-image-upload" className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted">
                    <Image className="h-3.5 w-3.5" />
                    {imagePreview ? 'Change Image' : 'Upload Image'}
                  </label>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB<br />Best: 1024 × 1536px (2:3)</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Product Name *</Label>
                <Input
                  placeholder="e.g. Training Hoodie"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="h-8 text-sm"
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
