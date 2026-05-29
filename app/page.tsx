'use client'
import { useState, useEffect, useCallback } from 'react'
import { RESTAURANTS, Restaurant } from '@/lib/restaurants'

// ── Types ──────────────────────────────────────────────────────────────────
interface Status { name: string; status: string }
interface Ranking { name: string; score: number; notes: string; dishes: string; date: string }
interface UserLoc { lat: number; lng: number }

// ── Constants ─────────────────────────────────────────────────────────────
const CATEGORIES = ['All','Turkish','Lebanese','Persian','Greek','Spanish','Israeli','Jordanian','Egyptian','General Med']
const CAT_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Turkish:      { bg:'#fef3e8', border:'#e8b870', text:'#9a6020' },
  Lebanese:     { bg:'#fef8e8', border:'#d4c060', text:'#7a6010' },
  Persian:      { bg:'#f0f4fe', border:'#a0b4e8', text:'#3050a0' },
  Greek:        { bg:'#e8f4fe', border:'#80b8e0', text:'#1060a0' },
  Spanish:      { bg:'#fde8e8', border:'#e09090', text:'#a02020' },
  Israeli:      { bg:'#eef8f0', border:'#90c8a0', text:'#207040' },
  Jordanian:    { bg:'#f8f0fe', border:'#c090d8', text:'#602090' },
  Egyptian:     { bg:'#fef4e0', border:'#d4a840', text:'#805010' },
  'General Med':{ bg:'#f4f4f4', border:'#b0b0b0', text:'#505050' },
}
const SCORE_LABELS: Record<number,string> = { 10:'Perfect',9:'Incredible',8:'Really Good',7:'Liked It',6:'It Was Fine',5:'Meh',4:'Not Great',3:'Bad',2:'Really Bad',1:'Terrible' }
const SCORE_COLORS: Record<number,string> = { 10:'#1a7a3a',9:'#2a9a4a',8:'#4aaa5a',7:'#8ab840',6:'#c8c030',5:'#e0a020',4:'#e07020',3:'#d04020',2:'#b02010',1:'#801010' }

function distMi(lat1:number,lng1:number,lat2:number,lng2:number){
  const R=3958.8,dLat=(lat2-lat1)*Math.PI/180,dLng=(lng2-lng1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

// ── Sub-components ────────────────────────────────────────────────────────
function Price({ n }: { n: number }) {
  return <span style={{fontSize:11,fontFamily:'monospace'}}><span style={{color:'#9a6a30'}}>{'$'.repeat(n)}</span><span style={{color:'#ddd0b8'}}>{'$'.repeat(3-n)}</span></span>
}

function RankingModal({ restaurant, current, onSave, onClose }: { restaurant: Restaurant; current?: Ranking; onSave:(d:Omit<Ranking,'name'>)=>void; onClose:()=>void }) {
  const [score, setScore] = useState<number|null>(current?.score||null)
  const [notes, setNotes] = useState(current?.notes||'')
  const [dishes, setDishes] = useState(current?.dishes||'')
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div style={{background:'#fff',borderRadius:16,padding:22,width:'100%',maxWidth:420,boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
          <div>
            <div style={{fontSize:11,color:'#b07830',textTransform:'uppercase',letterSpacing:'0.15em',marginBottom:3}}>Rate Your Visit</div>
            <div style={{fontSize:16,fontWeight:'bold',color:'#2c1f0e'}}>{restaurant.name}</div>
          </div>
          <button onClick={onClose} style={{background:'none',border:'none',fontSize:20,color:'#b0a090',cursor:'pointer',padding:0,lineHeight:1}}>×</button>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11,color:'#8a7050',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Score</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:6}}>
            {[10,9,8,7,6,5,4,3,2,1].map(n=>(
              <button key={n} onClick={()=>setScore(n)} style={{padding:'8px 4px',borderRadius:8,cursor:'pointer',border:`2px solid ${score===n?SCORE_COLORS[n]:'#e8d8c0'}`,background:score===n?SCORE_COLORS[n]:'#faf6f0',color:score===n?'#fff':'#5a4030',fontSize:13,fontWeight:'bold',transition:'all 0.15s'}}>{n}</button>
            ))}
          </div>
          {score&&<div style={{marginTop:8,fontSize:13,color:SCORE_COLORS[score],fontWeight:'bold',textAlign:'center'}}>{SCORE_LABELS[score]}</div>}
        </div>
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,color:'#8a7050',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>What You Ordered</div>
          <input value={dishes} onChange={e=>setDishes(e.target.value)} placeholder="e.g. Adana kebab, baklava..." style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1.5px solid #e0c898',fontSize:13,color:'#2c1f0e',outline:'none',background:'#fffdf8'}}/>
        </div>
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11,color:'#8a7050',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:5}}>Notes</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Your thoughts..." rows={2} style={{width:'100%',padding:'7px 10px',borderRadius:8,border:'1.5px solid #e0c898',fontSize:13,color:'#2c1f0e',outline:'none',resize:'none',background:'#fffdf8'}}/>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={onClose} style={{flex:1,padding:'9px',borderRadius:10,border:'1.5px solid #e0c898',background:'transparent',color:'#9a7050',fontSize:13,cursor:'pointer'}}>Cancel</button>
          <button onClick={()=>{if(score){onSave({score,notes,dishes,date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})});onClose()}}} disabled={!score} style={{flex:2,padding:'9px',borderRadius:10,border:'none',background:score?'linear-gradient(135deg,#d4983a,#c8803a)':'#e8d8c0',color:score?'#fff':'#b0a080',fontSize:13,cursor:score?'pointer':'not-allowed',fontWeight:'bold'}}>Save Rating</button>
        </div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────
export default function Home() {
  const [statuses, setStatuses]   = useState<Record<string,string>>({})
  const [rankings, setRankings]   = useState<Record<string,Ranking>>({})
  const [newSpots, setNewSpots]   = useState<Restaurant[]>([])
  const [lastRefresh, setLastRefresh] = useState<string|null>(null)
  const [city, setCity]           = useState('All')
  const [category, setCategory]   = useState('All')
  const [filter, setFilter]       = useState('all')
  const [showRecs, setShowRecs]   = useState(false)
  const [sortBy, setSortBy]       = useState('reviews')
  const [search, setSearch]       = useState('')
  const [userLoc, setUserLoc]     = useState<UserLoc|null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError]   = useState<string|null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [refreshMsg, setRefreshMsg] = useState<string|null>(null)
  const [rankModal, setRankModal] = useState<Restaurant|null>(null)
  const [loaded, setLoaded]       = useState(false)

  // Load all data from API on mount
  useEffect(()=>{
    Promise.all([
      fetch('/api/status').then(r=>r.json()),
      fetch('/api/ranking').then(r=>r.json()),
      fetch('/api/find-new-spots').then(r=>r.json()),
    ]).then(([statData, rankData, newData])=>{
      const s: Record<string,string> = {}
      ;(statData||[]).forEach((row:Status)=>{ s[row.name]=row.status })
      setStatuses(s)
      const rk: Record<string,Ranking> = {}
      ;(rankData||[]).forEach((row:Ranking)=>{ rk[row.name]=row })
      setRankings(rk)
      setNewSpots(newData?.spots||[])
      setLastRefresh(newData?.lastRefresh||null)
      setLoaded(true)
    }).catch(()=>setLoaded(true))
  },[])

  const updateStatus = async (name: string, status: string) => {
    const current = statuses[name]
    const newStatus = current === status ? null : status
    setStatuses(prev => {
      const next = {...prev}
      if (!newStatus) { delete next[name] } else { next[name] = newStatus }
      return next
    })
    await fetch('/api/status',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, status: newStatus }) })
    // If just marked tried, open ranking
    if (newStatus === 'tried') {
      const all = [...RESTAURANTS, ...newSpots]
      const r = all.find(r=>r.name===name)
      if (r) setRankModal(r)
    }
  }

  const saveRanking = async (restaurant: Restaurant, data: Omit<Ranking,'name'>) => {
    const ranking = { name: restaurant.name, ...data }
    setRankings(prev=>({...prev,[restaurant.name]:ranking}))
    await fetch('/api/ranking',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(ranking) })
  }

  const findNewSpots = async () => {
    setRefreshing(true); setRefreshMsg(null)
    try {
      const res = await fetch('/api/find-new-spots',{ method:'POST' })
      const data = await res.json()
      if (data.added > 0) {
        setNewSpots(prev=>[...prev,...data.spots])
        setRefreshMsg(`✓ ${data.added} new spot${data.added>1?'s':''} added!`)
      } else {
        setRefreshMsg('✓ No new spots found')
      }
      setLastRefresh(new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}))
    } catch { setRefreshMsg('Search failed. Try again.') }
    finally { setRefreshing(false) }
  }

  const getLocation = () => {
    if (!navigator.geolocation) { setLocError('Not supported'); return }
    setLocLoading(true); setLocError(null)
    navigator.geolocation.getCurrentPosition(
      pos=>{ setUserLoc({lat:pos.coords.latitude,lng:pos.coords.longitude}); setLocLoading(false); setSortBy('distance') },
      ()=>{ setLocError('Access denied'); setLocLoading(false) },
      {timeout:8000}
    )
  }

  const allRestaurants = [...RESTAURANTS, ...newSpots]
  const wantCount  = Object.values(statuses).filter(s=>s==='want to try').length
  const triedCount = Object.values(statuses).filter(s=>s==='tried').length
  const topRated   = Object.entries(rankings).sort((a,b)=>b[1].score-a[1].score).slice(0,5)

  const filtered = allRestaurants
    .filter(r=>{
      if (city!=='All' && r.city!==city) return false
      if (category!=='All' && r.category!==category) return false
      if (showRecs && !r.recommended) return false
      const q = search.toLowerCase()
      if (q && !r.name.toLowerCase().includes(q) && !r.note.toLowerCase().includes(q) && !r.area.toLowerCase().includes(q)) return false
      const s = statuses[r.name]
      if (filter==='want') return s==='want to try'
      if (filter==='tried') return s==='tried'
      if (filter==='ranked') return !!rankings[r.name]
      return true
    })
    .map(r=>({...r, distMi: userLoc&&r.lat ? distMi(userLoc.lat,userLoc.lng,r.lat,r.lng) : null}))
    .sort((a,b)=>{
      if (sortBy==='distance'&&a.distMi!=null&&b.distMi!=null) return a.distMi-b.distMi
      if (sortBy==='score') return (rankings[b.name]?.score||0)-(rankings[a.name]?.score||0)
      return b.reviews-a.reviews
    })

  // ── Styles (inline to stay single-file) ───────────────────────────────
  const btn = (active:boolean, ac:string, ic:string) => ({
    padding:'4px 11px', borderRadius:14, border:`1.5px solid ${active?ac:'#ddc890'}`,
    background: active?ac:'transparent', color: active?'#fff':ic,
    fontSize:11, cursor:'pointer' as const, whiteSpace:'nowrap' as const,
  })

  return (
    <div style={{minHeight:'100vh',background:'#f8f4ee'}}>

      {/* ── HEADER ── */}
      <div style={{background:'linear-gradient(160deg,#fff9f0,#fdf2de)',borderBottom:'2px solid #e4ce98',padding:'20px 18px 16px'}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>
          <div style={{fontSize:10,letterSpacing:'0.3em',color:'#b07830',textTransform:'uppercase',marginBottom:3}}>Mediterranean</div>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:14}}>
            <div>
              <h1 style={{margin:'0 0 2px',fontSize:20,fontWeight:'normal'}}>Restaurant Try List 🫒</h1>
              <p style={{margin:0,fontSize:11,color:'#9a7850'}}>{allRestaurants.length} spots · Dallas & Austin{!loaded?' · loading...':''}</p>
            </div>
            <div style={{textAlign:'right'}}>
              <button onClick={findNewSpots} disabled={refreshing} style={{padding:'7px 14px',borderRadius:10,border:'1.5px solid #c8903a',background:refreshing?'#f5e8d0':'linear-gradient(135deg,#d4983a,#c8803a)',color:refreshing?'#9a7050':'#fff',fontSize:11,cursor:refreshing?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:5,boxShadow:refreshing?'none':'0 2px 6px rgba(200,130,50,0.3)'}}>
                <span className={refreshing?'spinning':''}>✦</span>{refreshing?'Searching...':'Find New Spots'}
              </button>
              {lastRefresh&&<div style={{fontSize:10,color:'#b09070',marginTop:4}}>Last checked: {lastRefresh}</div>}
              {refreshMsg&&<div style={{fontSize:11,color:refreshMsg.startsWith('✓')?'#3a8a3a':'#c04020',marginTop:3}}>{refreshMsg}</div>}
            </div>
          </div>

          {/* Stats */}
          <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap'}}>
            {[
              {label:'Want to Try',count:wantCount,   color:'#c8703a',bg:'#fff0dc',border:'#e8b870'},
              {label:'Tried',      count:triedCount,  color:'#3a8a3a',bg:'#eaf7ea',border:'#90c890'},
              {label:'Ranked',     count:topRated.length,color:'#5a3a9a',bg:'#f0ecfe',border:'#c0a8e8'},
              {label:'Left',       count:allRestaurants.length-triedCount,color:'#7a5a30',bg:'#f5ede0',border:'#d0b070'},
            ].map(s=>(
              <div key={s.label} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:8,padding:'5px 11px',display:'flex',alignItems:'center',gap:6}}>
                <span style={{fontSize:15,fontWeight:'bold',color:s.color}}>{s.count}</span>
                <span style={{fontSize:10,color:s.color,textTransform:'uppercase',letterSpacing:'0.1em'}}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div style={{height:4,background:'#e4ce98',borderRadius:2,overflow:'hidden',marginBottom:topRated.length?12:0}}>
            <div style={{height:'100%',width:`${allRestaurants.length?(triedCount/allRestaurants.length)*100:0}%`,background:'linear-gradient(90deg,#3a8a3a,#60b060)',borderRadius:2,transition:'width 0.4s'}}/>
          </div>

          {/* Leaderboard */}
          {topRated.length>0&&(
            <div style={{background:'#fffbf3',border:'1px solid #e4ce98',borderRadius:10,padding:'10px 14px'}}>
              <div style={{fontSize:10,letterSpacing:'0.15em',textTransform:'uppercase',color:'#b07830',marginBottom:8}}>🏆 Your Top Rated</div>
              {topRated.map(([name,r],i)=>(
                <div key={name} style={{display:'flex',alignItems:'center',gap:8,marginBottom:i<topRated.length-1?6:0}}>
                  <span style={{fontSize:11,color:'#b0a080',width:14}}>{i+1}</span>
                  <div style={{width:28,height:20,borderRadius:5,background:SCORE_COLORS[r.score],display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:'bold',color:'#fff'}}>{r.score}</div>
                  <span style={{fontSize:12,flex:1,color:'#2c1f0e'}}>{name}</span>
                  <span style={{fontSize:10,color:'#b0a080'}}>{SCORE_LABELS[r.score]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div style={{background:'#fffbf3',borderBottom:'1px solid #e4ce98',padding:'10px 18px',position:'sticky',top:0,zIndex:10}}>
        <div style={{maxWidth:760,margin:'0 auto'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, area, notes..." style={{width:'100%',padding:'7px 12px',borderRadius:8,border:'1.5px solid #ddc890',background:'#fffdf8',fontSize:13,color:'#2c1f0e',outline:'none',marginBottom:8}}/>

          {/* Row 1: City + location */}
          <div style={{display:'flex',gap:5,marginBottom:7,flexWrap:'wrap',alignItems:'center'}}>
            {['All','Dallas','Austin'].map(c=>(
              <button key={c} onClick={()=>setCity(c)} style={{...btn(city===c,'#3a5a9a','#7a6040'),fontWeight:city===c?'bold':'normal'}}>
                {c==='All'?'🗺 All':c==='Dallas'?'🏙 Dallas':'🤠 Austin'}
              </button>
            ))}
            <div style={{width:1,background:'#ddc890',height:18,margin:'0 2px'}}/>
            <button onClick={getLocation} disabled={locLoading} style={{...btn(!!userLoc,'#3a8a60','#9a7050'),cursor:locLoading?'wait':'pointer'}}>
              {locLoading?'⟳ Locating...':userLoc?'📍 Near Me ✓':'📍 Near Me'}
            </button>
            {locError&&<span style={{fontSize:10,color:'#c04020'}}>{locError}</span>}
          </div>

          {/* Row 2: Sort + filters */}
          <div style={{display:'flex',gap:5,marginBottom:7,flexWrap:'wrap',alignItems:'center'}}>
            <span style={{fontSize:10,color:'#b0a080'}}>Sort:</span>
            {[{k:'reviews',l:'Reviews'},{k:'distance',l:'Distance'},{k:'score',l:'My Score'}].map(s=>(
              <button key={s.k} onClick={()=>{setSortBy(s.k);if(s.k==='distance'&&!userLoc)getLocation()}} style={btn(sortBy===s.k,'#7a5a9a','#9a7050')}>{s.l}</button>
            ))}
            <div style={{width:1,background:'#ddc890',height:18,margin:'0 2px'}}/>
            <button onClick={()=>setShowRecs(!showRecs)} style={btn(showRecs,'#c8703a','#9a7050')}>✦ Top Picks</button>
            {[{k:'all',l:'All'},{k:'want',l:'Want to Try'},{k:'tried',l:'Tried'},{k:'ranked',l:'Ranked'}].map(f=>(
              <button key={f.k} onClick={()=>setFilter(f.k)} style={btn(filter===f.k,'#4a7a9a','#9a7050')}>{f.l}</button>
            ))}
          </div>

          {/* Row 3: Category */}
          <div style={{display:'flex',gap:5,overflowX:'auto',paddingBottom:3}}>
            {CATEGORIES.map(c=>{
              const col=CAT_COLORS[c]; const active=category===c
              return <button key={c} onClick={()=>setCategory(c)} style={{padding:'3px 10px',borderRadius:12,border:`1.5px solid ${active?(col?.border||'#9a7850'):'#ddc890'}`,background:active?(col?.bg||'#f5ede0'):'transparent',color:active?(col?.text||'#7a5a30'):'#9a7850',fontSize:10,cursor:'pointer',whiteSpace:'nowrap',fontWeight:active?'bold':'normal'}}>{c}</button>
            })}
          </div>
        </div>
      </div>

      {/* ── CARDS ── */}
      <div style={{maxWidth:760,margin:'0 auto',padding:'12px 18px 60px'}}>
        <div style={{fontSize:11,color:'#b09060',marginBottom:10}}>
          {filtered.length} restaurant{filtered.length!==1?'s':''} · {sortBy==='distance'&&userLoc?'sorted by distance':sortBy==='score'?'sorted by your score':'sorted by review count'}
        </div>

        {filtered.length===0&&loaded&&(
          <div style={{textAlign:'center',padding:'50px 0',color:'#b8a080'}}>
            <div style={{fontSize:28,marginBottom:8}}>🫒</div>
            <div>No results. Try adjusting filters.</div>
          </div>
        )}

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:12}}>
          {filtered.map(r=>{
            const status  = statuses[r.name]
            const isTried = status==='tried'
            const isWant  = status==='want to try'
            const ranking = rankings[r.name]
            const col     = CAT_COLORS[r.category]||CAT_COLORS['General Med']
            return (
              <div key={r.name} style={{background:isTried?'#f0f8f0':isWant?'#fffbf0':'#ffffff',border:`1.5px solid ${isTried?'#a0cca0':isWant?'#e0be60':'#e4d0a8'}`,borderRadius:12,padding:'13px',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',display:'flex',flexDirection:'column',gap:8,position:'relative'}}>

                {r.isNew&&<div style={{position:'absolute',top:-1,right:12,background:'#3a8a60',color:'#fff',fontSize:9,padding:'2px 8px',borderRadius:'0 0 7px 7px',letterSpacing:'0.1em',textTransform:'uppercase'}}>New</div>}

                {/* Name + city */}
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',gap:6,marginBottom:5}}>
                    <span style={{fontSize:14,fontWeight:'bold',color:isTried?'#5a8a5a':'#2c1f0e',textDecoration:isTried?'line-through':'none',textDecorationColor:'#80b880',lineHeight:1.3,flex:1}}>{r.name}</span>
                    <span style={{fontSize:10,color:'#9a8060',whiteSpace:'nowrap',marginTop:2}}>{r.city==='Dallas'?'🏙 DFW':'🤠 ATX'}</span>
                  </div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    <span style={{fontSize:10,background:col.bg,color:col.text,border:`1px solid ${col.border}`,borderRadius:8,padding:'2px 7px'}}>{r.category}</span>
                    {r.recommended&&<span style={{fontSize:10,background:'#fef0dc',color:'#c8703a',border:'1px solid #e8b870',borderRadius:8,padding:'2px 7px'}}>✦ Pick</span>}
                    {isTried&&<span style={{fontSize:10,background:'#eaf7ea',color:'#3a8a3a',border:'1px solid #90c890',borderRadius:8,padding:'2px 7px'}}>✓ Tried</span>}
                    {isWant&&<span style={{fontSize:10,background:'#fff0dc',color:'#c8703a',border:'1px solid #e8b870',borderRadius:8,padding:'2px 7px'}}>♥ Want</span>}
                  </div>
                </div>

                {/* Stats */}
                <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
                  <span style={{color:'#c8903a',fontSize:11,fontWeight:'bold'}}>★ {r.rating}</span>
                  <span style={{fontSize:11,color:'#9a8060'}}>({r.reviews.toLocaleString()})</span>
                  <Price n={r.price}/>
                  {(r as any).distMi!=null&&<span style={{fontSize:11,color:'#5a7a9a',background:'#eef4fa',borderRadius:6,padding:'1px 6px'}}>{(r as any).distMi<10?(r as any).distMi.toFixed(1):Math.round((r as any).distMi)} mi</span>}
                </div>

                <div style={{fontSize:12,color:'#8a7050',lineHeight:1.5}}>{r.note}</div>

                {/* Ranking display */}
                {ranking&&(
                  <div style={{background:'#faf6f0',border:`1px solid ${SCORE_COLORS[ranking.score]}30`,borderRadius:8,padding:'7px 10px'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:ranking.dishes||ranking.notes?5:0}}>
                      <div style={{width:28,height:20,borderRadius:5,background:SCORE_COLORS[ranking.score],display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:'bold',color:'#fff'}}>{ranking.score}</div>
                      <span style={{fontSize:11,fontWeight:'bold',color:SCORE_COLORS[ranking.score]}}>{SCORE_LABELS[ranking.score]}</span>
                      <span style={{fontSize:10,color:'#b0a080',marginLeft:'auto'}}>{ranking.date}</span>
                    </div>
                    {ranking.dishes&&<div style={{fontSize:11,color:'#7a6040'}}>🍽 {ranking.dishes}</div>}
                    {ranking.notes&&<div style={{fontSize:11,color:'#7a6040',marginTop:2}}>"{ranking.notes}"</div>}
                  </div>
                )}

                {/* Footer */}
                <div style={{display:'flex',alignItems:'center',gap:5,flexWrap:'wrap',paddingTop:8,borderTop:'1px solid #f0e4c8',marginTop:'auto'}}>
                  <button onClick={()=>window.open(`https://www.google.com/search?q=${r.mapsQuery}&tbm=lcl`,'_blank')} style={{fontSize:11,color:'#3a5a9a',background:'#eef2fc',border:'1px solid #b8c8e8',borderRadius:8,padding:'3px 8px',cursor:'pointer'}}>📍 {r.area}</button>
                  {r.url&&<a href={r.url} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:'#4a7a9a',textDecoration:'none',background:'#f0f6fa',border:'1px solid #b0cce0',borderRadius:8,padding:'3px 8px'}}>↗ Site</a>}
                  <div style={{marginLeft:'auto',display:'flex',gap:5}}>
                    <button onClick={()=>updateStatus(r.name,'want to try')} style={{padding:'3px 9px',borderRadius:11,fontSize:10,border:`1.5px solid ${isWant?'#c8703a':'#ddc890'}`,background:isWant?'#c8703a':'transparent',color:isWant?'#fff':'#9a7050',cursor:'pointer'}}>
                      {isWant?'♥':'+ Want'}
                    </button>
                    <button onClick={()=>updateStatus(r.name,'tried')} style={{padding:'3px 9px',borderRadius:11,fontSize:10,border:`1.5px solid ${isTried?'#3a8a3a':'#b8ccb8'}`,background:isTried?'#3a8a3a':'transparent',color:isTried?'#fff':'#5a8a5a',cursor:'pointer'}}>
                      {isTried?'✓ Tried':'Tried'}
                    </button>
                    {isTried&&<button onClick={()=>setRankModal(r)} style={{padding:'3px 9px',borderRadius:11,fontSize:10,border:`1.5px solid ${ranking?'#7a5a9a':'#c8b0e0'}`,background:ranking?'#7a5a9a':'transparent',color:ranking?'#fff':'#7a5a9a',cursor:'pointer'}}>
                      {ranking?'★ '+ranking.score:'Rate'}
                    </button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RANKING MODAL ── */}
      {rankModal&&(
        <RankingModal
          restaurant={rankModal}
          current={rankings[rankModal.name]}
          onSave={data=>saveRanking(rankModal,data)}
          onClose={()=>setRankModal(null)}
        />
      )}
    </div>
  )
}
