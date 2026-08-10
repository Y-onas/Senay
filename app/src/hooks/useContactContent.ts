import { useEffect, useState } from 'react'
import {
  defaultContactContent,
  mergeContactContent,
  type ContactPageContent,
} from '@/data/contactDefaults'
import { getPageContent } from '@/services/contentService'
import { useLanguage } from '@/hooks/useLanguage'

export function useContactContent() {
  const { locale } = useLanguage()
  const [content, setContent] = useState<ContactPageContent>(
    locale === 'am' ? {} : defaultContactContent,
  )

  useEffect(() => {
    getPageContent('contact')
      .then((data) => setContent(mergeContactContent(data, locale)))
      .catch(() => setContent(locale === 'am' ? {} : defaultContactContent))
  }, [locale])

  return content
}
