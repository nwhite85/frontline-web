// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetBody } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { logger } from '@/utils/logger'
import { CalendarDays, Copy, Check, RefreshCw, Trash2, Info } from 'lucide-react'

interface ScheduleSettingsSheetProps {
  open: boolean
  onClose: () => void
  userId: string
  startHour: number
  endHour: number
  onTimeRangeChange: (start: number, end: number) => void
}

export function ScheduleSettingsSheet({
  open,
  onClose,
  userId,
  startHour,
  endHour,
  onTimeRangeChange,
}: ScheduleSettingsSheetProps) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('No active session')
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    }
  }

  const fetchToken = async () => {
    try {
      setLoading(true)
      const headers = await getAuthHeaders()
      const res = await fetch('/api/calendar/token', { headers })
      if (res.ok) {
        const data = await res.json()
        setToken(data.token)
      } else {
        setToken(null)
      }
    } catch (err) {
      logger.error('Error fetching calendar token:', err)
      setToken(null)
    } finally {
      setLoading(false)
    }
  }

  const generateToken = async () => {
    setGenerating(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/calendar/token', { method: 'POST', headers })
      if (!res.ok) throw new Error('Failed to generate token')
      const data = await res.json()
      setToken(data.token)
      toast.success('Calendar sync enabled — copy the URL below')
    } catch {
      toast.error('Failed to generate calendar token')
    } finally {
      setGenerating(false)
    }
  }

  const regenerateToken = async () => {
    if (!confirm('Regenerate your calendar URL? Your old URL will stop working.')) return
    setGenerating(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/calendar/token', { method: 'POST', headers })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setToken(data.token)
      toast.success('Calendar URL regenerated')
    } catch {
      toast.error('Failed to regenerate token')
    } finally {
      setGenerating(false)
    }
  }

  const revokeToken = async () => {
    if (!confirm('Disable calendar sync? Your calendar will stop updating automatically.')) return
    setGenerating(true)
    try {
      const headers = await getAuthHeaders()
      const res = await fetch('/api/calendar/token', { method: 'DELETE', headers })
      if (!res.ok) throw new Error()
      setToken(null)
      toast.success('Calendar sync disabled')
    } catch {
      toast.error('Failed to disable sync')
    } finally {
      setGenerating(false)
    }
  }

  const calendarUrl = token ? `${window.location.origin}/api/calendar/subscribe?token=${token}` : ''

  const copyUrl = () => {
    navigator.clipboard.writeText(calendarUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (open && userId) fetchToken()
  }, [open, userId])

  const isFullDay = startHour === 0 && endHour === 23

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Schedule Settings</SheetTitle>
        </SheetHeader>

        <SheetBody className="gap-5">
          {/* Section 1: View Settings */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">View Settings</h3>

            {/* Full day toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Full day view</Label>
                <p className="text-xs text-muted-foreground">Show 00:00 – 23:30</p>
              </div>
              <Switch
                checked={isFullDay}
                onCheckedChange={(checked) => {
                  if (checked) onTimeRangeChange(0, 23)
                  else onTimeRangeChange(5, 22)
                }}
              />
            </div>

            {/* Custom start/end time — only shown when not full day */}
            {!isFullDay && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Start time</Label>
                  <Select
                    value={String(startHour)}
                    onValueChange={(v) => onTimeRangeChange(Number(v), endHour)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>End time</Label>
                  <Select
                    value={String(endHour)}
                    onValueChange={(v) => onTimeRangeChange(startHour, Number(v))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {String(i).padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Section 2: Calendar Sync */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-medium">Calendar Sync</h3>
            <p className="text-xs text-muted-foreground">
              Subscribe to your Frontline schedule in Apple Calendar or any iCal-compatible app.
            </p>

            {loading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : token ? (
              <>
                {/* Subscription URL */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Subscription URL</label>
                  <div className="flex gap-2">
                    <Input
                      value={calendarUrl}
                      readOnly
                      className="font-mono text-xs flex-1"
                    />
                    <Button
                     
                      variant={copied ? 'default' : 'outline'}
                      onClick={copyUrl}
                      className="shrink-0"
                    >
                      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </div>

                {/* Instructions */}
                <details className="group">
                  <summary className="text-sm font-medium text-primary cursor-pointer select-none list-none flex items-center gap-1">
                    <span className="group-open:hidden">▸</span>
                    <span className="hidden group-open:inline">▾</span>
                    How to subscribe
                  </summary>
                  <div className="mt-3 rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-2">📱 iPhone / iPad</p>
                      <ol className="text-muted-foreground space-y-1 pl-4 list-decimal text-xs">
                        <li>Tap Copy above</li>
                        <li>Settings → Calendar → Accounts → Add Account → Other</li>
                        <li>Tap <strong>Add Subscribed Calendar</strong></li>
                        <li>Paste the URL and tap Subscribe</li>
                      </ol>
                    </div>
                    <Separator />
                    <div>
                      <p className="font-medium mb-2">💻 Mac</p>
                      <ol className="text-muted-foreground space-y-1 pl-4 list-decimal text-xs">
                        <li>Copy the URL above</li>
                        <li>Open Calendar app</li>
                        <li>File → New Calendar Subscription</li>
                        <li>Paste URL, click Subscribe</li>
                        <li>Set refresh: <strong>Every hour</strong></li>
                      </ol>
                    </div>
                  </div>
                </details>

                {/* Info note */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30 px-3 py-2.5 flex items-start gap-2">
                  <Info className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                    <strong>One-way sync.</strong> Changes in Frontline appear in your calendar automatically. Changes made in Apple Calendar won&apos;t affect Frontline.
                  </p>
                </div>

                <Separator />

                {/* Danger actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                   
                    className="flex-1"
                    disabled={generating}
                    onClick={regenerateToken}
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Regenerate URL
                  </Button>
                  <Button
                    variant="outline"
                   
                    className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
                    disabled={generating}
                    onClick={revokeToken}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Disable Sync
                  </Button>
                </div>
              </>
            ) : (
              /* No token state */
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <CalendarDays className="h-6 w-6 text-muted-foreground" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Calendar sync not enabled</p>
                  <p className="text-xs text-muted-foreground max-w-[280px]">
                    Enable it to see all your appointments, classes, events, and challenges in Apple Calendar — updating automatically.
                  </p>
                </div>
                <Button onClick={generateToken} disabled={generating}>
                  {generating ? 'Enabling…' : 'Enable Calendar Sync'}
                </Button>
              </div>
            )}
          </div>
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
