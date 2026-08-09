import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from 'lucide-react'
import { restaurant } from '@/data/restaurant'
import Logo from './Logo'
import { footerDefaults, getFooter, type FooterContent } from '@/services/footerService'
import { useContactContent } from '@/hooks/useContactContent'
import { useEnabledServices } from '@/hooks/useEnabledServices'

function filterFooterContent(footer: FooterContent, isHrefEnabled: (href: string) => boolean): FooterContent {
  return {
    ...footer,
    explore: {
      ...footer.explore,
      links: footer.explore.links.filter((link) => isHrefEnabled(link.href)),
    },
    company: {
      ...footer.company,
      links: footer.company.links.filter((link) => isHrefEnabled(link.href)),
    },
  }
}

export default function Footer() {
  const [footer, setFooter] = useState<FooterContent>(footerDefaults)
  const contact = useContactContent()
  const { isHrefEnabled } = useEnabledServices()

  useEffect(() => {
    getFooter().then(setFooter).catch(() => {})
  }, [])

  const visibleFooter = filterFooterContent(footer, isHrefEnabled)

  return (
    <footer className="bg-burgundy-dark text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/70">
              {visibleFooter.brand.tagline}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {visibleFooter.brand.social.map((s, i) => (
                <a
                  key={s.href || `social-${i}`}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium text-white/80 transition-colors hover:border-white hover:text-white"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {[visibleFooter.explore, visibleFooter.company].map((column, i) => (
            <div key={`footer-column-${i}`} className="lg:col-span-2">
              <h4 className="font-display text-lg font-bold uppercase tracking-wide">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link, linkIndex) => (
                  <li key={`${i}-${link.href || linkIndex}`}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-4">
            <Link
              to="/contact"
              className="group inline-flex items-center gap-2 font-display text-lg font-bold uppercase tracking-wide transition-colors hover:text-yellow-brand"
            >
              Visit Us
              <ArrowUpRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <ul className="mt-4 space-y-3 text-sm text-white/70">
              {(contact.branches ?? []).map((branch) => (
                <li key={branch.id} className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-yellow-brand" />
                  <Link to="/contact#locations" className="transition-colors hover:text-white">
                    <span className="block font-medium text-white/85">{branch.name}</span>
                    <span className="text-white/60">{branch.area}</span>
                  </Link>
                </li>
              ))}
              {contact.phone ? (
                <li className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-yellow-brand" />
                  <a href={`tel:${contact.phone}`} className="hover:text-white">
                    {contact.phone}
                  </a>
                </li>
              ) : null}
              {contact.email ? (
                <li className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-yellow-brand" />
                  <a href={`mailto:${contact.email}`} className="hover:text-white">
                    {contact.email}
                  </a>
                </li>
              ) : null}
              {(contact.openingHours ?? []).map((row) => (
                <li key={`${row.day}-${row.hours}`} className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-yellow-brand" />
                  <span>
                    {row.day}: {row.hours}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              to="/contact"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-brand transition-colors hover:text-white"
            >
              Contact us
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-sm text-white/50">
            &copy; {new Date().getFullYear()} {restaurant.name}. All rights reserved.
          </p>
          <p className="text-sm text-white/50">{visibleFooter.bottom.creditText}</p>
        </div>
      </div>
    </footer>
  )
}
