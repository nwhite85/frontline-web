import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://alvqlnqecjhemrgjmgqa.supabase.co'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsdnFsbnFlY2poZW1yZ2ptZ3FhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODU3ODM0MSwiZXhwIjoyMDg0MTU0MzQxfQ.tL0a6fsVtmmCOqAD1__yeUnFslhLlMWrTDObej7HL6g'

function getAdminClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const { programId, title, subtitle, trainerId } = await request.json()
    if (!programId || !title || !trainerId) {
      return NextResponse.json({ error: 'programId, title, and trainerId are required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // 1. Fetch source program
    const { data: source, error: sourceErr } = await supabase
      .from('programs')
      .select('*')
      .eq('id', programId)
      .single()
    if (sourceErr || !source) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    }

    // 2. Insert new program
    const { id: _id, created_at: _ca, updated_at: _ua, ...sourceFields } = source
    const { data: newProgram, error: insertErr } = await supabase
      .from('programs')
      .insert({ ...sourceFields, title, subtitle: subtitle || null, trainer_id: trainerId })
      .select('id')
      .single()
    if (insertErr || !newProgram) {
      return NextResponse.json({ error: insertErr?.message || 'Failed to create program' }, { status: 500 })
    }

    // 3. Fetch program_workouts
    const { data: slots, error: slotsErr } = await supabase
      .from('program_workouts')
      .select('week_number, day_number, workout_id')
      .eq('program_id', programId)
    if (slotsErr) {
      return NextResponse.json({ error: slotsErr.message }, { status: 500 })
    }

    // 4. Deep-copy workouts in parallel
    const newSlots = await Promise.all(
      (slots || []).map(async (slot) => {
        if (!slot.workout_id) {
          return { program_id: newProgram.id, week_number: slot.week_number, day_number: slot.day_number, workout_id: null }
        }

        const { data: workout, error: wErr } = await supabase
          .from('workouts')
          .select('title, weight_unit, workout_type, trainer_id, is_template, template_id')
          .eq('id', slot.workout_id)
          .single()
        if (wErr || !workout) {
          return { program_id: newProgram.id, week_number: slot.week_number, day_number: slot.day_number, workout_id: null }
        }

        const { data: newWorkout, error: wInsertErr } = await supabase
          .from('workouts')
          .insert({ ...workout, is_template: false, template_id: slot.workout_id })
          .select('id')
          .single()
        if (wInsertErr || !newWorkout) {
          return { program_id: newProgram.id, week_number: slot.week_number, day_number: slot.day_number, workout_id: null }
        }

        const { data: exercises } = await supabase
          .from('workout_exercises')
          .select('*')
          .eq('workout_id', slot.workout_id)
        if (exercises && exercises.length > 0) {
          const newExercises = exercises.map(({ id: _eid, workout_id: _wid, ...ex }) => ({
            ...ex,
            workout_id: newWorkout.id,
          }))
          await supabase.from('workout_exercises').insert(newExercises)
        }

        return { program_id: newProgram.id, week_number: slot.week_number, day_number: slot.day_number, workout_id: newWorkout.id }
      })
    )

    // 5. Batch insert program_workouts
    if (newSlots.length > 0) {
      const { error: batchErr } = await supabase.from('program_workouts').insert(newSlots)
      if (batchErr) {
        return NextResponse.json({ error: batchErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, programId: newProgram.id })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
