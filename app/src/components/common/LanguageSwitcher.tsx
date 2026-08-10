import { cn } from '@/lib/utils'
import { useLanguage, type Locale } from '@/hooks/useLanguage'

const options: { value: Locale; label: string }[] = [
  { value: 'en', label: 'EN' },
  { value: 'am', label: 'AM' },
]

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLanguage()

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-burgundy/15 bg-white/80 p-0.5 shadow-sm',
        className,
      )}
      role="group"
      aria-label={t('language')}
    >
      {options.map((option) => {
        const active = locale === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setLocale(option.value)}
            aria-pressed={active}
            className={cn(
              'min-w-[2.5rem] rounded-full px-3 py-1.5 text-xs font-bold tracking-wide transition-colors',
              active
                ? 'bg-burgundy text-white shadow-sm'
                : 'text-gray-600 hover:text-burgundy',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
