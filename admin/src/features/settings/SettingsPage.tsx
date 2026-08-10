import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { seoApi, settingsApi } from '@/lib/api'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'

type SeoValues = {
  siteTitle?: string
  defaultDescription?: string
  defaultKeywords?: string
  logo?: string | null
  ogImage?: string | null
}

type RestaurantValues = {
  phone?: string
  email?: string
  address?: string
}

export function SettingsPage() {
  const [seo, setSeo] = useState<SeoValues>({})
  const [restaurant, setRestaurant] = useState<RestaurantValues>({})
  const [loading, setLoading] = useState(true)
  const [savingSeo, setSavingSeo] = useState(false)
  const [savingRestaurant, setSavingRestaurant] = useState(false)

  useEffect(() => {
    Promise.all([seoApi.list(), settingsApi.get('restaurant')])
      .then(([items, restaurantSettings]) => {
        const global = items.find((item) => item.key === 'global')
        setSeo((global?.value ?? {}) as SeoValues)
        setRestaurant((restaurantSettings ?? {}) as RestaurantValues)
      })
      .finally(() => setLoading(false))
  }, [])

  const saveSeo = async () => {
    setSavingSeo(true)
    try {
      await seoApi.update('global', seo)
      toast.success('SEO settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingSeo(false)
    }
  }

  const saveRestaurant = async () => {
    setSavingRestaurant(true)
    try {
      await settingsApi.update('restaurant', restaurant)
      toast.success('Restaurant details saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingRestaurant(false)
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Settings" description="Global SEO and restaurant details." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>SEO & branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Site title</Label>
              <Input value={seo.siteTitle || ''} onChange={(e) => setSeo({ ...seo, siteTitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Default description</Label>
              <Textarea
                value={seo.defaultDescription || ''}
                onChange={(e) => setSeo({ ...seo, defaultDescription: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Default keywords</Label>
              <Input
                value={seo.defaultKeywords || ''}
                onChange={(e) => setSeo({ ...seo, defaultKeywords: e.target.value })}
              />
            </div>
            <ImageUploader
              label="Site logo"
              hint="Shown in the website navbar. Upload or reuse from media."
              value={seo.logo || ''}
              onChange={(url) => setSeo({ ...seo, logo: url || null })}
            />
            <ImageUploader
              label="Social / OG image"
              hint="Used when the site is shared on social media."
              value={seo.ogImage || ''}
              onChange={(url) => setSeo({ ...seo, ogImage: url || null })}
              aspect="wide"
            />
            <Button onClick={saveSeo} disabled={savingSeo}>
              <Save className="mr-2 h-4 w-4" />
              {savingSeo ? 'Saving…' : 'Save SEO'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Restaurant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={restaurant.phone || ''} onChange={(e) => setRestaurant({ ...restaurant, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={restaurant.email || ''} onChange={(e) => setRestaurant({ ...restaurant, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea value={restaurant.address || ''} onChange={(e) => setRestaurant({ ...restaurant, address: e.target.value })} />
            </div>
            <Button onClick={saveRestaurant} disabled={savingRestaurant}>
              <Save className="mr-2 h-4 w-4" />
              {savingRestaurant ? 'Saving…' : 'Save details'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
