import {
  AlertCircle,
  Building2,
  CheckCircle2,
  FileCog,
  Pencil,
  Plus,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import TopNavigation from '../../components/navigation/TopNavigation'
import { getAuthorityUser } from '../../services/authService'
import { getServiceProviders } from '../../services/serviceProviderService'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createProblemType,
  deleteProblemType,
  getCategoriesAdmin,
  getProblemTypesAdmin,
  updateProblemType,
} from '../../services/reportTypeService'

const blankForm = {
  name: '', categoryId: '', authorityId: '', defaultPriority: 'normal',
  description: '', safetyMessage: '', emergencyContactRecommended: false,
}

function ReportTypesPage() {
  const user = getAuthorityUser()
  const [categories, setCategories] = useState([])
  const [types, setTypes] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' })

  async function load() {
    try {
      setLoading(true)
      setError('')
      const [categoryResponse, typeResponse, departmentResponse] = await Promise.all([
        getCategoriesAdmin(), getProblemTypesAdmin(), getServiceProviders(),
      ])
      setCategories(categoryResponse.data ?? [])
      setTypes(typeResponse.data ?? [])
      setDepartments(departmentResponse.data ?? [])
    } catch (err) {
      setError(err.message || 'Unable to load report types.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const visibleTypes = useMemo(() => (
    filter === 'all' ? types : types.filter((item) => String(item.category_id) === filter)
  ), [types, filter])

  function openCategoryCreate() {
    setEditingCategory(null)
    setCategoryForm({ name: '', description: '' })
    setCategoryModalOpen(true)
  }

  function openCategoryEdit(item) {
    setEditingCategory(item)
    setCategoryForm({ name: item.name || '', description: item.description || '' })
    setCategoryModalOpen(true)
  }

  async function saveCategory(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editingCategory) await updateCategory(editingCategory.id, categoryForm)
      else await createCategory(categoryForm)
      setSuccess(editingCategory ? 'Category updated.' : 'Category created.')
      setCategoryModalOpen(false)
      await load()
    } catch (err) {
      setError(err.message || 'Unable to save category.')
    } finally { setSaving(false) }
  }

  async function toggleCategory(item) {
    try {
      await updateCategory(item.id, { active: !item.active })
      setSuccess(item.active ? 'Category deactivated.' : 'Category reactivated.')
      await load()
    } catch (err) { setError(err.message) }
  }

  async function removeCategory(item) {
    if (!window.confirm(`Permanently delete category "${item.name}"? This only works if it has never been used.`)) return
    try {
      await deleteCategory(item.id)
      setSuccess('Category permanently deleted.')
      await load()
    } catch (err) { setError(err.message) }
  }

  function openCreate() {
    setEditing(null)
    setForm({ ...blankForm, categoryId: categories[0]?.id ? String(categories[0].id) : '', authorityId: departments[0]?.id ? String(departments[0].id) : '' })
    setModalOpen(true)
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      name: item.name || '', categoryId: String(item.category_id || ''), authorityId: String(item.authority_id || ''),
      defaultPriority: item.default_priority || 'normal', description: item.description || '',
      safetyMessage: item.safety_message || '', emergencyContactRecommended: Boolean(item.emergency_contact_recommended),
    })
    setModalOpen(true)
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        categoryId: Number(form.categoryId),
        authorityId: form.authorityId ? Number(form.authorityId) : null,
      }
      if (editing) await updateProblemType(editing.id, payload)
      else await createProblemType(payload)
      setSuccess(editing ? 'Problem type updated.' : 'Problem type created.')
      setModalOpen(false)
      await load()
    } catch (err) {
      setError(err.message || 'Unable to save problem type.')
    } finally {
      setSaving(false)
    }
  }

  async function toggle(item) {
    try {
      await updateProblemType(item.id, { active: !item.active })
      setSuccess(item.active ? 'Problem type deactivated.' : 'Problem type reactivated.')
      await load()
    } catch (err) { setError(err.message) }
  }

  async function remove(item) {
    if (!window.confirm(`Permanently delete "${item.name}"? This only works when it has never been used.`)) return
    try {
      await deleteProblemType(item.id)
      setSuccess('Problem type permanently deleted.')
      await load()
    } catch (err) { setError(err.message) }
  }

  if (user?.role !== 'super_admin') {
    return <div className="min-h-screen bg-[#f5f7f7]"><TopNavigation /><div className="mx-auto max-w-3xl px-6 py-16"><p className="rounded-2xl border border-[#efd4cf] bg-[#fff5f3] p-5 text-sm text-[#9a4d43]">Only the Super Admin can manage report types.</p></div></div>
  }

  return (
    <div className="min-h-screen bg-[#f5f7f7]">
      <TopNavigation activePage="report-types" />
      <main className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="m-0 text-[11px] font-semibold uppercase tracking-[.16em] text-[#178165]">System configuration</p>
            <h1 className="m-0 mt-2 text-[30px] font-semibold tracking-[-.035em] text-[#26372f]">Report Types</h1>
            <p className="m-0 mt-2 max-w-2xl text-[13px] leading-6 text-[#748078]">Define what citizens can report and which department automatically receives each problem type.</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} className="inline-flex items-center gap-2 rounded-xl border border-[#dce3df] bg-white px-4 py-3 text-[12px] font-medium text-[#56665e]"><RefreshCw size={15} /> Refresh</button>
            <button type="button" onClick={openCategoryCreate} className="inline-flex items-center gap-2 rounded-xl border border-[#cfe0d7] bg-[#f4faf7] px-4 py-3 text-[12px] font-semibold text-[#176d59]"><Plus size={15} /> Add category</button>
            <button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-4 py-3 text-[12px] font-semibold text-white shadow-[0_10px_26px_rgba(22,129,101,.18)]"><Plus size={15} /> Add problem type</button>
          </div>
        </div>

        {(error || success) && <div className={`mt-5 flex items-center gap-2 rounded-xl border p-3 text-[12px] ${error ? 'border-[#efd2cd] bg-[#fff5f3] text-[#9e4d43]' : 'border-[#cfe6d8] bg-[#f1faf4] text-[#33734e]'}`}>{error ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}{error || success}</div>}

        <section className="mt-6 rounded-[24px] border border-[#e0e6e2] bg-white p-5 shadow-[0_12px_34px_rgba(36,55,47,.05)]">
          <div className="flex items-start justify-between gap-4"><div><h2 className="m-0 text-[15px] font-semibold text-[#2e4037]">Report categories</h2><p className="m-0 mt-1 text-[10.5px] text-[#849089]">Super Admin can create, edit or deactivate the main groups shown to citizens.</p></div><span className="rounded-full bg-[#edf6f2] px-3 py-1.5 text-[10px] font-semibold text-[#177b66]">{categories.filter((c)=>c.active).length} active</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((item) => <div key={item.id} className={`rounded-[18px] border p-4 ${item.active ? 'border-[#e1e7e3] bg-[#fbfcfb]' : 'border-[#eadfd9] bg-[#fbf8f6]'}`}><div className="flex items-start justify-between gap-3"><div><p className="m-0 text-[12.5px] font-semibold text-[#34463c]">{item.name}</p><p className="m-0 mt-1 line-clamp-2 text-[10px] leading-5 text-[#87928c]">{item.description || 'Infrastructure report category'}</p></div><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${item.active ? 'bg-[#e6f3eb] text-[#347553]' : 'bg-[#f3e9e4] text-[#946653]'}`}>{item.active ? 'Active' : 'Inactive'}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>openCategoryEdit(item)} className="inline-flex items-center gap-1.5 rounded-lg border border-[#dce3df] px-2.5 py-2 text-[9.5px] font-medium text-[#5b6b62]"><Pencil size={12}/> Edit</button><button onClick={()=>toggleCategory(item)} className="rounded-lg border border-[#dce3df] px-2.5 py-2 text-[9.5px] font-medium text-[#5b6b62]">{item.active ? 'Deactivate' : 'Reactivate'}</button><button onClick={()=>removeCategory(item)} className="rounded-lg border border-[#ecd8d4] p-2 text-[#a95349]" title="Delete permanently"><Trash2 size={12}/></button></div></div>)}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-[#e0e6e2] bg-white p-5 shadow-[0_12px_34px_rgba(36,55,47,.05)]">
          <div className="mb-5 flex flex-wrap gap-2">
            <button type="button" onClick={() => setFilter('all')} className={`rounded-full px-4 py-2 text-[11px] font-medium ${filter === 'all' ? 'bg-[#1c7762] text-white' : 'bg-[#f2f5f3] text-[#647269]'}`}>All ({types.length})</button>
            {categories.filter((c) => c.active).map((category) => (
              <button key={category.id} type="button" onClick={() => setFilter(String(category.id))} className={`rounded-full px-4 py-2 text-[11px] font-medium ${filter === String(category.id) ? 'bg-[#1c7762] text-white' : 'bg-[#f2f5f3] text-[#647269]'}`}>{category.name}</button>
            ))}
          </div>

          {loading ? <div className="py-14 text-center text-sm text-[#7c8881]">Loading report types…</div> : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead><tr className="border-b border-[#e8ece9] text-[10px] uppercase tracking-[.1em] text-[#87938c]"><th className="px-3 py-3">Problem type</th><th className="px-3 py-3">Category</th><th className="px-3 py-3">Department</th><th className="px-3 py-3">Priority</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {visibleTypes.map((item) => (
                    <tr key={item.id} className="border-b border-[#eef1ef] last:border-0">
                      <td className="px-3 py-4"><div className="flex items-start gap-3"><div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef6f2] text-[#178165]"><FileCog size={17} /></div><div><p className="m-0 text-[13px] font-medium text-[#2c3d34]">{item.name}</p><p className="m-0 mt-1 max-w-[320px] text-[11px] leading-5 text-[#87928c]">{item.description || item.safety_message || 'Citizen report type'}</p></div></div></td>
                      <td className="px-3 py-4 text-[12px] text-[#596960]">{item.category_name}</td>
                      <td className="px-3 py-4"><div className="inline-flex items-center gap-2 text-[12px] text-[#596960]"><Building2 size={14} className="text-[#178165]" />{item.authority_name || 'Not routed'}</div></td>
                      <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase ${item.default_priority === 'critical' ? 'bg-[#fde9e7] text-[#a93f38]' : item.default_priority === 'high' ? 'bg-[#fff0e3] text-[#a35b1b]' : 'bg-[#eef5f2] text-[#497064]'}`}>{item.default_priority}</span></td>
                      <td className="px-3 py-4"><span className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${item.active ? 'text-[#32805a]' : 'text-[#9a6a56]'}`}>{item.active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}{item.active ? 'Active' : 'Inactive'}</span></td>
                      <td className="px-3 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(item)} className="rounded-lg border border-[#dce3df] p-2 text-[#5b6b62]" title="Edit"><Pencil size={14} /></button><button onClick={() => toggle(item)} className="rounded-lg border border-[#dce3df] px-3 py-2 text-[10px] font-medium text-[#5b6b62]">{item.active ? 'Deactivate' : 'Reactivate'}</button><button onClick={() => remove(item)} className="rounded-lg border border-[#edd9d5] p-2 text-[#a95349]" title="Delete permanently"><Trash2 size={14} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleTypes.length === 0 && <div className="py-12 text-center text-[13px] text-[#7c8881]">No problem types in this category.</div>}
            </div>
          )}
        </section>
      </main>

      {categoryModalOpen && (
        <div className="fixed inset-0 z-[72] flex items-center justify-center bg-[#15221d]/55 p-4 backdrop-blur-sm">
          <form onSubmit={saveCategory} className="w-full max-w-lg rounded-[24px] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><h2 className="m-0 text-[21px] font-semibold text-[#293a32]">{editingCategory ? 'Edit category' : 'Add category'}</h2><p className="m-0 mt-1 text-[11px] text-[#7e8a83]">Categories group the specific problem types citizens can choose.</p></div><button type="button" onClick={()=>setCategoryModalOpen(false)} className="rounded-full border border-[#e1e6e3] p-2 text-[#6a7770]"><X size={16}/></button></div>
            <div className="mt-6 grid gap-4"><label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Category name</span><input required value={categoryForm.name} onChange={(e)=>setCategoryForm({...categoryForm,name:e.target.value})} className="h-11 w-full rounded-xl border border-[#d9e0dc] px-3 text-[13px] outline-none focus:border-[#3c9a80]" placeholder="e.g. Roads"/></label><label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Description</span><textarea rows="4" value={categoryForm.description} onChange={(e)=>setCategoryForm({...categoryForm,description:e.target.value})} className="w-full rounded-xl border border-[#d9e0dc] p-3 text-[12px] outline-none focus:border-[#3c9a80]" placeholder="What belongs in this category?"/></label></div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setCategoryModalOpen(false)} className="rounded-xl border border-[#dce3df] px-4 py-3 text-[12px] font-medium text-[#617067]">Cancel</button><button disabled={saving} className="rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-5 py-3 text-[12px] font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editingCategory ? 'Save category' : 'Create category'}</button></div>
          </form>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#15221d]/55 p-4 backdrop-blur-sm">
          <form onSubmit={save} className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><h2 className="m-0 text-[22px] font-semibold text-[#293a32]">{editing ? 'Edit problem type' : 'Add problem type'}</h2><p className="m-0 mt-1 text-[12px] text-[#7e8a83]">Routing is automatic based on the department selected here.</p></div><button type="button" onClick={() => setModalOpen(false)} className="rounded-full border border-[#e1e6e3] p-2 text-[#6a7770]"><X size={16} /></button></div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="mb-2 block text-[11px] font-medium text-[#536159]">Problem type name</span><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 w-full rounded-xl border border-[#d9e0dc] px-3 text-[13px] outline-none focus:border-[#3c9a80]" placeholder="e.g. Fallen Electrical Pole" /></label>
              <label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Category</span><select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="h-11 w-full rounded-xl border border-[#d9e0dc] bg-white px-3 text-[12px]">{categories.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
              <label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Responsible department</span><select value={form.authorityId} onChange={(e) => setForm({ ...form, authorityId: e.target.value })} className="h-11 w-full rounded-xl border border-[#d9e0dc] bg-white px-3 text-[12px]"><option value="">Not routed</option>{departments.filter((d) => d.is_active !== false).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
              <label><span className="mb-2 block text-[11px] font-medium text-[#536159]">Default priority</span><select value={form.defaultPriority} onChange={(e) => setForm({ ...form, defaultPriority: e.target.value })} className="h-11 w-full rounded-xl border border-[#d9e0dc] bg-white px-3 text-[12px]"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="critical">Critical</option></select></label>
              <label className="flex items-end gap-2 rounded-xl border border-[#e4e9e6] bg-[#f8faf8] px-4 py-3"><input type="checkbox" checked={form.emergencyContactRecommended} onChange={(e) => setForm({ ...form, emergencyContactRecommended: e.target.checked })} /><span className="text-[11px] text-[#56655d]">Emergency contact recommended</span></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-[11px] font-medium text-[#536159]">Description</span><textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-[#d9e0dc] p-3 text-[12px] outline-none focus:border-[#3c9a80]" /></label>
              <label className="sm:col-span-2"><span className="mb-2 block text-[11px] font-medium text-[#536159]">Citizen safety message</span><textarea rows="3" value={form.safetyMessage} onChange={(e) => setForm({ ...form, safetyMessage: e.target.value })} className="w-full rounded-xl border border-[#d9e0dc] p-3 text-[12px] outline-none focus:border-[#3c9a80]" /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl border border-[#dce3df] px-4 py-3 text-[12px] font-medium text-[#617067]">Cancel</button><button disabled={saving} className="rounded-xl bg-gradient-to-r from-[#178165] to-[#0f716d] px-5 py-3 text-[12px] font-semibold text-white disabled:opacity-60">{saving ? 'Saving…' : editing ? 'Save changes' : 'Create problem type'}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

export default ReportTypesPage
