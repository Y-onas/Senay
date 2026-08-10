import { useEffect, useMemo, useState } from 'react'
import { KeyRound, Trash2 } from 'lucide-react'
import { cmsApi } from '@/services/cmsApi'
import { ActionMenu, AddButton, ConfirmDialog, DataTable, EmptyState, FormField, Modal, StatusBadge, Toolbar, inputClass } from './pages/cms-ui'

type AdminRow = {
  id: string
  name: string
  email: string
  status: string
  telegramChatId?: string | null
  role: { id: string; name: string }
}

type RoleRow = { id: string; name: string }

export default function CmsTeamPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [msg, setMsg] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', roleId: '' })
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<{ open: boolean; admin?: AdminRow }>({ open: false })
  const [resetAdmin, setResetAdmin] = useState<AdminRow | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [a, r] = await Promise.all([cmsApi.admins(), cmsApi.roles()])
      setAdmins(a as AdminRow[])
      const inviteRoles = (r as RoleRow[]).filter(
        (role) => role.name === 'Super Admin' || role.name === 'Content Management',
      )
      setRoles(inviteRoles)
      if (!form.roleId && inviteRoles[0]) {
        const preferred =
          inviteRoles.find((role) => role.name === 'Content Management') ??
          inviteRoles[0]
        setForm((f) => ({ ...f, roleId: preferred.id }))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (!q.trim()) return admins
    const term = q.toLowerCase()
    return admins.filter((a) => a.name.toLowerCase().includes(term) || a.email.toLowerCase().includes(term))
  }, [admins, q])

  const create = async () => {
    setSaving(true)
    try {
      await cmsApi.createAdmin({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        roleId: form.roleId,
        status: 'ACTIVE',
      })
      setForm({ name: '', email: '', roleId: roles.find((r) => r.name !== 'Super Admin')?.id ?? roles[0]?.id ?? '' })
      setModalOpen(false)
      setMsg('Admin invited — they can sign in with Google using that email')
      load()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleStatus = async (a: AdminRow) => {
    const status = a.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    await cmsApi.patchAdmin(a.id, { status })
    setMsg(`${a.name} → ${status}`)
    load()
  }

  const updateTelegramId = async (a: AdminRow, value: string) => {
    const v = value.trim() || null
    if (v !== (a.telegramChatId ?? null)) {
      await cmsApi.patchAdmin(a.id, { telegramChatId: v })
      setMsg(`Telegram ID updated for ${a.name}`)
      load()
    }
  }

  const reset = async () => {
    if (!resetAdmin || !newPassword) return
    setResetting(true)
    try {
      await cmsApi.resetPassword(resetAdmin.id, newPassword)
      setMsg('Password reset')
      setResetAdmin(null)
      setNewPassword('')
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Reset failed')
    } finally {
      setResetting(false)
    }
  }

  const remove = async (a: AdminRow) => {
    await cmsApi.deleteAdmin(a.id)
    load()
  }

  const isValid = form.name.trim() && form.email.trim() && form.roleId

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-burgundy/60">System</p>
        <h1 className="font-display text-3xl uppercase">Admins</h1>
        <p className="mt-1 text-sm text-gray-500">
          Super Admin = full access. Content Management = site & content only (no
          System, Telegram, or Catalog).
        </p>
        {msg && <p className="mt-2 text-sm text-green-700">{msg}</p>}
      </div>

      <Toolbar
        search={q}
        onSearch={setQ}
        searchPlaceholder="Search admins…"
        action={<AddButton label="Add admin" onClick={() => setModalOpen(true)} />}
      />

      <DataTable
        loading={loading}
        rows={filtered}
        columns={[
          {
            key: 'name',
            header: 'Name',
            cell: (a) => (
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-gray-500">{a.email}</p>
              </div>
            ),
          },
          {
            key: 'role',
            header: 'Role',
            cell: (a) => <p>{a.role?.name}</p>,
          },
          {
            key: 'status',
            header: 'Status',
            width: '100px',
            cell: (a) => (
              <StatusBadge variant={a.status === 'ACTIVE' ? 'success' : 'neutral'}>{a.status}</StatusBadge>
            ),
          },
          {
            key: 'telegram',
            header: 'Telegram ID',
            width: '160px',
            cell: (a) => (
              <div>
                <input
                  defaultValue={a.telegramChatId ?? ''}
                  placeholder="Chat ID"
                  className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-xs font-mono"
                  onBlur={(e) => updateTelegramId(a, e.target.value)}
                />
                <p className="mt-1 max-w-32 text-[10px] leading-tight text-gray-400">
                  Send <code>/myid</code> to the bot, then paste the numeric ID here.
                </p>
              </div>
            ),
          },
        ]}
        action={(a) => (
          <ActionMenu
            items={[
              {
                label: a.status === 'ACTIVE' ? 'Disable' : 'Enable',
                onClick: () => toggleStatus(a),
              },
              {
                label: 'Reset password',
                icon: KeyRound,
                onClick: () => setResetAdmin(a),
              },
              {
                label: 'Delete',
                icon: Trash2,
                danger: true,
                onClick: () => setConfirm({ open: true, admin: a }),
              },
            ]}
          />
        )}
        empty={
          <EmptyState
            title="No admins yet"
            description="Invite team members to manage orders, content, and services."
            action={<AddButton label="Invite admin" onClick={() => setModalOpen(true)} />}
          />
        }
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add admin"
        description="Save their name and Google email. They sign in with Clerk — no password to share."
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!isValid || saving}
              onClick={create}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add admin'}
            </button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" required>
            <input
              className={inputClass()}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>
          <FormField label="Email (Google)" required>
            <input
              type="email"
              className={inputClass()}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="name@gmail.com"
            />
          </FormField>
          <FormField label="Role" required className="sm:col-span-2">
            <select
              className={inputClass()}
              value={form.roleId}
              onChange={(e) => setForm({ ...form, roleId: e.target.value })}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      </Modal>

      <Modal
        open={!!resetAdmin}
        onClose={() => {
          setResetAdmin(null)
          setNewPassword('')
        }}
        title={resetAdmin ? `Reset password for ${resetAdmin.name}` : 'Reset password'}
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setResetAdmin(null)
                setNewPassword('')
              }}
              className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={newPassword.length < 8 || resetting}
              onClick={reset}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resetting ? 'Resetting…' : 'Reset password'}
            </button>
          </>
        }
      >
        <FormField label="New password (min 8 characters)">
          <input
            type="password"
            className={inputClass()}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </FormField>
      </Modal>

      <ConfirmDialog
        open={confirm.open}
        title={confirm.admin ? `Delete ${confirm.admin.name}?` : 'Delete admin?'}
        description="This will remove their access immediately."
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirm({ open: false })}
        onConfirm={() => {
          if (confirm.admin) remove(confirm.admin)
          setConfirm({ open: false })
        }}
      />
    </div>
  )
}
