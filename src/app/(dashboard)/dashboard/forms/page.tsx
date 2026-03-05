'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { EmptyState } from '@/components/ui/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { Search, Plus, MoreHorizontal, FileText } from 'lucide-react'
import { SortButton } from '@/components/ui/sort-button'
import { toast } from 'sonner'
import { sortData, toggleSortDirection, type SortConfig } from '@/utils/tableSorting'

interface Form {
  id: string
  trainer_id: string | null
  title: string
  type: string
  questions: unknown[]
  created_at: string
  updated_at: string
}

const TYPE_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  onboarding: 'default',
  review: 'secondary',
  legal: 'outline',
  custom: 'secondary',
}

export default function FormsPage() {
  const router = useRouter()
  const { user } = useSimpleAuth()
  const { setActions, setHeaderSearch } = usePageActions()

  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig<Form> | null>({ key: 'title', direction: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(25)

  // Create sheet
  const [sheetOpen, setSheetOpen] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState('custom')
  const [creating, setCreating] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Inject top bar actions + search
  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={() => setSheetOpen(true)}>
        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
        Create Form
      </Button>
    )
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    setHeaderSearch(
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search forms…"
          className="pl-8 h-8 text-sm w-48 bg-card"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setPage(1) }}
        />
      </div>
    )
    return () => setHeaderSearch(null)
  }, [setHeaderSearch, searchQuery])

  const handleSort = (key: string) => {
    const newDir = toggleSortDirection(sortConfig?.key as string ?? null, key, sortConfig?.direction ?? null)
    setSortConfig(newDir ? { key, direction: newDir } : null)
    setPage(1)
  }

  // Fetch forms
  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .or(`trainer_id.eq.${user.id},trainer_id.is.null`)
          .order('created_at', { ascending: false })

        if (error) throw error
        setForms(data || [])
      } catch (err) {
        logger.error('Error fetching forms:', err)
        setError(getErrorMessage(err) || 'Failed to load forms')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  const filteredForms = forms.filter(f =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.type.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const sortedForms = sortData(filteredForms, sortConfig)
  const totalPages = pageSize === Infinity ? 1 : Math.max(1, Math.ceil(sortedForms.length / pageSize))
  const paginatedForms = pageSize === Infinity ? sortedForms : sortedForms.slice((page - 1) * pageSize, page * pageSize)

  const handleCreate = async () => {
    if (!user || !formTitle.trim()) return
    setCreating(true)
    try {
      const isLegal = formType.toLowerCase() === 'legal'
      const { data, error } = await supabase
        .from('forms')
        // @ts-ignore
        .insert({
          trainer_id: isLegal ? null : user.id,
          title: formTitle.trim(),
          type: formType,
          questions: [],
        })
        .select()
        .single()

      if (error) throw error
      setForms(prev => [data as Form, ...prev])
      toast.success('Form created')
      setSheetOpen(false)
      setFormTitle('')
      setFormType('custom')
      // @ts-ignore
      router.push(`/dashboard/forms/${data.id}`)
    } catch (err) {
      logger.error('Error creating form:', err)
      toast.error(getErrorMessage(err) || 'Failed to create form')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    const form = forms.find(f => f.id === deleteTarget.id)
    if (form && !form.trainer_id) {
      toast.error('System-wide legal documents cannot be deleted')
      setDeleteTarget(null)
      return
    }
    setDeleting(true)
    try {
      const { error } = await supabase.from('forms').delete().eq('id', deleteTarget.id)
      if (error) throw error
      setForms(prev => prev.filter(f => f.id !== deleteTarget.id))
      toast.success('Form deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex flex-col gap-6 p-6">
      {error && (
        <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : forms.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No forms yet"
          description="Create forms for client onboarding, reviews, waivers, or feedback surveys."
          action={
            <Button variant="outline" onClick={() => setSheetOpen(true)}>
              <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
              Create Form
            </Button>
          }
        />
      ) : filteredForms.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No forms match"
          description="Try adjusting your search query."
        />
      ) : (
        <Card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
          <CardContent className="p-0">
            <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="pl-4 w-9">
                  <div className="h-7 w-7 flex items-center justify-center">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <SortButton
                    label="Form Name"
                    direction={sortConfig?.key === 'title' ? sortConfig.direction : null}
                    onClick={() => handleSort('title')}
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">Type</TableHead>
                <TableHead className="text-xs font-medium">Fields</TableHead>
                <TableHead className="text-xs font-medium">Created</TableHead>
                <TableHead className="text-xs font-medium">Updated</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedForms.map(form => (
                <TableRow
                  key={form.id}
                  className="hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/dashboard/forms/${form.id}`)}
                >
                  <TableCell className="py-3 pl-4 w-9">
                    <div className="h-7 w-7 rounded-md flex items-center justify-center shrink-0 bg-blue-100 dark:bg-blue-500/20">
                      <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm font-medium">{form.title}</p>
                    {!form.trainer_id && (
                      <p className="text-xs text-muted-foreground mt-0.5">System-wide</p>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge variant={TYPE_BADGE_VARIANT[form.type] || 'secondary'} className="text-xs capitalize">
                      {form.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-sm text-muted-foreground">{form.questions?.length || 0}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs text-muted-foreground">{formatDate(form.created_at)}</span>
                  </TableCell>
                  <TableCell className="py-3">
                    <span className="text-xs text-muted-foreground">{formatDate(form.updated_at)}</span>
                  </TableCell>
                  <TableCell className="py-3" onClick={e => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/forms/${form.id}`)}>
                          Open
                        </DropdownMenuItem>
                        {form.trainer_id && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteTarget({ id: form.id, title: form.title })}
                            >
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
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

      {filteredForms.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-4">
          <span>{sortedForms.length} forms</span>
          <div className="flex items-center gap-2">
            <Select value={pageSize === Infinity ? 'all' : String(pageSize)} onValueChange={v => { setPageSize(v === 'all' ? Infinity : Number(v)); setPage(1) }}>
              <SelectTrigger className="h-7 w-20 text-xs bg-card"><SelectValue>{pageSize === Infinity ? 'All' : String(pageSize)}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="bg-card" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span>Page {page} of {totalPages}</span>
            <Button variant="outline" className="bg-card" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Create Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={open => { if (!open) { setSheetOpen(false); setFormTitle(''); setFormType('custom') } else setSheetOpen(true) }}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Create Form</SheetTitle>
          </SheetHeader>
          <SheetBody>
            <div className="grid gap-1.5">
              <Label className="text-xs">Form Title *</Label>
              <Input
                placeholder="e.g. New Client Onboarding"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs">Form Type</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Custom</SelectItem>
                  <SelectItem value="onboarding">Onboarding</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="legal">Legal (System-wide)</SelectItem>
                </SelectContent>
              </Select>
              {formType === 'legal' && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-md p-2 mt-1">
                  ⚠️ Legal documents are shared across all users in the app.
                </p>
              )}
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => { setSheetOpen(false); setFormTitle(''); setFormType('custom') }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!formTitle.trim() || creating}>
              {creating ? 'Creating…' : 'Create Form'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        itemName={deleteTarget?.title ?? ''}
        itemKind="form"
        cascadeWarning="All form responses will also be deleted."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
