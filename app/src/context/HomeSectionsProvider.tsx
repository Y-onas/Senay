import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  getRawHomeSections,
  type HomeSectionRecord,
} from '@/services/homeSectionsService'

type HomeSectionsContextValue = {
  sections: HomeSectionRecord[] | null
  loading: boolean
  ensureLoaded: () => void
}

const HomeSectionsContext = createContext<HomeSectionsContextValue | null>(null)

export function HomeSectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<HomeSectionRecord[] | null>(null)
  const [loading, setLoading] = useState(false)
  const startedRef = useRef(false)

  const ensureLoaded = useCallback(() => {
    if (startedRef.current) return
    startedRef.current = true
    setLoading(true)
    getRawHomeSections()
      .then((data) => {
        setSections(data)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const value = useMemo(
    () => ({ sections, loading, ensureLoaded }),
    [sections, loading, ensureLoaded],
  )

  return (
    <HomeSectionsContext.Provider value={value}>{children}</HomeSectionsContext.Provider>
  )
}

export function useHomeSectionsContext() {
  const ctx = useContext(HomeSectionsContext)
  if (!ctx) {
    throw new Error('useHomeSectionsContext must be used within HomeSectionsProvider')
  }
  return ctx
}

export function useOptionalHomeSectionsContext() {
  return useContext(HomeSectionsContext)
}
