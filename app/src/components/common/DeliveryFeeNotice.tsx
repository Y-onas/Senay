import { useLanguage } from '@/hooks/useLanguage'
import { cn } from '@/lib/utils'

export function isDeliveryMethod(value?: string | null): boolean {
  return (value ?? '').toLowerCase() === 'delivery'
}

/** Shown on non-catering orders when the customer chooses delivery. */
export function DeliveryFeeNotice({ className }: { className?: string }) {
  const { t } = useLanguage()

  return (
    <div
      role="note"
      className={cn(
        'rounded-2xl border border-yellow-brand/40 bg-yellow-brand/15 px-4 py-3 text-left',
        className,
      )}
    >
      <p className="font-display text-sm font-bold uppercase tracking-wide text-burgundy">
        {t('deliveryFeeNoticeTitle')}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-[#2C1A14]/80">
        {t('deliveryFeeNoticeBody')}
      </p>
    </div>
  )
}
