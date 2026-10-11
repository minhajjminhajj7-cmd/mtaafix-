import {
  Activity,
  AlertTriangle,
  BarChart3,
  Building2,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  RefreshCw,
  Siren,
  TimerReset,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import TopNavigation from '../../components/navigation/TopNavigation'
import { getAuthorityUser } from '../../services/authService'
import { getAnalyticsSummary } from '../../services/analyticsService'

const priorityTone = {
  critical: 'bg-[#b9463f]',
  high: 'bg-[#d88134]',
  normal: 'bg-[#d5aa32]',
  low: 'bg-[#4b8a72]',
}

function pretty(value) {
  return String(value || '').split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function hoursLabel(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  const hours = Number(value)
  if (hours < 24) return `${hours.toFixed(1)} h`
  return `${(hours / 24).toFixed(1)} days`
}

function AnalyticsPage() {
  const user = getAuthorityUser()
  const isProvider = user?.role === 'service_provider'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    try {
      setLoading(true)
      setError('')
      setData(await getAnalyticsSummary())
    } catch (err) {
      setError(err.message || 'Unable to load analytics.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const overview = data?.overview ?? {}
  const categoryMax = Math.max(1, ...(data?.categories ?? []).map((item) => Number(item.total || 0)))
  const trendMax = Math.max(1, ...(data?.trend ?? []).flatMap((item) => [Number(item.reported || 0), Number(item.resolved || 0)]))
  const prioritiesTotal = Math.max(1, (data?.priorities ?? []).reduce((sum, item) => sum + Number(item.value || 0), 0))

  const resolutionRate = useMemo(() => {
    const total = Number(overview.total || 0)
    return total ? Math.round((Number(overview.resolved || 0) / total) * 100) : 0
  }, [overview])

  return (
    <div className="min-h-screen bg-[#f5f7f7]">
      <TopNavigation activePage="analytics" criticalCount={overview.critical ?? 0} />
      <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-[#edf6f2] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[.12em] text-[#177b66]"><BarChart3 size={13} /> {isProvider ? 'Department intelligence' : 'Operations intelligence'}</div>
            <h1 className="m-0 text-[31px] font-semibold tracking-[-.04em] text-[#27382f]">Analytics & Performance</h1>
            <p className="m-0 mt-2 max-w-3xl text-[13px] leading-6 text-[#77837d]">{isProvider ? 'Understand the workload, risk and response performance for your department.' : 'Monitor incident volume, department performance, hotspots, priorities and resolution speed across MtaaFix.'}</p>
          </div>
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 self-start rounded-xl border border-[#dce3df] bg-white px-4 py-3 text-[12px] font-medium text-[#5d6b64]"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh analytics</button>
        </div>

        {error && <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#efd5cf] bg-[#fff5f3] p-3 text-[12px] text-[#9e5046]"><AlertTriangle size={15} />{error}</div>}

        <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            ['Active', overview.active ?? 0, Activity, 'from-[#177b66] to-[#0f6965]'],
            ['Critical', overview.critical ?? 0, Siren, 'from-[#bd5149] to-[#943b38]'],
            ['In progress', overview.in_progress ?? 0, TimerReset, 'from-[#3d7495] to-[#315d80]'],
            ['Overdue', overview.overdue ?? 0, Clock3, 'from-[#d98c38] to-[#ba672d]'],
            ['Resolved', overview.resolved ?? 0, CheckCircle2, 'from-[#4b8b5f] to-[#34704a]'],
            ['Citizen reports', overview.citizen_reports ?? 0, FileText, 'from-[#596f78] to-[#405761]'],
          ].map(([label, value, Icon, tone]) => (
            <div key={label} className={`rounded-[20px] bg-gradient-to-br ${tone} p-4 text-white shadow-[0_12px_30px_rgba(35,60,50,.1)]`}>
              <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/14"><Icon size={17} /></div>
              <p className="m-0 mt-5 text-[27px] font-semibold tracking-[-.04em]">{loading ? '—' : value}</p>
              <p className="m-0 mt-1 text-[10.5px] font-medium text-white/80">{label}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5 shadow-[0_12px_34px_rgba(36,55,47,.04)]">
            <div className="flex items-start justify-between gap-4"><div><h2 className="m-0 text-[16px] font-semibold text-[#2d3d35]">Incident volume by category</h2><p className="m-0 mt-1 text-[11px] text-[#87938c]">Total and active workload by infrastructure area</p></div><div className="rounded-full bg-[#edf6f2] px-3 py-1.5 text-[10px] font-semibold text-[#177b66]">{resolutionRate}% resolved</div></div>
            <div className="mt-6 grid gap-4">
              {(data?.categories ?? []).map((item) => (
                <div key={item.id}>
                  <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[11.5px] font-medium text-[#435249]">{item.name}</span><span className="text-[10.5px] text-[#77847d]">{item.total} total · {item.active} active</span></div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#edf1ef]"><div className="h-full rounded-full bg-gradient-to-r from-[#178165] to-[#73b79f]" style={{ width: `${Math.max(2, Number(item.total || 0) / categoryMax * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5 shadow-[0_12px_34px_rgba(36,55,47,.04)]">
            <h2 className="m-0 text-[16px] font-semibold text-[#2d3d35]">Priority mix</h2>
            <p className="m-0 mt-1 text-[11px] text-[#87938c]">Risk profile of current incidents</p>
            <div className="mt-6 overflow-hidden rounded-full bg-[#edf1ef]">
              <div className="flex h-5 w-full">
                {(data?.priorities ?? []).map((item) => <div key={item.key} title={`${pretty(item.key)}: ${item.value}`} className={priorityTone[item.key] || 'bg-[#72867d]'} style={{ width: `${Number(item.value || 0) / prioritiesTotal * 100}%` }} />)}
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {(data?.priorities ?? []).map((item) => <div key={item.key} className="rounded-[16px] border border-[#e7ebe8] bg-[#fafcfb] p-3"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${priorityTone[item.key] || 'bg-[#72867d]'}`} /><span className="text-[10px] font-medium text-[#66756d]">{pretty(item.key)}</span></div><p className="m-0 mt-2 text-[20px] font-semibold text-[#304139]">{item.value}</p></div>)}
            </div>
            <div className="mt-5 rounded-[16px] bg-[#f5f8f6] p-4"><p className="m-0 text-[10px] font-semibold uppercase tracking-[.08em] text-[#78857e]">Average resolution time</p><p className="m-0 mt-2 text-[24px] font-semibold text-[#2f4439]">{hoursLabel(overview.avg_resolution_hours)}</p></div>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-[#e0e6e2] bg-white p-5 shadow-[0_12px_34px_rgba(36,55,47,.04)]">
          <div><h2 className="m-0 text-[16px] font-semibold text-[#2d3d35]">14-day response trend</h2><p className="m-0 mt-1 text-[11px] text-[#87938c]">Reported incidents compared with resolved incidents</p></div>
          <div className="mt-6 flex h-[220px] items-end gap-2 overflow-x-auto border-b border-[#dfe5e1] pb-0">
            {(data?.trend ?? []).map((item) => (
              <div key={item.day} className="flex min-w-[46px] flex-1 flex-col items-center justify-end gap-1 self-stretch">
                <div className="flex h-full items-end gap-1">
                  <div title={`Reported ${item.reported}`} className="w-3 rounded-t bg-[#d58c45]" style={{ height: `${Math.max(3, Number(item.reported || 0) / trendMax * 165)}px` }} />
                  <div title={`Resolved ${item.resolved}`} className="w-3 rounded-t bg-[#3f8b69]" style={{ height: `${Math.max(3, Number(item.resolved || 0) / trendMax * 165)}px` }} />
                </div>
                <span className="pb-2 text-[8.5px] text-[#87938c]">{new Date(item.day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-4 text-[10px] text-[#6c7972]"><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#d58c45]" />Reported</span><span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#3f8b69]" />Resolved</span></div>
        </section>

        {!isProvider && (
          <section className="mt-6 rounded-[24px] border border-[#e0e6e2] bg-white shadow-[0_12px_34px_rgba(36,55,47,.04)]">
            <div className="border-b border-[#edf0ee] px-5 py-4"><h2 className="m-0 text-[16px] font-semibold text-[#2d3d35]">Department performance</h2><p className="m-0 mt-1 text-[11px] text-[#87938c]">Use overdue workload to identify where Super Admin follow-up is needed</p></div>
            <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-left"><thead><tr className="border-b border-[#edf0ee] text-[9.5px] uppercase tracking-[.09em] text-[#89958f]"><th className="px-5 py-3">Department</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Critical</th><th className="px-4 py-3">Overdue</th><th className="px-4 py-3">Resolved</th><th className="px-4 py-3">Avg resolution</th></tr></thead><tbody>{(data?.departments ?? []).map((item) => <tr key={item.id} className="border-b border-[#f0f2f1] last:border-0"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef6f2] text-[#177b66]"><Building2 size={16} /></div><div><p className="m-0 text-[12px] font-medium text-[#33443b]">{item.name}</p><p className="m-0 mt-1 text-[9.5px] text-[#8a958f]">{item.is_active ? 'Active department' : 'Inactive'}</p></div></div></td><td className="px-4 py-4 text-[12px] font-medium text-[#53625a]">{item.active}</td><td className="px-4 py-4 text-[12px] font-medium text-[#a94740]">{item.critical}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${Number(item.overdue) > 0 ? 'bg-[#fff0df] text-[#a36025]' : 'bg-[#edf6f1] text-[#3d7758]'}`}>{item.overdue}</span></td><td className="px-4 py-4 text-[12px] font-medium text-[#427458]">{item.resolved}</td><td className="px-4 py-4 text-[11px] text-[#66746c]">{hoursLabel(item.avg_resolution_hours)}</td></tr>)}</tbody></table></div>
          </section>
        )}

        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[24px] border border-[#e0e6e2] bg-white p-5"><div className="flex items-center gap-2"><MapPin size={17} className="text-[#177b66]" /><h2 className="m-0 text-[15px] font-semibold text-[#2d3d35]">Incident hotspots</h2></div><p className="m-0 mt-1 text-[10.5px] text-[#87938c]">Approximate clusters based on reported coordinates</p><div className="mt-4 grid gap-2">{(data?.hotspots ?? []).map((item, index) => <div key={`${item.latitude}-${item.longitude}`} className="flex items-center justify-between rounded-[15px] bg-[#f8faf9] p-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eaf4ef] text-[10px] font-bold text-[#177b66]">{index + 1}</div><div><p className="m-0 text-[11px] font-medium text-[#46564d]">{item.latitude}, {item.longitude}</p><p className="m-0 mt-1 text-[9.5px] text-[#87938c]">Approximate map cluster</p></div></div><div className="text-right"><p className="m-0 text-[15px] font-semibold text-[#34473d]">{item.incident_count}</p><p className="m-0 text-[8.5px] text-[#8b9690]">incidents</p></div></div>)}{(data?.hotspots ?? []).length === 0 && <p className="py-6 text-center text-[11px] text-[#87938c]">No map clusters yet.</p>}</div></div>
          <div className="rounded-[24px] border border-[#e0e6e2] bg-gradient-to-br from-[#183d34] to-[#245b4d] p-5 text-white"><h2 className="m-0 text-[15px] font-semibold">What needs attention?</h2><p className="m-0 mt-2 text-[11px] leading-5 text-white/65">MtaaFix considers an incident overdue when it has not been updated within the response window for its risk level.</p><div className="mt-5 grid grid-cols-2 gap-3">{[['Critical','24 hours'],['High','48 hours'],['Normal','72 hours'],['Low','120 hours']].map(([key, value]) => <div key={key} className="rounded-[16px] border border-white/10 bg-white/7 p-3"><p className="m-0 text-[10px] text-white/60">{key}</p><p className="m-0 mt-1 text-[17px] font-semibold">{value}</p></div>)}</div><div className="mt-5 flex items-center gap-3 rounded-[16px] bg-white/9 p-4"><Clock3 size={19} className="text-[#f0bb75]" /><div><p className="m-0 text-[11px] font-medium">{overview.overdue ?? 0} incident(s) currently overdue</p><p className="m-0 mt-1 text-[9.5px] text-white/60">These should be followed up by the responsible department or Super Admin.</p></div></div></div>
        </section>
      </main>
    </div>
  )
}

export default AnalyticsPage
