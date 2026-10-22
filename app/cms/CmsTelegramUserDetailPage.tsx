import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { CMS_BASE } from '@/config/cms'
import { cmsApi, type CmsTelegramUserDetail } from '@/services/cmsApi'

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

export default function CmsTelegramUserDetailPage() {
  const { id } = useParams()
  const [user, setUser] = useState<CmsTelegramUserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    cmsApi
      .botUser(id)
      .then(setUser)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load user'))
      .finally(() => setLoading(false))
  }, [id])

  const toggleBlocked = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await cmsApi.patchBotUser(user.id, { isBlocked: !user.isBlocked })
      setUser((current) => (current ? { ...current, ...updated } : current))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-500">Loading user…</p>
  if (error) return <p className="text-red-600">{error}</p>
  if (!user) return <p className="text-gray-500">User not found.</p>

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-burgundy/60">Telegram user</p>
          <h1 className="font-display text-3xl uppercase">{fullName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {user.username ? `@${user.username}` : 'No username'} · ID {user.telegramId}
          </p>
        </div>
        <Link to={`${CMS_BASE}/telegram/users`} className="text-sm text-burgundy">
          ← All users
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-burgundy/10 bg-white p-5">
          <h2 className="font-display text-lg uppercase">Profile</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Language</dt>
              <dd className="uppercase">{user.languageCode}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Joined</dt>
              <dd>{formatDate(user.firstSeenAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Last active</dt>
              <dd>{formatDate(user.lastInteractAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Status</dt>
              <dd className="capitalize">{user.status ?? (user.isBlocked ? 'blocked' : 'active')}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={toggleBlocked}
            disabled={saving}
            className="mt-4 rounded-full border border-burgundy px-4 py-2 text-sm text-burgundy disabled:opacity-50"
          >
            {user.isBlocked ? 'Unblock user' : 'Block user'}
          </button>
        </div>

        <div className="rounded-2xl border border-burgundy/10 bg-white p-5">
          <h2 className="font-display text-lg uppercase">Activity</h2>
          <p className="mt-4 text-3xl font-display text-burgundy">{user.requests.length}</p>
          <p className="text-sm text-gray-500">Requests submitted via Telegram</p>
          {user.requests[0] ? (
            <p className="mt-4 text-sm text-gray-600">
              Last interaction: {formatDate(user.requests[0].createdAt)} — {user.requests[0].status}
            </p>
          ) : (
            <p className="mt-4 text-sm text-gray-500">No requests yet.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-burgundy/10 bg-white">
        <div className="border-b border-burgundy/5 px-5 py-4">
          <h2 className="font-display text-lg uppercase">Request history</h2>
        </div>
        <ul className="divide-y divide-burgundy/5">
          {user.requests.map((request) => (
            <li key={request.id} className="px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{request.reference}</p>
                  <p className="text-sm text-gray-500">
                    {request.service?.name ?? 'Service'} · {formatDate(request.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-burgundy/10 px-2.5 py-0.5 text-xs text-burgundy">
                    {request.status}
                  </span>
                  <Link to={`${CMS_BASE}/requests/${request.id}`} className="text-sm text-burgundy">
                    View
                  </Link>
                </div>
              </div>
            </li>
          ))}
          {!user.requests.length && (
            <li className="px-5 py-8 text-center text-sm text-gray-500">No request history.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
