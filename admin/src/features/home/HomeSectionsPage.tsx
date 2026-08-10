import { useEffect, useState, type ComponentType } from 'react'
import { toast } from 'sonner'
import { contentApi, type HomeSection } from '@/lib/api'
import { HeroEditor } from '@/features/home/editors/HeroEditor'
import { CategoriesEditor } from '@/features/home/editors/CategoriesEditor'
import { FeaturedMenuEditor } from '@/features/home/editors/FeaturedMenuEditor'
import { OffersEditor } from '@/features/home/editors/OffersEditor'
import { WhyChooseUsEditor } from '@/features/home/editors/WhyChooseUsEditor'
import { HomeCateringEditor } from '@/features/home/editors/HomeCateringEditor'
import { StoryEditor, VideoEditor, CtaEditor } from '@/features/home/editors/StoryVideoCtaEditors'
import type { SectionEditorProps } from '@/features/home/editors/types'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const SECTION_NAV = [
  { key: 'hero', label: 'Hero' },
  { key: 'categories', label: 'Categories' },
  { key: 'offers', label: 'Special Offers' },
  { key: 'featuredMenu', label: 'Our Menu', aliases: ['featured-menu'] },
  { key: 'story', label: 'About Preview' },
  { key: 'whyChooseUs', label: 'Why Choose Us', aliases: ['why-choose-us'] },
  { key: 'catering', label: 'Catering' },
  { key: 'video', label: 'Video' },
  { key: 'cta', label: 'Call to Action' },
] as const

const SECTION_EDITORS: Record<string, ComponentType<SectionEditorProps>> = {
  hero: HeroEditor,
  categories: CategoriesEditor,
  offers: OffersEditor,
  featuredMenu: FeaturedMenuEditor,
  story: StoryEditor,
  whyChooseUs: WhyChooseUsEditor,
  catering: HomeCateringEditor,
  video: VideoEditor,
  cta: CtaEditor,
}

function findSection(sections: HomeSection[], navKey: string, aliases: string[] = []) {
  const keys = new Set([navKey, ...aliases])
  return sections.find((section) => keys.has(section.key))
}

export function HomeSectionsPage() {
  const [sections, setSections] = useState<HomeSection[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string>(SECTION_NAV[0].key)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(true), 0)
    contentApi
      .homeSections()
      .then(setSections)
      .finally(() => {
        clearTimeout(timer)
        setLoading(false)
      })
  }, [])

  const activeNav = SECTION_NAV.find((item) => item.key === activeKey) ?? SECTION_NAV[0]
  const activeAliases = 'aliases' in activeNav ? [...activeNav.aliases] : []
  const activeSection = findSection(sections, activeNav.key, activeAliases)
  const ActiveEditor = SECTION_EDITORS[activeKey]

  const saveSection = async (key: string, section: HomeSection, content: Record<string, unknown>) => {
    setSavingKey(key)
    try {
      const updated = await contentApi.updateHomeSection(section.id, {
        label: section.label,
        order: section.order,
        enabled: section.enabled,
        content,
      })
      setSections((rows) => rows.map((row) => (row.id === updated.id ? updated : row)))
      toast.success(`${section.label || key} updated`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-burgundy">Home</h1>
        <p className="text-brown-muted">
          Manage homepage sections. Testimonials, FAQ, Gallery and About are managed from their own
          sidebar pages.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTION_NAV.map((item) => (
          <Button
            key={item.key}
            size="sm"
            variant={activeKey === item.key ? 'default' : 'outline'}
            onClick={() => setActiveKey(item.key)}
          >
            {item.label}
          </Button>
        ))}
      </div>

      {!activeSection ? (
        <Card className="p-8 text-center text-brown-muted">
          Section not found. Run server seed or create it.
        </Card>
      ) : ActiveEditor ? (
        <div className="space-y-4">
          {activeKey === 'story' ? (
            <Card className="border-yellow-brand/30 bg-yellow-brand/5 p-4">
              <p className="text-sm text-brown-muted">
                Opening hours are pulled from restaurant contact settings automatically — edit image,
                title and description below.
              </p>
            </Card>
          ) : null}
          <ActiveEditor
            section={activeSection}
            saving={savingKey === activeKey}
            onSave={(draft, content) => saveSection(activeKey, draft, content)}
          />
        </div>
      ) : (
        <Card className="border-dashed p-6 text-sm text-brown/65">
          Editor for <strong>{activeKey}</strong> is not available yet.
        </Card>
      )}
    </div>
  )
}
