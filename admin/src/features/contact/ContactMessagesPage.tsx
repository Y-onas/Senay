import { useEffect, useState } from 'react'
import { Mail, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { contactApi } from '@/lib/api'
import { ADMIN_CONFIRM, confirmAdminAction } from '@/lib/confirm-messages'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'

type ContactMessage = {
  id: string
  name: string
  email: string
  phone?: string | null
  message: string
  read: boolean
  createdAt: string
}

export function ContactMessagesPage() {
  const [items, setItems] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    contactApi
      .messages()
      .then((rows) =>
        setItems(
          rows.map((row) => ({
            id: String(row.id),
            name: String(row.name || ''),
            email: String(row.email || ''),
            phone: typeof row.phone === 'string' ? row.phone : null,
            message: String(row.message || ''),
            read: Boolean(row.read),
            createdAt: String(row.createdAt || ''),
          })),
        ),
      )
      .finally(() => setLoading(false))
  }, [])

  const toggleRead = async (id: string, read: boolean) => {
    try {
      await contactApi.markRead(id, read)
      setItems((rows) => rows.map((r) => (r.id === id ? { ...r, read } : r)))
      toast.success(read ? 'Marked as read' : 'Marked as unread')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    }
  }

  const remove = async (id: string) => {
    if (!(await confirmAdminAction(ADMIN_CONFIRM.deleteMessage))) return
    try {
      await contactApi.delete(id)
      setItems((rows) => rows.filter((r) => r.id !== id))
      toast.success('Message deleted')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    }
  }

  if (loading) return <Skeleton className="h-96" />

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Contact Messages" description="Messages submitted from the contact form." />
      <div className="space-y-3">
        {items.map((item) => (
          <Card key={item.id} className={item.read ? 'opacity-80' : ''}>
            <CardContent className="space-y-3 pt-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {item.name} · {item.email}
                  </p>
                  {item.phone ? <p className="text-sm text-brown/60">{item.phone}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  {!item.read ? <Badge>New</Badge> : <Badge variant="secondary">Read</Badge>}
                  <span className="text-xs text-brown/50">{formatDate(item.createdAt)}</span>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-brown/80">{item.message}</p>
              <div className="flex gap-2">
                {!item.read ? (
                  <Button size="sm" variant="outline" onClick={() => toggleRead(item.id, true)}>
                    <Mail className="mr-1 h-4 w-4" /> Mark read
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggleRead(item.id, false)}>
                    Mark unread
                  </Button>
                )}
                <Button size="sm" variant="destructive" onClick={() => remove(item.id)}>
                  <Trash2 className="mr-1 h-4 w-4" /> Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!items.length ? <p className="text-sm text-brown/60">No contact messages yet.</p> : null}
      </div>
    </div>
  )
}
