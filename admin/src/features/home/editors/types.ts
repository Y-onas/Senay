import type { HomeSection } from '@/lib/api'

export type SectionEditorProps = {
  section: HomeSection
  saving?: boolean
  onSave: (section: HomeSection, content: Record<string, unknown>) => void
}
