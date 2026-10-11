import {
  AlertTriangle,
  ArrowRight,
  FileText,
  RefreshCw,
  Plus,
  Search,
  X,
} from 'lucide-react'

import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
  useSearchParams,
} from 'react-router-dom'

import TopNavigation from '../../components/navigation/TopNavigation'
import { createManualIncident, getIncidents } from '../../services/incidentService'
import { getAuthorityUser } from '../../services/authService'
import { getCategoriesAdmin, getProblemTypesAdmin } from '../../services/reportTypeService'


const priorityStyles = {
  critical:
    'bg-[#b93636] text-white',
  high:
    'bg-[#d96b21] text-white',
  normal:
    'bg-[#e6b52c] text-[#3e3210]',
  low:
    'bg-[#EDF7F2] text-[#1F7A63]',
}


const statusStyles = {
  open:
    'bg-[#eef2f3] text-[#50636d]',
  under_review:
    'bg-[#fff4d7] text-[#856200]',
  assigned:
    'bg-[#e7f2f6] text-[#24627b]',
  in_progress:
    'bg-[#e8f0f8] text-[#315f89]',
  resolution_submitted:
    'bg-[#f4ecff] text-[#67508b]',
  resolved:
    'bg-[#e4f3e9] text-[#267447]',
  closed:
    'bg-[#eceff0] text-[#687980]',
}


const allowedPriorities = [
  'critical',
  'high',
  'normal',
  'low',
]


const allowedStatuses = [
  'open',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'archived',
]


function formatStatus(status) {
  if (!status) return 'Unknown'
  if (status === 'open') return 'Reported'
  if (status === 'under_review') return 'Reviewed'
  if (status === 'assigned') return 'Accepted'
  if (status === 'resolution_submitted') return 'In Progress'
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}


function formatDate(date) {
  if (!date) return '—'

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(new Date(date))
}


function IncidentsPage() {
  const navigate = useNavigate()
  const user = getAuthorityUser()
  const [manualOpen, setManualOpen] = useState(false)

  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams()

  const [
    incidents,
    setIncidents,
  ] = useState([])

  const [stats, setStats] =
    useState({})

  const [loading, setLoading] =
    useState(true)

  const [
    refreshing,
    setRefreshing,
  ] = useState(false)

  const [error, setError] =
    useState('')

  const [search, setSearch] =
    useState('')


  const priorityParam =
    searchParams.get('priority')

  const statusParam =
    searchParams.get('status')

  const scopeParam =
    searchParams.get('scope')


  const priority =
    allowedPriorities.includes(
      priorityParam,
    )
      ? priorityParam
      : 'all'


  const status =
    allowedStatuses.includes(
      statusParam,
    )
      ? statusParam
      : 'all'


  async function loadIncidents(
    refresh = false,
  ) {
    try {
      if (refresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }

      setError('')

      const response =
        await getIncidents()

      setIncidents(
        response.data ?? [],
      )

      setStats(
        response.stats ?? {},
      )
    } catch (err) {
      setError(
        err.message ||
          'Unable to load incidents.',
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }


  useEffect(() => {
    loadIncidents()
  }, [])


  function updateFilter(
    key,
    value,
  ) {
    const next =
      new URLSearchParams(
        searchParams,
      )

    if (
      !value ||
      value === 'all'
    ) {
      next.delete(key)
    } else {
      next.set(key, value)
    }

    setSearchParams(next)
  }


  function clearFilters() {
    setSearch('')
    setSearchParams({})
  }


  const filtered = useMemo(() => {
    const query =
      search
        .trim()
        .toLowerCase()

    return incidents.filter(
      (incident) => {
        const searchableText = [
          incident.title,
          incident.problem_type_name,
          incident.category_name,
          incident.authority_name,
          incident.description,
          incident.id,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()


        const matchesSearch =
          !query ||
          searchableText.includes(
            query,
          )


        const matchesPriority =
          priority === 'all' ||
          incident.priority ===
            priority


        const matchesStatus =
          status === 'all' ||
          incident.status === status

        const active = !['resolved', 'closed', 'rejected', 'archived'].includes(incident.status)
        const ageHours = (Date.now() - new Date(incident.updated_at || incident.created_at).getTime()) / 3600000
        const limitHours = incident.priority === 'critical' ? 24 : incident.priority === 'high' ? 48 : incident.priority === 'normal' ? 72 : 120
        const overdue = active && ageHours > limitHours
        const matchesScope = scopeParam === 'active' ? active : scopeParam === 'overdue' ? overdue : true


        return (
          matchesSearch &&
          matchesPriority &&
          matchesStatus &&
          matchesScope
        )
      },
    )
  }, [
    incidents,
    search,
    priority,
    status,
    scopeParam,
  ])


  const filteredTitle =
    scopeParam === 'overdue'
      ? 'Overdue Incidents'
      : scopeParam === 'active'
        ? 'Active Incidents'
        : priority === 'critical'
          ? 'Critical Incidents'
          : status === 'in_progress'
            ? 'Incidents In Progress'
            : status === 'resolved'
              ? 'Resolved Incidents'
              : status === 'under_review'
                ? 'Reviewed Incidents'
                : status === 'assigned'
                  ? 'Accepted Incidents'
                  : status === 'open'
                    ? 'Open Incidents'
                    : status === 'closed'
                      ? 'Closed Incidents'
                      : priority === 'high'
                        ? 'High Priority Incidents'
                        : priority === 'normal'
                          ? 'Normal Priority Incidents'
                          : priority === 'low'
                            ? 'Low Priority Incidents'
                            : 'All Incidents'



  const filtersActive =
    search.trim() !== '' ||
    priority !== 'all' ||
    status !== 'all' ||
    (scopeParam === 'active' || scopeParam === 'overdue')


  function openIncident(id) {
    navigate(
      `/incidents/${id}`,
    )
  }


  return (
    <div className="min-h-screen bg-[#f5f7f7]">
      <TopNavigation
        activePage="incidents"
        criticalCount={
          stats.critical ?? 0
        }
      />


      {/* PAGE HEADER */}
      <section className="border-b border-[#dce4e7] bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

            <div>
              <p className="m-0 text-[12px] font-medium uppercase tracking-[0.12em] text-[#1F7A63]">
                Operations / Incidents
              </p>

              <h1 className="m-0 mt-2 text-[27px] font-medium text-[#26362F]">
                Incident Register
              </h1>

              <p className="m-0 mt-2 text-[13px] text-[#758078]">
                Review and manage
                infrastructure incidents
                reported through MtaaFix.
              </p>
            </div>


            <div className="flex flex-wrap gap-2">
              {user?.role === 'super_admin' && <button type="button" onClick={() => setManualOpen(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-4 py-2.5 text-[12px] font-semibold text-white"><Plus size={14}/> Create incident</button>}
              <button
                type="button"
                onClick={() => loadIncidents(true)}
                disabled={refreshing}
                className="flex w-fit items-center gap-2 rounded-xl border border-[#ced9dd] bg-white px-4 py-2.5 text-[12px] font-medium text-[#425964] transition hover:border-[#1F7A63] hover:text-[#1F7A63] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

          </div>
        </div>
      </section>


      <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">

        {/* STATISTICS */}
        <div className="grid grid-cols-2 border border-[#dce4e7] bg-white md:grid-cols-5">

          <Stat
            label="Total"
            value={
              stats.total ?? 0
            }
          />

          <Stat
            label="Active"
            value={
              stats.active ??
              stats.open ??
              0
            }
          />

          <Stat
            label="Critical"
            value={
              stats.critical ?? 0
            }
            danger
          />

          <Stat
            label="High Priority"
            value={
              stats.high ?? 0
            }
          />

          <Stat
            label="Resolved"
            value={
              stats.resolved ?? 0
            }
          />

        </div>


        {/* EXTRA STATUS SUMMARY */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 bg-white px-4 py-3 text-[12px] font-semibold text-[#758078]">

          <span>
            Open:{' '}
            <strong className="text-[#304139]">
              {stats.open ?? 0}
            </strong>
          </span>

          <span>
            Reviewed:{' '}
            <strong className="text-[#304139]">
              {stats.underReview ??
                0}
            </strong>
          </span>

          <span>
            Accepted:{' '}
            <strong className="text-[#304139]">
              {stats.assigned ??
                0}
            </strong>
          </span>

          <span>
            In Progress:{' '}
            <strong className="text-[#304139]">
              {stats.inProgress ??
                0}
            </strong>
          </span>

          <span>
            Closed:{' '}
            <strong className="text-[#304139]">
              {stats.closed ?? 0}
            </strong>
          </span>

          <span>
            Citizen Reports:{' '}
            <strong className="text-[#304139]">
              {stats.totalReports ??
                0}
            </strong>
          </span>

        </div>


        <section className="mt-7">

          {/* SECTION TITLE */}
          <div className="border-b-2 border-[#26362F] pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div className="flex items-center gap-2">
                <FileText
                  size={17}
                  className="text-[#1F7A63]"
                />

                <div>
                  <h2 className="m-0 text-[15px] font-medium text-[#26362F]">
                    {filteredTitle}
                  </h2>

                  <p className="m-0 mt-1 text-[12px] text-[#829199]">
                    {filtered.length}{' '}
                    matching incident
                    {filtered.length ===
                    1
                      ? ''
                      : 's'}
                  </p>
                </div>
              </div>


              {filtersActive && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="flex w-fit items-center gap-1.5 text-[12px] font-medium text-[#1F7A63] hover:underline"
                >
                  <X size={11} />

                  Clear filters
                </button>
              )}

            </div>
          </div>


          {/* FILTERS */}
          <div className="border border-b-0 border-[#dce4e7] bg-[#eef2f3] p-3">
            <div className="flex flex-col gap-2 lg:flex-row">

              {/* SEARCH */}
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#829199]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search incidents, categories or departments"
                  className="h-10 w-full border border-[#ced9dd] bg-white pl-9 pr-3 text-[12px] outline-none focus:border-[#1F7A63]"
                />
              </div>


              {/* PRIORITY FILTER */}
              <select
                value={priority}
                onChange={(event) =>
                  updateFilter(
                    'priority',
                    event.target
                      .value,
                  )
                }
                className="h-10 border border-[#ced9dd] bg-white px-3 text-[12px] font-semibold text-[#526771] outline-none focus:border-[#1F7A63]"
              >
                <option value="all">
                  All priorities
                </option>

                <option value="critical">
                  Critical
                </option>

                <option value="high">
                  High
                </option>

                <option value="normal">
                  Normal
                </option>

                <option value="low">
                  Low
                </option>
              </select>


              {/* STATUS FILTER */}
              <select
                value={status}
                onChange={(event) =>
                  updateFilter(
                    'status',
                    event.target
                      .value,
                  )
                }
                className="h-10 border border-[#ced9dd] bg-white px-3 text-[12px] font-semibold text-[#526771] outline-none focus:border-[#1F7A63]"
              >
                <option value="all">
                  All statuses
                </option>

                <option value="open">
                  Open
                </option>

                <option value="under_review">
                  Reviewed
                </option>

                <option value="assigned">
                  Accepted
                </option>

                <option value="in_progress">
                  In Progress
                </option>

                <option value="resolved">
                  Resolved
                </option>

                <option value="closed">
                  Closed
                </option>
                <option value="archived">
                  Archived
                </option>
              </select>

            </div>
          </div>


          {/* ERROR */}
          {error && (
            <div className="flex items-center gap-3 border border-[#efcccc] bg-[#fff2f2] p-4">
              <AlertTriangle
                size={17}
                className="text-[#b93636]"
              />

              <p className="m-0 text-[12px] font-semibold text-[#963737]">
                {error}
              </p>
            </div>
          )}


          {/* TABLE */}
          <div className="overflow-x-auto border border-[#dce4e7] bg-white">

            <table className="w-full min-w-[950px] border-collapse">

              <thead>
                <tr className="bg-gradient-to-r from-[#173e34] to-[#1f6655] text-left text-white">

                  <Heading>
                    Incident
                  </Heading>

                  <Heading>
                    Category
                  </Heading>

                  <Heading>
                    Priority
                  </Heading>

                  <Heading>
                    Service Unit
                  </Heading>

                  <Heading>
                    Reports
                  </Heading>

                  <Heading>
                    Status
                  </Heading>

                  <Heading>
                    Reported
                  </Heading>

                  <Heading>
                    Action
                  </Heading>

                </tr>
              </thead>


              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-12 text-center text-[13px] text-[#758078]"
                    >
                      Loading incidents...
                    </td>
                  </tr>

                ) : filtered.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-12 text-center"
                    >
                      <FileText
                        size={25}
                        className="mx-auto text-[#a4b0b5]"
                      />

                      <p className="m-0 mt-3 text-[13px] font-medium text-[#526771]">
                        No incidents
                        found
                      </p>

                      <p className="m-0 mt-1 text-[13px] text-[#839088]">
                        Try changing
                        the search or
                        filters.
                      </p>
                    </td>
                  </tr>

                ) : (
                  filtered.map(
                    (incident) => (
                      <tr
                        key={
                          incident.id
                        }
                        onClick={() =>
                          openIncident(
                            incident.id,
                          )
                        }
                        className="cursor-pointer border-b border-[#e6ebed] transition-colors last:border-b-0 hover:bg-[#f4f8f8]"
                      >

                        {/* INCIDENT */}
                        <Cell>
                          <p className="m-0 max-w-[240px] text-[12px] font-medium text-[#304139]">
                            {incident.problem_type_name ||
                              incident.title ||
                              'Infrastructure Incident'}
                          </p>

                          <p className="m-0 mt-1 font-mono text-[12px] text-[#8a989f]">
                            {incident.id
                              ?.slice(
                                0,
                                8,
                              )
                              .toUpperCase()}
                          </p>
                        </Cell>


                        {/* CATEGORY */}
                        <Cell>
                          {incident.category_name ||
                            '—'}
                        </Cell>


                        {/* PRIORITY */}
                        <Cell>
                          <span
                            className={`inline-block px-2 py-1 text-[12px] font-medium uppercase ${
                              priorityStyles[
                                incident
                                  .priority
                              ] ||
                              priorityStyles.normal
                            }`}
                          >
                            {incident.priority ||
                              'normal'}
                          </span>
                        </Cell>


                        {/* UNIT */}
                        <Cell>
                          {incident.authority_name ||
                            'Pending assignment'}
                        </Cell>


                        {/* REPORT COUNT */}
                        <Cell>
                          <span className="font-medium text-[#304139]">
                            {incident.report_count ??
                              0}
                          </span>
                        </Cell>


                        {/* STATUS */}
                        <Cell>
                          <span
                            className={`inline-block px-2 py-1 text-[12px] font-medium ${
                              statusStyles[
                                incident
                                  .status
                              ] ||
                              statusStyles.open
                            }`}
                          >
                            {formatStatus(
                              incident.status,
                            )}
                          </span>
                        </Cell>


                        {/* DATE */}
                        <Cell>
                          {formatDate(
                            incident.created_at,
                          )}
                        </Cell>


                        {/* OPEN */}
                        <Cell>
                          <button
                            type="button"
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation()

                              openIncident(
                                incident.id,
                              )
                            }}
                            className="inline-flex items-center gap-1.5 border border-[#b8d8d3] bg-[#f3f9f8] px-3 py-2 text-[13px] font-medium text-[#1F7A63] transition hover:border-[#1F7A63] hover:bg-[#EDF7F2]"
                          >
                            Open

                            <ArrowRight
                              size={
                                12
                              }
                            />
                          </button>
                        </Cell>

                      </tr>
                    ),
                  )
                )}
              </tbody>

            </table>
          </div>


          {/* TABLE FOOTER */}
          <div className="border border-t-0 border-[#dce4e7] bg-white px-4 py-3">
            <p className="m-0 text-[13px] text-[#829199]">
              {filtered.length}{' '}
              incident
              {filtered.length === 1
                ? ''
                : 's'}{' '}
              displayed
            </p>
          </div>

        </section>
      </main>
      {manualOpen && <ManualIncidentModal onClose={() => setManualOpen(false)} onCreated={async () => { setManualOpen(false); await loadIncidents(true) }} />}
    </div>
  )
}


function Stat({
  label,
  value,
  danger = false,
}) {
  return (
    <div className="border-b border-r border-[#e5ebed] px-5 py-4 md:border-b-0">

      <p className="m-0 text-[12px] font-medium uppercase tracking-[0.08em] text-[#839088]">
        {label}
      </p>

      <p
        className={`m-0 mt-2 text-[24px] font-medium ${
          danger
            ? 'text-[#b93636]'
            : 'text-[#26362F]'
        }`}
      >
        {value}
      </p>

    </div>
  )
}


function Heading({
  children,
}) {
  return (
    <th className="whitespace-nowrap px-4 py-3 text-[12px] font-medium uppercase tracking-[0.07em]">
      {children}
    </th>
  )
}


function Cell({
  children,
}) {
  return (
    <td className="px-4 py-3.5 text-[13px] text-[#596d77]">
      {children}
    </td>
  )
}



function ManualIncidentModal({ onClose, onCreated }) {
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ categoryId: '', problemTypeId: '', description: '', latitude: '-3.3869', longitude: '36.6830', priority: '' })

  useEffect(() => {
    Promise.all([getCategoriesAdmin(), getProblemTypesAdmin()]).then(([c,t]) => {
      const activeCategories=(c.data ?? []).filter((item)=>item.active)
      const activeTypes=(t.data ?? []).filter((item)=>item.active)
      setCategories(activeCategories); setTypes(activeTypes)
      const first=activeCategories[0]
      const firstType=activeTypes.find((item)=>String(item.category_id)===String(first?.id))
      setForm((current)=>({...current,categoryId:first?String(first.id):'',problemTypeId:firstType?String(firstType.id):''}))
    }).catch((err)=>setError(err.message)).finally(()=>setLoading(false))
  }, [])

  const visibleTypes=types.filter((item)=>String(item.category_id)===String(form.categoryId))
  function changeCategory(value) {
    const next=types.find((item)=>String(item.category_id)===String(value))
    setForm({...form,categoryId:value,problemTypeId:next?String(next.id):''})
  }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await createManualIncident({
        categoryId:Number(form.categoryId),problemTypeId:Number(form.problemTypeId),description:form.description,
        latitude:Number(form.latitude),longitude:Number(form.longitude),...(form.priority?{priority:form.priority}:{})
      })
      await onCreated()
    } catch (err) { setError(err.message || 'Unable to create incident.') } finally { setSaving(false) }
  }

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#15221d]/55 p-4 backdrop-blur-sm"><form onSubmit={submit} className="w-full max-w-2xl rounded-[24px] bg-white p-6 shadow-2xl sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="m-0 text-[22px] font-semibold text-[#293a32]">Create operational incident</h2><p className="m-0 mt-1 text-[11px] leading-5 text-[#7e8a83]">Use this only for issues received through phone, field officers or another offline channel. MtaaFix will route it automatically.</p></div><button type="button" onClick={onClose} className="rounded-full border border-[#e1e6e3] p-2 text-[#6a7770]"><X size={16}/></button></div>{error&&<div className="mt-4 rounded-xl border border-[#efd2cd] bg-[#fff5f3] p-3 text-[11px] text-[#9e4d43]">{error}</div>}{loading?<div className="py-10 text-center text-[12px] text-[#7c8881]">Loading configuration…</div>:<div className="mt-6 grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Category</span><select required value={form.categoryId} onChange={(e)=>changeCategory(e.target.value)} className="h-11 w-full rounded-xl border border-[#d9e0dc] bg-white px-3 text-[12px]">{categories.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Specific problem</span><select required value={form.problemTypeId} onChange={(e)=>setForm({...form,problemTypeId:e.target.value})} className="h-11 w-full rounded-xl border border-[#d9e0dc] bg-white px-3 text-[12px]">{visibleTypes.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="sm:col-span-2"><span className="mb-2 block text-[11px] font-medium text-[#536159]">Description</span><textarea required minLength="5" rows="4" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="w-full rounded-xl border border-[#d9e0dc] p-3 text-[12px]" placeholder="Describe the issue and how it was received…"/></label><label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Latitude</span><input required type="number" step="any" value={form.latitude} onChange={(e)=>setForm({...form,latitude:e.target.value})} className="h-11 w-full rounded-xl border border-[#d9e0dc] px-3 text-[12px]"/></label><label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Longitude</span><input required type="number" step="any" value={form.longitude} onChange={(e)=>setForm({...form,longitude:e.target.value})} className="h-11 w-full rounded-xl border border-[#d9e0dc] px-3 text-[12px]"/></label><label className="sm:col-span-2"><span className="mb-2 block text-[11px] font-medium text-[#536159]">Priority override (optional)</span><select value={form.priority} onChange={(e)=>setForm({...form,priority:e.target.value})} className="h-11 w-full rounded-xl border border-[#d9e0dc] bg-white px-3 text-[12px]"><option value="">Use configured risk priority</option><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label></div>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-[#dce3df] px-4 py-3 text-[12px] font-medium text-[#617067]">Cancel</button><button disabled={saving||loading} className="rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-5 py-3 text-[12px] font-semibold text-white disabled:opacity-60">{saving?'Creating…':'Create & route'}</button></div></form></div>
}

export default IncidentsPage
