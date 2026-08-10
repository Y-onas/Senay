import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { catalogApi } from '@/lib/api'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FieldGroup } from '@/features/services/components/FieldGroup'
import {
  BALTINA_CATEGORIES,
  beveragePricingFromRegular,
  parseNumber,
  slugifyCatalog,
} from '@/features/services/service-helpers'

export type CreateCateringDraft = {
  name: string
  slug: string
  mealType: string
  tier: string
  regularPrice: string
}

export type CreateBaltinaDraft = {
  name: string
  nameEn: string
  nameAm: string
  slug: string
  category: string
  price: string
  unit: string
  minQty: string
  step: string
  image: string
  description: string
  descEn: string
  descAm: string
}

export type CreateDrinksDraft = {
  name: string
  nameEn: string
  nameAm: string
  slug: string
  price: string
  unit: string
  minQty: string
  step: string
  image: string
  description: string
  descEn: string
  descAm: string
}

export type CreateFestivalDraft = {
  name: string
  slug: string
  price: string
  tagline: string
  badge: string
}

export function CreateCateringForm({
  draft,
  onChange,
  onCancel,
  onSubmit,
  saving,
}: {
  draft: CreateCateringDraft
  onChange: (next: CreateCateringDraft) => void
  onCancel: () => void
  onSubmit: () => void
  saving: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldGroup label="Package name">
        <Input
          placeholder="e.g. Platinum Feast"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Slug">
        <Input
          placeholder="platinum"
          value={draft.slug}
          onChange={(e) => onChange({ ...draft, slug: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Regular price (food only)">
        <Input
          placeholder="0"
          type="number"
          value={draft.regularPrice}
          onChange={(e) => onChange({ ...draft, regularPrice: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Meal type">
        <Select
          value={draft.mealType}
          onValueChange={(mealType) =>
            onChange({
              ...draft,
              mealType,
              tier: mealType === 'fasting' ? 'fasting' : 'silver',
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fasting">Fasting</SelectItem>
            <SelectItem value="non-fasting">Non-fasting</SelectItem>
          </SelectContent>
        </Select>
      </FieldGroup>
      <FieldGroup label="Tier">
        <Select value={draft.tier} onValueChange={(tier) => onChange({ ...draft, tier })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="fasting">Fasting</SelectItem>
            <SelectItem value="platinum">Platinum</SelectItem>
            <SelectItem value="gold">Gold</SelectItem>
            <SelectItem value="silver">Silver</SelectItem>
          </SelectContent>
        </Select>
      </FieldGroup>
      <div className="flex justify-end gap-2 border-t border-border/60 pt-4 sm:col-span-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving} className="gap-2">
          <Plus className="h-4 w-4" />
          {saving ? 'Creating…' : 'Create package'}
        </Button>
      </div>
    </div>
  )
}

function LocaleNameFields({
  nameEn,
  nameAm,
  onEn,
  onAm,
  enPlaceholder,
  amPlaceholder,
}: {
  nameEn: string
  nameAm: string
  onEn: (value: string) => void
  onAm: (value: string) => void
  enPlaceholder: string
  amPlaceholder: string
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Name</Label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-muted">EN</p>
          <Input placeholder={enPlaceholder} value={nameEn} onChange={(e) => onEn(e.target.value)} />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-muted">AM</p>
          <Input placeholder={amPlaceholder} value={nameAm} onChange={(e) => onAm(e.target.value)} />
        </div>
      </div>
    </div>
  )
}

function LocaleDescriptionFields({
  descEn,
  descAm,
  onEn,
  onAm,
}: {
  descEn: string
  descAm: string
  onEn: (value: string) => void
  onAm: (value: string) => void
}) {
  return (
    <div className="space-y-2 sm:col-span-2">
      <Label>Description</Label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-muted">EN</p>
          <Textarea
            rows={2}
            placeholder="Short description"
            value={descEn}
            onChange={(e) => onEn(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown-muted">AM</p>
          <Textarea rows={2} placeholder="አጭር መግለጫ" value={descAm} onChange={(e) => onAm(e.target.value)} />
        </div>
      </div>
    </div>
  )
}

export function CreateBaltinaForm({
  draft,
  onChange,
  onCancel,
  onSubmit,
  saving,
}: {
  draft: CreateBaltinaDraft
  onChange: (next: CreateBaltinaDraft) => void
  onCancel: () => void
  onSubmit: () => void
  saving: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <LocaleNameFields
        nameEn={draft.nameEn}
        nameAm={draft.nameAm}
        enPlaceholder="e.g. Shiro"
        amPlaceholder="ሽሮ"
        onEn={(nameEn) => onChange({ ...draft, nameEn, name: nameEn })}
        onAm={(nameAm) => onChange({ ...draft, nameAm })}
      />
      <FieldGroup label="Slug">
        <Input
          placeholder="shiro"
          value={draft.slug}
          onChange={(e) => onChange({ ...draft, slug: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Category">
        <Select value={draft.category} onValueChange={(category) => onChange({ ...draft, category })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BALTINA_CATEGORIES.map((entry) => (
              <SelectItem key={entry.value} value={entry.value}>
                {entry.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldGroup>
      <FieldGroup label="Price">
        <Input
          placeholder="0"
          type="number"
          value={draft.price}
          onChange={(e) => onChange({ ...draft, price: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Unit">
        <Input
          placeholder="kg, bottle..."
          value={draft.unit}
          onChange={(e) => onChange({ ...draft, unit: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Minimum quantity">
        <Input
          type="number"
          step="0.1"
          value={draft.minQty}
          onChange={(e) => onChange({ ...draft, minQty: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Step quantity">
        <Input
          type="number"
          step="0.1"
          value={draft.step}
          onChange={(e) => onChange({ ...draft, step: e.target.value })}
        />
      </FieldGroup>
      <div className="sm:col-span-2">
        <ImageUploader
          label="Product image"
          value={draft.image || null}
          onChange={(url) => onChange({ ...draft, image: url || '' })}
        />
      </div>
      <LocaleDescriptionFields
        descEn={draft.descEn}
        descAm={draft.descAm}
        onEn={(descEn) => onChange({ ...draft, descEn, description: descEn })}
        onAm={(descAm) => onChange({ ...draft, descAm })}
      />
      <div className="flex justify-end gap-2 border-t border-border/60 pt-4 sm:col-span-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving} className="gap-2">
          <Plus className="h-4 w-4" />
          {saving ? 'Creating…' : 'Create product'}
        </Button>
      </div>
    </div>
  )
}

export function CreateDrinksForm({
  draft,
  onChange,
  onCancel,
  onSubmit,
  saving,
}: {
  draft: CreateDrinksDraft
  onChange: (next: CreateDrinksDraft) => void
  onCancel: () => void
  onSubmit: () => void
  saving: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <LocaleNameFields
        nameEn={draft.nameEn}
        nameAm={draft.nameAm}
        enPlaceholder="e.g. Tela"
        amPlaceholder="ጠላ"
        onEn={(nameEn) => onChange({ ...draft, nameEn, name: nameEn })}
        onAm={(nameAm) => onChange({ ...draft, nameAm })}
      />
      <FieldGroup label="Slug">
        <Input
          placeholder="tela"
          value={draft.slug}
          onChange={(e) => onChange({ ...draft, slug: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Price">
        <Input
          placeholder="0"
          type="number"
          value={draft.price}
          onChange={(e) => onChange({ ...draft, price: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Unit">
        <Input
          placeholder="L"
          value={draft.unit}
          onChange={(e) => onChange({ ...draft, unit: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Minimum quantity">
        <Input
          type="number"
          step="0.1"
          value={draft.minQty}
          onChange={(e) => onChange({ ...draft, minQty: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Step quantity">
        <Input
          type="number"
          step="0.1"
          value={draft.step}
          onChange={(e) => onChange({ ...draft, step: e.target.value })}
        />
      </FieldGroup>
      <div className="sm:col-span-2">
        <ImageUploader
          label="Product image"
          value={draft.image || null}
          onChange={(url) => onChange({ ...draft, image: url || '' })}
        />
      </div>
      <LocaleDescriptionFields
        descEn={draft.descEn}
        descAm={draft.descAm}
        onEn={(descEn) => onChange({ ...draft, descEn, description: descEn })}
        onAm={(descAm) => onChange({ ...draft, descAm })}
      />
      <div className="flex justify-end gap-2 border-t border-border/60 pt-4 sm:col-span-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving} className="gap-2">
          <Plus className="h-4 w-4" />
          {saving ? 'Creating…' : 'Create product'}
        </Button>
      </div>
    </div>
  )
}

export function CreateFestivalForm({
  draft,
  onChange,
  onCancel,
  onSubmit,
  saving,
}: {
  draft: CreateFestivalDraft
  onChange: (next: CreateFestivalDraft) => void
  onCancel: () => void
  onSubmit: () => void
  saving: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <FieldGroup label="Package name">
        <Input value={draft.name} onChange={(e) => onChange({ ...draft, name: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Slug">
        <Input value={draft.slug} onChange={(e) => onChange({ ...draft, slug: e.target.value })} />
      </FieldGroup>
      <FieldGroup label="Price">
        <Input
          type="number"
          value={draft.price}
          onChange={(e) => onChange({ ...draft, price: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Badge">
        <Input
          placeholder="Popular"
          value={draft.badge}
          onChange={(e) => onChange({ ...draft, badge: e.target.value })}
        />
      </FieldGroup>
      <FieldGroup label="Tagline" className="sm:col-span-2">
        <Input value={draft.tagline} onChange={(e) => onChange({ ...draft, tagline: e.target.value })} />
      </FieldGroup>
      <div className="flex justify-end gap-2 border-t border-border/60 pt-4 sm:col-span-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={saving} className="gap-2">
          <Plus className="h-4 w-4" />
          {saving ? 'Creating…' : 'Create package'}
        </Button>
      </div>
    </div>
  )
}

export async function submitCateringCreate(serviceId: string, draft: CreateCateringDraft) {
  if (!draft.name.trim() || !draft.slug.trim()) {
    toast.error('Package name and slug are required')
    return false
  }
  const regular = parseNumber(draft.regularPrice)
  await catalogApi.create({
    serviceId,
    kind: 'PACKAGE',
    slug: slugifyCatalog(draft.slug),
    name: draft.name.trim(),
    description: '',
    price: regular,
    available: true,
    metadata: {
      mealType: draft.mealType,
      tier: draft.mealType === 'fasting' ? 'fasting' : draft.tier,
      nameAm: '',
      dishes: [],
      fixedPricePerGuest: regular,
      beveragePricing: beveragePricingFromRegular(regular),
    },
  })
  toast.success('Catering package created')
  return true
}

export async function submitBaltinaCreate(serviceId: string, draft: CreateBaltinaDraft) {
  if (!draft.name.trim() || !draft.slug.trim()) {
    toast.error('Product name and slug are required')
    return false
  }
  await catalogApi.create({
    serviceId,
    kind: 'PRODUCT',
    slug: slugifyCatalog(draft.slug),
    name: (draft.nameEn || draft.name).trim(),
    nameI18n: { en: (draft.nameEn || draft.name).trim(), am: draft.nameAm.trim() },
    description: (draft.descEn || draft.description).trim(),
    descriptionI18n: { en: (draft.descEn || draft.description).trim(), am: draft.descAm.trim() },
    price: parseNumber(draft.price),
    image: draft.image.trim() || null,
    available: true,
    metadata: {
      category: draft.category,
      unit: draft.unit.trim() || 'kg',
      minQty: parseNumber(draft.minQty || '0.5'),
      step: parseNumber(draft.step || '0.5'),
    },
  })
  toast.success('Baltina product created')
  return true
}

export async function submitDrinksCreate(serviceId: string, draft: CreateDrinksDraft) {
  if (!draft.name.trim() || !draft.slug.trim()) {
    toast.error('Product name and slug are required')
    return false
  }
  await catalogApi.create({
    serviceId,
    kind: 'PRODUCT',
    slug: slugifyCatalog(draft.slug),
    name: (draft.nameEn || draft.name).trim(),
    nameI18n: { en: (draft.nameEn || draft.name).trim(), am: draft.nameAm.trim() },
    description: (draft.descEn || draft.description).trim(),
    descriptionI18n: { en: (draft.descEn || draft.description).trim(), am: draft.descAm.trim() },
    price: parseNumber(draft.price),
    image: draft.image.trim() || null,
    available: true,
    metadata: {
      category: 'drinks',
      unit: draft.unit.trim() || 'L',
      minQty: parseNumber(draft.minQty || '1'),
      step: parseNumber(draft.step || '0.5'),
    },
  })
  toast.success('Drinks product created')
  return true
}

export async function submitFestivalCreate(serviceId: string, draft: CreateFestivalDraft) {
  if (!draft.name.trim() || !draft.slug.trim()) {
    toast.error('Package name and slug are required')
    return false
  }
  await catalogApi.create({
    serviceId,
    kind: 'PACKAGE',
    slug: slugifyCatalog(draft.slug),
    name: draft.name.trim(),
    description: draft.tagline.trim(),
    price: parseNumber(draft.price),
    available: true,
    metadata: {
      tagline: draft.tagline.trim(),
      badge: draft.badge || undefined,
      items: [],
    },
  })
  toast.success('Festival package created')
  return true
}
