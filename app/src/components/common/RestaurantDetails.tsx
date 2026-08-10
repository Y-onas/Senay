import { Clock, Mail, Phone } from 'lucide-react'
import type { ContactPageContent } from '@/data/contactDefaults'

type Props = Pick<
  ContactPageContent,
  'openingHours' | 'phone' | 'email' | 'hoursTitle' | 'contactTitle'
>

/** Hours and contact details — branches live in BranchLocations. */
export default function RestaurantDetails({
  openingHours = [],
  phone = '',
  email = '',
  hoursTitle = 'Opening Hours',
  contactTitle = 'Get in touch',
}: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
            <Clock className="h-5 w-5" />
          </span>
          <h3 className="font-display text-lg font-bold uppercase text-gray-900">
            {hoursTitle}
          </h3>
        </div>
        <ul className="mt-3 space-y-2">
          {openingHours.map((h) => (
            <li
              key={`${h.day}-${h.hours}`}
              className="flex justify-between gap-4 text-sm text-gray-500"
            >
              <span>{h.day}</span>
              <span className="font-medium text-gray-700">{h.hours}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy/10 text-burgundy">
            <Phone className="h-5 w-5" />
          </span>
          <h3 className="font-display text-lg font-bold uppercase text-gray-900">
            {contactTitle}
          </h3>
        </div>
        <div className="mt-3 space-y-2 text-sm">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex items-center gap-2 text-gray-500 transition-colors hover:text-burgundy"
            >
              <Phone className="h-4 w-4" /> {phone}
            </a>
          ) : null}
          {email ? (
            <a
              href={`mailto:${email}`}
              className="flex items-center gap-2 text-gray-500 transition-colors hover:text-burgundy"
            >
              <Mail className="h-4 w-4" /> {email}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
