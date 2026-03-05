'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'

interface TrainerProfile {
  id: string
  name: string
  email: string
  bio?: string
  phone?: string
  business_name?: string
  location?: string
  website?: string
  avatar_url?: string | null
}

export default function ProfilePage() {
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()

  const [profile, setProfile] = useState<TrainerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // Personal info
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [savingPersonal, setSavingPersonal] = useState(false)
  const [personalError, setPersonalError] = useState('')

  // Business info
  const [businessName, setBusinessName] = useState('')
  const [location, setLocation] = useState('')
  const [website, setWebsite] = useState('')
  const [savingBusiness, setSavingBusiness] = useState(false)
  const [businessError, setBusinessError] = useState('')

  // Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    setActions(null)
    return () => setActions(null)
  }, [setActions])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetch = async () => {
      setLoading(true)
      try {
        const { data: rawData } = await supabase
          .from('user_profiles')
          .select('id, name, email, bio, phone, business_name, location, website, avatar_url')
          .eq('id', user.id)
          .single()
        const data = rawData as TrainerProfile | null
        if (data) {
          setProfile(data)
          setName(data.name || '')
          setBio(data.bio || '')
          setPhone(data.phone || '')
          setBusinessName(data.business_name || '')
          setLocation(data.location || '')
          setWebsite(data.website || '')
          setAvatarUrl(data.avatar_url || null)
        }
      } catch (err) {
        logger.error('Error fetching profile:', err)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return }

    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const url = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from('user_profiles')
        // @ts-ignore
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id)
      if (updateError) throw updateError

      setAvatarUrl(url)
      toast.success('Profile photo updated')
    } catch (err) {
      logger.error('Avatar upload error:', err)
      toast.error(getErrorMessage(err) || 'Failed to upload photo')
    } finally {
      setUploadingAvatar(false)
      if (avatarInputRef.current) avatarInputRef.current.value = ''
    }
  }

  const handleSavePersonal = async () => {
    if (!user) { setLoading(false); return }
    setSavingPersonal(true)
    setPersonalError('')
    try {
      const { error } = await supabase
        .from('user_profiles')
        // @ts-ignore
        .update({ name, bio, phone })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Personal info saved')
    } catch (err) {
      const msg = getErrorMessage(err)
      setPersonalError(msg)
      toast.error(msg)
    } finally {
      setSavingPersonal(false)
    }
  }

  const handleSaveBusiness = async () => {
    if (!user) { setLoading(false); return }
    setSavingBusiness(true)
    setBusinessError('')
    try {
      const { error } = await supabase
        .from('user_profiles')
        // @ts-ignore
        .update({ business_name: businessName, location, website: website || null })
        .eq('id', user.id)
      if (error) throw error
      toast.success('Business info saved')
    } catch (err) {
      const msg = getErrorMessage(err)
      setBusinessError(msg)
      toast.error(msg)
    } finally {
      setSavingBusiness(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword) { setPasswordError('Enter a new password'); return }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match'); return }
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters'); return }
    setChangingPassword(true)
    setPasswordError('')
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated')
      setNewPassword(''); setConfirmPassword('')
    } catch (err) {
      const msg = getErrorMessage(err)
      setPasswordError(msg)
      toast.error(msg)
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
        Loading profile…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-2xl">
      {/* Avatar + name header */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          {/* Hidden file input */}
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <Avatar
            className="h-16 w-16 cursor-pointer ring-2 ring-transparent group-hover:ring-primary/30 transition-all"
            onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
          >
            {avatarUrl && <AvatarImage src={avatarUrl} alt={name || 'Avatar'} />}
            <AvatarFallback className="text-lg bg-accent text-primary font-semibold">
              {name.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'T'}
            </AvatarFallback>
          </Avatar>
          {/* Camera overlay */}
          <div
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={() => !uploadingAvatar && avatarInputRef.current?.click()}
          >
            {uploadingAvatar ? (
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <Camera className="h-4 w-4 text-white" />
            )}
          </div>
        </div>
        <div>
          <h2 className="text-base font-semibold">{name || user?.email}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Click avatar to upload photo</p>
        </div>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 flex flex-col gap-4">
          {personalError && <p className="text-sm text-destructive">{personalError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Full Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={user?.email || ''} disabled className="bg-muted" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+44 7700 000000" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Bio</Label>
            <Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell clients about yourself…" rows={4} />
          </div>
          <Button onClick={handleSavePersonal} disabled={savingPersonal} className="w-fit">
            {savingPersonal ? 'Saving…' : 'Save personal info'}
          </Button>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-sm font-semibold">Business Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 flex flex-col gap-4">
          {businessError && <p className="text-sm text-destructive">{businessError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>Business Name</Label>
            <Input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your training business name" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Website</Label>
            <Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://yourwebsite.com" type="url" />
          </div>
          <Button onClick={handleSaveBusiness} disabled={savingBusiness} className="w-fit">
            {savingBusiness ? 'Saving…' : 'Save business info'}
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-3 px-4">
          <CardTitle className="text-sm font-semibold">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="px-4 flex flex-col gap-4">
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          <div className="flex flex-col gap-1.5">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={e => { setNewPassword(e.target.value); setPasswordError('') }}
              placeholder="At least 8 characters"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Confirm New Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={e => { setConfirmPassword(e.target.value); setPasswordError('') }}
              placeholder="Confirm password"
            />
          </div>
          <Button
            variant="outline"
            onClick={handleChangePassword}
            disabled={changingPassword || !newPassword || !confirmPassword}
            className="w-fit"
          >
            {changingPassword ? 'Updating…' : 'Update password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
