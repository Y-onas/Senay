import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { settingsApi } from '@/lib/api'
import {
  ensureLocalized,
  normalizeField,
  writeLocale,
  type LocalizedText,
} from '@/lib/i18n'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type HoursRow = { day: LocalizedText; hours: LocalizedText }
type Branch = {
  id: string
  name: LocalizedText
  area: LocalizedText
  mapUrl: string
  image: string
}

type ContactDraft = {
  eyebrow: LocalizedText
  title: LocalizedText
  description: LocalizedText
  formTitle: LocalizedText
  phone: string
  email: string
  hoursTitle: LocalizedText
  contactTitle: LocalizedText
  openingHours: HoursRow[]
  locationsTitle: LocalizedText
  locationsDescription: LocalizedText
  locationsButtonText: LocalizedText
  branches: Branch[]
}

function defaultBranches(): Branch[] {
  return [
    {
      id: 'lebu',
      name: { en: 'Lebu Muzika Sefer', am: 'ለቡ ሙዚካ ሰፈር' },
      area: { en: 'Lebu · Addis Ababa', am: 'ለቡ · አዲስ አበባ' },
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Lebu+Muzika+Sefer+Addis+Ababa',
      image: '',
    },
    {
      id: 'figa',
      name: { en: 'Figa Mebrat Summit Road', am: 'ፊጋ መብራት ሳሚት መንገድ' },
      area: { en: 'Summit · Addis Ababa', am: 'ሳሚት · አዲስ አበባ' },
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Figa+Mebrat+Summit+Road+Addis+Ababa',
      image: '',
    },
    {
      id: 'jemo',
      name: { en: 'Jemo 1 Condominium', am: 'ጀሞ 1 ኮንዶሚኒየም' },
      area: { en: 'Jemo · Addis Ababa', am: 'ጀሞ · አዲስ አበባ' },
      mapUrl: 'https://www.google.com/maps/search/?api=1&query=Jemo+1+Condominium+Addis+Ababa',
      image: '',
    },
  ]
}

function defaultHours(): HoursRow[] {
  return [
    {
      day: { en: 'Monday – Thursday', am: 'ሰኞ – ሐሙስ' },
      hours: { en: '11:00 AM – 10:00 PM', am: '11:00 ጥዋት – 10:00 ማታ' },
    },
    {
      day: { en: 'Friday – Saturday', am: 'ዓርብ – ቅዳሜ' },
      hours: { en: '11:00 AM – 12:00 AM', am: '11:00 ጥዋት – 12:00 ጥዋት' },
    },
    {
      day: { en: 'Sunday', am: 'እሑድ' },
      hours: { en: '12:00 PM – 9:00 PM', am: '12:00 ቀን – 9:00 ማታ' },
    },
  ]
}

function normalizeHours(list: unknown): HoursRow[] {
  if (!Array.isArray(list)) return []
  return list.map((entry) => {
    const item = entry as Record<string, unknown>
    return {
      day: normalizeField(item.day),
      hours: normalizeField(item.hours),
    }
  })
}

function normalizeBranches(list: unknown): Branch[] {
  if (!Array.isArray(list)) return []
  return list.map((entry) => {
    const item = entry as Record<string, unknown>
    return {
      id: typeof item.id === 'string' ? item.id : '',
      name: normalizeField(item.name),
      area: normalizeField(item.area),
      mapUrl: typeof item.mapUrl === 'string' ? item.mapUrl : '',
      image: typeof item.image === 'string' ? item.image : '',
    }
  })
}

function normalizeDraft(raw: unknown): ContactDraft {
  const data = (raw ?? {}) as Record<string, unknown>
  return {
    eyebrow: normalizeField(data.eyebrow),
    title: normalizeField(data.title),
    description: normalizeField(data.description),
    formTitle: normalizeField(data.formTitle),
    phone: typeof data.phone === 'string' ? data.phone : '',
    email: typeof data.email === 'string' ? data.email : '',
    hoursTitle: normalizeField(data.hoursTitle),
    contactTitle: normalizeField(data.contactTitle),
    openingHours:
      Array.isArray(data.openingHours) && data.openingHours.length
        ? normalizeHours(data.openingHours)
        : defaultHours(),
    locationsTitle: normalizeField(data.locationsTitle),
    locationsDescription: normalizeField(data.locationsDescription),
    locationsButtonText: normalizeField(data.locationsButtonText),
    branches:
      Array.isArray(data.branches) && data.branches.length
        ? normalizeBranches(data.branches)
        : defaultBranches(),
  }
}

export function ContactPage() {
  const [draft, setDraft] = useState<ContactDraft>(() => normalizeDraft(null))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi
      .get('page:contact')
      .then((data) => setDraft(normalizeDraft(data)))
      .finally(() => setLoading(false))
  }, [])

  const setBranchField = (
    index: number,
    key: 'id' | 'mapUrl' | 'image' | 'name' | 'area',
    lang: 'en' | 'am' | null,
    text: string,
  ) => {
    if (key === 'mapUrl' || key === 'image' || key === 'id') {
      setDraft((prev) => {
        const list = [...prev.branches]
        const current = list[index]
        if (!current) return prev
        list[index] = { ...current, [key]: text }
        return { ...prev, branches: list }
      })
      return
    }
    setDraft((prev) => {
      const list = [...prev.branches]
      const current = list[index]
      if (!current || !lang) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, branches: list }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        eyebrow: ensureLocalized(draft.eyebrow),
        title: ensureLocalized(draft.title),
        description: ensureLocalized(draft.description),
        formTitle: ensureLocalized(draft.formTitle),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        hoursTitle: ensureLocalized(draft.hoursTitle),
        contactTitle: ensureLocalized(draft.contactTitle),
        openingHours: draft.openingHours
          .map((entry) => ({
            day: ensureLocalized(entry.day),
            hours: ensureLocalized(entry.hours),
          }))
          .filter((entry) => entry.day.en || entry.day.am || entry.hours.en || entry.hours.am),
        locationsTitle: ensureLocalized(draft.locationsTitle),
        locationsDescription: ensureLocalized(draft.locationsDescription),
        locationsButtonText: ensureLocalized(draft.locationsButtonText),
        branches: draft.branches
          .map((entry, idx) => ({
            id: entry.id.trim() || `branch-${idx + 1}`,
            name: ensureLocalized(entry.name),
            area: ensureLocalized(entry.area),
            mapUrl: entry.mapUrl.trim(),
            image: entry.image ?? '',
          }))
          .filter((entry) => entry.name.en || entry.name.am || entry.area.en || entry.area.am),
      }
      await settingsApi.put('page:contact', payload)

      const restaurant = (await settingsApi.get('restaurant').catch(() => ({}))) as Record<string, unknown>
      const openingHoursEn = payload.openingHours
        .map((entry) => ({ day: entry.day.en, hours: entry.hours.en }))
        .filter((entry) => entry.day || entry.hours)
      await settingsApi.put('restaurant', {
        ...restaurant,
        phone: payload.phone,
        email: payload.email,
        openingHours: openingHoursEn.length ? openingHoursEn : restaurant.openingHours,
      })

      setDraft(normalizeDraft(payload))
      toast.success('Contact page saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Contact Us"
        description="Edit the contact page hero, hours, phone, email and branch locations."
        actions={
          <Button onClick={save} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving…' : 'Save contact page'}
          </Button>
        }
      />

      <Card className="border-yellow-brand/30 bg-yellow-brand/5 p-4">
        <p className="text-sm text-brown/65">
          Messages from the contact form appear in{' '}
          <Link to="/contact-messages" className="font-semibold text-burgundy underline">
            Contact Messages
          </Link>
          .
        </p>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page heading</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedField
            label="Eyebrow"
            value={draft.eyebrow}
            enPlaceholder="Contact"
            amPlaceholder="እውቂያ"
            onChange={(eyebrow) => setDraft((prev) => ({ ...prev, eyebrow }))}
          />
          <LocalizedField
            label="Title"
            value={draft.title}
            enPlaceholder="We'd love to hear from you"
            amPlaceholder="ከእናንተ መስማት እንደምንፈልግ ነው"
            onChange={(title) => setDraft((prev) => ({ ...prev, title }))}
          />
          <LocalizedField
            label="Description"
            value={draft.description}
            multiline
            enPlaceholder="Questions, reservations or feedback — reach out and our team will get back to you."
            amPlaceholder="ጥያቄዎች፣ ቦታ ማስያዝ ወይም አስተያየት — ያግኙን እና ቡድናችን ይመለስልዎታል።"
            onChange={(description) => setDraft((prev) => ({ ...prev, description }))}
          />
          <LocalizedField
            label="Form title"
            value={draft.formTitle}
            enPlaceholder="Send a message"
            amPlaceholder="መልእክት ይላኩ"
            onChange={(formTitle) => setDraft((prev) => ({ ...prev, formTitle }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opening hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <LocalizedField
            label="Section title"
            value={draft.hoursTitle}
            enPlaceholder="Opening Hours"
            amPlaceholder="የመክፈቻ ሰዓቶች"
            onChange={(hoursTitle) => setDraft((prev) => ({ ...prev, hoursTitle }))}
          />
          {draft.openingHours.map((row, idx) => (
            <div key={idx} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <Label>Hours row {idx + 1}</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      openingHours: prev.openingHours.filter((_, j) => j !== idx),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <LocalizedField
                label="Day label"
                value={row.day}
                enPlaceholder="Monday – Thursday"
                amPlaceholder="ሰኞ – ሐሙስ"
                onChange={(day) => {
                  setDraft((prev) => {
                    const list = [...prev.openingHours]
                    list[idx] = { ...list[idx], day }
                    return { ...prev, openingHours: list }
                  })
                }}
              />
              <LocalizedField
                label="Hours"
                value={row.hours}
                enPlaceholder="11:00 AM – 10:00 PM"
                amPlaceholder="11:00 ጥዋት – 10:00 ማታ"
                onChange={(hours) => {
                  setDraft((prev) => {
                    const list = [...prev.openingHours]
                    list[idx] = { ...list[idx], hours }
                    return { ...prev, openingHours: list }
                  })
                }}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                openingHours: [...prev.openingHours, { day: { en: '', am: '' }, hours: { en: '', am: '' } }],
              }))
            }
          >
            + Add hours row
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Get in touch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedField
            label="Section title"
            value={draft.contactTitle}
            enPlaceholder="Get in touch"
            amPlaceholder="ያግኙን"
            onChange={(contactTitle) => setDraft((prev) => ({ ...prev, contactTitle }))}
          />
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input
              value={draft.phone}
              onChange={(e) => setDraft((prev) => ({ ...prev, phone: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={draft.email}
              onChange={(e) => setDraft((prev) => ({ ...prev, email: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locations section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <LocalizedField
            label="Section title"
            value={draft.locationsTitle}
            enPlaceholder="Locations"
            amPlaceholder="ቦታዎች"
            onChange={(locationsTitle) => setDraft((prev) => ({ ...prev, locationsTitle }))}
          />
          <LocalizedField
            label="Description"
            value={draft.locationsDescription}
            multiline
            enPlaceholder="Visit any of our three Addis Ababa branches for authentic Ethiopian food and house-brewed drinks."
            amPlaceholder="ባህላዊ የኢትዮጵያ ምግብና በቤት የተጠመቁ መጠጦችን ለመገኘት በአዲስ አበባ ያሉን ሶስት ቅርንጫፎች ይጎብኙ።"
            onChange={(locationsDescription) => setDraft((prev) => ({ ...prev, locationsDescription }))}
          />
          <LocalizedField
            label="Button text"
            value={draft.locationsButtonText}
            enPlaceholder="Explore all locations"
            amPlaceholder="ሁሉንም ቦታዎች ይመልከቱ"
            onChange={(locationsButtonText) => setDraft((prev) => ({ ...prev, locationsButtonText }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branches</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {draft.branches.map((branch, idx) => (
            <div key={branch.id || idx} className="space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <Label>Branch {idx + 1}</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraft((prev) => ({
                      ...prev,
                      branches: prev.branches.filter((_, j) => j !== idx),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <LocalizedField
                label="Name"
                value={branch.name}
                enPlaceholder="Lebu Muzika Sefer"
                amPlaceholder="ለቡ ሙዚካ ሰፈር"
                onChange={(name) => {
                  setDraft((prev) => {
                    const list = [...prev.branches]
                    list[idx] = { ...list[idx], name }
                    return { ...prev, branches: list }
                  })
                }}
              />
              <LocalizedField
                label="Area label"
                value={branch.area}
                enPlaceholder="Lebu · Addis Ababa"
                amPlaceholder="ለቡ · አዲስ አበባ"
                onChange={(area) => {
                  setDraft((prev) => {
                    const list = [...prev.branches]
                    list[idx] = { ...list[idx], area }
                    return { ...prev, branches: list }
                  })
                }}
              />
              <div className="space-y-2 md:col-span-2">
                <Label>Google Maps link</Label>
                <Input
                  value={branch.mapUrl}
                  onChange={(e) => setBranchField(idx, 'mapUrl', null, e.target.value)}
                />
              </div>
              <ImageUploader
                label="Branch photo (optional)"
                value={branch.image || ''}
                aspect="wide"
                onChange={(url) => setBranchField(idx, 'image', null, url || '')}
              />
            </div>
          ))}
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraft((prev) => ({
                ...prev,
                branches: [
                  ...prev.branches,
                  {
                    id: `branch-${Date.now()}`,
                    name: { en: '', am: '' },
                    area: { en: '', am: '' },
                    mapUrl: '',
                    image: '',
                  },
                ],
              }))
            }
          >
            + Add branch
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
