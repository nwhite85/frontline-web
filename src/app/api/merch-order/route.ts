import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const { name, item, fit, size } = await req.json()

    if (!name || !item || !fit || !size) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('merch_orders')
      .insert({ name, item, fit, size })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('Merch order error:', err)
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 })
  }
}

export async function GET() {
  const { data, error } = await supabase
    .from('merch_orders')
    .select('*')
    .order('submitted_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
