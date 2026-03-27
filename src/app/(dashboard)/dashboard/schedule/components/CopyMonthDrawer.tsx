// @ts-nocheck
'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetBody, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

interface CopyResult {
  copied: { appointments: number; classes: number; events: number; challenges: number }
  skipped: { appointments: number; classes: number; events: number; challenges: number }
  total: number
}

interface CopyMonthDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainerId: string
  onCopied: () => void
}

function getPreviousMonth(): string {
  const d = new Date()
  d.setDate(1)
  d.setMonth(d.getMonth() - 1)
  return d.toISOString().slice(0, 7)
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function CopyMonthDrawer({ open, onOpenChange, trainerId, onCopied }: CopyMonthDrawerProps) {
  const [sourceMonth, setSourceMonth] = useState(getPreviousMonth)
  const [targetMonth, setTargetMonth] = useState(getCurrentMonth)
  const [includeAppointments, setIncludeAppointments] = useState(true)
  const [includeClasses, setIncludeClasses] = useState(true)
  const [includeEvents, setIncludeEvents] = useState(true)
  const [includeChallenges, setIncludeChallenges] = useState(true)
  const [includeAvailable, setIncludeAvailable] = useState(false)
  const [result, setResult] = useState<CopyResult | null>(null)
  const [copying, setCopying] = useState(false)

  const sameMonth = sourceMonth === targetMonth

  const handleCopy = async () => {
    if (sameMonth || copying) return
    setCopying(true)
    setResult(null)
    try {
      const res = await fetch('/api/copy-schedule-month', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId,
          sourceMonth,
          targetMonth,
          includeAppointments,
          includeClasses,
          includeEvents,
          includeChallenges,
          includeAvailable,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to copy schedule')
        return
      }
      setResult(data)
      toast.success(`Copied ${data.total} session${data.total !== 1 ? 's' : ''} to ${targetMonth}`)
      onCopied()
    } catch {
      toast.error('Failed to copy schedule')
    } finally {
      setCopying(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-sm flex flex-col">
        <SheetHeader>
          <SheetTitle>Copy Schedule</SheetTitle>
          <SheetDescription>
            Copies sessions from one month to another, matched by day of week and occurrence.
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          {/* Month pickers */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">From</Label>
              <input
                type="month"
                value={sourceMonth}
                onChange={e => { setSourceMonth(e.target.value); setResult(null) }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">To</Label>
              <input
                type="month"
                value={targetMonth}
                onChange={e => { setTargetMonth(e.target.value); setResult(null) }}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
          </div>

          {sameMonth && (
            <p className="text-xs text-amber-500">Source and target month must be different</p>
          )}

          <Separator />

          {/* Toggles */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="inc-appointments" className="text-sm">Appointments</Label>
                <Switch
                  id="inc-appointments"
                  checked={includeAppointments}
                  onCheckedChange={setIncludeAppointments}
                />
              </div>
              {includeAppointments && (
                <div className="flex items-start justify-between gap-3 pl-3 border-l border-border">
                  <div className="space-y-0.5">
                    <Label htmlFor="inc-available" className="text-xs">Include available slots</Label>
                    <p className="text-xs text-muted-foreground">Copies open slots with no client assigned</p>
                  </div>
                  <Switch
                    id="inc-available"
                    checked={includeAvailable}
                    onCheckedChange={setIncludeAvailable}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inc-classes" className="text-sm">Classes</Label>
              <Switch
                id="inc-classes"
                checked={includeClasses}
                onCheckedChange={setIncludeClasses}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inc-events" className="text-sm">Events</Label>
              <Switch
                id="inc-events"
                checked={includeEvents}
                onCheckedChange={setIncludeEvents}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="inc-challenges" className="text-sm">Challenges</Label>
              <Switch
                id="inc-challenges"
                checked={includeChallenges}
                onCheckedChange={setIncludeChallenges}
              />
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
              <p className="text-sm font-medium">Copy complete — {result.total} session{result.total !== 1 ? 's' : ''} copied</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {includeAppointments && (
                  <span>Appointments: <span className="text-foreground font-medium">{result.copied.appointments}</span></span>
                )}
                {includeClasses && (
                  <span>Classes: <span className="text-foreground font-medium">{result.copied.classes}</span></span>
                )}
                {includeEvents && (
                  <span>Events: <span className="text-foreground font-medium">{result.copied.events}</span></span>
                )}
                {includeChallenges && (
                  <span>Challenges: <span className="text-foreground font-medium">{result.copied.challenges}</span></span>
                )}
              </div>
              {(result.skipped.appointments + result.skipped.classes + result.skipped.events + result.skipped.challenges) > 0 && (
                <p className="text-xs text-muted-foreground">
                  Skipped {result.skipped.appointments + result.skipped.classes + result.skipped.events + result.skipped.challenges} due to conflicts or missing occurrences
                </p>
              )}
            </div>
          )}
        </SheetBody>

        <SheetFooter className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleCopy}
            disabled={copying || sameMonth}
          >
            {copying ? 'Copying…' : 'Copy Sessions'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
