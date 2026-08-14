import { useEffect, useState } from 'react'
import { cmsApi, type CmsFaq, type CmsGalleryItem, type CmsTestimonial } from '@/services/cmsApi'
import { CMS_LANGUAGES, type CmsLanguage } from '@/cms/i18n'
import { getLocalizedValue, setLocalizedValue } from '@/cms/i18n'

export type PageTab = 'home' | 'blog' | 'about' | 'contact'

export const PAGE_TABS: { id: PageTab; label: string; hint: string }[] = [
  { id: 'home', label: 'Home', hint: 'Hero, gallery, offers, FAQs' },
  { id: 'blog', label: 'Blog', hint: 'Posts and page heading' },
  { id: 'about', label: 'About', hint: 'Story, values, timeline' },
  { id: 'contact', label: 'Contact', hint: 'Phone, address, form' },
]

export type PageHero = {
  eyebrow?: unknown
  title?: unknown
  description?: unknown
  [key: string]: unknown
}

export function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
      {label}
      <div className="mt-1.5 font-normal normal-case text-gray-900">{children}</div>
    </label>
  )
}

export function inputClass() {
  return 'w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm'
}

export function CmsLanguageTabs({
  language,
  onChange,
}: {
  language: CmsLanguage
  onChange: (next: CmsLanguage) => void
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-burgundy/20 bg-white p-1">
      {CMS_LANGUAGES.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => onChange(lang)}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
            language === lang ? 'bg-burgundy text-white' : 'text-gray-600 hover:text-burgundy'
          }`}
        >
          {lang}
        </button>
      ))}
    </div>
  )
}

export function SaveBar({
  msg,
  saving,
  onSave,
  label = 'Save changes',
}: {
  msg: string
  saving?: boolean
  onSave: () => void
  label?: string
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="btn-primary disabled:opacity-60"
      >
        {saving ? 'Saving…' : label}
      </button>
      {msg && <p className="text-sm text-green-700">{msg}</p>}
    </div>
  )
}

export function PageHeroFields({
  value,
  onChange,
}: {
  value: PageHero
  onChange: (next: PageHero) => void
}) {
  const setLang = (key: string, lang: CmsLanguage, text: string) =>
    onChange({ ...value, [key]: setLocalizedValue(value[key], lang, text) })

  const renderLocalizedInput = (key: string, enPlaceholder?: string, amPlaceholder?: string) => (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        EN
        <input
          className={inputClass()}
          value={getLocalizedValue(value[key], 'en')}
          onChange={(e) => setLang(key, 'en', e.target.value)}
          placeholder={enPlaceholder}
        />
      </label>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        AM
        <input
          className={inputClass()}
          value={getLocalizedValue(value[key], 'am')}
          onChange={(e) => setLang(key, 'am', e.target.value)}
          placeholder={amPlaceholder}
        />
      </label>
    </div>
  )

  const renderLocalizedTextarea = (key: string, rows = 3, enPlaceholder?: string, amPlaceholder?: string) => (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        EN
        <textarea
          className={inputClass()}
          rows={rows}
          value={getLocalizedValue(value[key], 'en')}
          onChange={(e) => setLang(key, 'en', e.target.value)}
          placeholder={enPlaceholder}
        />
      </label>
      <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        AM
        <textarea
          className={inputClass()}
          rows={rows}
          value={getLocalizedValue(value[key], 'am')}
          onChange={(e) => setLang(key, 'am', e.target.value)}
          placeholder={amPlaceholder}
        />
      </label>
    </div>
  )

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Small label above title">
        {renderLocalizedInput('eyebrow', 'e.g. About Us')}
      </Field>
      <Field label="Main page title">
        {renderLocalizedInput('title', 'e.g. The story of Senay Tela')}
      </Field>
      <div className="sm:col-span-2">
        <Field label="Short description under title">
          {renderLocalizedTextarea(
            'description',
            3,
            'One or two sentences visitors read first',
          )}
        </Field>
      </div>
    </div>
  )
}

export function usePageCms() {
  const [settings, setSettings] = useState<Record<string, unknown>>({})
  const [faqs, setFaqs] = useState<CmsFaq[]>([])
  const [gallery, setGallery] = useState<CmsGalleryItem[]>([])
  const [testimonials, setTestimonials] = useState<CmsTestimonial[]>([])
  const [blog, setBlog] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')

  const reload = async () => {
    setLoading(true)
    try {
      const [sets, f, posts, gal, test] = await Promise.all([
        cmsApi.settings(),
        cmsApi.faqs(),
        cmsApi.blog(),
        cmsApi.gallery(),
        cmsApi.testimonials(),
      ])
      setSettings(sets)
      setFaqs(f)
      setBlog(posts as Array<Record<string, unknown>>)
      setGallery(gal)
      setTestimonials(test)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const flash = (text: string) => {
    setMsg(text)
    setTimeout(() => setMsg(''), 4000)
  }

  const savePage = async (key: string, value: unknown, label: string) => {
    await cmsApi.putSetting(key, value)
    setSettings((s) => ({ ...s, [key]: value }))
    flash(`${label} saved — website updated`)
  }

  return {
    settings,
    faqs,
    gallery,
    testimonials,
    blog,
    loading,
    msg,
    flash,
    reload,
    savePage,
    setFaqs,
    setBlog,
    setGallery,
    setTestimonials,
  }
}
