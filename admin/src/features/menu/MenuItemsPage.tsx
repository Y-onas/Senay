import { useEffect, useMemo, useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { menuApi } from '@/lib/api'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { ensureLocalized, normalizeField, readLocale, type LocalizedText } from '@/lib/i18n'
import { LocalizedField } from '@/components/cms/LocalizedField'
import { ImageUploader } from '@/components/forms/ImageUploader'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Category = { id: string; name: string; slug: string }

type MenuItem = {
  id: string
  name: LocalizedText
  description: LocalizedText
  price: number | null
  categoryId: string
  image: string
  published: boolean
  featured: boolean
  vegetarian: boolean
  order: number
}

function normalizeItem(row: Record<string, unknown>): MenuItem {
  return {
    id: String(row.id),
    name: normalizeField(row.nameI18n ?? row.name),
    description: normalizeField(row.descriptionI18n ?? row.description),
    price: typeof row.price === 'number' ? row.price : row.price != null ? Number(row.price) : null,
    categoryId: String(row.categoryId || ''),
    image: String(row.image || ''),
    published: row.published !== false,
    featured: Boolean(row.featured),
    vegetarian: Boolean(row.vegetarian),
    order: typeof row.order === 'number' ? row.order : 0,
  }
}

function itemPayload(item: MenuItem) {
  return {
    name: readLocale(item.name, 'en'),
    nameI18n: ensureLocalized(item.name),
    description: readLocale(item.description, 'en'),
    descriptionI18n: ensureLocalized(item.description),
    price: item.price,
    categoryId: item.categoryId,
    image: item.image || null,
    published: item.published,
    featured: item.featured,
    vegetarian: item.vegetarian,
    order: item.order,
  }
}

export function MenuItemsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  const reload = async () => {
    const [cats, menuItems] = await Promise.all([menuApi.categories(), menuApi.items()])
    setCategories(
      cats.map((row) => ({
        id: String(row.id),
        name: String(row.name || ''),
        slug: String(row.slug || ''),
      })),
    )
    setItems(menuItems.map((row) => normalizeItem(row)))
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  const visibleItems = useMemo(
    () => (filterCategory === 'all' ? items : items.filter((item) => item.categoryId === filterCategory)),
    [items, filterCategory],
  )

  const add = async () => {
    const categoryId = categories[0]?.id
    if (!categoryId) {
      toast.error('Create a category first')
      return
    }
    setAdding(true)
    try {
      const created = await menuApi.createItem({
        name: 'New item',
        nameI18n: { en: 'New item', am: '' },
        description: 'Description',
        descriptionI18n: { en: 'Description', am: '' },
        price: 0,
        categoryId,
        published: true,
        order: items.length + 1,
      })
      setItems((prev) => [...prev, normalizeItem(created as Record<string, unknown>)])
      toast.success('Menu item added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Add failed')
    } finally {
      setAdding(false)
    }
  }

  const save = async (item: MenuItem) => {
    if (!readLocale(item.name, 'en').trim() || !readLocale(item.description, 'en').trim()) {
      toast.error('Name and description are required')
      return
    }
    try {
      const updated = await menuApi.updateItem(item.id, itemPayload(item))
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? normalizeItem(updated as Record<string, unknown>) : row)),
      )
      toast.success('Saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    }
  }

  const remove = async (id: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteMenuItem))) return
    try {
      await menuApi.deleteItem(id)
      setItems((prev) => prev.filter((row) => row.id !== id))
      toast.success('Deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Menu Items"
        description="Restaurant menu categories and dishes with images and prices."
        actions={
          <Button onClick={add} disabled={adding}>
            <Plus className="mr-2 h-4 w-4" />
            {adding ? 'Adding…' : 'Add item'}
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Filter by category</Label>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-base font-semibold">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span key={cat.id} className="rounded-full border px-3 py-1 text-sm">
              {cat.name}
            </span>
          ))}
          {!categories.length ? <p className="text-sm text-brown/60">No categories found.</p> : null}
        </div>
      </Card>

      <div className="space-y-4">
        {visibleItems.map((item) => (
          <Card key={item.id} className="p-4">
            <div className="grid gap-4 lg:grid-cols-[auto_1fr]">
              <ImageUploader
                value={item.image}
                onChange={(url) =>
                  setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, image: url || '' } : r)))
                }
                aspect="square"
              />
              <div className="space-y-3">
                <LocalizedField
                  label="Name"
                  value={item.name}
                  onChange={(name) =>
                    setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, name } : r)))
                  }
                />
                <LocalizedField
                  label="Description"
                  value={item.description}
                  multiline
                  onChange={(description) =>
                    setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, description } : r)))
                  }
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Price (ETB)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={item.price ?? ''}
                      onChange={(e) =>
                        setItems((rows) =>
                          rows.map((r) =>
                            r.id === item.id
                              ? { ...r, price: e.target.value === '' ? null : Number(e.target.value) }
                              : r,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select
                      value={item.categoryId}
                      onValueChange={(categoryId) =>
                        setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, categoryId } : r)))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Sort order</Label>
                    <Input
                      type="number"
                      value={item.order}
                      onChange={(e) =>
                        setItems((rows) =>
                          rows.map((r) => (r.id === item.id ? { ...r, order: Number(e.target.value) } : r)),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  {(
                    [
                      ['published', 'Published'],
                      ['featured', 'Featured'],
                      ['vegetarian', 'Vegetarian'],
                    ] as const
                  ).map(([key, label]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Switch
                        checked={item[key]}
                        onCheckedChange={(checked) =>
                          setItems((rows) => rows.map((r) => (r.id === item.id ? { ...r, [key]: checked } : r)))
                        }
                      />
                      <Label className="mb-0">{label}</Label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => save(item)}>
                    <Save className="mr-1 h-4 w-4" /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        {!visibleItems.length ? <p className="text-sm text-brown/60">No menu items in this category.</p> : null}
      </div>
    </div>
  )
}
