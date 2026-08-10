import type { ReactNode } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import type { HomeSection } from '@/lib/api'

type Props = {
  section: HomeSection
  title: string
  description?: string
  onEnabledChange: (enabled: boolean) => void
  onSave: () => void
  saving?: boolean
  children: ReactNode
}

export function SectionEditorShell({
  section,
  title,
  description,
  onEnabledChange,
  onSave,
  saving,
  children,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? <p className="mt-1 text-sm text-brown/60">{description}</p> : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch checked={section.enabled} onCheckedChange={onEnabledChange} />
              <span className="text-sm text-brown/70">Enabled</span>
            </div>
            <Button size="sm" onClick={onSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving…' : 'Save section'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}
