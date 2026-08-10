import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { toast } from 'sonner'
import { botApi, type TelegramUserDetail } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function TelegramUserDetailPage() {
  const { id = '' } = useParams()
  const [user, setUser] = useState<TelegramUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    botApi
      .user(id)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [id])

  const toggleBlocked = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await botApi.patchUser(user.id, { isBlocked: !user.isBlocked })
      setUser((current) => (current ? { ...current, ...updated } : current))
      toast.success(user.isBlocked ? 'User unblocked' : 'User blocked')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Skeleton className="h-64" />
  if (!user) return <p className="text-brown/60">User not found.</p>

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Telegram user'

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-brown/60">Telegram user</p>
          <h1 className="font-display text-3xl font-bold text-burgundy">{fullName}</h1>
          <p className="mt-1 text-sm text-brown/60">
            {user.username ? `@${user.username}` : 'No username'} · ID {user.telegramId}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/telegram/users">← All users</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-display text-lg font-bold text-burgundy">Profile</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-brown/60">Language</dt>
              <dd className="uppercase">{user.languageCode || '—'}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brown/60">Joined</dt>
              <dd>{formatDate(user.firstSeenAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brown/60">Last active</dt>
              <dd>{formatDate(user.lastInteractAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brown/60">Status</dt>
              <dd className="capitalize">{user.status || (user.isBlocked ? 'blocked' : 'active')}</dd>
            </div>
          </dl>
          <Button variant="outline" className="mt-4" disabled={saving} onClick={toggleBlocked}>
            {user.isBlocked ? 'Unblock user' : 'Block user'}
          </Button>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-bold text-burgundy">Activity</h2>
          <p className="mt-4 font-display text-4xl text-burgundy">{user.requests?.length || 0}</p>
          <p className="text-sm text-brown/60">Requests submitted via Telegram</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request history</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border/50">
            {(user.requests || []).length ? (
              user.requests!.map((request) => (
                <li key={request.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{request.reference}</p>
                      <p className="text-sm text-brown/60">
                        {request.service?.name || 'Service'} · {formatDate(request.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-burgundy/10 px-2.5 py-0.5 text-xs text-burgundy">
                        {request.status}
                      </span>
                      <Link to={`/requests/${request.id}`} className="text-sm text-burgundy hover:underline">
                        View
                      </Link>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="py-8 text-center text-sm text-brown/60">No request history.</li>
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
