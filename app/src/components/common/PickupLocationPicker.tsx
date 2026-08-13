import { MapPin } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import {
  type PickupLocation,
  usePickupLocations,
} from '@/hooks/usePickupLocations'
import { cn } from '@/lib/utils'

interface PickupLocationPickerProps {
  value: string | null
  onChange: (location: PickupLocation) => void
  error?: string
  className?: string
}

/** Customer picker fed by dynamically managed Contact page locations. */
export function PickupLocationPicker({
  value,
  onChange,
  error,
  className,
}: PickupLocationPickerProps) {
  const { t } = useLanguage()
  const { locations, loading } = usePickupLocations()

  return (
    <div className={className}>
      <p className="mb-1.5 text-sm font-medium text-gray-700">
        {t('pickupLocation')}
        <span className="ml-0.5 text-burgundy">*</span>
      </p>
      <p className="mb-3 text-xs text-gray-400">{t('pickupLocationHint')}</p>

      {loading ? (
        <p className="text-sm text-gray-400">{t('pickupLocationLoading')}</p>
      ) : locations.length === 0 ? (
        <p className="rounded-xl border border-burgundy/15 bg-white px-4 py-3 text-sm text-gray-500">
          {t('pickupLocationEmpty')}
        </p>
      ) : (
        <div className="grid gap-2">
          {locations.map((location) => {
            const active = value === location.id
            return (
              <button
                key={location.id}
                type="button"
                onClick={() => onChange(location)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all',
                  active
                    ? 'border-burgundy bg-burgundy/[0.06] ring-2 ring-burgundy/20'
                    : 'border-burgundy/15 bg-white hover:border-burgundy/40',
                )}
              >
                <MapPin
                  className={cn(
                    'mt-0.5 h-4 w-4 shrink-0',
                    active ? 'text-burgundy' : 'text-gray-400',
                  )}
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{location.name}</span>
                  {location.area ? (
                    <span className="mt-0.5 block text-xs text-gray-500">{location.area}</span>
                  ) : null}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  )
}
