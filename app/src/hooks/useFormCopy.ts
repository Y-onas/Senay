import { useEffect, useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { fillCopy, resolveFormCopy, type FormCopyValues } from '@/lib/formCopy'
import { getFormCopyFromApi } from '@/services/catalogApi'

export function useFormCopy(serviceSlug: string) {
  const { locale } = useLanguage()
  const [copy, setCopy] = useState(() => resolveFormCopy(serviceSlug, locale))

  useEffect(() => {
    let cancelled = false
    setCopy(resolveFormCopy(serviceSlug, locale))
    getFormCopyFromApi(serviceSlug)
      .then((stored) => {
        if (!cancelled) setCopy(resolveFormCopy(serviceSlug, locale, stored))
      })
      .catch(() => {
        if (!cancelled) setCopy(resolveFormCopy(serviceSlug, locale))
      })
    return () => {
      cancelled = true
    }
  }, [serviceSlug, locale])

  return copy
}

export { fillCopy }
export type { FormCopyValues }
