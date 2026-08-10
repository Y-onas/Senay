import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Users } from 'lucide-react'
import { botApi, type TelegramUserListItem } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { PageHeader } from '@/components/common/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export function TelegramUsersPage() {
  const [users, setUsers] = useState<TelegramUserListItem[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    botApi
      .users({ page, search, status: status || undefined })
      .then((res) => {
        setUsers(res.data)
        setTotalPages(res.pagination.totalPages || 1)
      })
      .finally(() => setLoading(false))
  }, [page, search, status])

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Telegram Users"
        description="Everyone who starts the bot — linked to future requests."
        icon={<Users className="h-5 w-5" />}
        actions={
          <Link to="/telegram" className="text-sm text-burgundy hover:underline">
            ← Back to bot
          </Link>
        }
      />

      <Card>
        <CardContent className="grid gap-3 pt-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-2">
            <Label>Search</Label>
            <Input
              value={search}
              onChange={(e) => {
                setPage(1)
                setSearch(e.target.value)
              }}
              placeholder="Username or name…"
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={status || 'all'}
              onValueChange={(value) => {
                setPage(1)
                setStatus(value === 'all' ? '' : value)
              }}
            >
              <SelectTrigger className="w-full min-w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-brown/60">
                  <th className="px-4 py-3">Telegram ID</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Requests</th>
                </tr>
              </thead>
              <tbody>
                {users.length ? (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-border/40 hover:bg-burgundy/[0.03]">
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link to={`/telegram/users/${user.id}`} className="font-medium text-burgundy">
                          {user.telegramId}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{user.username ? `@${user.username}` : '—'}</td>
                      <td className="px-4 py-3">
                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 uppercase">{user.languageCode || '—'}</td>
                      <td className="px-4 py-3 text-xs text-brown/60">{formatDate(user.firstSeenAt)}</td>
                      <td className="px-4 py-3 text-xs text-brown/60">{formatDate(user.lastInteractAt)}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-xs capitalize text-burgundy">
                          {user.status || (user.isBlocked ? 'blocked' : 'active')}
                        </span>
                      </td>
                      <td className="px-4 py-3">{user._count?.requests ?? 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-brown/60">
                      No Telegram users yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {totalPages > 1 ? (
              <div className="flex items-center justify-center gap-3 border-t px-4 py-3">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <span className="text-sm text-brown/60">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </div>
        </Card>
      )}
    </div>
  )
}
