import {
  Building2,
  Mail,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserRound,
  X,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import TopNavigation from '../../components/navigation/TopNavigation'

import {
  createServiceProvider,
  getServiceProviders,
  saveServiceProviderAccount,
  updateServiceProvider,
  updateServiceProviderStatus,
} from '../../services/serviceProviderService'

function ServiceProvidersPage() {
  const [providers, setProviders] =
    useState([])

  const [selected, setSelected] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [message, setMessage] =
    useState('')

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    authorityType: 'Municipal Department',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  })

  const [providerForm, setProviderForm] =
    useState({
      name: '',
      authorityType: '',
      contactPerson: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    })

  const [accountForm, setAccountForm] =
    useState({
      fullName: '',
      email: '',
      phone: '',
      password: '',
    })

  async function loadProviders() {
    try {
      setLoading(true)
      setError('')

      const response =
        await getServiceProviders()

      setProviders(
        response.data || [],
      )

      if (selected) {
        const refreshed =
          response.data?.find(
            (item) =>
              item.id === selected.id,
          )

        if (refreshed) {
          selectProvider(refreshed)
        }
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProviders()
  }, [])

  function selectProvider(provider) {
    setSelected(provider)

    setProviderForm({
      name: provider.name || '',
      authorityType: provider.authority_type || '',
      contactPerson:
        provider.contact_person || '',
      contactEmail:
        provider.contact_email || '',
      contactPhone:
        provider.contact_phone || '',
      address:
        provider.address || '',
    })

    const account =
      provider.accounts?.[0]

    setAccountForm({
      fullName:
        account?.fullName || '',
      email:
        account?.email || '',
      phone:
        account?.phone || '',
      password: '',
    })

    setMessage('')
    setError('')
  }

  async function saveProviderDetails() {
    if (!selected) return

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await updateServiceProvider(
        selected.id,
        providerForm,
      )

      setMessage(
        'Department details updated.',
      )

      await loadProviders()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function saveAccount() {
    if (!selected) return

    try {
      setSaving(true)
      setError('')
      setMessage('')

      await saveServiceProviderAccount(
        selected.id,
        accountForm,
      )

      setMessage(
        'Department login account saved successfully.',
      )

      setAccountForm(
        (current) => ({
          ...current,
          password: '',
        }),
      )

      await loadProviders()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function createDepartment(event) {
    event.preventDefault()
    try {
      setSaving(true)
      setError('')
      setMessage('')
      const response = await createServiceProvider(createForm)
      setCreateOpen(false)
      setCreateForm({ name: '', authorityType: 'Municipal Department', contactPerson: '', contactEmail: '', contactPhone: '', address: '' })
      setMessage('Department created. You can now create its portal login and assign report types to it.')
      const refreshed = await getServiceProviders()
      setProviders(refreshed.data || [])
      const created = refreshed.data?.find((item) => item.id === response.data?.id)
      if (created) selectProvider(created)
    } catch (err) {
      setError(err.message || 'Unable to create department.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(provider) {
    try {
      setSaving(true)
      setError('')
      setMessage('')

      await updateServiceProviderStatus(
        provider.id,
        !provider.is_active,
      )

      setMessage(
        provider.is_active
          ? 'Department deactivated.'
          : 'Department activated.',
      )

      await loadProviders()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7f8]">
      <TopNavigation
        activePage="administration"
      />

      <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-[#07877a]">
              Administration
            </p>

            <h1 className="m-0 text-3xl font-semibold tracking-[-0.03em] text-[#26362F]">
              Departments
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667780]">
              Manage the organizations and
              operational units responsible for
              handling infrastructure incidents.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,129,101,.16)]">
              <Plus size={16} /> Add department
            </button>
            <button
              type="button"
              onClick={loadProviders}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d8e0e3] bg-white px-4 py-2.5 text-sm font-medium text-[#263d4b] hover:bg-[#FAF7F1]"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {message}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="overflow-hidden rounded-lg border border-[#dfe6e8] bg-white">
            <div className="border-b border-[#e3e8ea] px-5 py-4">
              <h2 className="m-0 text-base font-semibold text-[#26362F]">
                Registered Departments
              </h2>

              <p className="mt-1 text-xs text-[#758078]">
                {providers.length} operational
                units
              </p>
            </div>

            {loading ? (
              <div className="p-8 text-sm text-[#758078]">
                Loading departments...
              </div>
            ) : (
              <div className="divide-y divide-[#e7ecee]">
                {providers.map(
                  (provider) => (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() =>
                        selectProvider(
                          provider,
                        )
                      }
                      className={`w-full px-5 py-5 text-left transition ${
                        selected?.id ===
                        provider.id
                          ? 'bg-[#eef7f5]'
                          : 'bg-white hover:bg-[#f8fafb]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#e8f3f1] text-[#1F7A63]">
                            <Building2
                              size={20}
                            />
                          </div>

                          <div>
                            <h3 className="m-0 text-sm font-semibold text-[#172f3e]">
                              {provider.name}
                            </h3>

                            <p className="mt-1 text-xs text-[#758078]">
                              {provider.authority_type ||
                                'Department'}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              {provider.categories?.map(
                                (
                                  category,
                                ) => (
                                  <span
                                    key={
                                      category.id
                                    }
                                    className="rounded-full bg-[#edf1f3] px-2.5 py-1 text-[12px] font-medium text-[#52636c]"
                                  >
                                    {
                                      category.name
                                    }
                                  </span>
                                ),
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
                            provider.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {provider.is_active
                            ? 'ACTIVE'
                            : 'INACTIVE'}
                        </span>
                      </div>
                    </button>
                  ),
                )}
              </div>
            )}
          </section>

          <section>
            {!selected ? (
              <div className="rounded-lg border border-[#dfe6e8] bg-white p-8 text-center">
                <Building2
                  size={32}
                  className="mx-auto text-[#8ca0a9]"
                />

                <h2 className="mt-4 text-lg font-semibold text-[#26362F]">
                  Select a department
                </h2>

                <p className="mt-2 text-sm text-[#758078]">
                  Choose an organization to
                  manage its contact details and
                  portal login.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-lg border border-[#dfe6e8] bg-white p-5">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="m-0 text-lg font-semibold text-[#26362F]">
                        {selected.name}
                      </h2>

                      <p className="mt-1 text-xs text-[#758078]">
                        {
                          selected.authority_type
                        }
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={() =>
                        toggleStatus(
                          selected,
                        )
                      }
                      className="rounded-md border border-[#dbe3e6] px-3 py-2 text-xs font-medium text-[#41545e] disabled:opacity-50"
                    >
                      {selected.is_active
                        ? 'Deactivate'
                        : 'Activate'}
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-medium text-[#41545e]">
                      Department Name
                      <input value={providerForm.name} onChange={(event) => setProviderForm((current) => ({ ...current, name: event.target.value }))} className="mt-2 w-full rounded-md border border-[#d9e2e5] px-3 py-2.5 text-sm outline-none focus:border-[#07877a]" />
                    </label>
                    <label className="text-xs font-medium text-[#41545e]">
                      Department Type
                      <input value={providerForm.authorityType} onChange={(event) => setProviderForm((current) => ({ ...current, authorityType: event.target.value }))} className="mt-2 w-full rounded-md border border-[#d9e2e5] px-3 py-2.5 text-sm outline-none focus:border-[#07877a]" placeholder="e.g. Municipal Department" />
                    </label>
                    <label className="text-xs font-medium text-[#41545e]">
                      Contact Person
                      <div className="relative mt-2">
                        <UserRound
                          size={16}
                          className="absolute left-3 top-3 text-[#8ca0a9]"
                        />

                        <input
                          value={
                            providerForm.contactPerson
                          }
                          onChange={(
                            event,
                          ) =>
                            setProviderForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                contactPerson:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          className="w-full rounded-md border border-[#d9e2e5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#07877a]"
                        />
                      </div>
                    </label>

                    <label className="text-xs font-medium text-[#41545e]">
                      Phone
                      <div className="relative mt-2">
                        <Phone
                          size={16}
                          className="absolute left-3 top-3 text-[#8ca0a9]"
                        />

                        <input
                          value={
                            providerForm.contactPhone
                          }
                          onChange={(
                            event,
                          ) =>
                            setProviderForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                contactPhone:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          className="w-full rounded-md border border-[#d9e2e5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#07877a]"
                        />
                      </div>
                    </label>

                    <label className="text-xs font-medium text-[#41545e] md:col-span-2">
                      Email
                      <div className="relative mt-2">
                        <Mail
                          size={16}
                          className="absolute left-3 top-3 text-[#8ca0a9]"
                        />

                        <input
                          type="email"
                          value={
                            providerForm.contactEmail
                          }
                          onChange={(
                            event,
                          ) =>
                            setProviderForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                contactEmail:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          className="w-full rounded-md border border-[#d9e2e5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#07877a]"
                        />
                      </div>
                    </label>

                    <label className="text-xs font-medium text-[#41545e] md:col-span-2">
                      Address
                      <div className="relative mt-2">
                        <MapPin
                          size={16}
                          className="absolute left-3 top-3 text-[#8ca0a9]"
                        />

                        <input
                          value={
                            providerForm.address
                          }
                          onChange={(
                            event,
                          ) =>
                            setProviderForm(
                              (
                                current,
                              ) => ({
                                ...current,
                                address:
                                  event
                                    .target
                                    .value,
                              }),
                            )
                          }
                          className="w-full rounded-md border border-[#d9e2e5] py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#07877a]"
                        />
                      </div>
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={
                      saveProviderDetails
                    }
                    className="mt-5 rounded-md bg-[#26362F] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Save Department Details
                  </button>
                </div>

                <div className="rounded-lg border border-[#dfe6e8] bg-white p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e8f3f1] text-[#1F7A63]">
                      <ShieldCheck
                        size={19}
                      />
                    </div>

                    <div>
                      <h2 className="m-0 text-base font-semibold text-[#26362F]">
                        Portal Login
                      </h2>

                      <p className="mt-1 text-xs text-[#758078]">
                        Account used by this
                        department.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-xs font-medium text-[#41545e]">
                      Account Name
                      <input
                        value={
                          accountForm.fullName
                        }
                        onChange={(
                          event,
                        ) =>
                          setAccountForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              fullName:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        className="mt-2 w-full rounded-md border border-[#d9e2e5] px-3 py-2.5 text-sm outline-none focus:border-[#07877a]"
                      />
                    </label>

                    <label className="text-xs font-medium text-[#41545e]">
                      Phone
                      <input
                        value={
                          accountForm.phone
                        }
                        onChange={(
                          event,
                        ) =>
                          setAccountForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              phone:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        className="mt-2 w-full rounded-md border border-[#d9e2e5] px-3 py-2.5 text-sm outline-none focus:border-[#07877a]"
                      />
                    </label>

                    <label className="text-xs font-medium text-[#41545e]">
                      Login Email
                      <input
                        type="email"
                        value={
                          accountForm.email
                        }
                        onChange={(
                          event,
                        ) =>
                          setAccountForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              email:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        className="mt-2 w-full rounded-md border border-[#d9e2e5] px-3 py-2.5 text-sm outline-none focus:border-[#07877a]"
                      />
                    </label>

                    <label className="text-xs font-medium text-[#41545e]">
                      {selected.accounts?.length
                        ? 'New Password (optional)'
                        : 'Temporary Password'}

                      <input
                        type="password"
                        value={
                          accountForm.password
                        }
                        onChange={(
                          event,
                        ) =>
                          setAccountForm(
                            (
                              current,
                            ) => ({
                              ...current,
                              password:
                                event
                                  .target
                                  .value,
                            }),
                          )
                        }
                        placeholder={
                          selected.accounts?.length
                            ? 'Leave blank to keep current password'
                            : 'Minimum 6 characters'
                        }
                        className="mt-2 w-full rounded-md border border-[#d9e2e5] px-3 py-2.5 text-sm outline-none focus:border-[#07877a]"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveAccount}
                    className="mt-5 rounded-md bg-[#07877a] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    {selected.accounts?.length
                      ? 'Update Login Account'
                      : 'Create Login Account'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {createOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#15221d]/55 p-4 backdrop-blur-sm">
          <form onSubmit={createDepartment} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="m-0 text-[22px] font-semibold text-[#293a32]">Add department</h2><p className="m-0 mt-1 text-[11px] leading-5 text-[#7e8a83]">Create the operational department first, then create its login account and connect report types to it.</p></div>
              <button type="button" onClick={() => setCreateOpen(false)} className="rounded-full border border-[#e1e6e3] p-2 text-[#6a7770]"><X size={16} /></button>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2 text-xs font-medium text-[#41545e]">Department Name<input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d9e2e5] px-3 text-sm outline-none focus:border-[#07877a]" placeholder="e.g. Roads Department" /></label>
              <label className="sm:col-span-2 text-xs font-medium text-[#41545e]">Department Type<input value={createForm.authorityType} onChange={(e) => setCreateForm({ ...createForm, authorityType: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d9e2e5] px-3 text-sm outline-none focus:border-[#07877a]" /></label>
              <label className="text-xs font-medium text-[#41545e]">Contact Person<input value={createForm.contactPerson} onChange={(e) => setCreateForm({ ...createForm, contactPerson: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d9e2e5] px-3 text-sm outline-none focus:border-[#07877a]" /></label>
              <label className="text-xs font-medium text-[#41545e]">Phone<input value={createForm.contactPhone} onChange={(e) => setCreateForm({ ...createForm, contactPhone: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d9e2e5] px-3 text-sm outline-none focus:border-[#07877a]" /></label>
              <label className="sm:col-span-2 text-xs font-medium text-[#41545e]">Email<input type="email" value={createForm.contactEmail} onChange={(e) => setCreateForm({ ...createForm, contactEmail: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d9e2e5] px-3 text-sm outline-none focus:border-[#07877a]" /></label>
              <label className="sm:col-span-2 text-xs font-medium text-[#41545e]">Address<input value={createForm.address} onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })} className="mt-2 h-11 w-full rounded-xl border border-[#d9e2e5] px-3 text-sm outline-none focus:border-[#07877a]" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setCreateOpen(false)} className="rounded-xl border border-[#dce3df] px-4 py-3 text-[12px] font-medium text-[#617067]">Cancel</button><button disabled={saving} className="rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-5 py-3 text-[12px] font-semibold text-white disabled:opacity-60">{saving ? 'Creating…' : 'Create department'}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ServiceProvidersPage
