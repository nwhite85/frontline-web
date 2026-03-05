// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody, SheetFooter } from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { EmptyState } from '@/components/ui/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import { Plus, MoreHorizontal, Smartphone, Layers, GripVertical } from 'lucide-react'
import { toast } from 'sonner'

interface NotificationBarSettings {
  notification_bar_enabled: boolean
  notification_bar_size: 'small' | 'medium' | 'large' | 'xl'
}

interface NotificationBarSlide {
  id: string
  trainer_id: string
  position: number
  title?: string
  main_text?: string
  label?: string
  label_position?: string
  content_alignment?: string
  color?: string
  bg_color?: string
  text_color?: string
  overlay_alpha?: number
  text_bg_color?: string
  text_bg_alpha?: number
  text_bg_blend?: string
  text_bg_spread?: number
  image?: string
  image_scale?: number
  image_position_x?: number
  image_position_y?: number
  image_rotation?: number
  foreground_image?: string
  foreground_image_scale?: number
  foreground_image_position_x?: number
  foreground_image_position_y?: number
  foreground_image_rotation?: number
  foreground_image_opacity?: number
  foreground_overlay_color?: string
  foreground_overlay_alpha?: number
  link_type?: string
  link_url?: string
  link_screen?: string
  active?: boolean
  created_at?: string
}

const DEFAULT_SLIDE: Partial<NotificationBarSlide> = {
  title: '',
  main_text: '',
  label: '',
  label_position: 'top',
  content_alignment: 'center',
  color: '#FFFFFF',
  bg_color: '#1a1a2e',
  text_color: '#FFFFFF',
  overlay_alpha: 0.4,
  text_bg_color: '#000000',
  text_bg_alpha: 0,
  text_bg_blend: 'normal',
  text_bg_spread: 0,
  image: '',
  image_scale: 100,
  image_position_x: 50,
  image_position_y: 50,
  image_rotation: 0,
  foreground_image: '',
  foreground_image_scale: 100,
  foreground_image_position_x: 50,
  foreground_image_position_y: 50,
  foreground_image_rotation: 0,
  foreground_image_opacity: 1,
  foreground_overlay_color: '#000000',
  foreground_overlay_alpha: 0,
  link_type: 'none',
  link_url: '',
  link_screen: '',
  active: true,
}

export default function AppPage() {
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [settings, setSettings] = useState<NotificationBarSettings>({
    notification_bar_enabled: false,
    notification_bar_size: 'medium',
  })
  const [slides, setSlides] = useState<NotificationBarSlide[]>([])

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingSlide, setEditingSlide] = useState<NotificationBarSlide | null>(null)
  const [slideForm, setSlideForm] = useState<Partial<NotificationBarSlide>>({ ...DEFAULT_SLIDE })
  const [slideSaving, setSlideSaving] = useState(false)

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Inject top bar actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleSaveSettings} disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
        <Button variant="outline" className="bg-card" onClick={handleAddSlide}>
          <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
          Add Slide
        </Button>
      </div>
    )
    return () => setActions(null)
  }, [setActions, saving, settings, slides])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        // Load global settings
        const { data: appData } = await supabase
          .from('client_app_settings')
          .select('notification_bar_enabled, notification_bar_size')
          .eq('trainer_id', user.id)
          .single()

        if (appData) {
          setSettings({
            notification_bar_enabled: appData.notification_bar_enabled || false,
            notification_bar_size: appData.notification_bar_size || 'medium',
          })
        }

        // Load slides
        const { data: slidesData } = await supabase
          .from('notification_bar_slides')
          .select('*')
          .eq('trainer_id', user.id)
          .order('position', { ascending: true })

        if (slidesData && slidesData.length > 0) {
          setSlides(slidesData as NotificationBarSlide[])
        }
      } catch (err) {
        logger.error('Error loading app settings:', err)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleSaveSettings = async () => {
    if (!user) { setLoading(false); return }
    setSaving(true)
    try {
      // Save global settings
      const { error: globalError } = await supabase
        .from('client_app_settings')
        .upsert({
          trainer_id: user.id,
          notification_bar_enabled: settings.notification_bar_enabled,
          notification_bar_size: settings.notification_bar_size,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'trainer_id' })

      if (globalError) throw globalError

      // Delete and re-insert slides
      const { error: deleteError } = await supabase
        .from('notification_bar_slides')
        .delete()
        .eq('trainer_id', user.id)

      if (deleteError) throw deleteError

      if (slides.length > 0) {
        const slidesToInsert = slides.map((slide, index) => ({
          ...slide,
          trainer_id: user.id,
          position: index,
          updated_at: new Date().toISOString(),
        }))

        const { error: insertError } = await supabase
          .from('notification_bar_slides')
          .insert(slidesToInsert)

        if (insertError) throw insertError
      }

      toast.success('App settings saved')
    } catch (err) {
      logger.error('Error saving app settings:', err)
      toast.error(getErrorMessage(err) || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSlide = () => {
    setEditingSlide(null)
    setSlideForm({ ...DEFAULT_SLIDE })
    setSheetOpen(true)
  }

  const handleEditSlide = (slide: NotificationBarSlide) => {
    setEditingSlide(slide)
    setSlideForm({ ...slide })
    setSheetOpen(true)
  }

  const handleSaveSlide = async () => {
    if (!user) { setLoading(false); return }
    setSlideSaving(true)
    try {
      if (editingSlide) {
        // Update existing slide in state
        setSlides(prev => prev.map(s => s.id === editingSlide.id ? { ...s, ...slideForm } : s))
        toast.success('Slide updated — remember to save settings')
      } else {
        // Add new slide
        const newSlide: NotificationBarSlide = {
          ...DEFAULT_SLIDE,
          ...slideForm,
          id: crypto.randomUUID(),
          trainer_id: user.id,
          position: slides.length,
        }
        setSlides(prev => [...prev, newSlide])
        toast.success('Slide added — remember to save settings')
      }
      setSheetOpen(false)
    } finally {
      setSlideSaving(false)
    }
  }

  const handleDeleteSlide = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      setSlides(prev => prev.filter(s => s.id !== deleteTarget.id).map((s, i) => ({ ...s, position: i })))
      toast.success('Slide removed — remember to save settings')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleSlideActive = (id: string) => {
    setSlides(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const moveSlide = (id: string, dir: 'up' | 'down') => {
    setSlides(prev => {
      const idx = prev.findIndex(s => s.id === id)
      if (idx === -1) return prev
      const next = dir === 'up' ? idx - 1 : idx + 1
      if (next < 0 || next >= prev.length) return prev
      const arr = [...prev]
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr.map((s, i) => ({ ...s, position: i }))
    })
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Settings Card */}
      {loading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold">Notification Bar</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Display a scrolling announcement bar at the top of your clients&apos; home screen.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Enable notification bar</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Show the bar on the client app home screen</p>
              </div>
              <Switch
                checked={settings.notification_bar_enabled}
                onCheckedChange={(val) => setSettings(prev => ({ ...prev, notification_bar_enabled: val }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Bar size</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Height of the notification bar</p>
              </div>
              <Select
                value={settings.notification_bar_size}
                onValueChange={(val) => setSettings(prev => ({ ...prev, notification_bar_size: val as any }))}
              >
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                  <SelectItem value="xl">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Slides Table */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Slides</h2>
            {slides.length > 0 && (
              <Badge variant="outline" className="bg-card text-xs">{slides.length}</Badge>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : slides.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No slides yet"
            description="Add slides to display in the notification bar on your clients' app home screen."
            action={
              <Button variant="outline" onClick={handleAddSlide}>
                <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
                Add Slide
              </Button>
            }
          />
        ) : (
          <Card className="py-0" style={{ borderRadius: 'var(--table-radius)' }}>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs font-medium w-8" />
                  <TableHead className="text-xs font-medium">Preview</TableHead>
                  <TableHead className="text-xs font-medium">Message</TableHead>
                  <TableHead className="text-xs font-medium">Position</TableHead>
                  <TableHead className="text-xs font-medium">Active</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide, idx) => (
                  <TableRow key={slide.id} className="hover:bg-muted/30">
                    <TableCell className="py-2 text-center">
                      <div className="flex flex-col gap-0.5 items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveSlide(slide.id, 'up')}
                          disabled={idx === 0}
                        >
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div
                        className="w-10 h-6 rounded flex-shrink-0"
                        style={{ backgroundColor: slide.bg_color || '#1a1a2e' }}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <p className="text-sm font-medium line-clamp-1">{slide.title || slide.main_text || <span className="text-muted-foreground italic">No text</span>}</p>
                      {slide.main_text && slide.title && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{slide.main_text}</p>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="text-xs text-muted-foreground">{idx + 1}</span>
                    </TableCell>
                    <TableCell className="py-2">
                      <Switch
                        checked={slide.active !== false}
                        onCheckedChange={() => handleToggleSlideActive(slide.id)}
                        className="scale-75"
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditSlide(slide)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => moveSlide(slide.id, 'up')} disabled={idx === 0}>Move up</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => moveSlide(slide.id, 'down')} disabled={idx === slides.length - 1}>Move down</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget({ id: slide.id, title: slide.title || slide.main_text || 'Untitled slide' })}
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
          </Card>
        )}
      </div>

      {/* Edit Slide Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingSlide ? 'Edit Slide' : 'Add Slide'}</SheetTitle>
          </SheetHeader>
          <SheetBody>
            {/* Preview swatch */}
            <div
              className="w-full h-16 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: slideForm.bg_color || '#1a1a2e' }}
            >
              <span className="text-sm font-medium" style={{ color: slideForm.text_color || '#FFFFFF' }}>
                {slideForm.title || slideForm.main_text || 'Preview'}
              </span>
            </div>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Title</Label>
                <Input
                  placeholder="Slide title"
                  value={slideForm.title || ''}
                  onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Main Text</Label>
                <Textarea
                  placeholder="Main message text..."
                  value={slideForm.main_text || ''}
                  onChange={e => setSlideForm(p => ({ ...p, main_text: e.target.value }))}
                  className="text-sm resize-none"
                  rows={3}
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Label</Label>
                <Input
                  placeholder="Optional label tag"
                  value={slideForm.label || ''}
                  onChange={e => setSlideForm(p => ({ ...p, label: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Background colour</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={slideForm.bg_color || '#1a1a2e'}
                      onChange={e => setSlideForm(p => ({ ...p, bg_color: e.target.value }))}
                      className="h-8 w-10 rounded cursor-pointer p-0 overflow-hidden border-0"
                    />
                    <Input
                      value={slideForm.bg_color || '#1a1a2e'}
                      onChange={e => setSlideForm(p => ({ ...p, bg_color: e.target.value }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Text colour</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={slideForm.text_color || '#FFFFFF'}
                      onChange={e => setSlideForm(p => ({ ...p, text_color: e.target.value }))}
                      className="h-8 w-10 rounded cursor-pointer p-0 overflow-hidden border-0"
                    />
                    <Input
                      value={slideForm.text_color || '#FFFFFF'}
                      onChange={e => setSlideForm(p => ({ ...p, text_color: e.target.value }))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Content alignment</Label>
                  <Select
                    value={slideForm.content_alignment || 'center'}
                    onValueChange={val => setSlideForm(p => ({ ...p, content_alignment: val }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Label position</Label>
                  <Select
                    value={slideForm.label_position || 'top'}
                    onValueChange={val => setSlideForm(p => ({ ...p, label_position: val }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="top">Top</SelectItem>
                      <SelectItem value="bottom">Bottom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="grid gap-1.5">
                <Label className="text-xs">Link type</Label>
                <Select
                  value={slideForm.link_type || 'none'}
                  onValueChange={val => setSlideForm(p => ({ ...p, link_type: val }))}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No link</SelectItem>
                    <SelectItem value="url">External URL</SelectItem>
                    <SelectItem value="screen">App screen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {slideForm.link_type === 'url' && (
                <div className="grid gap-1.5">
                  <Label className="text-xs">URL</Label>
                  <Input
                    placeholder="https://..."
                    value={slideForm.link_url || ''}
                    onChange={e => setSlideForm(p => ({ ...p, link_url: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              )}
              {slideForm.link_type === 'screen' && (
                <div className="grid gap-1.5">
                  <Label className="text-xs">App screen</Label>
                  <Input
                    placeholder="Screen name"
                    value={slideForm.link_screen || ''}
                    onChange={e => setSlideForm(p => ({ ...p, link_screen: e.target.value }))}
                    className="h-8 text-sm"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  id="slide-active"
                  checked={slideForm.active !== false}
                  onCheckedChange={val => setSlideForm(p => ({ ...p, active: val }))}
                />
                <Label htmlFor="slide-active" className="text-sm">Active</Label>
              </div>
            </div>
          </SheetBody>
          <SheetFooter>
            <Button variant="outline" onClick={() => setSheetOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSlide} disabled={slideSaving}>
              {slideSaving ? 'Saving…' : editingSlide ? 'Update Slide' : 'Add Slide'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={open => { if (!open) setDeleteTarget(null) }}
        itemName={deleteTarget?.title ?? ''}
        itemKind="slide"
        onConfirm={handleDeleteSlide}
        loading={deleting}
      />
    </div>
  )
}
