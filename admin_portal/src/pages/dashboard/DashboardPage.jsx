import {
  AlertTriangle,
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileText,
  RefreshCw,
  ShieldCheck,
  Siren,
  Wrench,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNavigation from '../../components/navigation/TopNavigation'
import { getAuthorityUser } from '../../services/authService'
import { getIncidents } from '../../services/incidentService'
import { getServiceProviders } from '../../services/serviceProviderService'
import { getNotifications, markNotificationRead } from '../../services/notificationService'

const statusClass = {
  open: 'bg-[#eef2f3] text-[#50636d]',
  under_review: 'bg-[#fff4d7] text-[#856200]',
  assigned: 'bg-[#e7f2f6] text-[#24627b]',
  in_progress: 'bg-[#e8f0f8] text-[#315f89]',
  resolution_submitted: 'bg-[#f4ecff] text-[#67508b]',
  resolved: 'bg-[#e4f3e9] text-[#267447]',
  archived: 'bg-[#eceff0] text-[#687980]',
}

function pretty(value) {
  return String(value || 'Unknown').split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

function formatDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

function ageInDays(value) {
  if (!value) return 0
  return (Date.now() - new Date(value).getTime()) / 86400000
}

function DashboardPage() {
  const navigate = useNavigate()
  const user = getAuthorityUser()
  const isProvider = user?.role === 'service_provider'
  const [incidents, setIncidents] = useState([])
  const [stats, setStats] = useState({})
  const [departments, setDepartments] = useState([])
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      setLoading(true)
      setError('')
      const response = await getIncidents()
      setIncidents(response.data ?? [])
      setStats(response.stats ?? {})
      if (isProvider) {
        try {
          const notificationResponse = await getNotifications()
          setFollowUps((notificationResponse.data ?? []).filter((item) => item.notification_type === 'department_message').slice(0, 5))
        } catch (_) { setFollowUps([]) }
      }
      if (!isProvider) {
        try {
          const providerResponse = await getServiceProviders()
          setDepartments(providerResponse.data ?? [])
        } catch (_) { setDepartments([]) }
      }
    } catch (err) {
      setError(err.message || 'Unable to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const needsAttention = useMemo(() => incidents.filter((item) => (
    !['resolved', 'closed', 'archived', 'rejected'].includes(item.status) && ageInDays(item.updated_at || item.created_at) >= 3
  )), [incidents])

  const recent = useMemo(() => incidents.slice(0, 7), [incidents])

  async function openFollowUp(item) {
    try { if (!item.is_read) await markNotificationRead(item.id) } catch (_) {}
    if (item.incident_id) navigate(`/incidents/${item.incident_id}`)
  }

  const cards = isProvider
    ? [
        { label: 'New reports', value: (stats.open ?? 0) + (stats.underReview ?? 0), icon: CircleDot, className: 'from-[#177b66] to-[#0f6965]', path: '/incidents?status=open', hint: 'Review incoming issues' },
        { label: 'Critical', value: stats.critical ?? 0, icon: Siren, className: 'from-[#bd5149] to-[#943b38]', path: '/incidents?priority=critical', hint: 'Highest safety risk' },
        { label: 'In progress', value: stats.inProgress ?? 0, icon: Wrench, className: 'from-[#3d7495] to-[#315d80]', path: '/incidents?status=in_progress', hint: 'Field work underway' },
        { label: 'Overdue', value: stats.overdue ?? needsAttention.length, icon: Clock3, className: 'from-[#d98c38] to-[#ba672d]', path: '/incidents?scope=overdue', hint: 'Needs immediate update' },
        { label: 'Resolved', value: stats.resolved ?? 0, icon: CheckCircle2, className: 'from-[#4b8b5f] to-[#34704a]', path: '/incidents?status=resolved', hint: 'Completed with evidence' },
      ]
    : [
        { label: 'Active incidents', value: stats.active ?? 0, icon: FileText, className: 'from-[#177b66] to-[#0f6965]', path: '/incidents?scope=active', hint: 'Across all departments' },
        { label: 'Critical', value: stats.critical ?? 0, icon: Siren, className: 'from-[#bd5149] to-[#943b38]', path: '/incidents?priority=critical', hint: 'Requires close monitoring' },
        { label: 'In progress', value: stats.inProgress ?? 0, icon: Wrench, className: 'from-[#3d7495] to-[#315d80]', path: '/incidents?status=in_progress', hint: 'Departments working now' },
        { label: 'Overdue', value: stats.overdue ?? needsAttention.length, icon: Clock3, className: 'from-[#d98c38] to-[#ba672d]', path: '/incidents?scope=overdue', hint: 'Escalation candidates' },
        { label: 'Resolved', value: stats.resolved ?? 0, icon: CheckCircle2, className: 'from-[#4b8b5f] to-[#34704a]', path: '/incidents?status=resolved', hint: 'Completed with evidence' },
      ]

  return (
    <div className="min-h-screen bg-[#f5f7f7]">
      <TopNavigation activePage="overview" criticalCount={stats.critical ?? 0} />
      <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#edf6f2] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#177b66]"><ShieldCheck size={13} /> {isProvider ? 'Department operations' : 'System oversight'}</div>
            <h1 className="m-0 text-[31px] font-semibold tracking-[-.04em] text-[#27382f]">{isProvider ? 'Department Workspace' : 'MtaaFix Overview'}</h1>
            <p className="m-0 mt-2 max-w-2xl text-[13px] leading-6 text-[#77837d]">{isProvider ? 'Review the incidents routed to your department, accept responsibility, update field work and resolve them with evidence.' : 'Monitor every department, identify delayed incidents and intervene only when routing or follow-up needs attention.'}</p>
          </div>
          <button type="button" onClick={load} className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dce3df] bg-white px-4 py-3 text-[12px] font-medium text-[#5d6b64]"><RefreshCw size={15} /> Refresh</button>
        </div>

        {error && <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#efd5cf] bg-[#fff5f3] p-3 text-[12px] text-[#9e5046]"><AlertTriangle size={15} />{error}</div>}

        {isProvider && followUps.length > 0 && (
          <section className="mt-5 rounded-[20px] border border-[#ead6b9] bg-[#fffaf1] p-4 shadow-[0_10px_28px_rgba(123,88,33,.05)]">
            <div className="flex items-center gap-2"><BellRing size={16} className="text-[#b77731]" /><h2 className="m-0 text-[13px] font-semibold text-[#644923]">Super Admin follow-up</h2></div>
            <div className="mt-3 grid gap-2">
              {followUps.map((item) => (
                <button key={item.id} type="button" onClick={() => openFollowUp(item)} className="flex items-center justify-between gap-3 rounded-[14px] border border-[#efdfc8] bg-white px-3 py-3 text-left transition hover:border-[#d9b985]">
                  <div className="min-w-0"><p className="m-0 truncate text-[11px] font-semibold text-[#5e4a2e]">{item.title}</p><p className="m-0 mt-1 line-clamp-2 text-[10px] leading-4 text-[#85745d]">{item.message}</p></div>
                  <ArrowRight size={14} className="shrink-0 text-[#b77731]" />
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <button key={card.label} type="button" onClick={() => navigate(card.path)} className={`group overflow-hidden rounded-[22px] bg-gradient-to-br ${card.className} p-5 text-left text-white shadow-[0_15px_40px_rgba(35,60,50,.12)] transition hover:-translate-y-1`}>
                <div className="flex items-start justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-white/14"><Icon size={19} /></div><ArrowRight size={17} className="opacity-60 transition group-hover:translate-x-1 group-hover:opacity-100" /></div>
                <p className="m-0 mt-6 text-[32px] font-semibold tracking-[-.04em]">{loading ? '—' : card.value}</p>
                <p className="m-0 mt-1 text-[13px] font-medium">{card.label}</p>
                <p className="m-0 mt-1 text-[10.5px] text-white/65">{card.hint}</p>
              </button>
            )
          })}
        </section>

        <section className="mt-7 grid gap-6 xl:grid-cols-[1.5fr_.7fr]">
          <div className="rounded-[24px] border border-[#e0e6e2] bg-white shadow-[0_12px_34px_rgba(36,55,47,.04)]">
            <div className="flex items-center justify-between border-b border-[#edf0ee] px-5 py-4"><div><h2 className="m-0 text-[16px] font-semibold text-[#2d3d35]">Recent incidents</h2><p className="m-0 mt-1 text-[11px] text-[#87938c]">{isProvider ? 'Only incidents routed to your department' : 'Latest activity across the platform'}</p></div><button onClick={() => navigate('/incidents')} className="text-[11px] font-semibold text-[#177b66]">View register</button></div>
            <div className="divide-y divide-[#eef1ef]">
              {loading ? <div className="p-8 text-center text-[12px] text-[#7b8881]">Loading incidents…</div> : recent.length === 0 ? <div className="p-8 text-center text-[12px] text-[#7b8881]">No incidents yet.</div> : recent.map((item) => (
                <button key={item.id} onClick={() => navigate(`/incidents/${item.id}`)} className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-[#fafcfb] sm:grid-cols-[1fr_auto_auto] sm:items-center">
                  <div className="min-w-0"><p className="m-0 truncate text-[13px] font-medium text-[#314139]">{item.problem_type_name || item.title}</p><p className="m-0 mt-1 truncate text-[10.5px] text-[#89948e]">{item.authority_name || 'Routing pending'} · {formatDate(item.created_at)}</p></div>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${statusClass[item.status] || 'bg-[#eef2f3] text-[#50636d]'}`}>{pretty(item.status)}</span>
                  <span className={`w-fit rounded-full px-2.5 py-1 text-[9.5px] font-semibold uppercase ${item.priority === 'critical' ? 'bg-[#fde9e7] text-[#a93f38]' : item.priority === 'high' ? 'bg-[#fff0e3] text-[#a35b1b]' : 'bg-[#eef5f2] text-[#497064]'}`}>{item.priority}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5 shadow-[0_12px_34px_rgba(36,55,47,.04)]">
            <h2 className="m-0 text-[16px] font-semibold text-[#2d3d35]">{isProvider ? 'Simple workflow' : 'Super Admin role'}</h2>
            <p className="m-0 mt-2 text-[11px] leading-5 text-[#849089]">{isProvider ? 'The department owns the incident from receipt to resolution.' : 'Super Admin configures, monitors and escalates. It does not approve normal department work.'}</p>
            <div className="mt-5 grid gap-3">
              {(isProvider ? [
                ['1', 'Review', 'Validate the report received by your department.'],
                ['2', 'Accept', 'Confirm that your department owns the response.'],
                ['3', 'Start work', 'Move the issue into active field work.'],
                ['4', 'Resolve', 'Upload completion photo/video and close the incident.'],
              ] : [
                ['1', 'Configure', 'Departments and report types.'],
                ['2', 'Monitor', 'Critical and delayed incidents.'],
                ['3', 'Re-route', 'Correct an incident sent to the wrong department.'],
                ['4', 'Escalate', 'Message or call the responsible department.'],
              ]).map(([number, title, text]) => (
                <div key={number} className="flex gap-3 rounded-[16px] bg-[#f8faf8] p-3.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e6f2ed] text-[11px] font-bold text-[#177b66]">{number}</div><div><p className="m-0 text-[12px] font-semibold text-[#35463d]">{title}</p><p className="m-0 mt-1 text-[10.5px] leading-5 text-[#7c8882]">{text}</p></div></div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default DashboardPage
