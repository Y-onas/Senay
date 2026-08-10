import { useEffect, useState } from 'react'
import { getLocalizedValue } from '@/cms/i18n'
import { LocalizedInput, LocalizedTextarea } from '@/cms/pages/cms-ui'
import { cmsApi, type CmsCatalogItem, type CmsService } from '@/services/cmsApi'

export default function CmsPackagesPage() {
  const [services, setServices] = useState<CmsService[]>([])
  const [items, setItems] = useState<CmsCatalogItem[]>([])
  const [filter, setFilter] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    const [svcs, catalog] = await Promise.all([
      cmsApi.services(),
      cmsApi.catalog(filter || undefined),
    ])
    setServices(svcs)
    setItems(catalog)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const toggle = async (item: CmsCatalogItem) => {
    await cmsApi.patchCatalog(item.id, { available: !item.available })
    setMsg(`${item.name} availability updated on website`)
    load()
  }

  const savePrice = async (item: CmsCatalogItem, price: number) => {
    await cmsApi.patchCatalog(item.id, { price })
    setMsg(`${item.name} price → ${price} ETB`)
    load()
  }

  const saveField = async (
    item: CmsCatalogItem,
    patch: Record<string, unknown>,
  ) => {
    await cmsApi.patchCatalog(item.id, patch)
    setMsg(`${item.name} saved`)
    load()
  }

  const remove = async (item: CmsCatalogItem) => {
    if (!confirm(`Delete ${item.name}?`)) return
    await cmsApi.deleteCatalog(item.id)
    setMsg('Deleted')
    load()
  }

  const grouped = services
    .filter((s) => !filter || s.slug === filter)
    .map((s) => ({
      service: s,
      items: items.filter((i) => i.serviceId === s.id || i.service?.id === s.id),
    }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-burgundy/60">Catalog</p>
          <h1 className="font-display text-3xl uppercase">Packages & products</h1>
          <p className="mt-1 text-sm text-gray-500">
            Prices and availability drive Baltina, Drinks, Festival, Catering, Agelgil.
          </p>
          {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">All services</option>
          {services.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {grouped.map(({ service, items: list }) => (
        <section key={service.id} className="space-y-3">
          <h2 className="font-display text-xl uppercase text-burgundy">{service.name}</h2>
          <div className="space-y-3">
            {list.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-burgundy/10 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{getLocalizedValue(item.nameI18n ?? item.name, 'en')}</p>
                    <p className="text-xs text-gray-500">
                      {item.kind} · {item.slug}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={item.available}
                        onChange={() => toggle(item)}
                      />
                      Available
                    </label>
                    <button
                      type="button"
                      onClick={() => remove(item)}
                      className="text-xs text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <LocalizedInput
                    label="Name"
                    value={item.nameI18n ?? { en: item.name }}
                    commitOnBlur
                    onChange={(next) =>
                      saveField(item, {
                        name: getLocalizedValue(next, 'en'),
                        nameI18n: next,
                      })
                    }
                    className="text-xs"
                  />
                  <label className="text-xs font-semibold uppercase text-gray-500">
                    Price (ETB)
                    <input
                      type="number"
                      defaultValue={item.price != null ? Number(item.price) : ''}
                      onBlur={(e) => {
                        const n = Number(e.target.value)
                        if (!Number.isNaN(n) && n !== Number(item.price)) {
                          savePrice(item, n)
                        }
                      }}
                      className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-normal normal-case"
                    />
                  </label>
                </div>
                <LocalizedTextarea
                  label="Description"
                  value={item.descriptionI18n ?? { en: item.description }}
                  rows={2}
                  commitOnBlur
                  onChange={(next) =>
                    saveField(item, {
                      description: getLocalizedValue(next, 'en'),
                      descriptionI18n: next,
                    })
                  }
                  className="mt-3"
                />
              </div>
            ))}
            {!list.length && (
              <p className="text-sm text-gray-500">No catalog items for this service.</p>
            )}
          </div>
        </section>
      ))}
    </div>
  )
}
