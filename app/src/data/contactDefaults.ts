import type { Branch } from '@/data/branches'
import { branches as defaultBranches } from '@/data/branches'
import { restaurant } from '@/data/restaurant'

export type OpeningHourRow = {
  day: string
  hours: string
}

export type ContactPageContent = {
  eyebrow?: string
  title?: string
  description?: string
  formTitle?: string
  phone?: string
  email?: string
  hoursTitle?: string
  contactTitle?: string
  openingHours?: OpeningHourRow[]
  locationsTitle?: string
  locationsDescription?: string
  locationsButtonText?: string
  branches?: Branch[]
}

export const defaultContactContent: ContactPageContent = {
  eyebrow: 'Contact',
  title: "We'd love to hear from you",
  description:
    'Questions, reservations or feedback — reach out and our team will get back to you.',
  formTitle: 'Send a message',
  phone: restaurant.phone,
  email: restaurant.email,
  hoursTitle: 'Opening Hours',
  contactTitle: 'Get in touch',
  openingHours: restaurant.openingHours,
  locationsTitle: 'Locations',
  locationsDescription:
    'Visit any of our three Addis Ababa branches for authentic Ethiopian food and house-brewed drinks.',
  locationsButtonText: 'Explore all locations',
  branches: defaultBranches,
}

export function mergeContactContent(
  data: Partial<ContactPageContent> | null | undefined,
  locale: 'en' | 'am' = 'en',
): ContactPageContent {
  const base = locale === 'am' ? {} : defaultContactContent
  const d = data ?? {}
  return {
    ...base,
    ...d,
    openingHours:
      Array.isArray(d.openingHours) && d.openingHours.length
        ? d.openingHours
        : locale === 'am'
          ? []
          : defaultContactContent.openingHours,
    branches:
      Array.isArray(d.branches) && d.branches.length
        ? d.branches
        : locale === 'am'
          ? []
          : defaultContactContent.branches,
  }
}
