import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  try {
    const { trainerId, clientName, clientEmail, items } = await req.json()
    if (!trainerId || !clientName || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const total = items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0)
    const supabase = getAdminClient()

    const { error } = await supabase.from('trainer_shop_orders').insert({
      trainer_id: trainerId,
      client_name: clientName,
      client_email: clientEmail || '',
      items,
      total,
      payment_status: 'paid',
    })

    if (error) return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
