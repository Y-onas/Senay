import { useEffect, useMemo, useState } from 'react'
import { Pencil, Save, Type } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { catalogApi, type CatalogItem } from '@/lib/api'
import { CollapsibleServiceSection } from '@/features/services/components/CollapsibleServiceSection'
import {
  FORM_COPY_ROLE,
  FORM_COPY_SLUG,
  formCopyFieldsForSlug,
  mergeFormCopyValues,
  type FormCopyValues,
} from '@/features/services/form-copy-schema'

function readStoredFields(item: CatalogItem | null): FormCopyValues {
  const raw = item?.metadata?.fields
  if (!raw || typeof raw !== 'object') return {}
  return raw as FormCopyValues
}

export function FormCopyEditor({
  serviceId,
  serviceSlug,
  item,
  onRefresh,
}: {
  serviceId: string
  serviceSlug: string
  item: CatalogItem | null
  onRefresh: () => void | Promise<void>
}) {
  const fields = useMemo(() => formCopyFieldsForSlug(serviceSlug), [serviceSlug])
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [values, setValues] = useState<FormCopyValues>(() => mergeFormCopyValues(serviceSlug, readStoredFields(item)))

  useEffect(() => {
    setValues(mergeFormCopyValues(serviceSlug, readStoredFields(item)))
  }, [item, serviceSlug])

  const groups = useMemo(() => {
    const map = new Map<string, typeof fields>()
    for (const field of fields) {
      const list = map.get(field.group) ?? []
      list.push(field)
      map.set(field.group, list)
    }
    return [...map.entries()]
  }, [fields])

  const setLocale = (key: string, locale: 'en' | 'am', value: string) => {
    setValues((prev) => ({
      ...prev,
      [key]: {
        en: locale === 'en' ? value : prev[key]?.en ?? '',
        am: locale === 'am' ? value : prev[key]?.am ?? '',
      },
    }))
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        kind: 'CONFIG' as const,
        slug: FORM_COPY_SLUG,
        name: 'Order form texts',
        nameI18n: { en: 'Order form texts', am: 'የትዕዛዝ ቅጽ ጽሑፎች' },
        description: 'English and Amharic labels for the website order form.',
        available: true,
        metadata: {
          catalogRole: FORM_COPY_ROLE,
          fields: values,
        },
      }
      if (item) await catalogApi.update(item.id, payload)
      else
        await catalogApi.create({
          serviceId,
          ...payload,
          sortOrder: 999,
        })
      toast.success('Order form texts saved')
      setOpen(false)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <CollapsibleServiceSection
        title="Order form texts"
        description="Hardcoded website labels — English and Amharic — so Amharic mode can show translated form copy."
        count={fields.length}
        icon={
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-burgundy/10 text-burgundy">
            <Type className="h-4 w-4" />
          </span>
        }
        headerAction={
          <Button size="sm" onClick={() => setOpen(true)} className="gap-1.5">
            <Pencil className="h-4 w-4" />
            Edit texts
          </Button>
        }
      >
        <div className="space-y-2">
          {fields.slice(0, 8).map((field) => {
            const row = values[field.key]
            return (
              <div key={field.key} className="rounded-lg border border-border/70 px-4 py-3">
                <p className="text-xs font-medium text-brown-muted">{field.label}</p>
                <p className="mt-0.5 truncate text-sm font-medium text-brown">{row?.en || field.en}</p>
                <p className="truncate text-sm text-brown/60">{row?.am || field.am || '—'}</p>
              </div>
            )
          })}
          {fields.length > 8 ? (
            <p className="pt-1 text-sm text-brown-muted">
              +{fields.length - 8} more. Use Edit texts to change English and Amharic for every label.
            </p>
          ) : null}
        </div>
      </CollapsibleServiceSection>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-xl lg:max-w-2xl">
          <SheetHeader className="border-b border-border/70 bg-cream/50 px-5 py-4 text-left">
            <SheetTitle className="font-display text-xl text-burgundy">Order form texts</SheetTitle>
            <SheetDescription>
              Edit the English and Amharic shown on this service’s order form. Empty Amharic falls back to English on
              the website.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5">
            {groups.map(([group, groupFields]) => (
              <section key={group} className="space-y-4">
                <h3 className="font-display text-base font-semibold text-burgundy">{group}</h3>
                {groupFields.map((field) => {
                  const row = values[field.key] ?? { en: field.en, am: field.am }
                  return (
                    <div key={field.key} className="space-y-2">
                      <p className="text-sm font-medium text-brown">{field.label}</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">English</p>
                          {field.multiline ? (
                            <Textarea
                              value={row.en}
                              rows={3}
                              onChange={(e) => setLocale(field.key, 'en', e.target.value)}
                            />
                          ) : (
                            <Input
                              value={row.en}
                              onChange={(e) => setLocale(field.key, 'en', e.target.value)}
                            />
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">Amharic</p>
                          {field.multiline ? (
                            <Textarea
                              value={row.am}
                              rows={3}
                              onChange={(e) => setLocale(field.key, 'am', e.target.value)}
                            />
                          ) : (
                            <Input
                              value={row.am}
                              onChange={(e) => setLocale(field.key, 'am', e.target.value)}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </section>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t border-border/70 px-5 py-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={save} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save texts'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
