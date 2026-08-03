import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logger } from '@/utils/logger'

// POST /api/upload-slide-image  (multipart/form-data: file)
// Uploads a notification-bar slide background to the public app-slides bucket
// using the service role, so it doesn't depend on a storage RLS policy for the
// browser. The caller must be an authenticated trainer (enforced by middleware);
// we also derive their id from the session to scope the storage path.

export async function POST(request: NextRequest) {
  try {
    // Identify the authenticated user from the session cookie
    const { cookies } = await import('next/headers')
    const { createServerClient } = await import('@supabase/ssr')
    const cookieStore = await cookies()
    const authSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
    )
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowed = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported image type' }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image must be under 5MB' }, { status: 400 })
    }

    // Normalise to a sensible size: cap the longest edge and re-encode as WebP.
    // If sharp can't process it (e.g. odd format), fall back to the raw bytes.
    let bytes: Uint8Array = new Uint8Array(await file.arrayBuffer())
    let contentType = file.type
    let ext = (file.name.split('.').pop() || 'png').toLowerCase()
    try {
      bytes = await sharp(bytes, { failOn: 'none' })
        .rotate() // respect EXIF orientation
        .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer()
      contentType = 'image/webp'
      ext = 'webp'
    } catch (procErr) {
      logger.error('slide image processing failed, storing original:', procErr)
    }

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
    const filePath = `${user.id}/${fileName}`

    const supabase = createServerSupabaseClient()
    const { error } = await supabase.storage
      .from('app-slides')
      .upload(filePath, bytes, { upsert: true, contentType })
    if (error) throw error

    const { data } = supabase.storage.from('app-slides').getPublicUrl(filePath)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    logger.error('upload-slide-image error:', err)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
