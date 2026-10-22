import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CMS_BASE } from '@/config/cms'
import { getLocalizedValue } from '@/cms/i18n'
import { cn } from '@/lib/utils'
import { cmsApi, type CmsCatalogItem, type CmsService } from '@/services/cmsApi'
import {
  AgelgilEditor,
  CateringPackageEditor,
  CateringOptionsEditor,
  FestivalEditor,
  ProductEditor,
} from './pages/editors'
import {
  ActionMenu,
  ConfirmDialog,
  FormField,
  LocalizedInput,
  LocalizedTextarea,
  StatusBadge,
  StickySaveBar,
  ViewSiteLink,
  inputClass,
} from './pages/cms-ui'

type ServiceDetail = CmsService & { catalogItems: CmsCatalogItem[] }

/**
 * Per-service management: description, visibility, packages/products.
 * Same data feeds website + future Telegram bot.
 */
export default function CmsServiceDetailPage() {
  const { id } = useParams()
  const [service, setService] = useState<ServiceDetail | null>(null)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [draftI18n, setDraftI18n] = useState({
    nameI18n: {} as Partial<Record<string, string>>,
    descriptionI18n: {} as Partial<Record<string, string>>,
  })
  const [draft, setDraft] = useState({
    name: '',
    description: '',
    image: '',
    webAppPath: '',
  })
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = () => {
    if (!id) return
    cmsApi.service(id).then((s) => {
      setService(s)
      setDraft({
        name: getLocalizedValue(s.nameI18n ?? s.name, 'en'),
        description: getLocalizedValue(s.descriptionI18n ?? s.description, 'en'),
        image: s.image ?? '',
        webAppPath: s.webAppPath ?? '',
      })
      setDraftI18n({
        nameI18n: s.nameI18n ?? (s.name ? { en: s.name } : {}),
        descriptionI18n:
          s.descriptionI18n ?? (s.description ? { en: s.description } : {}),
      })
      setDirty(false)
    })
  }

  useEffect(load, [id])

  if (!service) return <p className="text-gray-500">Loading service…</p>

  const saveDetails = async () => {
    setSaving(true)
    try {
      await cmsApi.patchService(service.id, {
        name: getLocalizedValue(draftI18n.nameI18n, 'en'),
        nameI18n: draftI18n.nameI18n,
        description: getLocalizedValue(draftI18n.descriptionI18n, 'en'),
        descriptionI18n: draftI18n.descriptionI18n,
        image: draft.image || null,
        webAppPath: draft.webAppPath.trim() || null,
      })
      setMsg('Service details saved — website & Telegram updated')
      load()
    } finally {
      setSaving(false)
    }
  }

  const toggle = async () => {
    await cmsApi.patchService(service.id, { enabled: !service.enabled })
    setMsg(
      service.enabled
        ? 'Disabled — hidden on website and Telegram'
        : 'Enabled — visible on website and Telegram',
    )
    load()
  }

  const remove = async () => {
    const res = await cmsApi.deleteService(service.id)
    setMsg(res.message ?? 'Service removed')
    window.location.href = `${CMS_BASE}/services`
  }

  const items = service.catalogItems ?? []

  return (
    <div className="space-y-6">
      <div>
        <Link to={`${CMS_BASE}/services`} className="text-sm text-burgundy">
          ← All services
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl uppercase">
            {getLocalizedValue(service.nameI18n ?? service.name, 'en')}
          </h1>
          <StatusBadge variant={service.enabled ? 'success' : 'neutral'}>
            {service.enabled ? 'Visible' : 'Hidden'}
          </StatusBadge>
        </div>
        <p className="text-sm text-gray-500">
          slug: <code>{service.slug}</code> — packages below power the website and Telegram for this
          service only.
        </p>
        {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4 rounded-2xl border border-burgundy/10 bg-white p-5">
          <h2 className="font-display text-lg uppercase">Service details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <LocalizedInput
              label="Name"
              value={draftI18n.nameI18n}
              onChange={(next) => {
                setDraftI18n((prev) => ({ ...prev, nameI18n: next }))
                setDraft((d) => ({ ...d, name: getLocalizedValue(next, 'en') }))
                setDirty(true)
              }}
            />
            <FormField label="Image path or URL">
              <input
                className={inputClass()}
                value={draft.image}
                onChange={(e) => {
                  setDraft({ ...draft, image: e.target.value })
                  setDirty(true)
                }}
              />
            </FormField>
            <FormField label="Telegram WebApp path">
              <input
                className={inputClass()}
                value={draft.webAppPath}
                onChange={(e) => {
                  setDraft({ ...draft, webAppPath: e.target.value })
                  setDirty(true)
                }}
                placeholder="/catering"
              />
            </FormField>
            <LocalizedTextarea
              label="Description"
              value={draftI18n.descriptionI18n}
              className="sm:col-span-2"
              rows={3}
              onChange={(next) => {
                setDraftI18n((prev) => ({ ...prev, descriptionI18n: next }))
                setDraft((d) => ({ ...d, description: getLocalizedValue(next, 'en') }))
                setDirty(true)
              }}
            />
          </div>
          <StickySaveBar
            label="Save details"
            dirty={dirty}
            saving={saving}
            onSave={saveDetails}
            onCancel={() => {
              setDraft({
                name: getLocalizedValue(service.nameI18n ?? service.name, 'en'),
                description: getLocalizedValue(
                  service.descriptionI18n ?? service.description,
                  'en',
                ),
                image: service.image ?? '',
                webAppPath: service.webAppPath ?? '',
              })
              setDirty(false)
            }}
          />
        </div>

        <div className="space-y-4 rounded-2xl border border-burgundy/10 bg-white p-5">
          <h2 className="font-display text-lg uppercase">Actions</h2>
          <div className="space-y-3">
            <button
              type="button"
              onClick={toggle}
              className={cn(
                'w-full rounded-full px-4 py-2.5 text-sm font-medium',
                service.enabled
                  ? 'border border-burgundy text-burgundy hover:bg-burgundy/5'
                  : 'bg-green-600 text-white hover:bg-green-700',
              )}
            >
              {service.enabled ? 'Hide from website' : 'Show on website'}
            </button>
            <ActionMenu
              items={[
                {
                  label: 'View on website',
                  onClick: () => {
                    window.open(`/${service.slug}`, '_blank')
                  },
                },
                {
                  label: 'Delete service',
                  danger: true,
                  onClick: () => setConfirmDelete(true),
                },
              ]}
            />
            <ViewSiteLink path={`/${service.slug}`} />
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-display text-lg uppercase">Packages & products</h2>
        <p className="text-sm text-gray-500">
          Create, edit, enable, or disable items. Unavailable items are hidden from customers.
        </p>

        {service.slug === 'catering' && (
          <>
            <CateringOptionsEditor items={items} serviceId={service.id} onChanged={load} />
            <CateringPackageEditor items={items} serviceId={service.id} onChanged={load} />
          </>
        )}
        {service.slug === 'festival' && (
          <FestivalEditor items={items} serviceId={service.id} onChanged={load} />
        )}
        {service.slug === 'agelgil' && (
          <AgelgilEditor
            config={items.find((i) => i.slug === 'pricing' || i.kind === 'CONFIG')}
            onChanged={load}
          />
        )}
        {(service.slug === 'baltina' || service.slug === 'drinks') && (
          <ProductEditor
            items={items.filter((i) => i.kind === 'PRODUCT')}
            serviceId={service.id}
            onChanged={load}
          />
        )}
        {!['catering', 'festival', 'agelgil', 'baltina', 'drinks'].includes(service.slug) && (
          <ProductEditor
            items={items}
            serviceId={service.id}
            kind="PACKAGE"
            onChanged={load}
          />
        )}
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${service.name}?`}
        description={
          service._count?.requests && service._count.requests > 0
            ? 'This service has existing orders. It will be disabled instead of deleted.'
            : 'This will remove the service and all its catalog items. This cannot be undone.'
        }
        confirmLabel={service._count?.requests && service._count.requests > 0 ? 'Disable' : 'Delete'}
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          remove()
          setConfirmDelete(false)
        }}
      />
    </div>
  )
}
