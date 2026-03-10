import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// Service role used for GET (bypass RLS to return all submitted names)
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

const supabaseAnon = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
const supabaseAdmin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })

export async function POST(req: NextRequest) {
  try {
    const { name, item, fit, size } = await req.json()
    if (!name || !item || !fit || !size) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    // Use anon client — RLS allows public insert
    const { error } = await supabaseAnon
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
  // Use service role (or anon fallback) to read all orders
  const { data, error } = await supabaseAdmin
    .from('merch_orders')
    .select('*')
    .order('submitted_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
