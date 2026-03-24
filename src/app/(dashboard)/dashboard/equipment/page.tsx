'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { toast } from 'sonner'
import { Plus, Package, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface EquipmentItem {
  id: string
  name: string
  quantity: number
  notes: string | null
}

export default function EquipmentPage() {
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()
  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<EquipmentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EquipmentItem | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    if (!user) return
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('equipment_inventory')
      .select('*')
      .eq('trainer_id', user.id)
      .order('name')
    setItems(data || [])
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (user) fetchItems()
  }, [user, fetchItems])

  useEffect(() => {
    setActions(
      <Button onClick={() => { setEditTarget(null); setShowSheet(true) }}>
        <Plus className="h-3.5 w-3.5 mr-1" />
        Add Equipment
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  const openEdit = (item: EquipmentItem) => {
    setEditTarget(item)
    setName(item.name)
    setQuantity(String(item.quantity))
    setNotes(item.notes || '')
    setShowSheet(true)
  }

  const openAdd = () => {
    setEditTarget(null)
    setName('')
    setQuantity('1')
    setNotes('')
    setShowSheet(true)
  }

  const handleSave = async () => {
    if (!name.trim() || !user) return
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        quantity: parseInt(quantity) || 1,
        notes: notes.trim() || null,
        trainer_id: user.id,
      }
      if (editTarget) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('equipment_inventory').update(payload).eq('id', editTarget.id)
        if (error) throw error
        toast.success('Equipment updated')
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (supabase as any).from('equipment_inventory').insert(payload)
        if (error) throw error
        toast.success('Equipment added')
      }
      setShowSheet(false)
      fetchItems()
    } catch (err: any) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('equipment_inventory').delete().eq('id', deleteTarget.id)
    toast.success('Equipment removed')
    setDeleteTarget(null)
    fetchItems()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Equipment Inventory</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your kit quantities. Use these to calculate tier capacities in your challenge settings.
        </p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium">No equipment added yet</p>
          <p className="text-xs text-muted-foreground">Add your kit to reference when setting challenge capacities</p>
          <Button variant="outline" onClick={openAdd} className="mt-2">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add Equipment
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {items.map(item => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.name}</p>
                {item.notes && <p className="text-xs text-muted-foreground mt-0.5">{item.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold tabular-nums">{item.quantity}</span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteTarget(item)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit sheet */}
      <Sheet open={showSheet} onOpenChange={v => { if (!v) setShowSheet(false) }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editTarget ? 'Edit Equipment' : 'Add Equipment'}</SheetTitle>
          </SheetHeader>
          <SheetBody className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kettlebells" />
            </div>
            <div className="space-y-1.5">
              <Label>Quantity</Label>
              <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Mix of 12kg, 16kg, 20kg, 24kg" />
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setShowSheet(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will remove it from your inventory. Challenge capacities won&apos;t be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
