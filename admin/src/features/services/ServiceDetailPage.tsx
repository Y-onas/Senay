import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Pencil, Plus, Save, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { catalogApi, servicesApi, type CatalogItem, type Service } from '@/lib/api'
import { confirmAdminAction, ADMIN_CONFIRM } from '@/lib/confirm-messages'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { CatalogPanel } from '@/features/services/components/CatalogPanel'
import { CollapsibleServiceSection } from '@/features/services/components/CollapsibleServiceSection'
import { FieldGroup } from '@/features/services/components/FieldGroup'
import { ServiceImage } from '@/features/services/components/ServiceImage'
import {
  CreateBaltinaForm,
  CreateCateringForm,
  CreateDrinksForm,
  CreateFestivalForm,
  submitBaltinaCreate,
  submitCateringCreate,
  submitDrinksCreate,
  submitFestivalCreate,
  type CreateBaltinaDraft,
  type CreateCateringDraft,
  type CreateDrinksDraft,
  type CreateFestivalDraft,
} from '@/features/services/components/CreateCatalogForms'
import { isDrinksSlug, isFestivalSlug } from '@/features/services/service-helpers'
import { AgelgilEditor } from '@/features/services/editors/AgelgilEditor'
import { BaltinaProductEditor } from '@/features/services/editors/BaltinaProductEditor'
import { CateringLabelsEditor } from '@/features/services/editors/CateringLabelsEditor'
import { FormCopyEditor } from '@/features/services/editors/FormCopyEditor'
import { isFormCopyItem } from '@/features/services/form-copy-schema'
import { CateringPackageEditor } from '@/features/services/editors/CateringPackageEditor'
import { DrinksProductEditor } from '@/features/services/editors/DrinksProductEditor'
import { FestivalPackageEditor } from '@/features/services/editors/FestivalPackageEditor'

type PanelKind = 'catering' | 'baltina' | 'drinks' | 'festival' | 'agelgil' | 'generic'

type EditPanel =
  | { action: 'create'; kind: PanelKind }
  | { action: 'edit'; kind: PanelKind; item: CatalogItem }
  | null

const emptyCateringDraft = (): CreateCateringDraft => ({
  name: '',
  slug: '',
  mealType: 'fasting',
  tier: 'fasting',
  regularPrice: '',
})

const emptyBaltinaDraft = (): CreateBaltinaDraft => ({
  name: '',
  nameEn: '',
  nameAm: '',
  slug: '',
  category: 'flours',
  price: '',
  unit: 'kg',
  minQty: '0.5',
  step: '0.5',
  image: '',
  description: '',
  descEn: '',
  descAm: '',
})

const emptyDrinksDraft = (): CreateDrinksDraft => ({
  name: '',
  nameEn: '',
  nameAm: '',
  slug: '',
  price: '',
  unit: 'L',
  minQty: '1',
  step: '0.5',
  image: '',
  description: '',
  descEn: '',
  descAm: '',
})

const emptyFestivalDraft = (): CreateFestivalDraft => ({
  name: '',
  slug: '',
  price: '',
  tagline: '',
  badge: '',
})

function GenericCatalogEditor({
  item,
  onDelete,
  onSaved,
}: {
  item: CatalogItem
  onDelete: (id: string) => void | Promise<void>
  onSaved: () => void | Promise<void>
}) {
  const [row, setRow] = useState(item)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setRow(item)
  }, [item])

  const save = async () => {
    setSaving(true)
    try {
      await catalogApi.update(row.id, {
        name: row.name,
        description: row.description,
        price: row.price,
        image: row.image,
        available: row.available,
        sortOrder: row.sortOrder,
        metadata: row.metadata,
      })
      toast.success(`${row.name} saved`)
      await onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <FieldGroup label="Slug">
        <Input value={row.slug || ''} disabled />
      </FieldGroup>
      <FieldGroup label="Name">
        <Input value={row.name} onChange={(e) => setRow({ ...row, name: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Price">
        <Input
          type="number"
          value={row.price ?? ''}
          onChange={(e) => setRow({ ...row, price: e.target.value ? Number(e.target.value) : null })}
        />
      </FieldGroup>
      <div className="flex items-end gap-2 pb-1">
        <Switch checked={row.available} onCheckedChange={(available) => setRow({ ...row, available })} />
        <span className="text-sm">Available</span>
      </div>
      <FieldGroup label="Description" className="md:col-span-2">
        <Input value={row.description || ''} onChange={(e) => setRow({ ...row, description: e.target.value })} />
      </FieldGroup>
      <div className="flex gap-2 border-t border-border/60 pt-4 md:col-span-2">
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button variant="destructive" onClick={() => onDelete(row.id)}>
          Delete
        </Button>
      </div>
    </div>
  )
}

export function ServiceDetailPage() {
  const { id = '' } = useParams()
  const [service, setService] = useState<(Service & { catalogItems?: CatalogItem[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingService, setSavingService] = useState(false)
  const [showServiceInfo, setShowServiceInfo] = useState(false)
  const [panel, setPanel] = useState<EditPanel>(null)
  const [creatingAgelgil, setCreatingAgelgil] = useState(false)
  const [creatingCatalog, setCreatingCatalog] = useState(false)
  const [cateringDraft, setCateringDraft] = useState(emptyCateringDraft)
  const [baltinaDraft, setBaltinaDraft] = useState(emptyBaltinaDraft)
  const [drinksDraft, setDrinksDraft] = useState(emptyDrinksDraft)
  const [festivalDraft, setFestivalDraft] = useState(emptyFestivalDraft)

  const refresh = useCallback(async () => {
    if (!id) return
    const data = await servicesApi.get(id)
    setService(data)
  }, [id])

  useEffect(() => {
    if (!id) return
    servicesApi
      .get(id)
      .then(setService)
      .finally(() => setLoading(false))
  }, [id])

  const items = service?.catalogItems ?? []
  const slug = service?.slug ?? ''
  const isCatering = slug === 'catering'
  const isBaltina = slug === 'baltina'
  const isDrinks = isDrinksSlug(slug)
  const isFestival = isFestivalSlug(slug)
  const isAgelgil = slug === 'agelgil'

  const products = useMemo(() => items.filter((item) => item.kind === 'PRODUCT'), [items])
  const packages = useMemo(() => items.filter((item) => item.kind === 'PACKAGE'), [items])
  const occasions = useMemo(
    () => items.filter((item) => item.kind === 'CONFIG' && item.metadata?.catalogRole === 'occasion'),
    [items],
  )
  const beverages = useMemo(
    () => items.filter((item) => item.kind === 'CONFIG' && item.metadata?.catalogRole === 'beverage'),
    [items],
  )
  const agelgilConfig = useMemo(
    () => items.find((item) => item.slug === 'pricing') ?? null,
    [items],
  )
  const formCopyItem = useMemo(() => items.find((item) => isFormCopyItem(item)) ?? null, [items])
  const otherItems = useMemo(() => {
    if (isCatering) {
      return items.filter(
        (item) =>
          item.kind !== 'PACKAGE' &&
          !isFormCopyItem(item) &&
          !(item.kind === 'CONFIG' && (item.metadata?.catalogRole === 'occasion' || item.metadata?.catalogRole === 'beverage')),
      )
    }
    if (isBaltina) return items.filter((item) => item.kind !== 'PRODUCT' && !isFormCopyItem(item))
    if (isDrinks) return items.filter((item) => item.kind !== 'PRODUCT' && !isFormCopyItem(item))
    if (isFestival) return items.filter((item) => item.kind !== 'PACKAGE' && !isFormCopyItem(item))
    return items.filter((item) => !isFormCopyItem(item))
  }, [items, isBaltina, isCatering, isDrinks, isFestival])

  const heroSummary = isCatering
    ? `${packages.length} packages`
    : isBaltina
      ? `${products.length} products`
      : isDrinks
        ? `${products.length} products`
        : isFestival
          ? `${packages.length} packages`
          : `${items.length} catalog items`

  const closePanel = () => setPanel(null)

  const deleteItem = async (itemId: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteCatalogItem))) return
    await catalogApi.delete(itemId)
    toast.success('Deleted')
    closePanel()
    await refresh()
  }

  const saveService = async () => {
    if (!service) return
    setSavingService(true)
    try {
      await servicesApi.update(service.id, {
        name: service.name,
        description: service.description,
        slug: service.slug,
        image: service.image,
        enabled: service.enabled,
      })
      toast.success('Service updated')
      await refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingService(false)
    }
  }

  const createAgelgilConfig = async () => {
    if (!service) return
    setCreatingAgelgil(true)
    try {
      await catalogApi.create({
        serviceId: service.id,
        kind: 'CONFIG',
        slug: 'pricing',
        name: 'Agelgil Pricing Config',
        description: 'Pricing table for Agelgil packages',
        price: null,
        available: true,
        metadata: {
          priceTable: {
            'fasting-regular': { 10: 3500, 15: 5000, 20: 6500, 30: 9000 },
            'fasting-special': { 10: 4500, 15: 6500, 20: 8500, 30: 12000 },
            'non-fasting-regular': { 10: 3500, 15: 5000, 20: 6500, 30: 9000 },
            'non-fasting-special': { 10: 4500, 15: 6500, 20: 8500, 30: 12000 },
          },
        },
      })
      toast.success('Agelgil config created')
      await refresh()
    } finally {
      setCreatingAgelgil(false)
    }
  }

  const handleCreate = async () => {
    if (!service || panel?.action !== 'create') return
    setCreatingCatalog(true)
    try {
      let ok = false
      if (panel.kind === 'catering') ok = await submitCateringCreate(service.id, cateringDraft)
      if (panel.kind === 'baltina') ok = await submitBaltinaCreate(service.id, baltinaDraft)
      if (panel.kind === 'drinks') ok = await submitDrinksCreate(service.id, drinksDraft)
      if (panel.kind === 'festival') ok = await submitFestivalCreate(service.id, festivalDraft)
      if (panel.kind === 'generic') {
        const created = await catalogApi.create({
          serviceId: service.id,
          kind: 'PRODUCT',
          slug: `item-${Date.now()}`,
          name: 'New item',
          price: 0,
          available: true,
        })
        toast.success('Catalog item created')
        closePanel()
        await refresh()
        setPanel({ action: 'edit', kind: 'generic', item: created })
        return
      }
      if (ok) {
        if (panel.kind === 'catering') setCateringDraft(emptyCateringDraft())
        if (panel.kind === 'baltina') setBaltinaDraft(emptyBaltinaDraft())
        if (panel.kind === 'drinks') setDrinksDraft(emptyDrinksDraft())
        if (panel.kind === 'festival') setFestivalDraft(emptyFestivalDraft())
        closePanel()
        await refresh()
      }
    } finally {
      setCreatingCatalog(false)
    }
  }

  const panelTitle =
    panel?.action === 'create'
      ? panel.kind === 'catering'
        ? 'Add catering package'
        : panel.kind === 'baltina'
          ? 'Add Baltina product'
          : panel.kind === 'drinks'
            ? 'Add drinks product'
            : panel.kind === 'festival'
              ? 'Add festival package'
              : 'Add catalog item'
      : panel?.action === 'edit'
        ? `Edit ${panel.item.name}`
        : ''

  if (loading) return <Skeleton className="h-96" />
  if (!service) return <p className="text-brown-muted">Service not found.</p>

  return (
    <div className="animate-fade-in space-y-6">
      <div className="admin-hero">
        <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-5 sm:p-6">
          <div className="h-24 w-full shrink-0 overflow-hidden rounded-2xl ring-1 ring-cream/15 sm:w-40">
            <ServiceImage slug={service.slug} image={service.image} name={service.name} className="h-full w-full" />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              to="/services"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-cream/70 transition-colors hover:text-yellow-brand"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to services
            </Link>
            <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight sm:text-4xl">{service.name}</h1>
            <p className="mt-1 text-sm text-cream/60">{heroSummary}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset',
                service.enabled
                  ? 'bg-green-brand/90 text-cream ring-green-brand'
                  : 'bg-cream/10 text-cream/70 ring-cream/20',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', service.enabled ? 'bg-cream' : 'bg-cream/50')} />
              {service.enabled ? 'Enabled' : 'Disabled'}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 bg-cream/15 text-cream hover:bg-cream/25"
              onClick={() => setShowServiceInfo((open) => !open)}
            >
              <Settings2 className="h-3.5 w-3.5" />
              {showServiceInfo ? 'Hide service info' : 'Service info'}
            </Button>
          </div>
        </div>
      </div>

      {showServiceInfo ? (
        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
              <FieldGroup label="Name">
                <Input
                  value={service.name}
                  onChange={(e) => setService({ ...service, name: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup label="Slug">
                <Input value={service.slug} onChange={(e) => setService({ ...service, slug: e.target.value })} />
              </FieldGroup>
              <FieldGroup label="Description" className="md:col-span-2">
                <Textarea
                  value={service.description || ''}
                  onChange={(e) => setService({ ...service, description: e.target.value })}
                  rows={3}
                />
              </FieldGroup>
              <div className="md:col-span-2">
                <ImageUploader
                  label="Service image"
                  hint="Upload to Cloudinary or reuse from the media library."
                  value={service.image || null}
                  onChange={(url) => setService({ ...service, image: url })}
                  aspect="wide"
                />
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-xs font-medium text-brown-muted">Card preview</p>
              <ServiceImage
                slug={service.slug}
                image={service.image}
                name={service.name}
                className="aspect-[4/3] w-full rounded-xl"
              />
              <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-3">
                <label className="flex cursor-pointer items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-medium text-brown">Enable on website</span>
                    <p className="mt-1 text-[11px] leading-relaxed text-brown-muted">
                      When disabled and saved, this service is removed from navigation, footer, listings, and direct
                      page access.
                    </p>
                  </div>
                  <Switch
                    checked={service.enabled}
                    onCheckedChange={(enabled) => setService({ ...service, enabled })}
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end border-t border-border/60 pt-4 md:col-span-3">
              <Button disabled={savingService} onClick={saveService} className="gap-2">
                <Save className="h-4 w-4" />
                {savingService ? 'Saving…' : 'Save service'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <FormCopyEditor
        serviceId={service.id}
        serviceSlug={service.slug}
        item={formCopyItem}
        onRefresh={refresh}
      />

      {isCatering ? (
        <>
          <CateringLabelsEditor
            role="occasion"
            title="Event occasions"
            description="Labels on the catering form (Wedding, Birthday, etc.) in English and Amharic."
            addLabel="Add occasion"
            emptyLabel="No occasions yet."
            items={occasions}
            serviceId={service.id}
            onRefresh={refresh}
            onDelete={deleteItem}
          />
          <CateringLabelsEditor
            role="beverage"
            title="Beverage options"
            description="Drink add-on choices on the catering form."
            addLabel="Add option"
            emptyLabel="No beverage options yet."
            items={beverages}
            serviceId={service.id}
            onRefresh={refresh}
            onDelete={deleteItem}
          />
          <CatalogPanel
            title="Catering packages"
            description="Tap Edit to change foods, prices, and details. Forms stay closed until you need them."
            addLabel="Add package"
            items={packages}
            emptyLabel="No catering packages yet."
            onAdd={() => setPanel({ action: 'create', kind: 'catering' })}
            onEdit={(item) => setPanel({ action: 'edit', kind: 'catering', item })}
            onDelete={deleteItem}
            getSubtitle={(item) => {
              const meta = item.metadata ?? {}
              const dishCount = Array.isArray(meta.dishes) ? meta.dishes.length : 0
              return `${String(meta.mealType ?? '—')} · ${String(meta.tier ?? '—')} · ${dishCount} foods`
            }}
          />
          {otherItems.length > 0 ? (
            <CatalogPanel
              title="Other items"
              addLabel="Add item"
              items={otherItems}
              emptyLabel="No other items."
              onAdd={() => setPanel({ action: 'create', kind: 'generic' })}
              onEdit={(item) => setPanel({ action: 'edit', kind: 'generic', item })}
              onDelete={deleteItem}
            />
          ) : null}
        </>
      ) : null}

      {isBaltina ? (
        <>
          <CatalogPanel
            title="Baltina products"
            description="Shiro, flours, spices and mixes. Edit one product at a time."
            addLabel="Add product"
            items={products}
            emptyLabel="No Baltina products yet."
            onAdd={() => setPanel({ action: 'create', kind: 'baltina' })}
            onEdit={(item) => setPanel({ action: 'edit', kind: 'baltina', item })}
            onDelete={deleteItem}
            getSubtitle={(item) => {
              const meta = item.metadata ?? {}
              return `${String(meta.category ?? '—')} · per ${String(meta.unit ?? 'kg')}`
            }}
          />
          {otherItems.length > 0 ? (
            <CatalogPanel
              title="Other Baltina items"
              addLabel="Add item"
              items={otherItems}
              emptyLabel="No other items."
              onAdd={() => setPanel({ action: 'create', kind: 'generic' })}
              onEdit={(item) => setPanel({ action: 'edit', kind: 'generic', item })}
              onDelete={deleteItem}
            />
          ) : null}
        </>
      ) : null}

      {isDrinks ? (
        <>
          <CatalogPanel
            title="Drinks products"
            description="Tela, tej and other drinks. Open a form only when adding or editing."
            addLabel="Add product"
            items={products}
            emptyLabel="No drinks products yet."
            onAdd={() => setPanel({ action: 'create', kind: 'drinks' })}
            onEdit={(item) => setPanel({ action: 'edit', kind: 'drinks', item })}
            onDelete={deleteItem}
            getSubtitle={(item) => {
              const meta = item.metadata ?? {}
              return `per ${String(meta.unit ?? 'L')}`
            }}
          />
          {otherItems.length > 0 ? (
            <CatalogPanel
              title="Other Drinks items"
              addLabel="Add item"
              items={otherItems}
              emptyLabel="No other items."
              onAdd={() => setPanel({ action: 'create', kind: 'generic' })}
              onEdit={(item) => setPanel({ action: 'edit', kind: 'generic', item })}
              onDelete={deleteItem}
            />
          ) : null}
        </>
      ) : null}

      {isFestival ? (
        <>
          <CatalogPanel
            title="Festival packages"
            description="Grand, premium and other festival packages."
            addLabel="Add package"
            items={packages}
            emptyLabel="No festival packages yet."
            onAdd={() => setPanel({ action: 'create', kind: 'festival' })}
            onEdit={(item) => setPanel({ action: 'edit', kind: 'festival', item })}
            onDelete={deleteItem}
            getSubtitle={(item) => {
              const meta = item.metadata ?? {}
              const itemCount = Array.isArray(meta.items) ? meta.items.length : 0
              return `${String(meta.badge || 'No badge')} · ${itemCount} items`
            }}
          />
          {otherItems.length > 0 ? (
            <CatalogPanel
              title="Other Festival items"
              addLabel="Add item"
              items={otherItems}
              emptyLabel="No other items."
              onAdd={() => setPanel({ action: 'create', kind: 'generic' })}
              onEdit={(item) => setPanel({ action: 'edit', kind: 'generic', item })}
              onDelete={deleteItem}
            />
          ) : null}
        </>
      ) : null}

      {isAgelgil ? (
        <CollapsibleServiceSection
          title="Agelgil pricing"
          description="Price table and dish lists for each package type."
          count={agelgilConfig ? 1 : 0}
          headerAction={
            agelgilConfig ? (
              <Button
                className="gap-2"
                onClick={() => setPanel({ action: 'edit', kind: 'agelgil', item: agelgilConfig })}
              >
                <Pencil className="h-4 w-4" />
                Edit pricing
              </Button>
            ) : (
              <Button onClick={createAgelgilConfig} disabled={creatingAgelgil} className="gap-2">
                <Plus className="h-4 w-4" />
                {creatingAgelgil ? 'Creating…' : 'Create config'}
              </Button>
            )
          }
        >
          {agelgilConfig ? (
            <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold text-burgundy">{agelgilConfig.name}</p>
                <p className="text-sm text-brown-muted">{agelgilConfig.description || 'Pricing & menus ready'}</p>
              </div>
              <Button
                variant="secondary"
                onClick={() => setPanel({ action: 'edit', kind: 'agelgil', item: agelgilConfig })}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Open editor
              </Button>
            </div>
          ) : (
            <p className="text-sm text-brown-muted">
              No pricing config yet. Create one to control Agelgil prices on the website.
            </p>
          )}
        </CollapsibleServiceSection>
      ) : null}

      {!isCatering && !isBaltina && !isDrinks && !isFestival && !isAgelgil ? (
        <CatalogPanel
          title="Catalog items"
          description="Products, packages, and configs for this service."
          addLabel="Add item"
          items={otherItems}
          emptyLabel="No catalog items yet."
          onAdd={() => setPanel({ action: 'create', kind: 'generic' })}
          onEdit={(item) => setPanel({ action: 'edit', kind: 'generic', item })}
          onDelete={deleteItem}
        />
      ) : null}

      <Sheet open={panel !== null} onOpenChange={(open) => !open && closePanel()}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl">
          <SheetHeader className="border-b border-border/70 bg-cream/50 px-5 py-4 text-left">
            <SheetTitle className="font-display text-xl text-burgundy">{panelTitle}</SheetTitle>
            <SheetDescription>
              {panel?.action === 'create'
                ? 'Fill in the details, then save. The list stays clean until you open a form.'
                : 'Update the existing values, then save.'}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {panel?.action === 'create' && panel.kind === 'catering' ? (
              <CreateCateringForm
                draft={cateringDraft}
                onChange={setCateringDraft}
                onCancel={closePanel}
                onSubmit={handleCreate}
                saving={creatingCatalog}
              />
            ) : null}
            {panel?.action === 'create' && panel.kind === 'baltina' ? (
              <CreateBaltinaForm
                draft={baltinaDraft}
                onChange={setBaltinaDraft}
                onCancel={closePanel}
                onSubmit={handleCreate}
                saving={creatingCatalog}
              />
            ) : null}
            {panel?.action === 'create' && panel.kind === 'drinks' ? (
              <CreateDrinksForm
                draft={drinksDraft}
                onChange={setDrinksDraft}
                onCancel={closePanel}
                onSubmit={handleCreate}
                saving={creatingCatalog}
              />
            ) : null}
            {panel?.action === 'create' && panel.kind === 'festival' ? (
              <CreateFestivalForm
                draft={festivalDraft}
                onChange={setFestivalDraft}
                onCancel={closePanel}
                onSubmit={handleCreate}
                saving={creatingCatalog}
              />
            ) : null}

            {panel?.action === 'edit' && panel.kind === 'baltina' ? (
              <BaltinaProductEditor
                item={panel.item}
                embedded
                onDelete={deleteItem}
                onSaved={async () => {
                  await refresh()
                  closePanel()
                }}
              />
            ) : null}
            {panel?.action === 'edit' && panel.kind === 'drinks' ? (
              <DrinksProductEditor
                item={panel.item}
                embedded
                onDelete={deleteItem}
                onSaved={async () => {
                  await refresh()
                  closePanel()
                }}
              />
            ) : null}
            {panel?.action === 'edit' && panel.kind === 'agelgil' ? (
              <AgelgilEditor
                item={panel.item}
                onDelete={deleteItem}
                onSaved={async () => {
                  await refresh()
                  closePanel()
                }}
              />
            ) : null}
            {panel?.action === 'edit' && panel.kind === 'catering' ? (
              <CateringPackageEditor
                item={panel.item}
                embedded
                onDelete={deleteItem}
                onSaved={async () => {
                  await refresh()
                  closePanel()
                }}
              />
            ) : null}
            {panel?.action === 'edit' && panel.kind === 'festival' ? (
              <FestivalPackageEditor
                item={panel.item}
                embedded
                onDelete={deleteItem}
                onSaved={async () => {
                  await refresh()
                  closePanel()
                }}
              />
            ) : null}
            {panel?.action === 'edit' && panel.kind === 'generic' ? (
              <GenericCatalogEditor
                item={panel.item}
                onDelete={deleteItem}
                onSaved={async () => {
                  await refresh()
                  closePanel()
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
