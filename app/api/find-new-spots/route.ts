import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { RESTAURANTS } from '@/lib/restaurants'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    // Get existing new spots from DB
    const { data: existingNewSpots } = await supabase.from('new_spots').select('name')
    const existingNames = new Set([
      ...RESTAURANTS.map(r => r.name.toLowerCase()),
      ...(existingNewSpots || []).map((r: any) => r.name.toLowerCase()),
    ])

    const prompt = `Search for Mediterranean restaurants that recently opened (last 6-12 months) in Dallas/DFW and Austin Texas. Look for Turkish, Lebanese, Persian, Greek, Spanish, Israeli, Moroccan, Egyptian cuisine.

Return ONLY a valid JSON array. Each object must have exactly these fields:
- name (string)
- city (string: "Dallas" or "Austin")  
- category (string: Turkish/Lebanese/Persian/Greek/Spanish/Israeli/Egyptian/Jordanian/General Med)
- area (string: neighborhood)
- note (string: 1-2 sentences on what to order)
- price (number: 1=budget 2=moderate 3=upscale)
- rating (number: Google rating or 4.3)
- reviews (number: review count or 50)
- url (string or null)
- mapsQuery (string: URL-encoded like "Restaurant+Name+City+TX")
- recommended (boolean)
- isNew (boolean: always true)
- lat (number)
- lng (number)

Exclude these restaurants: ${[...existingNames].slice(0, 40).join(', ')}

Return ONLY the JSON array, no markdown, no explanation.`

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('')

    const match = text.match(/\[[\s\S]*\]/)
    const found = match ? JSON.parse(match[0]) : []
    const brandNew = found.filter((r: any) => r?.name && !existingNames.has(r.name.toLowerCase()))

    // Save to Supabase
    for (const spot of brandNew) {
      await supabase.from('new_spots').upsert({ name: spot.name, data: spot }, { onConflict: 'name' })
    }

    // Update last refresh timestamp
    await supabase.from('app_meta').upsert({ key: 'last_refresh', value: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) })

    return NextResponse.json({ added: brandNew.length, spots: brandNew })
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  const { data: spots } = await supabase.from('new_spots').select('*').order('added_at', { ascending: false })
  const { data: meta } = await supabase.from('app_meta').select('*').eq('key', 'last_refresh').single()
  return NextResponse.json({
    spots: (spots || []).map((s: any) => s.data),
    lastRefresh: meta?.value || null,
  })
}
