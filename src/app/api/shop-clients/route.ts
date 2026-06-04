import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, name, first_name, last_name, email')
      .eq('user_type', 'client')
      .order('name')

    if (error) return NextResponse.json([], { status: 200 })

    const clients = (data || []).map((c: any) => ({
      id: c.id,
      name: c.name || `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || 'Unknown',
      email: c.email || '',
    }))

    return NextResponse.json(clients)
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}
