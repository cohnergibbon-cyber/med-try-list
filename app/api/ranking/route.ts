import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { name, score, notes, dishes, date } = await req.json()
  if (!name || !score) return NextResponse.json({ error: 'name and score required' }, { status: 400 })

  const { error } = await supabase.from('restaurant_rankings').upsert(
    { name, score, notes, dishes, date, updated_at: new Date().toISOString() },
    { onConflict: 'name' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { data, error } = await supabase.from('restaurant_rankings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
