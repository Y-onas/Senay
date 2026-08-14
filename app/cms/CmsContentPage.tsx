import { useEffect, useState } from 'react'
import { getLocalizedValue } from '@/cms/i18n'
import { LocalizedInput, LocalizedTextarea } from '@/cms/pages/cms-ui'
import { cmsApi, type CmsFaq } from '@/services/cmsApi'

type Restaurant = {
  name?: unknown
  tagline?: unknown
  phone?: string
  email?: string
  address?: unknown
  openingHours?: { day: unknown; hours: unknown }[]
}

type Homepage = {
  heroEyebrow?: unknown
  heroHeadline?: unknown
  heroSubcopy?: unknown
}

export default function CmsContentPage() {
  const [tab, setTab] = useState<'faq' | 'contact' | 'homepage'>('faq')
  const [faqs, setFaqs] = useState<CmsFaq[]>([])
  const [restaurant, setRestaurant] = useState<Restaurant>({})
  const [homepage, setHomepage] = useState<Homepage>({})
  const [msg, setMsg] = useState('')
  const [newQ, setNewQ] = useState<Partial<Record<string, string>>>({})
  const [newA, setNewA] = useState<Partial<Record<string, string>>>({})

  const load = async () => {
    const [f, settings] = await Promise.all([cmsApi.faqs(), cmsApi.settings()])
    setFaqs(f)
    setRestaurant((settings.restaurant as Restaurant) ?? {})
    setHomepage((settings.homepage as Homepage) ?? {})
  }

  useEffect(() => {
    load()
  }, [])

  const addFaq = async () => {
    if (!getLocalizedValue(newQ, 'en').trim() || !getLocalizedValue(newA, 'en').trim()) return
    await cmsApi.createFaq({
      question: getLocalizedValue(newQ, 'en').trim(),
      questionI18n: newQ,
      answer: getLocalizedValue(newA, 'en').trim(),
      answerI18n: newA,
      language: 'EN',
      sortOrder: faqs.length + 1,
    })
    setNewQ({})
    setNewA({})
    setMsg('FAQ added — visible on homepage')
    load()
  }

  const saveRestaurant = async () => {
    await cmsApi.putSetting('restaurant', restaurant)
    setMsg('Contact / restaurant info saved — website updated')
  }

  const saveHomepage = async () => {
    await cmsApi.putSetting('homepage', homepage)
    setMsg('Homepage hero saved — website updated')
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-burgundy/60">Website</p>
        <h1 className="font-display text-3xl uppercase">Content</h1>
        {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
      </div>

      <div className="flex gap-2">
        {(['faq', 'contact', 'homepage'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm capitalize ${
              tab === t ? 'bg-burgundy text-white' : 'bg-white border'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'faq' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-burgundy/10 bg-white p-5">
            <h2 className="font-display text-lg uppercase">Add FAQ</h2>
            <LocalizedInput label="Question" value={newQ} onChange={setNewQ} className="mt-3" />
            <LocalizedTextarea label="Answer" value={newA} onChange={setNewA} className="mt-2" rows={3} />
            <button type="button" onClick={addFaq} className="btn-primary mt-3">
              Add question
            </button>
          </div>

          {faqs.map((f) => (
            <div key={f.id} className="rounded-2xl border border-burgundy/10 bg-white p-5">
              <LocalizedInput
                label="Question"
                value={f.questionI18n ?? { en: f.question }}
                commitOnBlur
                onChange={(next) => {
                  cmsApi
                    .patchFaq(f.id, {
                      question: getLocalizedValue(next, 'en'),
                      questionI18n: next,
                    })
                    .then(() => {
                      setMsg('FAQ updated')
                      load()
                    })
                }}
              />
              <LocalizedTextarea
                label="Answer"
                value={f.answerI18n ?? { en: f.answer }}
                commitOnBlur
                onChange={(next) => {
                  cmsApi
                    .patchFaq(f.id, {
                      answer: getLocalizedValue(next, 'en'),
                      answerI18n: next,
                    })
                    .then(() => {
                      setMsg('FAQ updated')
                      load()
                    })
                }}
                className="mt-2"
                rows={3}
              />
              <button
                type="button"
                onClick={() =>
                  cmsApi.deleteFaq(f.id).then(() => {
                    setMsg('FAQ deleted')
                    load()
                  })
                }
                className="mt-2 text-xs text-red-600"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'contact' && (
        <div className="rounded-2xl border border-burgundy/10 bg-white p-5 space-y-3">
          {(
            [
              ['name', 'Business name'],
              ['tagline', 'Tagline'],
              ['phone', 'Phone'],
              ['email', 'Email'],
              ['address', 'Address'],
            ] as const
          ).map(([key, label]) => (
            <LocalizedInput
              key={key}
              label={label}
              value={restaurant[key]}
              onChange={(next) => setRestaurant((r) => ({ ...r, [key]: next }))}
            />
          ))}
          <button type="button" onClick={saveRestaurant} className="btn-primary mt-2">
            Save contact info
          </button>
        </div>
      )}

      {tab === 'homepage' && (
        <div className="rounded-2xl border border-burgundy/10 bg-white p-5 space-y-3">
          <LocalizedInput
            label="Hero eyebrow"
            value={homepage.heroEyebrow}
            onChange={(next) => setHomepage((h) => ({ ...h, heroEyebrow: next }))}
          />
          <LocalizedInput
            label="Hero headline"
            value={homepage.heroHeadline}
            onChange={(next) => setHomepage((h) => ({ ...h, heroHeadline: next }))}
          />
          <LocalizedTextarea
            label="Hero subcopy"
            value={homepage.heroSubcopy}
            onChange={(next) => setHomepage((h) => ({ ...h, heroSubcopy: next }))}
            rows={3}
          />
          <button type="button" onClick={saveHomepage} className="btn-primary mt-2">
            Save homepage
          </button>
        </div>
      )}
    </div>
  )
}
