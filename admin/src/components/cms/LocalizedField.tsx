import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getRawLocalizedValue, setLocalizedValue, type CmsLanguage } from '@/lib/i18n'

type Props = {
  label: string
  value: unknown
  onChange: (next: ReturnType<typeof setLocalizedValue>) => void
  multiline?: boolean
  enPlaceholder?: string
  amPlaceholder?: string
}

function LocaleInput({
  lang,
  value,
  onChange,
  multiline,
  placeholder,
}: {
  lang: CmsLanguage
  value: unknown
  onChange: (text: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const current = getRawLocalizedValue(value, lang)
  const Field = multiline ? Textarea : Input
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brown/50">{lang.toUpperCase()}</p>
      <Field
        value={current}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={multiline ? 'min-h-[96px]' : undefined}
      />
    </div>
  )
}

export function LocalizedField({
  label,
  value,
  onChange,
  multiline,
  enPlaceholder,
  amPlaceholder,
}: Props) {
  const patch = (lang: CmsLanguage, text: string) => onChange(setLocalizedValue(value, lang, text))

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <LocaleInput lang="en" value={value} multiline={multiline} placeholder={enPlaceholder} onChange={(t) => patch('en', t)} />
        <LocaleInput lang="am" value={value} multiline={multiline} placeholder={amPlaceholder} onChange={(t) => patch('am', t)} />
      </div>
    </div>
  )
}
