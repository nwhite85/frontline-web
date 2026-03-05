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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Save, Globe, Palette, Layout, Eye, EyeOff, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface WebsiteSettings {
  id?: string
  trainer_id: string
  published: boolean
  business_name: string
  tagline: string
  contact_email: string
  contact_phone: string
  address: string
  hero_headline: string
  hero_subheading: string
  primary_color: string
  font_preference: string
  logo_url?: string
  pages: WebsitePage[]
  updated_at?: string
}

interface WebsitePage {
  id: string
  name: string
  slug: string
  enabled: boolean
  content?: string
}

const DEFAULT_PAGES: WebsitePage[] = [
  { id: 'home', name: 'Home', slug: '/', enabled: true, content: '' },
  { id: 'about', name: 'About', slug: '/about', enabled: true, content: '' },
  { id: 'classes', name: 'Classes', slug: '/classes', enabled: true, content: '' },
  { id: 'pricing', name: 'Pricing', slug: '/pricing', enabled: true, content: '' },
  { id: 'contact', name: 'Contact', slug: '/contact', enabled: true, content: '' },
]

const FONT_OPTIONS = [
  { value: 'inter', label: 'Inter (Modern)' },
  { value: 'geist', label: 'Geist (Clean)' },
  { value: 'poppins', label: 'Poppins (Friendly)' },
  { value: 'montserrat', label: 'Montserrat (Bold)' },
  { value: 'roboto', label: 'Roboto (Neutral)' },
]

const DEFAULT_SETTINGS: Omit<WebsiteSettings, 'trainer_id'> = {
  published: false,
  business_name: '',
  tagline: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  hero_headline: '',
  hero_subheading: '',
  primary_color: '#2563eb',
  font_preference: 'inter',
  logo_url: '',
  pages: DEFAULT_PAGES,
}

export default function WebsitePage() {
  const { user } = useSimpleAuth()
  const { setActions, setHeaderTabs } = usePageActions()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<WebsiteSettings | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Inject top bar actions
  useEffect(() => {
    setActions(
      <Button variant="outline" className="bg-card" onClick={handleSave} disabled={saving}>
        <Save className="h-3.5 w-3.5 mr-1.5" />
        {saving ? 'Saving…' : 'Save Changes'}
      </Button>
    )
    return () => setActions(null)
  }, [setActions, saving, settings])

  // Inject header tabs
  useEffect(() => {
    const TABS = [
      { id: 'overview', label: 'Overview', icon: Globe },
      { id: 'pages',    label: 'Pages',    icon: Layout },
      { id: 'branding', label: 'Branding', icon: Palette },
    ]
    setHeaderTabs(
      <div className="inline-flex items-center rounded-md bg-muted/50 p-1 gap-0.5" data-tab-pill style={{ height: 'var(--tab-pill-h)' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'inline-flex items-center h-7 px-2.5 text-xs font-medium rounded-sm transition-all gap-1',
              activeTab === id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>
    )
    return () => setHeaderTabs(null)
  }, [setHeaderTabs, activeTab])

  // Load website settings
  useEffect(() => {
    if (!user) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await supabase
          .from('website_settings')
          .select('*')
          .eq('trainer_id', user.id)
          .single()

        if (data) {
          const d = data as any
          setSettings({
            ...DEFAULT_SETTINGS,
            ...d,
            pages: d.pages && d.pages.length > 0 ? d.pages : DEFAULT_PAGES,
          })
          if (d.logo_url) setLogoPreview(d.logo_url)
        } else {
          setSettings({ ...DEFAULT_SETTINGS, trainer_id: user.id })
        }
      } catch (err) {
        // If no data exists, use defaults (404/PGRST116 is normal)
        setSettings({ ...DEFAULT_SETTINGS, trainer_id: user.id })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const handleSave = async () => {
    if (!user || !settings) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('website_settings')
        // @ts-ignore
        .upsert({
          ...settings,
          trainer_id: user.id,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'trainer_id' })

      if (error) throw error
      toast.success('Website settings saved')
    } catch (err) {
      logger.error('Error saving website settings:', err)
      toast.error(getErrorMessage(err) || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be less than 2MB'); return }

    setUploadingLogo(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `logos/${user.id}/logo.${ext}`

      const { error } = await supabase.storage
        .from('website-assets')
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data: urlData } = supabase.storage.from('website-assets').getPublicUrl(path)
      const logoUrl = urlData.publicUrl
      setLogoPreview(logoUrl)
      setSettings(prev => prev ? { ...prev, logo_url: logoUrl } : prev)
      toast.success('Logo uploaded')
    } catch (err) {
      logger.error('Logo upload error:', err)
      toast.error('Failed to upload logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const update = (field: keyof WebsiteSettings, value: unknown) => {
    setSettings(prev => prev ? { ...prev, [field]: value } : prev)
  }

  const updatePage = (pageId: string, field: keyof WebsitePage, value: unknown) => {
    setSettings(prev => {
      if (!prev) return prev
      return {
        ...prev,
        pages: prev.pages.map(p => p.id === pageId ? { ...p, [field]: value } : p),
      }
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!settings) return null

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Status banner */}
      <div className={`flex items-center justify-between rounded-lg px-4 py-3 ${settings.published ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted border border-border'}`}>
        <div className="flex items-center gap-2">
          {settings.published ? (
            <Eye className="h-4 w-4 text-emerald-600" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">
              {settings.published ? 'Website is live' : 'Website is in draft'}
            </p>
            <p className="text-xs text-muted-foreground">
              {settings.published
                ? 'Your public website is visible to everyone'
                : 'Your website is not publicly visible yet'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={settings.published ? 'default' : 'secondary'} className="text-xs">
            {settings.published ? 'Published' : 'Draft'}
          </Badge>
          <Switch
            checked={settings.published}
            onCheckedChange={val => update('published', val)}
          />
        </div>
      </div>

      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && <div className="mt-4">
          <div className="flex flex-col gap-4 max-w-2xl">
            {/* Business Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Business Information</CardTitle>
                <CardDescription className="text-xs">Your public-facing business details.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Business Name</Label>
                    <Input
                      value={settings.business_name}
                      onChange={e => update('business_name', e.target.value)}
                      placeholder="e.g. Frontline Fitness"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Tagline</Label>
                    <Input
                      value={settings.tagline}
                      onChange={e => update('tagline', e.target.value)}
                      placeholder="e.g. Outdoor Bootcamp · Lydiard Park"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Contact Email</Label>
                    <Input
                      type="email"
                      value={settings.contact_email}
                      onChange={e => update('contact_email', e.target.value)}
                      placeholder="hello@frontlinefitness.co.uk"
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      type="tel"
                      value={settings.contact_phone}
                      onChange={e => update('contact_phone', e.target.value)}
                      placeholder="+44 7700 000000"
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Address</Label>
                  <Input
                    value={settings.address}
                    onChange={e => update('address', e.target.value)}
                    placeholder="e.g. Lydiard Park, Swindon, SN5 3PA"
                    className="h-8 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hero Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Hero Section</CardTitle>
                <CardDescription className="text-xs">The main banner shown at the top of your homepage.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Headline</Label>
                  <Input
                    value={settings.hero_headline}
                    onChange={e => update('hero_headline', e.target.value)}
                    placeholder="e.g. Train Harder. Live Better."
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Subheading</Label>
                  <Textarea
                    value={settings.hero_subheading}
                    onChange={e => update('hero_subheading', e.target.value)}
                    placeholder="e.g. Outdoor bootcamp sessions for all fitness levels. Join us at Lydiard Park from April 2026."
                    className="text-sm resize-none"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}

        {/* Pages Tab */}
        {activeTab === 'pages' && <div className="mt-4">
          <div className="flex flex-col gap-3 max-w-2xl">
            <p className="text-xs text-muted-foreground">
              Control which pages are visible on your website. Toggle pages on or off, and add custom content for each.
            </p>
            {settings.pages.map(page => (
              <Card key={page.id}>
                <CardHeader className="pb-2 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium">{page.name}</CardTitle>
                      <Badge variant="outline" className="text-xs font-mono">{page.slug}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{page.enabled ? 'Visible' : 'Hidden'}</span>
                      <Switch
                        checked={page.enabled}
                        onCheckedChange={val => updatePage(page.id, 'enabled', val)}
                      />
                    </div>
                  </div>
                </CardHeader>
                {page.id !== 'home' && (
                  <CardContent className="px-4">
                    <div className="grid gap-1.5">
                      <Label className="text-xs text-muted-foreground">Page content (optional)</Label>
                      <Textarea
                        value={page.content || ''}
                        onChange={e => updatePage(page.id, 'content', e.target.value)}
                        placeholder={`Content for the ${page.name} page...`}
                        className="text-sm resize-none text-muted-foreground"
                        rows={2}
                        disabled={!page.enabled}
                      />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </div>}

        {/* Branding Tab */}
        {activeTab === 'branding' && <div className="mt-4">
          <div className="flex flex-col gap-4 max-w-2xl">
            {/* Logo */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Logo</CardTitle>
                <CardDescription className="text-xs">Upload your business logo. PNG or SVG recommended. Max 2MB.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {logoPreview ? (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-16 max-w-48 object-contain rounded-lg border border-border bg-muted p-2"
                    />
                    <button
                      type="button"
                      onClick={() => { setLogoPreview(null); update('logo_url', '') }}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center"
                    >×</button>
                  </div>
                ) : (
                  <div className="w-48 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                    <span className="text-xs">No logo uploaded</span>
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-muted"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingLogo ? 'Uploading…' : logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Colours */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Brand Colours</CardTitle>
                <CardDescription className="text-xs">Set your primary brand colour. This will be used for buttons and accents.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1.5 max-w-xs">
                  <Label className="text-xs">Primary Colour</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.primary_color}
                      onChange={e => update('primary_color', e.target.value)}
                      className="h-8 w-12 rounded cursor-pointer border border-input"
                    />
                    <Input
                      value={settings.primary_color}
                      onChange={e => update('primary_color', e.target.value)}
                      placeholder="#2563eb"
                      className="h-8 text-sm font-mono max-w-32"
                    />
                    <div
                      className="w-8 h-8 rounded-md border border-border shrink-0"
                      style={{ backgroundColor: settings.primary_color }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Typography</CardTitle>
                <CardDescription className="text-xs">Choose the font used across your website.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-1.5 max-w-xs">
                  <Label className="text-xs">Font</Label>
                  <Select value={settings.font_preference} onValueChange={val => update('font_preference', val)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>}
      </div>
    </div>
  )
}
