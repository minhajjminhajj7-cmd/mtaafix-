import {
  AlertCircle,
  ArrowLeft,
  Archive,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  PlayCircle,
  RefreshCw,
  Route,
  ShieldAlert,
  Trash2,
  Upload,
  UserRound,
  Video,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import TopNavigation from '../../components/navigation/TopNavigation'
import { getAuthorityUser } from '../../services/authService'
import {
  acceptIncident,
  addIncidentProgress,
  archiveIncident,
  assignIncident,
  deleteIncident,
  getIncidentById,
  messageDepartment,
  restoreIncident,
  updateIncidentPriority,
  resolveIncident,
  reviewIncident,
  startIncidentWork,
} from '../../services/incidentService'
import { getServiceProviders } from '../../services/serviceProviderService'

const API_ORIGIN = 'http://localhost:4000'

function pretty(value) {
  return String(value || 'Unknown').split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function fileUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`
}

function mediaType(item) {
  const hint = String(item?.media_type || item?.mime_type || item?.file_url || '').toLowerCase()
  return hint.includes('video') || /\.(mp4|mov|webm|m4v)$/i.test(hint) ? 'video' : 'image'
}

function StatusPill({ status }) {
  const styles = {
    open: 'bg-[#eef2f3] text-[#50636d]',
    under_review: 'bg-[#fff4d7] text-[#856200]',
    assigned: 'bg-[#e7f2f6] text-[#24627b]',
    in_progress: 'bg-[#e8f0f8] text-[#315f89]',
    resolved: 'bg-[#e4f3e9] text-[#267447]',
    archived: 'bg-[#eceff0] text-[#687980]',
    rejected: 'bg-[#fdeaea] text-[#9a3f3f]',
  }
  return <span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold ${styles[status] || styles.open}`}>{pretty(status)}</span>
}

function IncidentDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const user = getAuthorityUser()
  const isProvider = user?.role === 'service_provider'
  const isSuperAdmin = user?.role === 'super_admin'

  const [incident, setIncident] = useState(null)
  const [reports, setReports] = useState([])
  const [history, setHistory] = useState([])
  const [progressEvidence, setProgressEvidence] = useState([])
  const [resolutionEvidence, setResolutionEvidence] = useState([])
  const [departments, setDepartments] = useState([])
  const [selectedAuthorityId, setSelectedAuthorityId] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('normal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [progressNote, setProgressNote] = useState('')
  const [progressFiles, setProgressFiles] = useState([])
  const [resolutionNote, setResolutionNote] = useState('')
  const [resolutionFiles, setResolutionFiles] = useState([])
  const [message, setMessage] = useState('')

  async function load() {
    try {
      setLoading(true)
      setError('')
      const response = await getIncidentById(id)
      const data = response.data ?? {}
      setIncident(data.incident ?? response.incident ?? null)
      setReports(data.reports ?? response.reports ?? [])
      setHistory(data.history ?? response.history ?? [])
      setProgressEvidence(data.progressEvidence ?? response.progressEvidence ?? [])
      setResolutionEvidence(data.resolutionEvidence ?? response.resolutionEvidence ?? [])
      const current = data.incident ?? response.incident
      setSelectedAuthorityId(current?.authority_id ? String(current.authority_id) : '')
      setSelectedPriority(current?.priority || 'normal')
    } catch (err) {
      setError(err.message || 'Unable to load incident.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (!isSuperAdmin) return
    getServiceProviders().then((response) => setDepartments(response.data ?? [])).catch(() => setDepartments([]))
  }, [isSuperAdmin])

  async function runAction(action, successMessage) {
    try {
      setSaving(true)
      setError('')
      setSuccess('')
      await action()
      setSuccess(successMessage)
      await load()
    } catch (err) {
      setError(err.message || 'Unable to complete action.')
    } finally {
      setSaving(false)
    }
  }

  async function saveProgress(event) {
    event.preventDefault()
    if (!progressNote.trim() && progressFiles.length === 0) return setError('Add a progress note, photo or video.')
    await runAction(() => addIncidentProgress(id, progressNote.trim(), progressFiles), 'Progress update saved.')
    setProgressNote('')
    setProgressFiles([])
  }

  async function resolve(event) {
    event.preventDefault()
    if (resolutionNote.trim().length < 5) return setError('Add a short resolution note.')
    if (resolutionFiles.length === 0) return setError('Upload at least one completion photo or video.')
    await runAction(() => resolveIncident(id, resolutionNote.trim(), resolutionFiles), 'Incident resolved with evidence.')
    setResolutionNote('')
    setResolutionFiles([])
  }

  async function reassign() {
    if (!selectedAuthorityId) return setError('Choose a department first.')
    await runAction(() => assignIncident(id, Number(selectedAuthorityId)), 'Responsible department updated.')
  }

  async function savePriority() {
    await runAction(() => updateIncidentPriority(id, selectedPriority), 'Incident priority updated.')
  }

  async function restore() {
    await runAction(() => restoreIncident(id, 'Restored by Super Admin'), 'Incident restored to the active register.')
  }

  async function sendMessage(event) {
    event.preventDefault()
    if (message.trim().length < 3) return setError('Write a message first.')
    await runAction(() => messageDepartment(id, message.trim()), 'Message recorded for the department.')
    setMessage('')
  }

  async function archive() {
    const note = window.prompt('Why are you archiving this incident?')
    if (!note) return
    await runAction(() => archiveIncident(id, note), 'Incident archived.')
  }

  async function remove() {
    if (!window.confirm('Permanently delete this incident? Incidents with citizen reports cannot be deleted and should be archived instead.')) return
    try {
      setSaving(true)
      await deleteIncident(id)
      navigate('/incidents', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally { setSaving(false) }
  }

  const firstReport = reports[0]
  const citizenMedia = useMemo(() => reports.flatMap((report) => {
    const evidence = Array.isArray(report.evidence) ? report.evidence : []
    const items = evidence.map((item) => ({ ...item, label: report.citizen_name || 'Citizen evidence' }))
    if (items.length === 0 && report.image_url) items.push({ file_url: report.image_url, media_type: 'image', label: report.citizen_name || 'Citizen evidence' })
    return items
  }), [reports])

  if (loading) {
    return <div className="min-h-screen bg-[#f5f7f7]"><TopNavigation activePage="incidents" /><div className="mx-auto max-w-[1450px] px-5 py-20 text-center text-sm text-[#7c8882]">Loading incident…</div></div>
  }

  if (!incident) {
    return <div className="min-h-screen bg-[#f5f7f7]"><TopNavigation activePage="incidents" /><div className="mx-auto max-w-[1450px] px-5 py-20 text-center text-sm text-[#9a4d43]">{error || 'Incident not found.'}</div></div>
  }

  const workflow = [
    ['open', 'Reported', 'Citizen report reached the responsible department.'],
    ['under_review', 'Reviewed', 'Department reviewed and validated the issue.'],
    ['assigned', 'Accepted', 'Department accepted responsibility for the response.'],
    ['in_progress', 'In progress', 'Field work is underway.'],
    ['resolved', 'Resolved', 'Department completed the work and uploaded proof.'],
  ]
  const order = { open: 0, under_review: 1, assigned: 2, in_progress: 3, resolution_submitted: 3, resolved: 4, closed: 4 }
  const currentIndex = order[incident.status] ?? 0

  return (
    <div className="min-h-screen bg-[#f5f7f7]">
      <TopNavigation activePage="incidents" />
      <main className="mx-auto max-w-[1450px] px-5 py-7 lg:px-8">
        <button type="button" onClick={() => navigate('/incidents')} className="inline-flex items-center gap-2 text-[12px] font-medium text-[#617068]"><ArrowLeft size={15} /> Back to incidents</button>

        <div className="mt-5 flex flex-col justify-between gap-5 rounded-[24px] border border-[#dfe6e2] bg-white p-6 shadow-[0_12px_34px_rgba(36,55,47,.04)] lg:flex-row lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2"><StatusPill status={incident.status} /><span className={`rounded-full px-3 py-1.5 text-[10px] font-semibold uppercase ${incident.priority === 'critical' ? 'bg-[#fde8e6] text-[#a63f38]' : incident.priority === 'high' ? 'bg-[#fff0e4] text-[#a45b1d]' : 'bg-[#edf5f1] text-[#4a7465]'}`}>{incident.priority} priority</span></div>
            <h1 className="m-0 mt-4 text-[29px] font-semibold tracking-[-.04em] text-[#27382f]">{incident.problem_type_name || incident.title}</h1>
            <p className="m-0 mt-2 max-w-3xl text-[13px] leading-6 text-[#748078]">{incident.description}</p>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#7f8b84]"><span className="inline-flex items-center gap-1.5"><CalendarDays size={13} /> {formatDate(incident.created_at)}</span><span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {incident.latitude}, {incident.longitude}</span><span className="inline-flex items-center gap-1.5"><FileText size={13} /> {incident.report_count} citizen report{Number(incident.report_count) === 1 ? '' : 's'}</span></div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dce3df] px-4 py-2.5 text-[11px] font-medium text-[#5e6d65]"><RefreshCw size={14} /> Refresh</button>
        </div>

        {(error || success) && <div className={`mt-4 flex items-center gap-2 rounded-xl border p-3 text-[12px] ${error ? 'border-[#efd2cd] bg-[#fff5f3] text-[#9e4d43]' : 'border-[#cfe6d8] bg-[#f1faf4] text-[#33734e]'}`}>{error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}{error || success}</div>}

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5">
              <div className="flex items-center gap-2"><Route size={17} className="text-[#178165]" /><h2 className="m-0 text-[15px] font-semibold text-[#304139]">Response workflow</h2></div>
              <div className="mt-5 grid gap-2 sm:grid-cols-5">
                {workflow.map(([key, title, description], index) => {
                  const active = index <= currentIndex
                  const current = index === currentIndex
                  return <div key={key} className={`rounded-[17px] border p-3.5 ${current ? 'border-[#5da891] bg-[#edf7f3]' : active ? 'border-[#d3e8df] bg-[#f6faf8]' : 'border-[#e6ebe8] bg-[#fafbfa]'}`}><div className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-[#178165] text-white' : 'bg-[#e8ecea] text-[#8c9791]'}`}>{active && index < currentIndex ? '✓' : index + 1}</div><p className="m-0 mt-3 text-[11px] font-semibold text-[#36473f]">{title}</p><p className="m-0 mt-1 text-[9.5px] leading-4 text-[#84908a]">{description}</p></div>
                })}
              </div>
            </div>

            {isProvider && (
              <div className="rounded-[24px] border border-[#dce6e1] bg-white p-5">
                <h2 className="m-0 text-[15px] font-semibold text-[#304139]">Department actions</h2>
                <p className="m-0 mt-1 text-[11px] text-[#849089]">Only your department controls the normal operational workflow.</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {incident.status === 'open' && <button disabled={saving} onClick={() => runAction(() => reviewIncident(id, 'Reviewed by responsible department'), 'Incident reviewed.')} className="rounded-xl bg-[#e9f5f0] px-4 py-3 text-[11px] font-semibold text-[#176f5c]">Review incident</button>}
                  {incident.status === 'under_review' && <button disabled={saving} onClick={() => runAction(() => acceptIncident(id), 'Department accepted responsibility.')} className="rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-4 py-3 text-[11px] font-semibold text-white">Accept responsibility</button>}
                  {incident.status === 'assigned' && <button disabled={saving} onClick={() => runAction(() => startIncidentWork(id), 'Work started.')} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#3e7796] to-[#315f82] px-4 py-3 text-[11px] font-semibold text-white"><PlayCircle size={15} /> Start work</button>}
                </div>

                {incident.status === 'in_progress' && <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <form onSubmit={saveProgress} className="rounded-[18px] border border-[#e3e8e5] bg-[#fafcfb] p-4"><p className="m-0 text-[12px] font-semibold text-[#36473f]">Add progress update</p><textarea value={progressNote} onChange={(e) => setProgressNote(e.target.value)} rows="4" placeholder="What has been done so far?" className="mt-3 w-full rounded-xl border border-[#dce3df] bg-white p-3 text-[12px] outline-none focus:border-[#4e9b83]" /><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#cad7d0] bg-white px-3 py-3 text-[11px] text-[#607068]"><Upload size={15} /> Add photo/video<input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => setProgressFiles(Array.from(e.target.files || []))} /></label>{progressFiles.length > 0 && <p className="m-0 mt-2 text-[10px] text-[#728078]">{progressFiles.length} file(s) selected</p>}<button disabled={saving} className="mt-3 rounded-xl border border-[#cfdcd5] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#376b5c]">Save progress</button></form>
                  <form onSubmit={resolve} className="rounded-[18px] border border-[#d7e8df] bg-[#f4faf7] p-4"><p className="m-0 text-[12px] font-semibold text-[#2d594b]">Resolve incident</p><p className="m-0 mt-1 text-[10px] leading-4 text-[#71837a]">Completion evidence is required before the incident can be resolved.</p><textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} rows="4" placeholder="Describe the completed work…" className="mt-3 w-full rounded-xl border border-[#d5e2db] bg-white p-3 text-[12px] outline-none focus:border-[#4e9b83]" /><label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-[#bcd3c7] bg-white px-3 py-3 text-[11px] text-[#557067]"><ImageIcon size={15} /> Completion photo/video<input type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => setResolutionFiles(Array.from(e.target.files || []))} /></label>{resolutionFiles.length > 0 && <p className="m-0 mt-2 text-[10px] text-[#638074]">{resolutionFiles.length} completion file(s) selected</p>}<button disabled={saving} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4b8b5f] to-[#34704a] px-4 py-2.5 text-[11px] font-semibold text-white"><CheckCircle2 size={14} /> Mark resolved</button></form>
                </div>}
              </div>
            )}

            <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5">
              <h2 className="m-0 text-[15px] font-semibold text-[#304139]">Evidence</h2>
              <p className="m-0 mt-1 text-[11px] text-[#849089]">Citizen evidence, field progress and completion proof stay attached to the incident.</p>
              <MediaSection title="Citizen evidence" items={citizenMedia} />
              <MediaSection title="Field progress" items={progressEvidence} />
              <MediaSection title="Resolution evidence" items={resolutionEvidence} />
            </div>

            <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5">
              <h2 className="m-0 text-[15px] font-semibold text-[#304139]">Accountability timeline</h2>
              <div className="mt-5 grid gap-3">
                {history.length === 0 ? <p className="text-[11px] text-[#849089]">No workflow history recorded yet.</p> : history.map((item) => (
                  <div key={item.id} className="flex gap-3 rounded-[16px] bg-[#f8faf8] p-3.5"><div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#178165]" /><div><div className="flex flex-wrap items-center gap-2"><p className="m-0 text-[11px] font-semibold text-[#35463d]">{pretty(item.action)}</p><span className="text-[9.5px] text-[#909a95]">{formatDate(item.created_at)}</span></div><p className="m-0 mt-1 text-[10.5px] text-[#76837c]">{item.actor_name || 'System'}{item.note ? ` — ${item.note}` : ''}</p></div></div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5">
              <div className="flex items-center gap-2"><Building2 size={17} className="text-[#178165]" /><h2 className="m-0 text-[15px] font-semibold text-[#304139]">Responsible department</h2></div>
              <p className="m-0 mt-4 text-[15px] font-semibold text-[#2e4037]">{incident.authority_name || 'Routing pending'}</p>
              {incident.contact_person && <p className="m-0 mt-1 text-[11px] text-[#77847d]">Contact: {incident.contact_person}</p>}
              <div className="mt-4 grid gap-2">
                {incident.contact_phone && <a href={`tel:${incident.contact_phone}`} className="inline-flex items-center gap-2 rounded-xl bg-[#f2f7f4] px-3 py-3 text-[11px] font-medium text-[#41685b]"><Phone size={14} /> {incident.contact_phone}</a>}
                {incident.contact_email && <a href={`mailto:${incident.contact_email}`} className="inline-flex items-center gap-2 rounded-xl bg-[#f2f7f4] px-3 py-3 text-[11px] font-medium text-[#41685b]"><Mail size={14} /> {incident.contact_email}</a>}
              </div>
            </div>

            <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5">
              <div className="flex items-center gap-2"><UserRound size={17} className="text-[#178165]" /><h2 className="m-0 text-[15px] font-semibold text-[#304139]">Citizen report</h2></div>
              <div className="mt-4 grid gap-3 text-[11px]"><InfoRow label="Reported by" value={firstReport?.citizen_name || 'Citizen'} /><InfoRow label="Reported at" value={formatDate(firstReport?.created_at)} /><InfoRow label="Tracking code" value={firstReport?.tracking_code || '—'} /><InfoRow label="Reports merged" value={String(incident.report_count ?? reports.length)} /></div>
            </div>

            {isSuperAdmin && <div className="rounded-[24px] border border-[#dfe6e2] bg-white p-5">
              <div className="flex items-center gap-2"><ShieldAlert size={17} className="text-[#a25b35]" /><h2 className="m-0 text-[15px] font-semibold text-[#304139]">Super Admin controls</h2></div>
              <p className="m-0 mt-2 text-[10.5px] leading-5 text-[#7f8b85]">Use these only for routing correction, escalation or data administration. Super Admin does not approve normal department work.</p>
              <div className="mt-4"><label className="mb-2 block text-[10px] font-medium text-[#5d6b64]">Responsible department</label><div className="flex gap-2"><select value={selectedAuthorityId} onChange={(e) => setSelectedAuthorityId(e.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-[#d9e1dd] bg-white px-3 text-[11px]">{departments.filter((item) => item.is_active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button disabled={saving} onClick={reassign} className="rounded-xl bg-[#eef5f2] px-3 text-[10px] font-semibold text-[#24715c]">Re-route</button></div></div>
              <div className="mt-4"><label className="mb-2 block text-[10px] font-medium text-[#5d6b64]">Priority override</label><div className="flex gap-2"><select value={selectedPriority} onChange={(e)=>setSelectedPriority(e.target.value)} className="h-10 min-w-0 flex-1 rounded-xl border border-[#d9e1dd] bg-white px-3 text-[11px]"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select><button disabled={saving || selectedPriority === incident.priority} onClick={savePriority} className="rounded-xl bg-[#f5f0e7] px-3 text-[10px] font-semibold text-[#8b6533] disabled:opacity-45">Update</button></div></div>
              <form onSubmit={sendMessage} className="mt-4"><label className="mb-2 block text-[10px] font-medium text-[#5d6b64]">Message department</label><textarea value={message} onChange={(e) => setMessage(e.target.value)} rows="3" placeholder="Ask for an update or escalate a delayed incident…" className="w-full rounded-xl border border-[#d9e1dd] p-3 text-[11px] outline-none focus:border-[#4e9b83]" /><button disabled={saving} className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#d1ddd7] px-3 py-2.5 text-[10.5px] font-semibold text-[#4a665b]"><MessageSquareText size={14} /> Record message</button></form>
              <div className="mt-5 border-t border-[#edf0ee] pt-4"><div className="flex flex-wrap gap-2">{incident.status === 'archived' ? <button disabled={saving} onClick={restore} className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0d7] bg-[#f4faf7] px-3 py-2.5 text-[10.5px] font-semibold text-[#32745a]"><RefreshCw size={14}/> Restore</button> : <button disabled={saving} onClick={archive} className="inline-flex items-center gap-2 rounded-xl border border-[#e5d8c7] px-3 py-2.5 text-[10.5px] font-semibold text-[#8a6332]"><Archive size={14} /> Archive</button>}<button disabled={saving} onClick={remove} className="inline-flex items-center gap-2 rounded-xl border border-[#ecd6d2] px-3 py-2.5 text-[10.5px] font-semibold text-[#a45148]"><Trash2 size={14} /> Delete</button></div><p className="m-0 mt-2 text-[9.5px] leading-4 text-[#929b96]">Citizen-linked incidents cannot be permanently deleted; archive them to preserve accountability.</p></div>
            </div>}
          </aside>
        </section>
      </main>
    </div>
  )
}

function InfoRow({ label, value }) {
  return <div className="flex items-start justify-between gap-4 border-b border-[#eef1ef] pb-3 last:border-0 last:pb-0"><span className="text-[#87928c]">{label}</span><span className="max-w-[65%] text-right font-medium text-[#3d4e45]">{value}</span></div>
}

function MediaSection({ title, items = [] }) {
  if (!items.length) return null
  return <div className="mt-5"><p className="m-0 text-[10px] font-semibold uppercase tracking-[.12em] text-[#7f8b84]">{title}</p><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item, index) => {
    const url = fileUrl(item.file_url || item.image_url)
    const type = mediaType(item)
    return <a key={item.id || `${title}-${index}`} href={url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-[16px] border border-[#e1e6e3] bg-[#f7f9f8]">{type === 'video' ? <video src={url} controls className="h-40 w-full bg-black object-cover" /> : <img src={url} alt={item.original_name || title} className="h-40 w-full object-cover" />}<div className="flex items-center gap-2 px-3 py-2.5 text-[10px] text-[#627069]">{type === 'video' ? <Video size={13} /> : <ImageIcon size={13} />}{item.original_name || item.label || `${title} ${index + 1}`}</div></a>
  })}</div></div>
}

export default IncidentDetailsPage
