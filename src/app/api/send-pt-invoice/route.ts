import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/utils/logger'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, appointmentIds } = await request.json()
    if (!clientId || !appointmentIds?.length) {
      return NextResponse.json({ error: 'clientId and appointmentIds required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Fetch client profile
    const { data: client } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .eq('id', clientId)
      .single()

    if (!client?.email) {
      return NextResponse.json({ error: 'Client not found or no email' }, { status: 404 })
    }

    // Fetch appointments
    const { data: appointments } = await supabase
      .from('appointments')
      .select('id, appointment_date, start_time, appointment_type, payment_status, price')
      .in('id', appointmentIds)
      .eq('client_id', clientId)

    if (!appointments?.length) {
      return NextResponse.json({ error: 'No appointments found' }, { status: 404 })
    }

    // Filter out already invoiced/paid/comped
    const billable = appointments.filter(a => a.payment_status === 'unbilled' || !a.payment_status)
    if (!billable.length) {
      return NextResponse.json({ error: 'All sessions already invoiced or paid' }, { status: 400 })
    }

    // Get or create Stripe customer
    let stripeCustomerId: string
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', clientId)
      .single()

    if ((profile as any)?.stripe_customer_id) {
      stripeCustomerId = (profile as any).stripe_customer_id
    } else {
      const customer = await stripe.customers.create({
        email: client.email,
        name: client.name ?? undefined,
        metadata: { supabase_user_id: clientId }
      })
      stripeCustomerId = customer.id
      await supabase.from('user_profiles').update({ stripe_customer_id: stripeCustomerId } as any).eq('id', clientId)
    }

    // Format session dates for invoice description
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

    // Group by appointment_type to create line items
    const grouped = new Map<string, { count: number; dates: string[]; price: number }>()

    for (const apt of billable) {
      // Use price from appointment row if set, otherwise fall back to £35
      const price = (apt as any).price || 35

      const key = apt.appointment_type || 'PT Session'
      if (!grouped.has(key)) grouped.set(key, { count: 0, dates: [], price })
      const g = grouped.get(key)!
      g.count++
      g.dates.push(formatDate(apt.appointment_date))
    }

    // Create Stripe invoice
    const invoice = await stripe.invoices.create({
      customer: stripeCustomerId,
      collection_method: 'send_invoice',
      days_until_due: Math.ceil((new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getTime() - Date.now()) / 86400000), // days until end of month
      metadata: {
        client_id: clientId,
        appointment_ids: appointmentIds.join(','),
      },
      description: `PT Sessions — ${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`,
    })

    // Add line items
    for (const [sessionType, { count, dates, price }] of grouped) {
      await stripe.invoiceItems.create({
        customer: stripeCustomerId,
        invoice: invoice.id,
        amount: Math.round(price * 100) * count, // total pence (unit × count)
        currency: 'gbp',
        description: `${sessionType} × ${count} @ £${price} (${dates.join(', ')})`,
      })
    }

    // Finalise and send
    const invoiceId = invoice.id
    if (!invoiceId) throw new Error('Failed to create invoice')
    await stripe.invoices.finalizeInvoice(invoiceId)
    await stripe.invoices.sendInvoice(invoiceId)

    // Mark appointments as invoiced
    // Note: stripe_invoice_id and invoice_sent_at columns require a DB migration before they can be written.
    // Until that migration is run, we just update payment_status.
    await supabase
      .from('appointments')
      .update({ payment_status: 'invoiced' })
      .in('id', billable.map(a => a.id))

    logger.log(`Invoice ${invoiceId} sent to ${client.email} for ${billable.length} sessions`)
    return NextResponse.json({ success: true, invoiceId, sessionCount: billable.length })
  } catch (error: any) {
    logger.error('send-pt-invoice error:', error)
    return NextResponse.json({ error: error.message || 'Failed to send invoice' }, { status: 500 })
  }
}
