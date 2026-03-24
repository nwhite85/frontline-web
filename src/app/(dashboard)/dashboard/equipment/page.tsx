'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter,
} from '@/components/ui/sheet'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { Plus, Package, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { getErrorMessage } from '@/utils/errorHandling'

interface EquipmentItem {
  id: string
  name: string
  quantity: number
  notes: string | null
}

// ─────────────────────────────────────────────
// Equipment Sheet
// ─────────────────────────────────────────────
function EquipmentSheet({
  open,
  onOpenChange,
  editTarget,
  trainerId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  editTarget: EquipmentItem | null
  trainerId: string
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (open) {
      if (editTarget) {
        setName(editTarget.name)
        setQuantity(String(editTarget.quantity))
        setNotes(editTarget.notes || '')
      } else {
        setName(''); setQuantity('1'); setNotes('')
      }
      setFormError('')
    }
  }, [open, editTarget])

  const handleSave = async () => {
    if (!name.trim()) { setFormError('Name is required'); return }
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        name: name.trim(),
        quantity: parseInt(quantity) || 1,
        notes: notes.trim() || null,
        trainer_id: trainerId,
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
      onOpenChange(false)
      onSaved()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px]">
        <SheetHeader>
          <SheetTitle>{editTarget ? 'Edit Equipment' : 'Add Equipment'}</SheetTitle>
          <SheetDescription>Track kit quantities to reference when setting challenge capacities.</SheetDescription>
        </SheetHeader>
        <SheetBody>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Kettlebells" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Quantity</Label>
            <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. Mix of 12kg, 16kg, 20kg, 24kg" />
          </div>
        </SheetBody>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function EquipmentPage() {
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()

  const [items, setItems] = useState<EquipmentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showSheet, setShowSheet] = useState(false)
  const [editTarget, setEditTarget] = useState<EquipmentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

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
      <Button variant="outline" className="bg-card" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Add Equipment
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('equipment_inventory').delete().eq('id', deleteTarget.id)
    toast.success('Equipment removed')
    setDeleteTarget(null)
    setDeleting(false)
    fetchItems()
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {loading ? (
        <div className="flex flex-col gap-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No equipment added yet"
          description="Add your kit to reference when setting challenge tier capacities."
          action={
            <Button variant="outline" onClick={() => { setEditTarget(null); setShowSheet(true) }}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />Add Equipment
            </Button>
          }
        />
      ) : (
        <Card data-table-card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="pl-4 w-9">
                    <div className="h-7 w-7 flex items-center justify-center">
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </TableHead>
                  <TableHead className="text-xs font-medium">Name</TableHead>
                  <TableHead className="text-xs font-medium">Notes</TableHead>
                  <TableHead className="text-xs font-medium text-right pr-6">Quantity</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="py-3 pl-4 w-9">
                      <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-500/20">
                        <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="text-sm font-medium">{item.name}</p>
                    </TableCell>
                    <TableCell className="py-3">
                      <p className="text-xs text-muted-foreground">{item.notes || '—'}</p>
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <span className="text-sm font-bold tabular-nums">{item.quantity}</span>
                    </TableCell>
                    <TableCell className="py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditTarget(item); setShowSheet(true) }}>Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget({ id: item.id, name: item.name })}>Delete</DropdownMenuItem>
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

      <EquipmentSheet
        open={showSheet}
        onOpenChange={v => { if (!v) setShowSheet(false) }}
        editTarget={editTarget}
        trainerId={user?.id || ''}
        onSaved={fetchItems}
      />

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={v => { if (!v) setDeleteTarget(null) }}
        itemName={deleteTarget?.name || ''}
        itemKind="Equipment"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
