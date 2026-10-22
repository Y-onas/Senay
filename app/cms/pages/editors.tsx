import { useMemo, useState } from 'react'
import { getLocalizedValue } from '@/cms/i18n'
import { cmsApi, type CmsCatalogItem } from '@/services/cmsApi'
import {
  ActionMenu,
  AddButton,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FormField,
  ImageField,
  LocalizedInput,
  LocalizedTextarea,
  Modal,
  StatusBadge,
  Toolbar,
  inputClass,
  slugify,
} from './cms-ui'

const BEVERAGE_KEYS = [
  'food-only',
  'tela',
  'tej',
  'tela-tej',
  'berz-tej',
] as const

const UNITS = ['kg', 'L', 'piece', 'pack'] as const

function useItemModal({ serviceId, kind, onChanged }: { serviceId: string; kind?: 'PRODUCT' | 'PACKAGE' | 'CONFIG'; onChanged: () => void }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CmsCatalogItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Record<string, unknown>>({})

  const openAdd = (defaults: Record<string, unknown> = {}) => {
    setEditing(null)
    setForm(defaults)
    setOpen(true)
  }

  const openEdit = (item: CmsCatalogItem, defaults: Record<string, unknown> = {}) => {
    setEditing(item)
    setForm({ ...defaults, ...item })
    setOpen(true)
  }

  const close = () => {
    setOpen(false)
    setEditing(null)
  }

  const save = async (payload: Record<string, unknown>) => {
    setSaving(true)
    try {
      if (editing) {
        await cmsApi.patchCatalog(editing.id, payload)
      } else {
        await cmsApi.createCatalog({
          serviceId,
          kind,
          ...payload,
          available: true,
        })
      }
      onChanged()
      close()
    } finally {
      setSaving(false)
    }
  }

  return { open, editing, saving, form, setForm, openAdd, openEdit, close, save }
}

/** Product grid editor for Baltina / Drinks / generic */
export function ProductEditor({
  items,
  serviceId,
  kind = 'PRODUCT',
  onChanged,
}: {
  items: CmsCatalogItem[]
  serviceId: string
  kind?: 'PRODUCT' | 'PACKAGE'
  onChanged: () => void
}) {
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; item?: CmsCatalogItem }>({ open: false })
  const modal = useItemModal({ serviceId, kind, onChanged })

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const term = q.toLowerCase()
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        i.slug.toLowerCase().includes(term) ||
        i.description.toLowerCase().includes(term),
    )
  }, [items, q])

  const toggle = async (item: CmsCatalogItem) => {
    await cmsApi.patchCatalog(item.id, { available: !item.available })
    onChanged()
  }

  const remove = async (item: CmsCatalogItem) => {
    await cmsApi.deleteCatalog(item.id)
    onChanged()
  }

  return (
    <div className="space-y-4">
      <Toolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search products…"
        action={
          <AddButton
            label={`Add ${kind === 'PACKAGE' ? 'package' : 'product'}`}
            onClick={() =>
              modal.openAdd({
                name: '',
                slug: '',
                price: 0,
                description: '',
                image: '',
                metadata: { unit: 'kg', category: 'all', minQty: 0.5, step: 0.5 },
              })
            }
          />
        }
      />

      <DataTable
        rows={filtered}
        columns={[
          {
            key: 'name',
            header: 'Product',
            cell: (item) => (
              <div className="flex items-center gap-3">
                {item.image ? (
                  <img
                    src={item.image}
                    alt=""
                    className="h-10 w-10 rounded-lg border object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-gray-100 text-xs text-gray-400">
                    No img
                  </div>
                )}
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {item.slug} · {String(item.metadata?.unit ?? 'unit')}
                  </p>
                </div>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Price',
            width: '120px',
            cell: (item) => <p className="font-medium">{item.price ?? 0} ETB</p>,
          },
          {
            key: 'status',
            header: 'Status',
            width: '110px',
            cell: (item) => (
              <StatusBadge variant={item.available ? 'success' : 'neutral'}>
                {item.available ? 'Available' : 'Hidden'}
              </StatusBadge>
            ),
          },
        ]}
        action={(item) => (
          <div className="flex items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.available}
                onChange={() => toggle(item)}
              />
              Available
            </label>
            <ActionMenu
              items={[
                { label: 'Edit', onClick: () => modal.openEdit(item) },
                {
                  label: 'Delete',
                  danger: true,
                  onClick: () => setConfirm({ open: true, item }),
                },
              ]}
            />
          </div>
        )}
        empty={
          <EmptyState
            title={`No ${kind === 'PACKAGE' ? 'packages' : 'products'} yet`}
            description="Add items customers can order."
            action={
              <AddButton
                label={`Add ${kind === 'PACKAGE' ? 'package' : 'product'}`}
                onClick={() =>
                  modal.openAdd({
                    name: '',
                    slug: '',
                    price: 0,
                    description: '',
                    image: '',
                    metadata: { unit: 'kg', category: 'all', minQty: 0.5, step: 0.5 },
                  })
                }
              />
            }
          />
        }
      />

      <ProductModal
        open={modal.open}
        editing={modal.editing}
        form={modal.form}
        setForm={modal.setForm}
        saving={modal.saving}
        onClose={modal.close}
        onSave={modal.save}
        kind={kind}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.item ? `Delete ${confirm.item.name}?` : 'Delete item?'}
        description="This cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.item) remove(confirm.item)
          setConfirm({ open: false })
        }}
      />
    </div>
  )
}

function ProductModal({
  open,
  editing,
  form,
  setForm,
  saving,
  onClose,
  onSave,
  kind,
}: {
  open: boolean
  editing: CmsCatalogItem | null
  form: Record<string, unknown>
  setForm: (f: Record<string, unknown>) => void
  saving: boolean
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => void
  kind?: 'PRODUCT' | 'PACKAGE'
}) {
  const name = String(form.name ?? '')
  const slug = String(form.slug ?? '')
  const price = Number(form.price ?? 0)
  const description = String(form.description ?? '')
  const nameI18n =
    (form.nameI18n as Record<string, string> | undefined) ??
    (name ? { en: name } : {})
  const descriptionI18n =
    (form.descriptionI18n as Record<string, string> | undefined) ??
    (description ? { en: description } : {})
  const image = String(form.image ?? '')
  const unit = String((form.metadata as Record<string, unknown>)?.unit ?? 'kg')
  const isValid = name.trim() && slug.trim()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit product' : `Add ${kind === 'PACKAGE' ? 'package' : 'product'}`}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || saving}
            onClick={() =>
              onSave({
                name: getLocalizedValue(nameI18n, 'en').trim(),
                nameI18n,
                slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
                price,
                description: getLocalizedValue(descriptionI18n, 'en').trim(),
                descriptionI18n,
                image: image || null,
                metadata: { unit, category: 'all', minQty: unit === 'kg' ? 0.5 : 1, step: unit === 'kg' ? 0.5 : 1 },
              })
            }
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LocalizedInput
          label="Name"
          value={nameI18n}
          required
          onChange={(next) =>
            setForm({
              ...form,
              name: getLocalizedValue(next, 'en'),
              nameI18n: next,
            })
          }
          enPlaceholder="e.g. Berbere spice blend"
        />
        <FormField label="Slug" required>
          <input
            className={inputClass()}
            value={slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            placeholder="e.g. berbere-spice"
          />
        </FormField>
        <FormField label="Price ETB">
          <input
            type="number"
            className={inputClass()}
            value={price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
        </FormField>
        <FormField label="Unit">
          <select
            className={inputClass()}
            value={unit}
            onChange={(e) =>
              setForm({
                ...form,
                metadata: { ...(form.metadata as Record<string, unknown>), unit: e.target.value },
              })
            }
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </FormField>
        <LocalizedTextarea
          label="Description"
          className="sm:col-span-2"
          rows={3}
          value={descriptionI18n}
          onChange={(next) =>
            setForm({
              ...form,
              description: getLocalizedValue(next, 'en'),
              descriptionI18n: next,
            })
          }
        />
        <div className="sm:col-span-2">
          <ImageField label="Image" value={image} onChange={(v) => setForm({ ...form, image: v })} />
        </div>
      </div>
    </Modal>
  )
}

/** Catering event occasions & beverage labels — CONFIG catalog items with EN/AM */
export function CateringOptionsEditor({
  items,
  serviceId,
  onChanged,
}: {
  items: CmsCatalogItem[]
  serviceId: string
  onChanged: () => void
}) {
  const occasions = items.filter(
    (i) => i.kind === 'CONFIG' && i.metadata?.catalogRole === 'occasion',
  )
  const beverages = items.filter(
    (i) => i.kind === 'CONFIG' && i.metadata?.catalogRole === 'beverage',
  )

  return (
    <div className="space-y-8">
      <CateringLabelEditor
        role="occasion"
        title="Event occasions"
        description="Labels on the catering form (Wedding, Birthday, etc.) — English and Amharic."
        addLabel="Add occasion"
        emptyTitle="No occasions yet"
        items={occasions}
        serviceId={serviceId}
        onChanged={onChanged}
      />
      <CateringLabelEditor
        role="beverage"
        title="Beverage options"
        description="Drink add-on choices (Food only, With Tej, etc.) — English and Amharic."
        addLabel="Add beverage option"
        emptyTitle="No beverage options yet"
        items={beverages}
        serviceId={serviceId}
        onChanged={onChanged}
      />
    </div>
  )
}

function CateringLabelEditor({
  role,
  title,
  description,
  addLabel,
  emptyTitle,
  items,
  serviceId,
  onChanged,
}: {
  role: 'occasion' | 'beverage'
  title: string
  description: string
  addLabel: string
  emptyTitle: string
  items: CmsCatalogItem[]
  serviceId: string
  onChanged: () => void
}) {
  const [confirm, setConfirm] = useState<{ open: boolean; item?: CmsCatalogItem }>({
    open: false,
  })
  const modal = useItemModal({ serviceId, kind: 'CONFIG', onChanged })

  const toggle = async (item: CmsCatalogItem) => {
    await cmsApi.patchCatalog(item.id, { available: !item.available })
    onChanged()
  }

  const remove = async (item: CmsCatalogItem) => {
    await cmsApi.deleteCatalog(item.id)
    onChanged()
  }

  const openAdd = () => {
    modal.openAdd({
      slug: '',
      name: '',
      nameI18n: { en: '', am: '' },
      description: '',
      metadata: {
        catalogRole: role,
        ...(role === 'occasion' ? { emoji: '✨' } : { value: '' }),
      },
    })
  }

  const openEdit = (item: CmsCatalogItem) => {
    modal.openEdit(item, {
      nameI18n: item.nameI18n ?? { en: item.name, am: '' },
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-base uppercase">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <div className="flex justify-end">
        <AddButton label={addLabel} onClick={openAdd} />
      </div>

      <DataTable
        rows={items}
        columns={[
          {
            key: 'name',
            header: role === 'occasion' ? 'Occasion' : 'Option',
            cell: (item) => (
              <div>
                <p className="font-medium">
                  {role === 'occasion' && (
                    <span className="mr-1">{String(item.metadata?.emoji ?? '✨')}</span>
                  )}
                  {getLocalizedValue(item.nameI18n ?? item.name, 'en')}
                </p>
                <p className="text-xs text-gray-500">
                  {getLocalizedValue(item.nameI18n ?? item.name, 'am') || '—'} · {item.slug}
                </p>
              </div>
            ),
          },
          {
            key: 'status',
            header: 'Status',
            width: '110px',
            cell: (item) => (
              <StatusBadge variant={item.available ? 'success' : 'neutral'}>
                {item.available ? 'Visible' : 'Hidden'}
              </StatusBadge>
            ),
          },
        ]}
        action={(item) => (
          <div className="flex items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.available}
                onChange={() => toggle(item)}
              />
              Visible
            </label>
            <ActionMenu
              items={[
                { label: 'Edit', onClick: () => openEdit(item) },
                { label: 'Delete', danger: true, onClick: () => setConfirm({ open: true, item }) },
              ]}
            />
          </div>
        )}
        empty={
          <EmptyState
            title={emptyTitle}
            description="Add labels in English and Amharic for the catering order form."
            action={<AddButton label={addLabel} onClick={openAdd} />}
          />
        }
      />

      <CateringLabelModal
        role={role}
        open={modal.open}
        editing={modal.editing}
        form={modal.form}
        setForm={modal.setForm}
        saving={modal.saving}
        onClose={modal.close}
        onSave={modal.save}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.item ? `Delete ${confirm.item.name}?` : 'Delete item?'}
        description="This cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.item) remove(confirm.item)
          setConfirm({ open: false })
        }}
      />
    </div>
  )
}

function CateringLabelModal({
  role,
  open,
  editing,
  form,
  setForm,
  saving,
  onClose,
  onSave,
}: {
  role: 'occasion' | 'beverage'
  open: boolean
  editing: CmsCatalogItem | null
  form: Record<string, unknown>
  setForm: (f: Record<string, unknown>) => void
  saving: boolean
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => void
}) {
  const meta = (form.metadata as Record<string, unknown>) ?? {}
  const nameI18n = (form.nameI18n as Partial<Record<string, string>>) ?? {
    en: String(form.name ?? ''),
    am: '',
  }
  const slug = String(form.slug ?? '')
  const isValid = slug.trim() && getLocalizedValue(nameI18n, 'en').trim()

  const setMeta = (patch: Record<string, unknown>) => {
    setForm({
      ...form,
      metadata: { ...meta, catalogRole: role, ...patch },
    })
  }

  return (
    <Modal
      open={open}
      title={editing ? `Edit ${getLocalizedValue(nameI18n, 'en')}` : role === 'occasion' ? 'Add occasion' : 'Add beverage option'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="rounded-full px-4 py-2 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || saving}
            className="rounded-full bg-burgundy px-4 py-2 text-sm text-white disabled:opacity-50"
            onClick={() =>
              onSave({
                slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
                name: getLocalizedValue(nameI18n, 'en'),
                nameI18n,
                description: '',
                metadata: {
                  catalogRole: role,
                  ...(role === 'occasion'
                    ? { emoji: String(meta.emoji ?? '✨') }
                    : {
                        value: String(meta.value ?? slug).trim().toLowerCase().replace(/\s+/g, '-'),
                      }),
                },
              })
            }
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LocalizedInput
          label="Label"
          value={nameI18n}
          className="sm:col-span-2"
          onChange={(next) => setForm({ ...form, name: getLocalizedValue(next, 'en'), nameI18n: next })}
        />
        <FormField label="Slug (value)">
          <input
            className={inputClass()}
            value={slug}
            disabled={!!editing}
            placeholder={role === 'occasion' ? 'wedding' : 'food-only'}
            onChange={(e) => {
              const next = e.target.value
              setForm({ ...form, slug: next })
              if (role === 'beverage' && !editing) {
                setMeta({ value: next.trim().toLowerCase().replace(/\s+/g, '-') })
              }
            }}
          />
        </FormField>
        {role === 'occasion' ? (
          <FormField label="Emoji">
            <input
              className={inputClass()}
              value={String(meta.emoji ?? '✨')}
              onChange={(e) => setMeta({ emoji: e.target.value })}
            />
          </FormField>
        ) : (
          <FormField label="Pricing key">
            <input
              className={inputClass()}
              value={String(meta.value ?? slug)}
              placeholder="food-only"
              onChange={(e) => setMeta({ value: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })}
            />
          </FormField>
        )}
      </div>
    </Modal>
  )
}

/** Catering packages — table + modal by meal type */
export function CateringPackageEditor({
  items,
  serviceId,
  onChanged,
}: {
  items: CmsCatalogItem[]
  serviceId: string
  onChanged: () => void
}) {
  const [q, setQ] = useState('')
  const [mealFilter, setMealFilter] = useState<'all' | 'fasting' | 'non-fasting'>('all')
  const [confirm, setConfirm] = useState<{ open: boolean; item?: CmsCatalogItem }>({ open: false })
  const modal = useItemModal({ serviceId, kind: 'PACKAGE', onChanged })

  const filtered = useMemo(() => {
    let list = items
    if (mealFilter !== 'all') {
      list = list.filter((i) => (i.metadata?.mealType as string) === mealFilter)
    }
    if (!q.trim()) return list
    const term = q.toLowerCase()
    return list.filter((i) => i.name.toLowerCase().includes(term) || i.slug.toLowerCase().includes(term))
  }, [items, q, mealFilter])

  const toggle = async (item: CmsCatalogItem) => {
    await cmsApi.patchCatalog(item.id, { available: !item.available })
    onChanged()
  }

  const remove = async (item: CmsCatalogItem) => {
    await cmsApi.deleteCatalog(item.id)
    onChanged()
  }

  return (
    <div className="space-y-4">
      <Toolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search packages…"
      >
        <select
          className={inputClass()}
          value={mealFilter}
          onChange={(e) => setMealFilter(e.target.value as typeof mealFilter)}
        >
          <option value="all">All meal types</option>
          <option value="fasting">Fasting</option>
          <option value="non-fasting">Non-fasting</option>
        </select>
      </Toolbar>

      <div className="flex items-center justify-between">
        <AddButton
          label="Add package"
          onClick={() =>
            modal.openAdd({
              name: '',
              slug: '',
              price: 1100,
              description: '',
              metadata: {
                mealType: 'fasting',
                nameAm: '',
                beveragePricing: Object.fromEntries(BEVERAGE_KEYS.map((k) => [k, 0])),
                dishes: [],
              },
            })
          }
        />
      </div>

      <DataTable
        rows={filtered}
        columns={[
          {
            key: 'name',
            header: 'Package',
            cell: (item) => (
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {String(item.metadata?.mealType ?? '')} · {item.slug}
                </p>
              </div>
            ),
          },
          {
            key: 'base',
            header: 'Base price',
            width: '120px',
            cell: (item) => {
              const pricing = (item.metadata?.beveragePricing as Record<string, number>) ?? {}
              return <p className="font-medium">{pricing['food-only'] ?? Number(item.price ?? 0)} ETB</p>
            },
          },
          {
            key: 'status',
            header: 'Status',
            width: '110px',
            cell: (item) => (
              <StatusBadge variant={item.available ? 'success' : 'neutral'}>
                {item.available ? 'Available' : 'Hidden'}
              </StatusBadge>
            ),
          },
        ]}
        action={(item) => (
          <div className="flex items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={item.available}
                onChange={() => toggle(item)}
              />
              Available
            </label>
            <ActionMenu
              items={[
                { label: 'Edit', onClick: () => modal.openEdit(item) },
                { label: 'Delete', danger: true, onClick: () => setConfirm({ open: true, item }) },
              ]}
            />
          </div>
        )}
        empty={
          <EmptyState
            title="No packages yet"
            description="Add fasting and non-fasting catering packages with beverage options."
            action={
              <AddButton
                label="Add package"
                onClick={() =>
                  modal.openAdd({
                    name: '',
                    slug: '',
                    price: 1100,
                    description: '',
                    metadata: {
                      mealType: 'fasting',
                      nameAm: '',
                      beveragePricing: Object.fromEntries(BEVERAGE_KEYS.map((k) => [k, 0])),
                      dishes: [],
                    },
                  })
                }
              />
            }
          />
        }
      />

      <CateringModal
        open={modal.open}
        editing={modal.editing}
        form={modal.form}
        setForm={modal.setForm}
        saving={modal.saving}
        onClose={modal.close}
        onSave={modal.save}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.item ? `Delete ${confirm.item.name}?` : 'Delete package?'}
        description="This cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.item) remove(confirm.item)
          setConfirm({ open: false })
        }}
      />
    </div>
  )
}

function CateringModal({
  open,
  editing,
  form,
  setForm,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  editing: CmsCatalogItem | null
  form: Record<string, unknown>
  setForm: (f: Record<string, unknown>) => void
  saving: boolean
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => void
}) {
  const name = String(form.name ?? '')
  const slug = String(form.slug ?? '')
  const mealType = String((form.metadata as Record<string, unknown>)?.mealType ?? 'fasting') as 'fasting' | 'non-fasting'
  const nameAm = String((form.metadata as Record<string, unknown>)?.nameAm ?? '')
  const description = String(form.description ?? '')
  const pricing = {
    ...Object.fromEntries(BEVERAGE_KEYS.map((k) => [k, 0])),
    ...((form.metadata as Record<string, unknown>)?.beveragePricing as Record<string, number> ?? {}),
  }
  const dishes = (((form.metadata as Record<string, unknown>)?.dishes as string[]) ?? []).join('\n')
  const isValid = name.trim() && slug.trim()

  const setPricing = (key: string, value: number) => {
    const next = { ...pricing, [key]: value }
    setForm({
      ...form,
      metadata: { ...(form.metadata as Record<string, unknown>), beveragePricing: next },
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit catering package' : 'Add catering package'}
      size="xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || saving}
            onClick={() =>
              onSave({
                name: name.trim(),
                slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
                description: description.trim(),
                price: pricing['food-only'] || 0,
                metadata: {
                  ...(form.metadata as Record<string, unknown>),
                  mealType,
                  nameAm: nameAm.trim(),
                  beveragePricing: pricing,
                  dishes: dishes
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean),
                },
              })
            }
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create package'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Name (English)" required>
          <input
            className={inputClass()}
            value={name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </FormField>
        <FormField label="Name (Amharic)">
          <input
            className={inputClass()}
            value={nameAm}
            onChange={(e) =>
              setForm({
                ...form,
                metadata: { ...(form.metadata as Record<string, unknown>), nameAm: e.target.value },
              })
            }
          />
        </FormField>
        <FormField label="Slug" required>
          <input
            className={inputClass()}
            value={slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
          />
        </FormField>
        <FormField label="Meal type">
          <select
            className={inputClass()}
            value={mealType}
            onChange={(e) =>
              setForm({
                ...form,
                metadata: { ...(form.metadata as Record<string, unknown>), mealType: e.target.value },
              })
            }
          >
            <option value="fasting">Fasting</option>
            <option value="non-fasting">Non-fasting</option>
          </select>
        </FormField>
        <FormField label="Description" className="sm:col-span-2">
          <textarea
            className={inputClass()}
            rows={2}
            value={description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </FormField>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-gray-700">Price per guest (ETB) by beverage</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {BEVERAGE_KEYS.map((key) => (
            <FormField key={key} label={key.replace(/-/g, ' ')}>
              <input
                type="number"
                className={inputClass()}
                value={pricing[key]}
                onChange={(e) => setPricing(key, Number(e.target.value))}
              />
            </FormField>
          ))}
        </div>
      </div>

      <FormField label="Dishes (one per line)" className="mt-4">
        <textarea
          className={inputClass()}
          rows={6}
          value={dishes}
          onChange={(e) =>
            setForm({
              ...form,
              metadata: {
                ...(form.metadata as Record<string, unknown>),
                dishes: e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean),
              },
            })
          }
        />
      </FormField>
    </Modal>
  )
}

/** Festival packages — table + modal */
export function FestivalEditor({
  items,
  serviceId,
  onChanged,
}: {
  items: CmsCatalogItem[]
  serviceId: string
  onChanged: () => void
}) {
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; item?: CmsCatalogItem }>({ open: false })
  const modal = useItemModal({ serviceId, kind: 'PACKAGE', onChanged })

  const filtered = useMemo(() => {
    if (!q.trim()) return items
    const term = q.toLowerCase()
    return items.filter((i) => i.name.toLowerCase().includes(term) || i.slug.toLowerCase().includes(term))
  }, [items, q])

  const toggle = async (item: CmsCatalogItem) => {
    await cmsApi.patchCatalog(item.id, { available: !item.available })
    onChanged()
  }

  const remove = async (item: CmsCatalogItem) => {
    await cmsApi.deleteCatalog(item.id)
    onChanged()
  }

  return (
    <div className="space-y-4">
      <Toolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search packages…"
        action={
          <AddButton
            label="Add package"
            onClick={() =>
              modal.openAdd({
                name: '',
                slug: '',
                price: 3500,
                description: '',
                metadata: { tagline: '', items: [] },
              })
            }
          />
        }
      />

      <DataTable
        rows={filtered}
        columns={[
          {
            key: 'name',
            header: 'Package',
            cell: (item) => (
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">{item.slug}</p>
                <p className="mt-1 line-clamp-1 max-w-md text-sm text-gray-600">
                  {String((item.metadata as Record<string, unknown>)?.tagline ?? item.description)}
                </p>
              </div>
            ),
          },
          {
            key: 'price',
            header: 'Price',
            width: '120px',
            cell: (item) => <p className="font-medium">{item.price ?? 0} ETB</p>,
          },
          {
            key: 'status',
            header: 'Status',
            width: '110px',
            cell: (item) => (
              <StatusBadge variant={item.available ? 'success' : 'neutral'}>
                {item.available ? 'Available' : 'Hidden'}
              </StatusBadge>
            ),
          },
        ]}
        action={(item) => (
          <div className="flex items-center justify-end gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={item.available} onChange={() => toggle(item)} />
              Available
            </label>
            <ActionMenu
              items={[
                { label: 'Edit', onClick: () => modal.openEdit(item) },
                { label: 'Delete', danger: true, onClick: () => setConfirm({ open: true, item }) },
              ]}
            />
          </div>
        )}
        empty={
          <EmptyState
            title="No festival packages yet"
            description="Add holiday and celebration packages."
            action={
              <AddButton
                label="Add package"
                onClick={() =>
                  modal.openAdd({
                    name: '',
                    slug: '',
                    price: 3500,
                    description: '',
                    metadata: { tagline: '', items: [] },
                  })
                }
              />
            }
          />
        }
      />

      <FestivalModal
        open={modal.open}
        editing={modal.editing}
        form={modal.form}
        setForm={modal.setForm}
        saving={modal.saving}
        onClose={modal.close}
        onSave={modal.save}
      />

      <ConfirmDialog
        open={confirm.open}
        title={confirm.item ? `Delete ${confirm.item.name}?` : 'Delete package?'}
        description="This cannot be undone."
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.item) remove(confirm.item)
          setConfirm({ open: false })
        }}
      />
    </div>
  )
}

function FestivalModal({
  open,
  editing,
  form,
  setForm,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  editing: CmsCatalogItem | null
  form: Record<string, unknown>
  setForm: (f: Record<string, unknown>) => void
  saving: boolean
  onClose: () => void
  onSave: (payload: Record<string, unknown>) => void
}) {
  const name = String(form.name ?? '')
  const slug = String(form.slug ?? '')
  const price = Number(form.price ?? 0)
  const description = String(form.description ?? '')
  const nameI18n =
    (form.nameI18n as Record<string, string> | undefined) ??
    (name ? { en: name } : {})
  const descriptionI18n =
    (form.descriptionI18n as Record<string, string> | undefined) ??
    (description ? { en: description } : {})
  const tagline = String((form.metadata as Record<string, unknown>)?.tagline ?? '')
  const included = (((form.metadata as Record<string, unknown>)?.items as Array<{ label?: string }>) ?? [])
    .map((i) => i.label ?? '')
    .join('\n')
  const isValid = name.trim() && slug.trim()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Edit festival package' : 'Add festival package'}
      size="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!isValid || saving}
            onClick={() =>
              onSave({
                name: getLocalizedValue(nameI18n, 'en').trim(),
                nameI18n,
                slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
                price,
                description: getLocalizedValue(descriptionI18n, 'en').trim(),
                descriptionI18n,
                metadata: {
                  ...(form.metadata as Record<string, unknown>),
                  tagline: tagline.trim(),
                  items: included
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((label, idx) => ({ id: `item-${idx}`, label, icon: 'injera' })),
                },
              })
            }
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Create package'}
          </button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <LocalizedInput
          label="Package name"
          value={nameI18n}
          required
          onChange={(next) =>
            setForm({
              ...form,
              name: getLocalizedValue(next, 'en'),
              nameI18n: next,
            })
          }
        />
        <FormField label="Slug" required>
          <input
            className={inputClass()}
            value={slug}
            onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
          />
        </FormField>
        <FormField label="Price ETB">
          <input
            type="number"
            className={inputClass()}
            value={price}
            onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
          />
        </FormField>
        <FormField label="Tagline">
          <input
            className={inputClass()}
            value={tagline}
            onChange={(e) =>
              setForm({
                ...form,
                metadata: { ...(form.metadata as Record<string, unknown>), tagline: e.target.value },
              })
            }
            placeholder="Short tagline shown under the name"
          />
        </FormField>
        <LocalizedTextarea
          label="Description"
          className="sm:col-span-2"
          rows={2}
          value={descriptionI18n}
          onChange={(next) =>
            setForm({
              ...form,
              description: getLocalizedValue(next, 'en'),
              descriptionI18n: next,
            })
          }
        />
        <FormField label="Included items (one per line)" className="sm:col-span-2">
          <textarea
            className={inputClass()}
            rows={5}
            value={included}
            onChange={(e) =>
              setForm({
                ...form,
                metadata: {
                  ...(form.metadata as Record<string, unknown>),
                  items: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((label, idx) => ({ id: `item-${idx}`, label, icon: 'injera' })),
                },
              })
            }
          />
        </FormField>
      </div>
    </Modal>
  )
}

/** Agelgil price matrix — kept as a table form with explicit save */
export function AgelgilEditor({
  config,
  onChanged,
}: {
  config: CmsCatalogItem | undefined
  onChanged: () => void
}) {
  if (!config) {
    return <p className="text-sm text-gray-500">Agelgil pricing config missing.</p>
  }

  const meta = config.metadata ?? {}
  const sizes = (meta.sizes as number[]) ?? [10, 15, 20, 30]
  const priceTable = (meta.priceTable as Record<string, Record<string, number>>) ?? {}
  const keys = [
    'fasting-regular',
    'fasting-special',
    'non-fasting-regular',
    'non-fasting-special',
  ]

  const [table, setTable] = useState(priceTable)
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await cmsApi.patchCatalog(config.id, {
        metadata: { ...meta, priceTable: table, sizes },
      })
      setMsg('Agelgil prices saved — website updated')
      onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-burgundy/10 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-burgundy/[0.04] text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Package type</th>
                {sizes.map((size) => (
                  <th key={size} className="px-4 py-3 text-right">
                    Size {size}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-burgundy/5">
              {keys.map((key) => (
                <tr key={key}>
                  <td className="px-4 py-3 font-medium capitalize">{key.replace(/-/g, ' ')}</td>
                  {sizes.map((size) => (
                    <td key={size} className="px-4 py-3 text-right">
                      <input
                        type="number"
                        className={inputClass({ small: true })}
                        value={table[key]?.[String(size)] ?? ''}
                        onChange={(e) => {
                          const n = Number(e.target.value)
                          setTable((t) => ({
                            ...t,
                            [key]: { ...(t[key] ?? {}), [String(size)]: n },
                          }))
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <button type="button" onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Agelgil prices'}
        </button>
      </div>

      {msg && <p className="text-sm text-green-700">{msg}</p>}
    </div>
  )
}
