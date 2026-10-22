import { useEffect, useMemo, useState } from 'react'
import { cmsApi, type CmsFaq, type CmsGalleryItem, type CmsTestimonial } from '@/services/cmsApi'
import {
  PAGE_TABS,
  type PageHero,
  type PageTab,
  PageHeroFields,
  usePageCms,
} from './pages/shared'
import {
  ActionMenu,
  AddButton,
  ConfirmDialog,
  DataTable,
  EmptyState,
  FormField,
  ImageField,
  KeyValueList,
  Modal,
  OfferCardEditor,
  SectionPanel,
  StickySaveBar,
  Toolbar,
  ViewSiteLink,
  inputClass,
  slugify,
  type OfferCardData,
} from './pages/cms-ui'

type HomeSections = {
  heroCarousel?: { src: string; alt: string }[]
  gallerySection?: { eyebrow?: string; title?: string; description?: string }
  testimonialsSection?: { eyebrow?: string; title?: string }
  offersSection?: {
    eyebrow?: string
    title?: string
    description?: string
    cards?: OfferCardData[]
  }
  videoSection?: { url?: string; title?: string; subtitle?: string }
}

const HOME_SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'testimonials', label: 'Reviews' },
  { id: 'offers', label: 'Offers' },
  { id: 'video', label: 'Video' },
  { id: 'faq', label: 'FAQ' },
] as const

type HomeSectionId = (typeof HOME_SECTIONS)[number]['id']

export default function CmsPagesPage() {
  const cms = usePageCms()
  const [tab, setTab] = useState<PageTab>('home')
  const [homeSection, setHomeSection] = useState<HomeSectionId>('hero')
  const [saving, setSaving] = useState(false)

  const pageKey = (id: PageTab) => (id === 'home' ? 'homepage' : `page:${id}`)

  const savedHero = useMemo(() => (cms.settings[pageKey(tab)] as PageHero) ?? {}, [cms.settings, tab])
  const [draft, setDraft] = useState<PageHero>({})
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedHero)

  useEffect(() => {
    setDraft(savedHero)
  }, [savedHero, tab])

  const switchTab = (id: PageTab) => {
    setTab(id)
    setHomeSection('hero')
  }

  const saveDraft = async () => {
    setSaving(true)
    try {
      const key = pageKey(tab)
      const value =
        tab === 'home'
          ? {
              heroEyebrow: draft.eyebrow ?? draft.heroEyebrow,
              heroHeadline: draft.title ?? draft.heroHeadline,
              heroSubcopy: draft.description ?? draft.heroSubcopy,
              ...draft,
            }
          : draft
      await cms.savePage(key, value, PAGE_TABS.find((t) => t.id === tab)?.label ?? tab)
    } finally {
      setSaving(false)
    }
  }

  if (cms.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        Loading page editor…
      </div>
    )
  }

  const currentTab = PAGE_TABS.find((t) => t.id === tab)

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-burgundy/60">Website content</p>
          <h1 className="font-display text-3xl uppercase">Pages</h1>
          <p className="mt-1 max-w-xl text-sm text-gray-500">
            Edit what visitors see. Changes go live after you click Save. Service menus stay under
            Services.
          </p>
        </div>
        <ViewSiteLink path={tab === 'home' ? '/' : `/${tab}`} />
      </div>

      {cms.msg && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {cms.msg}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PAGE_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`shrink-0 rounded-2xl px-4 py-2.5 text-left transition ${
              tab === t.id
                ? 'bg-burgundy text-white shadow-sm'
                : 'border border-burgundy/15 bg-white text-gray-700 hover:border-burgundy/30'
            }`}
          >
            <span className="block text-sm font-medium">{t.label}</span>
            <span className={`block text-[11px] ${tab === t.id ? 'text-white/70' : 'text-gray-400'}`}>
              {t.hint}
            </span>
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <>
          <div className="flex flex-wrap gap-2">
            {HOME_SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setHomeSection(s.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  homeSection === s.id
                    ? 'bg-burgundy/10 text-burgundy'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {homeSection === 'hero' && <HomeHeroSection draft={draft} setDraft={setDraft} />}
          {homeSection === 'gallery' && <HomeGallerySection draft={draft} setDraft={setDraft} cms={cms} />}
          {homeSection === 'testimonials' && (
            <HomeTestimonialsSection draft={draft} setDraft={setDraft} cms={cms} />
          )}
          {homeSection === 'offers' && <HomeOffersSection draft={draft} setDraft={setDraft} />}
          {homeSection === 'video' && <HomeVideoSection draft={draft} setDraft={setDraft} />}
          {homeSection === 'faq' && <HomeFaqSection cms={cms} />}

          {(homeSection === 'hero' ||
            homeSection === 'gallery' ||
            homeSection === 'testimonials' ||
            homeSection === 'offers' ||
            homeSection === 'video') && (
            <StickySaveBar
              label="Save home page"
              saving={saving}
              dirty={dirty}
              onSave={saveDraft}
              onCancel={() => setDraft(savedHero)}
              msg={dirty ? undefined : cms.msg}
            />
          )}
        </>
      )}

      {tab === 'blog' && <BlogEditor cms={cms} />}
      {tab === 'about' && (
        <>
          <AboutEditor draft={draft} setDraft={setDraft} />
          <StickySaveBar
            label="Save about page"
            saving={saving}
            dirty={dirty}
            onSave={saveDraft}
            onCancel={() => setDraft(savedHero)}
          />
        </>
      )}
      {tab === 'contact' && (
        <ContactEditor
          draft={draft}
          setDraft={setDraft}
          cms={cms}
          saving={saving}
          onSaveHero={saveDraft}
        />
      )}

      {!['home', 'about'].includes(tab) && tab !== 'contact' && currentTab && (
        <p className="text-xs text-gray-500">Remember to save after editing {currentTab.label.toLowerCase()} content.</p>
      )}
    </div>
  )
}

function patchDraft(
  draft: PageHero,
  setDraft: (d: PageHero) => void,
  patch: Partial<HomeSections & PageHero>,
) {
  setDraft({ ...draft, ...patch })
}

function HomeHeroSection({
  draft,
  setDraft,
}: {
  draft: PageHero
  setDraft: (d: PageHero) => void
}) {
  const sections = draft as HomeSections & PageHero
  const carousel = sections.heroCarousel ?? []

  return (
    <div className="space-y-4">
      <SectionPanel title="Main headline" description="The big banner text visitors see first" defaultOpen>
        <PageHeroFields
          value={{
            eyebrow: draft.eyebrow ?? draft.heroEyebrow ?? '',
            title: draft.title ?? draft.heroHeadline ?? '',
            description: draft.description ?? draft.heroSubcopy ?? '',
          }}
          onChange={(next) =>
            setDraft({
              ...draft,
              eyebrow: next.eyebrow,
              title: next.title,
              description: next.description,
              heroEyebrow: next.eyebrow,
              heroHeadline: next.title,
              heroSubcopy: next.description,
            })
          }
        />
      </SectionPanel>

      <SectionPanel title="Rotating product images" description="Photos that slide behind the headline" defaultOpen>
        <div className="space-y-4">
          {carousel.map((item, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Slide {i + 1}</span>
                <button
                  type="button"
                  onClick={() =>
                    patchDraft(draft, setDraft, {
                      heroCarousel: carousel.filter((_, j) => j !== i),
                    })
                  }
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <ImageField
                label="Image"
                value={item.src}
                onChange={(src) => {
                  const next = [...carousel]
                  next[i] = { ...next[i], src }
                  patchDraft(draft, setDraft, { heroCarousel: next })
                }}
              />
              <FormField label="Description for accessibility">
                <input
                  className={inputClass()}
                  value={item.alt}
                  onChange={(e) => {
                    const next = [...carousel]
                    next[i] = { ...next[i], alt: e.target.value }
                    patchDraft(draft, setDraft, { heroCarousel: next })
                  }}
                  placeholder="e.g. House Tela in clay pot"
                />
              </FormField>
            </div>
          ))}
          <button
            type="button"
            onClick={() =>
              patchDraft(draft, setDraft, {
                heroCarousel: [...carousel, { src: '/images/tela-clean.png', alt: '' }],
              })
            }
            className="rounded-xl border border-dashed border-burgundy/25 px-4 py-2 text-sm text-burgundy hover:bg-burgundy/[0.03]"
          >
            + Add slide
          </button>
        </div>
      </SectionPanel>
    </div>
  )
}

function HomeGallerySection({
  draft,
  setDraft,
  cms,
}: {
  draft: PageHero
  setDraft: (d: PageHero) => void
  cms: ReturnType<typeof usePageCms>
}) {
  const sec = ((draft as HomeSections).gallerySection ?? {}) as NonNullable<HomeSections['gallerySection']>
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; item?: CmsGalleryItem }>({ open: false })
  const [modal, setModal] = useState<{ open: boolean; item?: CmsGalleryItem }>({ open: false })
  const [form, setForm] = useState({ url: '', name: '', category: 'food', tall: false })

  const filtered = useMemo(() => {
    if (!q.trim()) return cms.gallery
    return cms.gallery.filter(
      (g) =>
        (g.name ?? '').toLowerCase().includes(q.toLowerCase()) ||
        g.category.toLowerCase().includes(q.toLowerCase()),
    )
  }, [cms.gallery, q])

  const openAdd = () => {
    setForm({ url: '/images/tela-clean.png', name: '', category: 'food', tall: false })
    setModal({ open: true })
  }

  const openEdit = (item: CmsGalleryItem) => {
    setForm({
      url: item.url,
      name: item.name ?? '',
      category: item.category,
      tall: item.tall,
    })
    setModal({ open: true, item })
  }

  const save = async () => {
    if (modal.item) {
      await cmsApi.patchGallery(modal.item.id, form)
    } else {
      await cmsApi.createGallery({ ...form, sortOrder: cms.gallery.length + 1, published: true })
    }
    cms.reload()
    setModal({ open: false })
  }

  const remove = async (item: CmsGalleryItem) => {
    await cmsApi.deleteGallery(item.id)
    cms.reload()
  }

  return (
    <div className="space-y-4">
      <SectionPanel title="Section heading" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Small label">
            <input
              className={inputClass()}
              value={sec.eyebrow ?? 'Gallery'}
              onChange={(e) =>
                patchDraft(draft, setDraft, { gallerySection: { ...sec, eyebrow: e.target.value } })
              }
            />
          </FormField>
          <FormField label="Title">
            <input
              className={inputClass()}
              value={sec.title ?? ''}
              onChange={(e) =>
                patchDraft(draft, setDraft, { gallerySection: { ...sec, title: e.target.value } })
              }
            />
          </FormField>
          <FormField label="Description" className="sm:col-span-2">
            <textarea
              className={inputClass()}
              rows={2}
              value={sec.description ?? ''}
              onChange={(e) =>
                patchDraft(draft, setDraft, { gallerySection: { ...sec, description: e.target.value } })
              }
            />
          </FormField>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Gallery photos"
        description="Add, edit, or hide photos in the mosaic grid"
        defaultOpen
        action={<AddButton label="Add photo" onClick={openAdd} />}
      >
        <Toolbar search={q} onSearch={setQ} searchPlaceholder="Search photos…" />

        <DataTable
          rows={filtered}
          columns={[
            {
              key: 'image',
              header: 'Image',
              width: '80px',
              cell: (g) => (
                <img
                  src={g.url}
                  alt=""
                  className="h-12 w-12 rounded-lg border object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              ),
            },
            {
              key: 'name',
              header: 'Caption / name',
              cell: (g) => (
                <div>
                  <p className="font-medium">{g.name || '—'}</p>
                  <p className="text-xs text-gray-500">{g.url}</p>
                </div>
              ),
            },
            {
              key: 'type',
              header: 'Type',
              width: '100px',
              cell: (g) => <p className="capitalize">{g.category}</p>,
            },
            {
              key: 'tall',
              header: 'Tall',
              width: '70px',
              cell: (g) => <p>{g.tall ? 'Yes' : 'No'}</p>,
            },
            {
              key: 'status',
              header: 'Status',
              width: '90px',
              cell: (g) => (
                <span className={`text-xs ${g.published ? 'text-green-600' : 'text-gray-400'}`}>
                  {g.published ? 'Visible' : 'Hidden'}
                </span>
              ),
            },
          ]}
          action={(g) => (
            <ActionMenu
              items={[
                { label: 'Edit', onClick: () => openEdit(g) },
                { label: 'Delete', danger: true, onClick: () => setConfirm({ open: true, item: g }) },
              ]}
            />
          )}
          empty={
            <EmptyState
              title="No gallery photos yet"
              description="Add the first photo to the home page gallery."
              action={<AddButton label="Add photo" onClick={openAdd} />}
            />
          }
        />
      </SectionPanel>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.item ? 'Edit photo' : 'Add photo'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal({ open: false })}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!form.url.trim()}
              onClick={save}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modal.item ? 'Save changes' : 'Add photo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <ImageField label="Photo URL" value={form.url} onChange={(url) => setForm({ ...form, url })} />
          <FormField label="Caption (fallback if image fails to load)">
            <input
              className={inputClass()}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Type">
            <select
              className={inputClass()}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="food">Food</option>
              <option value="drinks">Drinks</option>
              <option value="products">Products</option>
            </select>
          </FormField>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.tall}
              onChange={(e) => setForm({ ...form, tall: e.target.checked })}
            />
            Tall tile (takes more vertical space)
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete photo?"
        description="This will remove it from the gallery."
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

function HomeTestimonialsSection({
  draft,
  setDraft,
  cms,
}: {
  draft: PageHero
  setDraft: (d: PageHero) => void
  cms: ReturnType<typeof usePageCms>
}) {
  const sec = ((draft as HomeSections).testimonialsSection ?? {}) as NonNullable<HomeSections['testimonialsSection']>
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; item?: CmsTestimonial }>({ open: false })
  const [modal, setModal] = useState<{ open: boolean; item?: CmsTestimonial }>({ open: false })
  const [form, setForm] = useState({
    name: '',
    quote: '',
    role: '',
    dish: '',
    dishCategory: 'food',
    published: true,
  })

  const pendingCount = useMemo(
    () => cms.testimonials.filter((t) => !t.published).length,
    [cms.testimonials],
  )

  const filtered = useMemo(() => {
    const list = !q.trim()
      ? cms.testimonials
      : cms.testimonials.filter(
          (t) =>
            t.name.toLowerCase().includes(q.toLowerCase()) ||
            t.quote.toLowerCase().includes(q.toLowerCase()) ||
            (t.role ?? '').toLowerCase().includes(q.toLowerCase()),
        )
    return [...list].sort((a, b) => {
      if (a.published !== b.published) return a.published ? 1 : -1
      return a.sortOrder - b.sortOrder
    })
  }, [cms.testimonials, q])

  const openAdd = () => {
    setForm({ name: '', quote: '', role: '', dish: '', dishCategory: 'food', published: true })
    setModal({ open: true })
  }

  const openEdit = (item: CmsTestimonial) => {
    setForm({
      name: item.name,
      quote: item.quote,
      role: item.role ?? '',
      dish: item.dish ?? '',
      dishCategory: item.dishCategory ?? 'food',
      published: item.published,
    })
    setModal({ open: true, item })
  }

  const save = async () => {
    if (modal.item) {
      await cmsApi.patchTestimonial(modal.item.id, form)
    } else {
      await cmsApi.createTestimonial({ ...form, sortOrder: cms.testimonials.length + 1 })
    }
    cms.reload()
    setModal({ open: false })
  }

  const remove = async (item: CmsTestimonial) => {
    await cmsApi.deleteTestimonial(item.id)
    cms.reload()
  }

  const approve = async (item: CmsTestimonial) => {
    await cmsApi.patchTestimonial(item.id, { published: true })
    cms.reload()
  }

  return (
    <div className="space-y-4">
      <SectionPanel title="Section heading" defaultOpen>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label="Small label">
            <input
              className={inputClass()}
              value={sec.eyebrow ?? 'Testimonials'}
              onChange={(e) =>
                patchDraft(draft, setDraft, { testimonialsSection: { ...sec, eyebrow: e.target.value } })
              }
            />
          </FormField>
          <FormField label="Title">
            <input
              className={inputClass()}
              value={sec.title ?? ''}
              onChange={(e) =>
                patchDraft(draft, setDraft, { testimonialsSection: { ...sec, title: e.target.value } })
              }
            />
          </FormField>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Guest reviews"
        description={
          pendingCount
            ? `${pendingCount} awaiting approval from “Share Your Experience”`
            : 'Quotes shown in the carousel. Guest submissions need approval before they appear.'
        }
        badge={pendingCount ? `${pendingCount} pending` : undefined}
        defaultOpen
        action={<AddButton label="Add review" onClick={openAdd} />}
      >
        <Toolbar search={q} onSearch={setQ} searchPlaceholder="Search reviews…" />

        <DataTable
          rows={filtered}
          columns={[
            {
              key: 'name',
              header: 'Guest',
              cell: (t) => (
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role || 'Guest'}</p>
                </div>
              ),
            },
            {
              key: 'quote',
              header: 'Quote',
              cell: (t) => <p className="line-clamp-2 max-w-md text-sm text-gray-600">{t.quote}</p>,
            },
            {
              key: 'dish',
              header: 'Featured dish',
              width: '140px',
              cell: (t) => (
                <p className="text-sm">
                  {t.dish || '—'} <span className="text-xs text-gray-400">({t.dishCategory || 'food'})</span>
                </p>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              width: '100px',
              cell: (t) =>
                t.published ? (
                  <span className="text-xs text-green-600">Published</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                    Pending
                  </span>
                ),
            },
          ]}
          action={(t) => (
            <ActionMenu
              items={[
                ...(!t.published
                  ? [{ label: 'Approve', onClick: () => approve(t) }]
                  : []),
                { label: 'Edit', onClick: () => openEdit(t) },
                {
                  label: t.published ? 'Delete' : 'Reject',
                  danger: true,
                  onClick: () => setConfirm({ open: true, item: t }),
                },
              ]}
            />
          )}
          empty={
            <EmptyState
              title="No reviews yet"
              description="Add a review, or wait for guests to share their experience on the site."
              action={<AddButton label="Add review" onClick={openAdd} />}
            />
          }
        />
      </SectionPanel>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.item ? 'Edit review' : 'Add review'}
        size="lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal({ open: false })}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!form.name.trim() || !form.quote.trim()}
              onClick={save}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modal.item ? 'Save changes' : 'Add review'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Guest name" required>
            <input
              className={inputClass()}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Role / occasion">
            <input
              className={inputClass()}
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              placeholder="e.g. Wedding client"
            />
          </FormField>
          <FormField label="Featured dish name">
            <input
              className={inputClass()}
              value={form.dish}
              onChange={(e) => setForm({ ...form, dish: e.target.value })}
            />
          </FormField>
          <FormField label="Dish type">
            <select
              className={inputClass()}
              value={form.dishCategory}
              onChange={(e) => setForm({ ...form, dishCategory: e.target.value })}
            >
              <option value="food">Food</option>
              <option value="drinks">Drinks</option>
              <option value="products">Products</option>
            </select>
          </FormField>
          <FormField label="Quote" required className="sm:col-span-2">
            <textarea
              className={inputClass()}
              rows={4}
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published on website
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.item && !confirm.item.published ? 'Reject review?' : 'Delete review?'}
        description={
          confirm.item && !confirm.item.published
            ? 'This pending guest submission will be permanently removed.'
            : 'This will remove it from the home page carousel.'
        }
        danger
        confirmLabel={confirm.item && !confirm.item.published ? 'Reject' : 'Delete'}
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.item) remove(confirm.item)
          setConfirm({ open: false })
        }}
      />
    </div>
  )
}

function HomeOffersSection({ draft, setDraft }: { draft: PageHero; setDraft: (d: PageHero) => void }) {
  const sec = ((draft as HomeSections).offersSection ?? {}) as NonNullable<HomeSections['offersSection']>
  const cards = sec.cards ?? []

  return (
    <div className="space-y-4">
      <SectionPanel title="Section heading" defaultOpen>
        <div className="grid gap-3">
          <FormField label="Small label">
            <input
              className={inputClass()}
              value={sec.eyebrow ?? 'Special Offers'}
              onChange={(e) =>
                patchDraft(draft, setDraft, { offersSection: { ...sec, eyebrow: e.target.value } })
              }
            />
          </FormField>
          <FormField label="Title">
            <input
              className={inputClass()}
              value={sec.title ?? ''}
              onChange={(e) =>
                patchDraft(draft, setDraft, { offersSection: { ...sec, title: e.target.value } })
              }
            />
          </FormField>
          <FormField label="Description">
            <textarea
              className={inputClass()}
              rows={2}
              value={sec.description ?? ''}
              onChange={(e) =>
                patchDraft(draft, setDraft, { offersSection: { ...sec, description: e.target.value } })
              }
            />
          </FormField>
        </div>
      </SectionPanel>

      <SectionPanel
        title="Offer cards"
        description="The promotional boxes on the home page"
        defaultOpen
        action={
          <button
            type="button"
            onClick={() =>
              patchDraft(draft, setDraft, {
                offersSection: {
                  ...sec,
                  cards: [
                    ...cards,
                    {
                      id: `offer-${Date.now()}`,
                      title: 'New offer',
                      link: '/shop',
                      linkText: 'Order Now',
                      variant: 'yellow',
                    },
                  ],
                },
              })
            }
            className="inline-flex items-center gap-1 rounded-full bg-burgundy px-3 py-1.5 text-xs font-medium text-white"
          >
            + Add card
          </button>
        }
      >
        <div className="space-y-4">
          {cards.map((card, i) => (
            <div key={card.id} className="rounded-xl border border-gray-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Offer card {i + 1}</p>
                <button
                  type="button"
                  onClick={() =>
                    patchDraft(draft, setDraft, {
                      offersSection: { ...sec, cards: cards.filter((_, j) => j !== i) },
                    })
                  }
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
              <OfferCardEditor
                card={card}
                onChange={(c) => {
                  const next = [...cards]
                  next[i] = c
                  patchDraft(draft, setDraft, { offersSection: { ...sec, cards: next } })
                }}
              />
            </div>
          ))}
          {!cards.length && (
            <EmptyState
              title="No offer cards yet"
              description="Add promotional cards that link to service pages."
            />
          )}
        </div>
      </SectionPanel>
    </div>
  )
}

function HomeVideoSection({ draft, setDraft }: { draft: PageHero; setDraft: (d: PageHero) => void }) {
  const sec = ((draft as HomeSections).videoSection ?? {}) as NonNullable<HomeSections['videoSection']>
  return (
    <SectionPanel title="Video banner" description="Short clip with text overlay" defaultOpen>
      <div className="space-y-4">
        <FormField label="Video file path">
          <input
            className={inputClass()}
            value={sec.url ?? '/images/chef-video.mp4'}
            onChange={(e) =>
              patchDraft(draft, setDraft, { videoSection: { ...sec, url: e.target.value } })
            }
          />
          <p className="mt-1 text-xs text-gray-500">Default: /images/chef-video.mp4</p>
        </FormField>
        <FormField label="Text on video">
          <input
            className={inputClass()}
            value={sec.title ?? ''}
            onChange={(e) =>
              patchDraft(draft, setDraft, { videoSection: { ...sec, title: e.target.value } })
            }
          />
        </FormField>
        <FormField label="Smaller line below">
          <input
            className={inputClass()}
            value={sec.subtitle ?? ''}
            onChange={(e) =>
              patchDraft(draft, setDraft, { videoSection: { ...sec, subtitle: e.target.value } })
            }
          />
        </FormField>
      </div>
    </SectionPanel>
  )
}

function HomeFaqSection({ cms }: { cms: ReturnType<typeof usePageCms> }) {
  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; item?: CmsFaq }>({ open: false })
  const [modal, setModal] = useState<{ open: boolean; item?: CmsFaq }>({ open: false })
  const [form, setForm] = useState({ question: '', answer: '', published: true })

  const filtered = useMemo(() => {
    if (!q.trim()) return cms.faqs
    return cms.faqs.filter(
      (f) =>
        f.question.toLowerCase().includes(q.toLowerCase()) ||
        f.answer.toLowerCase().includes(q.toLowerCase()),
    )
  }, [cms.faqs, q])

  const openAdd = () => {
    setForm({ question: '', answer: '', published: true })
    setModal({ open: true })
  }

  const openEdit = (item: CmsFaq) => {
    setForm({ question: item.question, answer: item.answer, published: item.published })
    setModal({ open: true, item })
  }

  const save = async () => {
    if (modal.item) {
      await cmsApi.patchFaq(modal.item.id, form)
    } else {
      await cmsApi.createFaq({ ...form, language: 'EN', sortOrder: cms.faqs.length + 1 })
    }
    cms.reload()
    setModal({ open: false })
  }

  const remove = async (item: CmsFaq) => {
    await cmsApi.deleteFaq(item.id)
    cms.reload()
  }

  return (
    <SectionPanel
      title="Frequently asked questions"
      description="Questions shown on the home page"
      defaultOpen
      action={<AddButton label="Add question" onClick={openAdd} />}
    >
      <Toolbar search={q} onSearch={setQ} searchPlaceholder="Search questions…" />

      <DataTable
        rows={filtered}
        columns={[
          {
            key: 'question',
            header: 'Question',
            cell: (f) => <p className="font-medium">{f.question}</p>,
          },
          {
            key: 'answer',
            header: 'Answer',
            cell: (f) => <p className="line-clamp-2 max-w-md text-sm text-gray-600">{f.answer}</p>,
          },
          {
            key: 'status',
            header: 'Status',
            width: '90px',
            cell: (f) => (
              <span className={`text-xs ${f.published ? 'text-green-600' : 'text-gray-400'}`}>
                {f.published ? 'Visible' : 'Hidden'}
              </span>
            ),
          },
        ]}
        action={(f) => (
          <ActionMenu
            items={[
              { label: 'Edit', onClick: () => openEdit(f) },
              { label: 'Delete', danger: true, onClick: () => setConfirm({ open: true, item: f }) },
            ]}
          />
        )}
        empty={
          <EmptyState
            title="No questions yet"
            description="Add FAQs that help customers decide what to order."
            action={<AddButton label="Add question" onClick={openAdd} />}
          />
        }
      />

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.item ? 'Edit question' : 'Add question'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal({ open: false })}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!form.question.trim() || !form.answer.trim()}
              onClick={save}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modal.item ? 'Save changes' : 'Add question'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Question" required>
            <input
              className={inputClass()}
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
            />
          </FormField>
          <FormField label="Answer" required>
            <textarea
              className={inputClass()}
              rows={4}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Show on website
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title="Delete question?"
        description="This will remove it from the home page FAQ."
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.item) remove(confirm.item)
          setConfirm({ open: false })
        }}
      />
    </SectionPanel>
  )
}

function BlogEditor({
  cms,
}: {
  cms: ReturnType<typeof usePageCms>
}) {
  const savedHero = (cms.settings['page:blog'] as PageHero) ?? {}
  const [hero, setHero] = useState(savedHero)
  const [heroDirty, setHeroDirty] = useState(false)
  const [savingHero, setSavingHero] = useState(false)

  useEffect(() => {
    setHero(savedHero)
    setHeroDirty(false)
  }, [savedHero])

  const saveHero = async () => {
    setSavingHero(true)
    try {
      await cms.savePage('page:blog', hero, 'Blog')
      setHeroDirty(false)
    } finally {
      setSavingHero(false)
    }
  }

  const [q, setQ] = useState('')
  const [confirm, setConfirm] = useState<{ open: boolean; item?: Record<string, unknown> }>({ open: false })
  const [modal, setModal] = useState<{ open: boolean; item?: Record<string, unknown> }>({ open: false })
  const [form, setForm] = useState({ title: '', slug: '', excerpt: '', content: '', image: '', published: true })

  const filtered = useMemo(() => {
    if (!q.trim()) return cms.blog
    return cms.blog.filter((p) =>
      String(p.title ?? '')
        .toLowerCase()
        .includes(q.toLowerCase()),
    )
  }, [cms.blog, q])

  const openAdd = () => {
    setForm({ title: '', slug: '', excerpt: '', content: '', image: '', published: true })
    setModal({ open: true })
  }

  const openEdit = (post: Record<string, unknown>) => {
    setForm({
      title: String(post.title ?? ''),
      slug: String(post.slug ?? ''),
      excerpt: String(post.excerpt ?? ''),
      content: ((post.content as string[]) ?? []).join('\n\n'),
      image: String(post.image ?? ''),
      published: Boolean(post.published),
    })
    setModal({ open: true, item: post })
  }

  const save = async () => {
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim().toLowerCase().replace(/\s+/g, '-'),
      excerpt: form.excerpt.trim(),
      content: form.content.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean),
      image: form.image.trim() || null,
      published: form.published,
    }
    if (modal.item) {
      await cmsApi.patchBlog(String(modal.item.id), payload)
    } else {
      await cmsApi.createBlog({ ...payload, author: 'Senay Kitchen', publishedAt: new Date().toISOString() })
    }
    cms.reload()
    setModal({ open: false })
  }

  const remove = async (post: Record<string, unknown>) => {
    await cmsApi.deleteBlog(String(post.id))
    cms.reload()
  }

  return (
    <div className="space-y-4 pb-20">
      <SectionPanel title="Blog page heading" defaultOpen>
        <PageHeroFields
          value={hero}
          onChange={(h) => {
            setHero(h)
            setHeroDirty(true)
          }}
        />
        <button
          type="button"
          disabled={!heroDirty || savingHero}
          onClick={saveHero}
          className="btn-primary mt-3 disabled:opacity-50"
        >
          {savingHero ? 'Saving…' : 'Save page heading'}
        </button>
      </SectionPanel>

      <SectionPanel
        title="Published posts"
        description={`${cms.blog.length} post(s)`}
        defaultOpen
        action={<AddButton label="New post" onClick={openAdd} />}
      >
        <Toolbar search={q} onSearch={setQ} searchPlaceholder="Search posts…" />

        <DataTable
          rows={filtered}
          keyExtractor={(p) => String(p.id)}
          columns={[
            {
              key: 'title',
              header: 'Post',
              cell: (p) => (
                <div>
                  <p className="font-medium">{String(p.title)}</p>
                  <p className="text-xs text-gray-500">/{String(p.slug)}</p>
                  <p className="line-clamp-2 mt-1 max-w-md text-sm text-gray-600">{String(p.excerpt ?? '')}</p>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              width: '90px',
              cell: (p) => (
                <span className={`text-xs ${p.published ? 'text-green-600' : 'text-gray-400'}`}>
                  {p.published ? 'Published' : 'Draft'}
                </span>
              ),
            },
          ]}
          action={(p) => (
            <ActionMenu
              items={[
                { label: 'Edit', onClick: () => openEdit(p) },
                { label: 'Delete', danger: true, onClick: () => setConfirm({ open: true, item: p }) },
              ]}
            />
          )}
          empty={
            <EmptyState
              title="No posts yet"
              description="Write blog posts that show up on the public blog page."
              action={<AddButton label="New post" onClick={openAdd} />}
            />
          }
        />
      </SectionPanel>

      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false })}
        title={modal.item ? 'Edit post' : 'New post'}
        size="xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModal({ open: false })}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!form.title.trim() || !form.slug.trim()}
              onClick={save}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {modal.item ? 'Save changes' : 'Publish post'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Title" required>
            <input
              className={inputClass()}
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                  slug: form.slug || slugify(e.target.value),
                })
              }
            />
          </FormField>
          <FormField label="Slug" required>
            <input
              className={inputClass()}
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
            />
          </FormField>
          <FormField label="Cover image" className="sm:col-span-2">
            <ImageField label="" value={form.image} onChange={(image) => setForm({ ...form, image })} />
          </FormField>
          <FormField label="Short summary" className="sm:col-span-2">
            <input
              className={inputClass()}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </FormField>
          <FormField label="Full article" required className="sm:col-span-2">
            <textarea
              className={inputClass()}
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Write paragraphs here. Press Enter twice between paragraphs."
            />
            <p className="mt-1 text-xs text-gray-500">Separate paragraphs with a blank line</p>
          </FormField>
          <label className="flex items-center gap-2 text-sm text-gray-700 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published on website
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.item ? `Delete ${confirm.item.title}?` : 'Delete post?'}
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

function AboutEditor({
  draft,
  setDraft,
}: {
  draft: PageHero
  setDraft: (d: PageHero) => void
}) {
  const paragraphs = ((draft.paragraphs as string[]) ?? ['']).join('\n\n')
  const values = (draft.values as Array<{ title: string; text: string }>) ?? []
  const milestones = (draft.milestones as Array<{ year: string; text: string }>) ?? []

  return (
    <div className="space-y-4">
      <SectionPanel title="Page heading" defaultOpen>
        <PageHeroFields
          value={{
            eyebrow: draft.eyebrow ?? '',
            title: draft.title ?? '',
            description: draft.description ?? '',
          }}
          onChange={(h) => setDraft({ ...draft, ...h })}
        />
      </SectionPanel>

      <SectionPanel title="Our story" description="Main text block on the About page" defaultOpen>
        <FormField label="Section small label">
          <input
            className={inputClass()}
            value={String(draft.sectionLabel ?? '')}
            onChange={(e) => setDraft({ ...draft, sectionLabel: e.target.value })}
          />
        </FormField>
        <FormField label="Section title">
          <input
            className={inputClass()}
            value={String(draft.sectionTitle ?? '')}
            onChange={(e) => setDraft({ ...draft, sectionTitle: e.target.value })}
          />
        </FormField>
        <FormField label="Story paragraphs">
          <textarea
            className={inputClass()}
            rows={6}
            value={paragraphs}
            onChange={(e) =>
              setDraft({
                ...draft,
                paragraphs: e.target.value
                  .split(/\n\s*\n/)
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="First paragraph&#10;&#10;Second paragraph"
          />
          <p className="mt-1 text-xs text-gray-500">Press Enter twice between paragraphs</p>
        </FormField>
      </SectionPanel>

      <SectionPanel title="Our values" description="Four boxes with title + description">
        <KeyValueList
          items={values.length ? values : [{ title: '', text: '' }]}
          onChange={(next) => setDraft({ ...draft, values: next as { title: string; text: string }[] })}
          fieldA="title"
          fieldB="text"
          placeholderA="Value name"
          placeholderB="Short explanation"
        />
      </SectionPanel>

      <SectionPanel title="Timeline" description="Key dates in your history">
        <KeyValueList
          items={milestones.length ? milestones : [{ year: '', text: '' }]}
          onChange={(next) => setDraft({ ...draft, milestones: next as { year: string; text: string }[] })}
          fieldA="year"
          fieldB="text"
          placeholderA="Year"
          placeholderB="What happened"
        />
      </SectionPanel>
    </div>
  )
}

function ContactEditor({
  draft,
  setDraft,
  cms,
  saving,
  onSaveHero,
}: {
  draft: PageHero
  setDraft: (d: PageHero) => void
  cms: ReturnType<typeof usePageCms>
  saving: boolean
  onSaveHero: () => void
}) {
  const savedRestaurant = (cms.settings.restaurant as Record<string, unknown>) ?? {}
  const [restaurant, setRestaurant] = useState(savedRestaurant)
  const [savingAll, setSavingAll] = useState(false)

  useEffect(() => {
    setRestaurant(savedRestaurant)
  }, [cms.settings.restaurant])

  const pageDirty = JSON.stringify(draft) !== JSON.stringify(cms.settings['page:contact'] ?? {})
  const infoDirty = JSON.stringify(restaurant) !== JSON.stringify(savedRestaurant)
  const dirty = pageDirty || infoDirty

  const saveAll = async () => {
    setSavingAll(true)
    try {
      if (pageDirty) await onSaveHero()
      if (infoDirty) {
        await cmsApi.putSetting('restaurant', restaurant)
        cms.flash('Contact info saved — website updated')
        cms.reload()
      }
    } finally {
      setSavingAll(false)
    }
  }

  return (
    <div className="space-y-4 pb-24">
      <SectionPanel title="Page heading" defaultOpen>
        <PageHeroFields
          value={{
            eyebrow: draft.eyebrow ?? '',
            title: draft.title ?? '',
            description: draft.description ?? '',
          }}
          onChange={(h) => setDraft({ ...draft, ...h })}
        />
        <FormField label="Contact form title">
          <input
            className={inputClass()}
            value={String(draft.formTitle ?? '')}
            onChange={(e) => setDraft({ ...draft, formTitle: e.target.value })}
            placeholder="e.g. Send a message"
          />
        </FormField>
      </SectionPanel>

      <SectionPanel title="Business details" description="Phone, email, address shown on Contact" defaultOpen>
        {(
          [
            ['name', 'Business name'],
            ['tagline', 'Tagline'],
            ['phone', 'Phone number'],
            ['email', 'Email address'],
            ['address', 'Street address'],
            ['hours', 'Opening hours'],
            ['mapUrl', 'Google Maps embed URL'],
          ] as const
        ).map(([key, label]) => (
          <FormField key={key} label={label}>
            <input
              className={inputClass()}
              value={String(restaurant[key] ?? '')}
              onChange={(e) => setRestaurant({ ...restaurant, [key]: e.target.value })}
            />
          </FormField>
        ))}
      </SectionPanel>

      <StickySaveBar
        label="Save contact page"
        saving={savingAll || saving}
        dirty={dirty}
        onSave={saveAll}
        onCancel={() => {
          setDraft(cms.settings['page:contact'] as PageHero)
          setRestaurant(savedRestaurant)
        }}
      />
    </div>
  )
}
