import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Edit3, Trash2 } from 'lucide-react'
import { CMS_BASE } from '@/config/cms'
import { getLocalizedValue } from '@/cms/i18n'
import { cmsApi, type CmsService } from '@/services/cmsApi'
import {
  ActionMenu,
  AddButton,
  ConfirmDialog,
  DataTable,
  EmptyState,
  LocalizedInput,
  LocalizedTextarea,
  Modal,
  StatusBadge,
  Toolbar,
  inputClass,
} from './pages/cms-ui'

export default function CmsServicesPage() {
  const [services, setServices] = useState<CmsService[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<CmsService | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', description: '', webAppPath: '' })
  const [formI18n, setFormI18n] = useState({
    nameI18n: {} as Partial<Record<string, string>>,
    descriptionI18n: {} as Partial<Record<string, string>>,
  })
  const [saving, setSaving] = useState(false)

  const [confirm, setConfirm] = useState<{ open: boolean; service?: CmsService }>({
    open: false,
  })

  const load = async () => {
    setLoading(true)
    try {
      const data = await cmsApi.services()
      setServices(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return services
    const term = q.toLowerCase()
    return services.filter(
      (s) =>
        getLocalizedValue(s.nameI18n ?? s.name, 'en').toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term) ||
        getLocalizedValue(s.descriptionI18n ?? s.description, 'en').toLowerCase().includes(term),
    )
  }, [services, q])

  const openAdd = () => {
    setEditingService(null)
    setForm({ name: '', slug: '', description: '', webAppPath: '' })
    setFormI18n({ nameI18n: {}, descriptionI18n: {} })
    setIsModalOpen(true)
  }

  const openEdit = (s: CmsService) => {
    setEditingService(s)
    setForm({
      name: getLocalizedValue(s.nameI18n ?? s.name, 'en'),
      slug: s.slug,
      description: getLocalizedValue(s.descriptionI18n ?? s.description, 'en'),
      webAppPath: s.webAppPath ?? '',
    })
    setFormI18n({
      nameI18n:
        s.nameI18n ??
        (s.name ? { en: s.name } : {}),
      descriptionI18n:
        s.descriptionI18n ??
        (s.description ? { en: s.description } : {}),
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingService(null)
  }

  const save = async () => {
    setSaving(true)
    try {
      if (editingService) {
        await cmsApi.patchService(editingService.id, {
          name: getLocalizedValue(formI18n.nameI18n, 'en'),
          nameI18n: formI18n.nameI18n,
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          description: getLocalizedValue(formI18n.descriptionI18n, 'en'),
          descriptionI18n: formI18n.descriptionI18n,
          webAppPath: form.webAppPath.trim() || null,
        })
        setMsg('Service updated')
      } else {
        await cmsApi.createService({
          name: getLocalizedValue(formI18n.nameI18n, 'en').trim(),
          nameI18n: formI18n.nameI18n,
          slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
          description: getLocalizedValue(formI18n.descriptionI18n, 'en').trim(),
          descriptionI18n: formI18n.descriptionI18n,
          webAppPath: form.webAppPath.trim() || null,
          enabled: true,
        })
        setMsg('Service created')
      }
      closeModal()
      load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const toggle = async (s: CmsService) => {
    await cmsApi.patchService(s.id, { enabled: !s.enabled })
    setMsg(`${s.name} ${s.enabled ? 'hidden' : 'visible'} on website & Telegram`)
    load()
  }

  const move = async (index: number, dir: -1 | 1) => {
    const next = [...services]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    await cmsApi.reorderServices(next.map((s) => s.id))
    setServices(next)
    setMsg('Order updated everywhere')
  }

  const remove = async (s: CmsService) => {
    const res = await cmsApi.deleteService(s.id)
    setMsg(res.message ?? 'Service removed')
    load()
  }

  const isValid = form.name.trim() && form.slug.trim()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-burgundy/60">Operations</p>
        <h1 className="font-display text-3xl uppercase">Services</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Control what customers see on the website and in Telegram. Disable a service to hide it
          from menus, catalogs, and new requests — no code change required.
        </p>
      </div>

      {msg && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {msg}
        </div>
      )}

      <Toolbar search={q} onSearch={setQ} searchPlaceholder="Search services…" action={<AddButton label="Add service" onClick={openAdd} />} />

      <DataTable
        loading={loading}
        rows={filtered}
        columns={[
          {
            key: 'name',
            header: 'Service',
            cell: (s) => (
              <div>
                <Link
                  to={`${CMS_BASE}/services/${s.id}`}
                  className="font-display text-lg uppercase text-burgundy hover:underline"
                >
                  {getLocalizedValue(s.nameI18n ?? s.name, 'en')}
                </Link>
                <p className="text-xs text-gray-500">slug: {s.slug}</p>
                <p className="mt-1 line-clamp-1 max-w-md text-sm text-gray-600">
                  {getLocalizedValue(s.descriptionI18n ?? s.description, 'en')}
                </p>
              </div>
            ),
          },
          {
            key: 'items',
            header: 'Items',
            width: '120px',
            cell: (s) => (
              <p className="text-sm text-gray-600">
                {s._count?.catalogItems ?? 0} packages
                <br />
                <span className="text-xs text-gray-400">{s._count?.requests ?? 0} requests</span>
              </p>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            width: '100px',
            cell: (s) => (
              <StatusBadge variant={s.enabled ? 'success' : 'neutral'}>
                {s.enabled ? 'Visible' : 'Hidden'}
              </StatusBadge>
            ),
          },
          {
            key: 'order',
            header: 'Order',
            width: '90px',
            cell: (_s, i) => (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === filtered.length - 1}
                  className="rounded border px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            ),
          },
        ]}
        action={(s) => (
          <div className="flex items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.enabled}
                onChange={() => toggle(s)}
              />
              Visible
            </label>
            <ActionMenu
              items={[
                {
                  label: 'Edit',
                  icon: Edit3,
                  onClick: () => openEdit(s),
                },
                {
                  label: 'Manage items',
                  onClick: () => {
                    window.location.href = `${CMS_BASE}/services/${s.id}`
                  },
                },
                {
                  label: 'Delete',
                  icon: Trash2,
                  danger: true,
                  onClick: () => setConfirm({ open: true, service: s }),
                },
              ]}
            />
          </div>
        )}
        empty={
          <EmptyState
            title="No services yet"
            description="Add the first service that customers can order on the website and Telegram."
            action={<AddButton label="Add service" onClick={openAdd} />}
          />
        }
      />

      <Modal
        open={isModalOpen}
        onClose={closeModal}
        title={editingService ? 'Edit service' : 'Add service'}
        description={
          editingService
            ? 'Update the service name, slug, and description.'
            : 'Create a new customer-facing service. The slug becomes the URL path.'
        }
        footer={
          <>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!isValid || saving}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingService ? 'Save changes' : 'Create service'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <LocalizedInput
            label="Name"
            value={formI18n.nameI18n}
            onChange={(next) => {
              setFormI18n((prev) => ({ ...prev, nameI18n: next }))
              setForm((f) => ({ ...f, name: getLocalizedValue(next, 'en') }))
            }}
            enPlaceholder="e.g. Catering"
          />
          <label className="block text-sm font-medium text-gray-700">
            Slug
            <input
              className={inputClass()}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="e.g. catering"
            />
            <p className="mt-1 text-xs text-gray-500">Lowercase, no spaces. Used in URLs and API.</p>
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Telegram WebApp path
            <input
              className={inputClass()}
              value={form.webAppPath}
              onChange={(e) => setForm({ ...form, webAppPath: e.target.value })}
              placeholder="e.g. /catering"
            />
            <p className="mt-1 text-xs text-gray-500">The website page that opens after this service is selected in Telegram.</p>
          </label>
          <LocalizedTextarea
            label="Short description"
            value={formI18n.descriptionI18n}
            onChange={(next) => {
              setFormI18n((prev) => ({ ...prev, descriptionI18n: next }))
              setForm((f) => ({ ...f, description: getLocalizedValue(next, 'en') }))
            }}
            rows={3}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.service ? `Delete ${confirm.service.name}?` : 'Delete service?'}
        description={
          confirm.service && confirm.service._count && confirm.service._count.requests > 0
            ? 'This service has existing orders. It will be disabled instead of deleted to keep order history.'
            : 'This will remove the service and all its catalog items. This cannot be undone.'
        }
        confirmLabel={confirm.service && confirm.service._count && confirm.service._count.requests > 0 ? 'Disable' : 'Delete'}
        danger
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.service) remove(confirm.service)
          setConfirm({ open: false })
        }}
      />
    </div>
  )
}
