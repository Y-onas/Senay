import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CMS_BASE } from '@/config/cms'
import { cmsApi, type CmsTelegramUser } from '@/services/cmsApi'
import { Field, inputClass } from './pages/shared'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'blocked', label: 'Blocked' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}

function displayName(user: CmsTelegramUser) {
  return [user.firstName, user.lastName].filter(Boolean).join(' ')
}

export default function CmsTelegramUsersPage() {
  const [users, setUsers] = useState<CmsTelegramUser[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    cmsApi
      .botUsers({ page, search: search.trim() || undefined, status: status || undefined })
      .then((res) => {
        setUsers(res.data)
        setTotalPages(res.pagination.totalPages)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load users'))
      .finally(() => setLoading(false))
  }, [page, search, status])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-burgundy/60">Telegram</p>
          <h1 className="font-display text-3xl uppercase">Telegram Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Everyone who starts the bot is saved here and linked to future requests.
          </p>
        </div>
        <Link to={`${CMS_BASE}/telegram`} className="text-sm text-burgundy">
          ← Bot settings
        </Link>
      </div>

      <div className="grid gap-3 rounded-2xl border border-burgundy/10 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
        <Field label="Search">
          <input
            className={inputClass()}
            value={search}
            onChange={(e) => {
              setPage(1)
              setSearch(e.target.value)
            }}
            placeholder="Username, name…"
          />
        </Field>
        <Field label="Status">
          <select
            className={inputClass()}
            value={status}
            onChange={(e) => {
              setPage(1)
              setStatus(e.target.value)
            }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {error ? <p className="text-red-600">{error}</p> : null}
      {loading ? <p className="text-gray-500">Loading users…</p> : null}

      {!loading && (
        <div className="overflow-x-auto rounded-2xl border border-burgundy/10 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase text-gray-400">
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
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-burgundy/[0.03]">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link to={`${CMS_BASE}/telegram/users/${user.id}`} className="text-burgundy">
                      {user.telegramId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{user.username ? `@${user.username}` : '—'}</td>
                  <td className="px-4 py-3">{displayName(user)}</td>
                  <td className="px-4 py-3 uppercase">{user.languageCode}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.firstSeenAt)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.lastInteractAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-xs capitalize text-burgundy">
                      {user.status ?? (user.isBlocked ? 'blocked' : 'active')}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user._count?.requests ?? 0}</td>
                </tr>
              ))}
              {!users.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No Telegram users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-full border px-3 py-1 text-sm disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-full border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
