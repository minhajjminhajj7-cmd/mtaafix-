import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import { AlertTriangle, ExternalLink, Filter, MapPin, RefreshCw, Search, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getIncidents } from '../../services/incidentService'
import TopNavigation from '../../components/navigation/TopNavigation'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = [-6.163, 35.7516]
const priorityStyles = {
  critical: { label: 'Critical', background: '#a33f39' },
  high: { label: 'High', background: '#c46c2c' },
  normal: { label: 'Normal', background: '#33718c' },
  low: { label: 'Low', background: '#527868' },
}
const statusLabels = {
  open: 'Reported', under_review: 'Reviewed', assigned: 'Accepted',
  in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed', archived: 'Archived',
}

function createMarkerIcon(priority = 'normal') {
  const style = priorityStyles[priority] || priorityStyles.normal
  return L.divIcon({
    className: 'mtaafix-map-marker',
    html: `<div style="width:34px;height:34px;border-radius:50% 50% 50% 0;background:${style.background};border:3px solid white;box-shadow:0 3px 10px rgba(15,23,42,.28);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center"><div style="width:9px;height:9px;border-radius:50%;background:white"></div></div>`,
    iconSize: [34, 34], iconAnchor: [17, 34], popupAnchor: [0, -32],
  })
}

function MapBounds({ incidents }) {
  const map = useMap()
  useEffect(() => {
    if (!incidents.length) { map.setView(DEFAULT_CENTER, 6); return }
    if (incidents.length === 1) { map.setView([incidents[0].latitude, incidents[0].longitude], 15); return }
    const bounds = L.latLngBounds(incidents.map((item) => [item.latitude, item.longitude]))
    map.fitBounds(bounds, { padding: [45, 45], maxZoom: 15 })
  }, [incidents, map])
  return null
}

function normalizeIncident(item) {
  const latitude = Number(item.lat ?? item.latitude)
  const longitude = Number(item.lon ?? item.lng ?? item.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null
  return { ...item, latitude, longitude }
}

function ageHours(item) {
  return (Date.now() - new Date(item.updated_at || item.created_at).getTime()) / 3600000
}
function isOverdue(item) {
  if (['resolved','closed','rejected','archived'].includes(item.status)) return false
  const limit = item.priority === 'critical' ? 24 : item.priority === 'high' ? 48 : item.priority === 'normal' ? 72 : 120
  return ageHours(item) > limit
}

export default function LiveIncidentMapPage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [priority, setPriority] = useState('all')
  const [status, setStatus] = useState('active')
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  async function loadIncidents(refresh = false) {
    try {
      setError('')
      refresh ? setRefreshing(true) : setLoading(true)
      const response = await getIncidents()
      const rows = Array.isArray(response?.data) ? response.data : []
      setIncidents(rows.map(normalizeIncident).filter(Boolean))
    } catch (err) {
      setError(err.message || 'Unable to load incidents.')
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }

  useEffect(() => { loadIncidents() }, [])

  const categories = useMemo(() => [...new Set(incidents.map((item) => item.category_name).filter(Boolean))].sort(), [incidents])
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return incidents.filter((item) => {
      const matchesPriority = priority === 'all' || item.priority === priority
      const matchesStatus = status === 'all' || (status === 'active'
        ? !['resolved','closed','rejected','archived'].includes(item.status)
        : status === 'overdue' ? isOverdue(item) : item.status === status)
      const matchesCategory = category === 'all' || item.category_name === category
      const text = `${item.title || ''} ${item.problem_type_name || ''} ${item.category_name || ''} ${item.authority_name || ''}`.toLowerCase()
      return matchesPriority && matchesStatus && matchesCategory && (!q || text.includes(q))
    })
  }, [incidents, priority, status, category, search])

  const summary = useMemo(() => ({
    total: incidents.length,
    active: incidents.filter((item) => !['resolved','closed','rejected','archived'].includes(item.status)).length,
    critical: incidents.filter((item) => item.priority === 'critical' && !['resolved','closed','rejected','archived'].includes(item.status)).length,
    overdue: incidents.filter(isOverdue).length,
  }), [incidents])

  const hotspotGroups = useMemo(() => {
    const groups = new Map()
    filtered.forEach((item) => {
      const key = `${item.latitude.toFixed(3)},${item.longitude.toFixed(3)}`
      const current = groups.get(key) || { key, latitude: item.latitude, longitude: item.longitude, count: 0, critical: 0 }
      current.count += 1
      if (item.priority === 'critical') current.critical += 1
      groups.set(key, current)
    })
    return [...groups.values()].sort((a,b) => b.count - a.count || b.critical - a.critical).slice(0,6)
  }, [filtered])

  function clearFilters() { setPriority('all'); setStatus('active'); setCategory('all'); setSearch('') }

  return (
    <div className="min-h-screen bg-[#f5f7f7]">
      <TopNavigation activePage="map" criticalCount={summary.critical} />
      <main className="mx-auto max-w-[1600px] px-5 py-7 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.12em] text-[#177b66]"><MapPin size={14}/> Operations map</div><h1 className="m-0 text-[30px] font-semibold tracking-[-.035em] text-[#27382f]">Live Incident Map</h1><p className="m-0 mt-2 max-w-3xl text-[13px] leading-6 text-[#77837d]">Filter incidents by risk, status and infrastructure area. Hotspot summaries help identify locations with repeated infrastructure problems.</p></div>
          <button type="button" onClick={() => loadIncidents(true)} disabled={refreshing} className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dce3df] bg-white px-4 py-3 text-[12px] font-medium text-[#5d6b64]"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>{refreshing ? 'Refreshing…' : 'Refresh map'}</button>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryItem label="Mapped incidents" value={summary.total}/><SummaryItem label="Active" value={summary.active} tone="teal"/><SummaryItem label="Critical" value={summary.critical} tone="red"/><SummaryItem label="Overdue" value={summary.overdue} tone="orange"/>
        </section>

        <section className="mt-5 rounded-[20px] border border-[#e0e6e2] bg-white p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative min-w-0 flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#87938c]"/><input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search incident, department or category…" className="h-11 w-full rounded-xl border border-[#dce3df] bg-[#fbfcfb] pl-9 pr-3 text-[12px] outline-none focus:border-[#4e9b83]"/></div>
            <select value={priority} onChange={(e)=>setPriority(e.target.value)} className="h-11 rounded-xl border border-[#dce3df] bg-white px-3 text-[11px]"><option value="all">All priorities</option><option value="critical">Critical</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
            <select value={status} onChange={(e)=>setStatus(e.target.value)} className="h-11 rounded-xl border border-[#dce3df] bg-white px-3 text-[11px]"><option value="active">Active</option><option value="all">All statuses</option><option value="open">Reported</option><option value="under_review">Reviewed</option><option value="assigned">Accepted</option><option value="in_progress">In progress</option><option value="overdue">Overdue</option><option value="resolved">Resolved</option></select>
            <select value={category} onChange={(e)=>setCategory(e.target.value)} className="h-11 max-w-[240px] rounded-xl border border-[#dce3df] bg-white px-3 text-[11px]"><option value="all">All categories</option>{categories.map((item)=><option key={item} value={item}>{item}</option>)}</select>
            <button onClick={clearFilters} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#dce3df] px-3 text-[11px] font-medium text-[#66736c]"><X size={14}/>Reset</button>
          </div>
        </section>

        {error && <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#efd5cf] bg-[#fff5f3] p-3 text-[12px] text-[#9e5046]"><AlertTriangle size={15}/>{error}</div>}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
          <section className="overflow-hidden rounded-[22px] border border-[#e0e6e2] bg-white shadow-[0_12px_34px_rgba(36,55,47,.04)]">
            <div className="h-[640px] w-full">
              {loading ? <div className="flex h-full items-center justify-center text-[12px] text-[#77837d]">Loading incident locations…</div> : (
                <MapContainer center={DEFAULT_CENTER} zoom={6} scrollWheelZoom className="h-full w-full"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><MapBounds incidents={filtered}/>{filtered.map((item)=><Marker key={item.id} position={[item.latitude,item.longitude]} icon={createMarkerIcon(item.priority)}><Popup><div className="min-w-[220px]"><p className="m-0 text-[10px] font-semibold uppercase tracking-[.08em] text-slate-400">{item.problem_type_name || item.category_name}</p><h3 className="mt-1 text-sm font-semibold text-slate-900">{item.title || 'Infrastructure incident'}</h3><p className="mt-1 text-xs text-slate-500">{item.authority_name || 'Routing pending'}</p><div className="mt-2 flex gap-2"><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{priorityStyles[item.priority]?.label || item.priority}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{statusLabels[item.status] || item.status}</span></div>{isOverdue(item) && <p className="mt-2 text-xs font-semibold text-amber-700">Overdue response</p>}<button onClick={()=>navigate(`/incidents/${item.id}`)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">Open incident <ExternalLink size={13}/></button></div></Popup></Marker>)}</MapContainer>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#e0e6e2] px-4 py-3 text-[10px] text-[#66736c]"><span className="font-semibold">Priority</span>{Object.entries(priorityStyles).map(([key,value])=><span key={key} className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:value.background}}/>{value.label}</span>)}<span className="ml-auto">Showing {filtered.length} / {incidents.length}</span></div>
          </section>

          <div className="grid content-start gap-5">
            <section className="rounded-[22px] border border-[#e0e6e2] bg-white shadow-[0_12px_34px_rgba(36,55,47,.04)]"><div className="border-b border-[#edf0ee] px-5 py-4"><h2 className="m-0 text-[15px] font-semibold text-[#2d3d35]">Filtered incidents</h2><p className="m-0 mt-1 text-[10.5px] text-[#87938c]">Select an incident to inspect its workflow</p></div><div className="max-h-[390px] overflow-y-auto">{filtered.length===0?<div className="px-5 py-10 text-center text-[11px] text-[#87938c]">No incidents match these filters.</div>:filtered.slice(0,25).map((item)=><button key={item.id} onClick={()=>navigate(`/incidents/${item.id}`)} className="block w-full border-b border-[#f0f2f1] px-5 py-4 text-left transition hover:bg-[#fafcfb]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="m-0 truncate text-[12px] font-semibold text-[#33443b]">{item.problem_type_name || item.title}</p><p className="m-0 mt-1 truncate text-[10px] text-[#87938c]">{item.authority_name || 'Routing pending'}</p></div><span className="shrink-0 rounded-full px-2 py-1 text-[9px] font-semibold text-white" style={{background:priorityStyles[item.priority]?.background || priorityStyles.normal.background}}>{priorityStyles[item.priority]?.label || item.priority}</span></div><div className="mt-3 flex items-center justify-between text-[9.5px] text-[#7b8780]"><span>{statusLabels[item.status] || item.status}</span>{isOverdue(item)&&<span className="font-semibold text-[#b36d2e]">Overdue</span>}</div></button>)}</div></section>
            <section className="rounded-[22px] border border-[#e0e6e2] bg-white p-5"><div className="flex items-center gap-2"><Filter size={15} className="text-[#177b66]"/><h2 className="m-0 text-[14px] font-semibold text-[#2d3d35]">Hotspot watch</h2></div><p className="m-0 mt-1 text-[10px] text-[#87938c]">Approximate clusters in the current filter</p><div className="mt-4 grid gap-2">{hotspotGroups.map((item,index)=><div key={item.key} className="flex items-center justify-between rounded-[14px] bg-[#f8faf9] p-3"><div><p className="m-0 text-[10.5px] font-medium text-[#4b5b52]">{index+1}. {item.key}</p><p className="m-0 mt-1 text-[9px] text-[#8a958f]">{item.critical} critical</p></div><span className="rounded-full bg-[#eaf4ef] px-2.5 py-1 text-[10px] font-semibold text-[#177b66]">{item.count}</span></div>)}{hotspotGroups.length===0&&<p className="py-4 text-center text-[10px] text-[#87938c]">No hotspots in this view.</p>}</div></section>
          </div>
        </div>
      </main>
    </div>
  )
}

function SummaryItem({label,value,tone='slate'}) {
  const tones={slate:'text-[#304139]',teal:'text-[#177b66]',red:'text-[#a5413b]',orange:'text-[#b06a2d]'}
  return <div className="rounded-[18px] border border-[#e0e6e2] bg-white px-4 py-4"><p className="m-0 text-[10px] font-medium text-[#87938c]">{label}</p><p className={`m-0 mt-1 text-[24px] font-semibold ${tones[tone]}`}>{value}</p></div>
}
