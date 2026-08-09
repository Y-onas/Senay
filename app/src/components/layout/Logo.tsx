import { Link } from 'react-router'
import { cn } from '@/lib/utils'

/** Senay Tela wordmark. `light` for use over dark backgrounds. */
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-sm">
        {/* mix-blend-multiply drops the logo's white background onto the white chip */}
        <img
          src="/images/senay-logo.png"
          alt="Senay Tela Restaurant and Catering"
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            'font-display text-xl font-bold uppercase tracking-tight lg:text-2xl',
            light ? 'text-white' : 'text-burgundy',
          )}
        >
          Senay Tela
        </span>
        <span
          className={cn(
            'text-[9px] font-medium uppercase tracking-[0.12em] sm:text-[10px] sm:tracking-[0.18em]',
            light ? 'text-white/60' : 'text-gold',
          )}
        >
          Restaurant and Catering
        </span>
      </span>
    </Link>
  )
}
