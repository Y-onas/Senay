import { useState } from 'react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import PageHero from '@/components/common/PageHero'
import RestaurantDetails from '@/components/common/RestaurantDetails'
import BranchLocations from '@/components/common/BranchLocations'
import { TextField, TextAreaField } from '@/components/common/FormField'
import { useContactContent } from '@/hooks/useContactContent'
import { useLanguage } from '@/hooks/useLanguage'
import { submitContact } from '@/services/dynamicContentService'

export default function ContactPage() {
  const { t, navLabel } = useLanguage()
  const page = useContactContent()
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = t('contactErrorName')
    if (!form.email.trim()) next.email = t('contactErrorEmail')
    if (!form.message.trim()) next.message = t('contactErrorMessage')
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      await submitContact({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        message: form.message,
      })
      setSent(true)
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (err) {
      setErrors({
        message: err instanceof Error ? err.message : t('contactErrorSendFailed'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const hasHero = Boolean(
    page.eyebrow?.trim() || page.title?.trim() || page.description?.trim(),
  )

  return (
    <>
      {hasHero ? (
        <PageHero
          eyebrow={page.eyebrow}
          title={page.title ?? ''}
          description={page.description}
          crumbs={[
            { label: navLabel('/', 'Home'), to: '/' },
            { label: navLabel('/contact', 'Contact') },
          ]}
        />
      ) : null}

      <section className="bg-cream py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            {page.formTitle ? (
              <h2 className="font-display text-2xl font-bold uppercase text-gray-900">
                {page.formTitle}
              </h2>
            ) : null}

            {sent ? (
              <div className="mt-6 flex flex-col items-center rounded-2xl bg-green-brand/10 p-8 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-brand" />
                <p className="mt-4 font-display text-xl font-bold uppercase text-gray-900">
                  {t('contactMessageSent')}
                </p>
                <p className="mt-2 text-sm text-gray-500">{t('contactThanksReply')}</p>
                <button onClick={() => setSent(false)} className="btn-primary mt-6">
                  {t('contactSendAnother')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <TextField
                  label={t('contactName')}
                  name="name"
                  required
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => update('name', e.target.value)}
                />
                <TextField
                  label={t('contactEmail')}
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  error={errors.email}
                  onChange={(e) => update('email', e.target.value)}
                />
                <TextField
                  label={t('contactPhoneOptional')}
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                />
                <TextAreaField
                  label={t('contactMessage')}
                  name="message"
                  required
                  rows={5}
                  value={form.message}
                  error={errors.message}
                  onChange={(e) => update('message', e.target.value)}
                  placeholder={t('contactMessagePlaceholder')}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full justify-center disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> {t('contactSending')}
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> {t('contactSendMessage')}
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div>
            <RestaurantDetails
              openingHours={page.openingHours}
              phone={page.phone}
              email={page.email}
              hoursTitle={page.hoursTitle}
              contactTitle={page.contactTitle}
            />
          </div>
        </div>
      </section>

      <BranchLocations
        title={page.locationsTitle}
        description={page.locationsDescription}
        buttonText={page.locationsButtonText}
        branches={page.branches}
      />
    </>
  )
}
