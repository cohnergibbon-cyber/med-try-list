import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { name, status } = await req.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  if (!status) {
    const { error } = await supabase.from('restaurant_statuses').delete().eq('name', name)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('restaurant_statuses').upsert({ name, status, updated_at: new Date().toISOString() }, { onConflict: 'name' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function GET() {
  const { data, error } = await supabase.from('restaurant_statuses').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
