// Telegram admin pages — minify into st-hq bundle as b7, u7, d7
function b7() {
  const defaults = {
    enabled: true,
    webAppBaseUrl: '',
    notificationsEnabled: true,
    notifyOnNewRequest: true,
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'am'],
  }
  const readLocale = (base, i18n, lang) => {
    if (i18n && typeof i18n === 'object' && typeof i18n[lang] === 'string' && i18n[lang]) return i18n[lang]
    return lang === 'en' ? base || '' : ''
  }
  const [saved, setSaved] = x.useState(defaults)
  const [draft, setDraft] = x.useState(defaults)
  const [menus, setMenus] = x.useState([])
  const [messages, setMessages] = x.useState([])
  const [services, setServices] = x.useState([])
  const [health, setHealth] = x.useState(null)
  const [stats, setStats] = x.useState(null)
  const [admins, setAdmins] = x.useState([])
  const [loading, setLoading] = x.useState(true)
  const [saving, setSaving] = x.useState(false)
  const [busy, setBusy] = x.useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)
  const rootMenus = menus.filter((item) => !item.parentKey).sort((a, b) => a.sortOrder - b.sortOrder)

  const reload = () =>
    Promise.all([
      Ws.settings.get('telegram'),
      Ws.bot.menus(),
      Ws.bot.messages(),
      Ws.bot.services(),
      Ws.bot.health(),
      Ws.bot.stats(),
      Ws.bot.admins(),
    ]).then(([telegram, menuRows, messageRows, serviceRows, healthRow, statsRow, adminRows]) => {
      const merged = {
        ...defaults,
        ...(telegram || {}),
        defaultLanguage: telegram?.defaultLanguage === 'am' ? 'am' : 'en',
        supportedLanguages: Array.isArray(telegram?.supportedLanguages)
          ? telegram.supportedLanguages.filter((lang) => lang === 'en' || lang === 'am')
          : defaults.supportedLanguages,
      }
      delete merged.botToken
      delete merged.webhookUrl
      delete merged.websiteBaseUrl
      setSaved(merged)
      setDraft(merged)
      setMenus(menuRows || [])
      setMessages(messageRows || [])
      setServices(serviceRows || [])
      setHealth(healthRow || null)
      setStats(statsRow || null)
      setAdmins(adminRows || [])
    })

  x.useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [])

  const saveSettings = async () => {
    setSaving(true)
    try {
      await Ws.settings.update('telegram', draft)
      setSaved(draft)
      setHealth(await Ws.bot.health())
      we.success('Telegram settings saved')
    } finally {
      setSaving(false)
    }
  }

  const saveMenu = async (item) => {
    setBusy(true)
    try {
      await Ws.bot.patchMenu(item.id, {
        parentKey: item.parentKey || null,
        label: item.label,
        labelI18n: item.labelI18n,
        action: item.action,
        actionData: item.actionData || null,
        icon: item.icon || null,
        enabled: item.enabled,
        sortOrder: Number(item.sortOrder),
      })
      we.success('Menu item saved')
    } finally {
      setBusy(false)
    }
  }

  const reorderRoot = async (index, direction) => {
    const next = index + direction
    if (next < 0 || next >= rootMenus.length) return
    const reordered = [...rootMenus]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(next, 0, moved)
    setMenus([...reordered, ...menus.filter((item) => item.parentKey)])
    await Ws.bot.reorderMenus(reordered.map((item) => item.id))
  }

  const saveMessage = async (item) => {
    setBusy(true)
    try {
      await Ws.bot.putMessage(item.key, { text: item.text, textI18n: item.textI18n })
      we.success('Message saved')
    } finally {
      setBusy(false)
    }
  }

  const saveServiceDescription = async (item) => {
    setBusy(true)
    try {
      const enText = readLocale(item.description, item.descriptionI18n, 'en')
      await Ws.bot.patchService(item.id, {
        description: enText,
        descriptionI18n: item.descriptionI18n,
      })
      we.success('Service description saved')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return i.jsx(ht, { className: 'h-96' })

  const statusClass =
    health?.status === 'online'
      ? 'bg-emerald-100 text-emerald-800'
      : health?.status === 'degraded'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800'

  return i.jsxs('div', {
    className: 'space-y-6 animate-fade-in pb-24',
    children: [
      i.jsx(r0, {
        title: 'Telegram Bot',
        description: 'Connection, menus, messages, and notifications — all from the dashboard.',
        icon: i.jsx(mr, { className: 'h-5 w-5' }),
      }),
      health
        ? i.jsxs(Ke, {
            className: 'border-burgundy/10',
            children: [
              i.jsxs('div', {
                className: 'flex flex-wrap items-center justify-between gap-3 p-5',
                children: [
                  i.jsxs('div', {
                    children: [
                      i.jsx('p', { className: 'text-xs uppercase tracking-wide text-brown-muted', children: 'Status' }),
                      i.jsx('p', {
                        className: 'font-display text-2xl font-bold text-burgundy',
                        children: health.botUsername ? `@${health.botUsername}` : 'Not connected',
                      }),
                    ],
                  }),
                  i.jsx('span', {
                    className: `rounded-full px-3 py-1 text-xs font-semibold uppercase ${statusClass}`,
                    children: health.status || 'offline',
                  }),
                ],
              }),
              i.jsxs('div', {
                className: 'grid gap-2 px-5 pb-5 text-sm md:grid-cols-2 lg:grid-cols-4',
                children: [
                  i.jsxs('p', { children: ['Enabled: ', draft.enabled ? 'Yes' : 'No'] }),
                  i.jsxs('p', { children: ['Token valid: ', health.tokenValid ? 'Yes' : 'No'] }),
                  i.jsxs('p', { children: ['Process online: ', health.processOnline ? 'Yes' : 'No'] }),
                  i.jsxs('p', { children: ['Mode: ', health.mode || 'polling'] }),
                ],
              }),
            ],
          })
        : null,
      stats
        ? i.jsx('div', {
            className: 'grid gap-3 sm:grid-cols-2 lg:grid-cols-4',
            children: [
              ['Total users', stats.totalUsers],
              ['New today', stats.newUsersToday],
              ['Active (7d)', stats.activeUsersLast7Days],
              ['Telegram requests', stats.telegramRequests],
            ].map(([label, value]) =>
              i.jsxs(Ke, {
                className: 'p-4',
                children: [
                  i.jsx('p', { className: 'text-xs uppercase text-brown-muted', children: label }),
                  i.jsx('p', { className: 'mt-1 font-display text-3xl text-burgundy', children: value }),
                ],
              }, label),
            ),
          })
        : null,
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Connection' }) }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              i.jsxs('label', {
                className: 'flex items-center gap-2 text-sm',
                children: [
                  i.jsx('input', {
                    type: 'checkbox',
                    checked: draft.enabled,
                    onChange: (e) => setDraft({ ...draft, enabled: e.target.checked }),
                  }),
                  'Bot enabled',
                ],
              }),
              i.jsx(Ke, {
                className: 'border-yellow-brand/30 bg-yellow-brand/5 p-4',
                children: i.jsxs('div', {
                  className: 'space-y-2 text-sm text-brown-muted',
                  children: [
                    i.jsx('p', {
                      className: 'font-medium text-burgundy',
                      children: 'Secrets are configured in server/.env (not stored in the database)',
                    }),
                    i.jsxs('p', {
                      children: [
                        'Bot token: ',
                        i.jsx('span', {
                          className: 'font-mono text-xs',
                          children: health?.env?.botTokenPreview || (health?.tokenConfigured ? 'configured' : 'not set'),
                        }),
                      ],
                    }),
                    i.jsxs('p', {
                      children: [
                        'Webhook URL: ',
                        i.jsx('span', {
                          className: 'font-mono text-xs break-all',
                          children: health?.env?.webhookUrl || health?.configuredWebhookUrl || '—',
                        }),
                      ],
                    }),
                    i.jsxs('p', {
                      children: [
                        'Website URL: ',
                        i.jsx('span', {
                          className: 'font-mono text-xs break-all',
                          children: health?.env?.websiteBaseUrl || health?.webAppBaseUrl || '—',
                        }),
                      ],
                    }),
                    i.jsxs('p', {
                      children: [
                        'Admin IDs (ADMIN_IDS): ',
                        i.jsx('span', {
                          className: 'font-mono text-xs',
                          children: (health?.env?.adminIds || []).join(', ') || '—',
                        }),
                      ],
                    }),
                    i.jsxs('p', {
                      children: [
                        'Bot mode: ',
                        i.jsx('span', { className: 'font-mono text-xs', children: health?.env?.botMode || health?.mode || 'polling' }),
                      ],
                    }),
                  ],
                }),
              }),
              i.jsxs('div', {
                className: 'grid gap-4 md:grid-cols-2',
                children: [
                  i.jsxs('div', {
                    className: 'space-y-2',
                    children: [
                      i.jsx(me, { children: 'Default language' }),
                      i.jsxs(Tt, {
                        value: draft.defaultLanguage,
                        onValueChange: (v) => setDraft({ ...draft, defaultLanguage: v === 'am' ? 'am' : 'en' }),
                        children: [
                          i.jsx(_t, { children: i.jsx(Rt, {}) }),
                          i.jsxs(kt, {
                            children: [
                              i.jsx(ke, { value: 'en', children: 'English' }),
                              i.jsx(ke, { value: 'am', children: 'Amharic' }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              i.jsxs(re, { onClick: saveSettings, disabled: saving || !dirty, children: [i.jsx(ha, { className: 'mr-2 h-4 w-4' }), saving ? 'Saving…' : 'Save settings'] }),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Bot messages (EN / AM)' }) }),
          i.jsx(xt, {
            className: 'space-y-4',
            children: messages.map((message) =>
              i.jsxs('div', {
                className: 'rounded-lg border p-4 space-y-3',
                children: [
                  i.jsxs('div', {
                    className: 'flex items-center justify-between gap-2',
                    children: [
                      i.jsx('code', { className: 'text-xs text-brown-muted', children: message.key }),
                      i.jsxs(re, { size: 'sm', disabled: busy, onClick: () => saveMessage(message), children: [i.jsx(ha, { className: 'mr-1 h-3 w-3' }), 'Save'] }),
                    ],
                  }),
                  i.jsxs('div', {
                    className: 'grid gap-3 md:grid-cols-2',
                    children: [
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'English' }),
                          i.jsx(Vn, {
                            rows: 3,
                            value: readLocale(message.text, message.textI18n, 'en'),
                            onChange: (e) =>
                              setMessages((rows) =>
                                rows.map((row) =>
                                  row.key === message.key
                                    ? {
                                        ...row,
                                        text: e.target.value,
                                        textI18n: { ...row.textI18n, en: e.target.value },
                                      }
                                    : row,
                                ),
                              ),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'Amharic' }),
                          i.jsx(Vn, {
                            rows: 3,
                            value: readLocale(message.text, message.textI18n, 'am'),
                            onChange: (e) =>
                              setMessages((rows) =>
                                rows.map((row) =>
                                  row.key === message.key
                                    ? { ...row, textI18n: { ...row.textI18n, am: e.target.value } }
                                    : row,
                                ),
                              ),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }, message.key),
            ),
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, {
            children: i.jsx(Mt, {
              children: 'Order service descriptions (EN / AM)',
            }),
          }),
          i.jsx(xt, {
            className: 'space-y-4',
            children: [
              i.jsx('p', {
                className: 'text-sm text-brown-muted',
                children:
                  'Text shown when a user taps Order and picks a service. Write the full message here — include package names or prices manually if you want them.',
              }),
              services.map((service) =>
                i.jsxs('div', {
                  className: 'rounded-lg border p-4 space-y-3',
                  children: [
                    i.jsxs('div', {
                      className: 'flex flex-wrap items-center justify-between gap-2',
                      children: [
                        i.jsxs('div', {
                          children: [
                            i.jsx('p', {
                              className: 'font-medium text-burgundy',
                              children: readLocale(service.name, service.nameI18n, 'en') || service.slug,
                            }),
                            i.jsx('code', { className: 'text-xs text-brown-muted', children: service.slug }),
                          ],
                        }),
                        i.jsxs(re, {
                          size: 'sm',
                          disabled: busy,
                          onClick: () => saveServiceDescription(service),
                          children: [i.jsx(ha, { className: 'mr-1 h-3 w-3' }), 'Save'],
                        }),
                      ],
                    }),
                    i.jsxs('div', {
                      className: 'grid gap-3 md:grid-cols-2',
                      children: [
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsx(me, { children: 'English' }),
                            i.jsx(Vn, {
                              rows: 4,
                              value: readLocale(service.description, service.descriptionI18n, 'en'),
                              onChange: (e) =>
                                setServices((rows) =>
                                  rows.map((row) =>
                                    row.id === service.id
                                      ? {
                                          ...row,
                                          description: e.target.value,
                                          descriptionI18n: { ...row.descriptionI18n, en: e.target.value },
                                        }
                                      : row,
                                  ),
                                ),
                            }),
                          ],
                        }),
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsx(me, { children: 'Amharic' }),
                            i.jsx(Vn, {
                              rows: 4,
                              value: readLocale(service.description, service.descriptionI18n, 'am'),
                              onChange: (e) =>
                                setServices((rows) =>
                                  rows.map((row) =>
                                    row.id === service.id
                                      ? { ...row, descriptionI18n: { ...row.descriptionI18n, am: e.target.value } }
                                      : row,
                                  ),
                                ),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }, service.id),
              ),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Bot menu buttons' }) }),
          i.jsx(xt, {
            className: 'space-y-4',
            children: menus.map((item) => {
              const rootIndex = rootMenus.findIndex((entry) => entry.id === item.id)
              return i.jsxs('div', {
                className: 'rounded-lg border p-4 space-y-3',
                children: [
                  i.jsxs('div', {
                    className: 'flex flex-wrap items-center justify-between gap-2',
                    children: [
                      i.jsx('code', { className: 'text-xs', children: item.key }),
                      i.jsxs('div', {
                        className: 'flex flex-wrap items-center gap-2',
                        children: [
                          !item.parentKey && rootIndex >= 0
                            ? i.jsxs(i.Fragment, {
                                children: [
                                  i.jsx(re, { size: 'sm', variant: 'outline', disabled: rootIndex === 0 || busy, onClick: () => reorderRoot(rootIndex, -1), children: 'Up' }),
                                  i.jsx(re, { size: 'sm', variant: 'outline', disabled: rootIndex === rootMenus.length - 1 || busy, onClick: () => reorderRoot(rootIndex, 1), children: 'Down' }),
                                ],
                              })
                            : null,
                          i.jsxs('label', {
                            className: 'flex items-center gap-2 text-sm',
                            children: [
                              i.jsx('input', {
                                type: 'checkbox',
                                checked: item.enabled,
                                onChange: (e) =>
                                  setMenus((rows) =>
                                    rows.map((row) => (row.id === item.id ? { ...row, enabled: e.target.checked } : row)),
                                  ),
                              }),
                              'Visible',
                            ],
                          }),
                          i.jsxs(re, { size: 'sm', disabled: busy, onClick: () => saveMenu(item), children: [i.jsx(ha, { className: 'mr-1 h-3 w-3' }), 'Save'] }),
                        ],
                      }),
                    ],
                  }),
                  i.jsxs('div', {
                    className: 'grid gap-3 md:grid-cols-2',
                    children: [
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'English label' }),
                          i.jsx(J, {
                            value: readLocale(item.label, item.labelI18n, 'en'),
                            onChange: (e) =>
                              setMenus((rows) =>
                                rows.map((row) =>
                                  row.id === item.id
                                    ? { ...row, label: e.target.value, labelI18n: { ...row.labelI18n, en: e.target.value } }
                                    : row,
                                ),
                              ),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'Amharic label' }),
                          i.jsx(J, {
                            value: readLocale(item.label, item.labelI18n, 'am'),
                            onChange: (e) =>
                              setMenus((rows) =>
                                rows.map((row) =>
                                  row.id === item.id ? { ...row, labelI18n: { ...row.labelI18n, am: e.target.value } } : row,
                                ),
                              ),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }, item.id)
            }),
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Order notifications' }) }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              i.jsxs('label', {
                className: 'flex items-center gap-2 text-sm',
                children: [
                  i.jsx('input', {
                    type: 'checkbox',
                    checked: draft.notificationsEnabled,
                    onChange: (e) => setDraft({ ...draft, notificationsEnabled: e.target.checked }),
                  }),
                  'Send Telegram notifications to admins',
                ],
              }),
              i.jsxs('label', {
                className: 'flex items-center gap-2 text-sm',
                children: [
                  i.jsx('input', {
                    type: 'checkbox',
                    checked: draft.notifyOnNewRequest,
                    onChange: (e) => setDraft({ ...draft, notifyOnNewRequest: e.target.checked }),
                  }),
                  'Notify on every new order',
                ],
              }),
              i.jsxs('table', {
                className: 'w-full text-left text-sm',
                children: [
                  i.jsx('thead', {
                    children: i.jsxs('tr', {
                      className: 'border-b text-xs uppercase text-brown-muted',
                      children: [i.jsx('th', { className: 'py-2 pr-4', children: 'Admin' }), i.jsx('th', { className: 'py-2', children: 'Telegram chat ID' })],
                    }),
                  }),
                  i.jsx('tbody', {
                    children: admins.map((admin) =>
                      i.jsxs('tr', {
                        className: 'border-b border-border/50',
                        children: [
                          i.jsx('td', { className: 'py-2 pr-4', children: admin.name }),
                          i.jsx('td', { className: 'py-2 font-mono text-xs', children: admin.telegramChatId || '— not set —' }),
                        ],
                      }, admin.id),
                    ),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  })
}

function u7() {
  const [users, setUsers] = x.useState([])
  const [search, setSearch] = x.useState('')
  const [status, setStatus] = x.useState('')
  const [page, setPage] = x.useState(1)
  const [totalPages, setTotalPages] = x.useState(1)
  const [loading, setLoading] = x.useState(true)

  x.useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (search.trim()) params.set('search', search.trim())
    if (status) params.set('status', status)
    Ws.bot
      .users(params.toString())
      .then((res) => {
        const rows = Array.isArray(res) ? res : res?.data || []
        setUsers(rows)
        setTotalPages(Array.isArray(res) ? 1 : res?.pagination?.totalPages || 1)
      })
      .finally(() => setLoading(false))
  }, [page, search, status])

  const fmt = (value) => (value ? new Date(value).toLocaleString() : '—')

  return i.jsxs('div', {
    className: 'space-y-6 animate-fade-in',
    children: [
      i.jsx(r0, {
        title: 'Telegram Users',
        description: 'Everyone who starts the bot — linked to future requests.',
        icon: i.jsx(pb, { className: 'h-5 w-5' }),
      }),
      i.jsx(Ke, {
        children: i.jsxs(xt, {
          className: 'grid gap-3 md:grid-cols-[1fr_auto]',
          children: [
            i.jsxs('div', {
              className: 'space-y-2',
              children: [
                i.jsx(me, { children: 'Search' }),
                i.jsx(J, {
                  value: search,
                  onChange: (e) => {
                    setPage(1)
                    setSearch(e.target.value)
                  },
                  placeholder: 'Username or name…',
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'space-y-2',
              children: [
                i.jsx(me, { children: 'Status' }),
                i.jsxs(Tt, {
                  value: status || 'all',
                  onValueChange: (v) => {
                    setPage(1)
                    setStatus(v === 'all' ? '' : v)
                  },
                  children: [
                    i.jsx(_t, { children: i.jsx(Rt, { placeholder: 'Status' }) }),
                    i.jsxs(kt, {
                      children: [
                        i.jsx(ke, { value: 'all', children: 'All' }),
                        i.jsx(ke, { value: 'active', children: 'Active' }),
                        i.jsx(ke, { value: 'inactive', children: 'Inactive' }),
                        i.jsx(ke, { value: 'blocked', children: 'Blocked' }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      loading
        ? i.jsx(ht, { className: 'h-64' })
        : i.jsx(Ke, {
            children: i.jsxs('div', {
              className: 'overflow-x-auto',
              children: [
                i.jsxs('table', {
                  className: 'w-full text-left text-sm',
                  children: [
                    i.jsx('thead', {
                      children: i.jsxs('tr', {
                        className: 'border-b text-xs uppercase text-brown-muted',
                        children: [
                          i.jsx('th', { className: 'px-4 py-3', children: 'Telegram ID' }),
                          i.jsx('th', { className: 'px-4 py-3', children: 'Username' }),
                          i.jsx('th', { className: 'px-4 py-3', children: 'Name' }),
                          i.jsx('th', { className: 'px-4 py-3', children: 'Language' }),
                          i.jsx('th', { className: 'px-4 py-3', children: 'Joined' }),
                          i.jsx('th', { className: 'px-4 py-3', children: 'Last active' }),
                          i.jsx('th', { className: 'px-4 py-3', children: 'Status' }),
                          i.jsx('th', { className: 'px-4 py-3', children: 'Requests' }),
                        ],
                      }),
                    }),
                    i.jsx('tbody', {
                      children: users.length
                        ? users.map((user) =>
                            i.jsxs('tr', {
                              className: 'border-b border-border/40 hover:bg-burgundy/[0.03]',
                              children: [
                                i.jsx('td', {
                                  className: 'px-4 py-3 font-mono text-xs',
                                  children: i.jsx(ci, { to: `/telegram/users/${user.id}`, className: 'text-burgundy font-medium', children: user.telegramId }),
                                }),
                                i.jsx('td', { className: 'px-4 py-3', children: user.username ? `@${user.username}` : '—' }),
                                i.jsx('td', { className: 'px-4 py-3', children: [user.firstName, user.lastName].filter(Boolean).join(' ') }),
                                i.jsx('td', { className: 'px-4 py-3 uppercase', children: user.languageCode }),
                                i.jsx('td', { className: 'px-4 py-3 text-xs text-brown-muted', children: fmt(user.firstSeenAt) }),
                                i.jsx('td', { className: 'px-4 py-3 text-xs text-brown-muted', children: fmt(user.lastInteractAt) }),
                                i.jsx('td', {
                                  className: 'px-4 py-3',
                                  children: i.jsx('span', {
                                    className: 'rounded-full bg-burgundy/10 px-2 py-0.5 text-xs capitalize text-burgundy',
                                    children: user.status || (user.isBlocked ? 'blocked' : 'active'),
                                  }),
                                }),
                                i.jsx('td', { className: 'px-4 py-3', children: user._count?.requests ?? 0 }),
                              ],
                            }, user.id),
                          )
                        : i.jsx('tr', {
                            children: i.jsx('td', {
                              colSpan: 8,
                              className: 'px-4 py-10 text-center text-brown-muted',
                              children: 'No Telegram users yet.',
                            }),
                          }),
                    }),
                  ],
                }),
                totalPages > 1
                  ? i.jsxs('div', {
                      className: 'flex items-center justify-center gap-3 border-t px-4 py-3',
                      children: [
                        i.jsx(re, { size: 'sm', variant: 'outline', disabled: page <= 1, onClick: () => setPage((p) => p - 1), children: 'Previous' }),
                        i.jsxs('span', { className: 'text-sm text-brown-muted', children: ['Page ', page, ' of ', totalPages] }),
                        i.jsx(re, { size: 'sm', variant: 'outline', disabled: page >= totalPages, onClick: () => setPage((p) => p + 1), children: 'Next' }),
                      ],
                    })
                  : null,
              ],
            }),
          }),
    ],
  })
}

function d7() {
  const { id } = Pf()
  const navigate = wn()
  const [user, setUser] = x.useState(null)
  const [loading, setLoading] = x.useState(true)
  const [saving, setSaving] = x.useState(false)

  x.useEffect(() => {
    if (!id) return
    Ws.bot
      .user(id)
      .then(setUser)
      .finally(() => setLoading(false))
  }, [id])

  const toggleBlocked = async () => {
    if (!user) return
    setSaving(true)
    try {
      const updated = await Ws.bot.patchUser(user.id, { isBlocked: !user.isBlocked })
      setUser((current) => (current ? { ...current, ...updated } : current))
      we.success(user.isBlocked ? 'User unblocked' : 'User blocked')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return i.jsx(ht, { className: 'h-64' })
  if (!user) return i.jsx('p', { className: 'text-brown-muted', children: 'User not found.' })

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')
  const fmt = (value) => new Date(value).toLocaleString()

  return i.jsxs('div', {
    className: 'space-y-6 animate-fade-in',
    children: [
      i.jsxs('div', {
        className: 'flex flex-wrap items-end justify-between gap-4',
        children: [
          i.jsxs('div', {
            children: [
              i.jsx('p', { className: 'text-xs uppercase tracking-widest text-brown-muted', children: 'Telegram user' }),
              i.jsx('h1', { className: 'font-display text-3xl font-bold text-burgundy', children: fullName }),
              i.jsxs('p', {
                className: 'mt-1 text-sm text-brown-muted',
                children: [user.username ? `@${user.username}` : 'No username', ' · ID ', user.telegramId],
              }),
            ],
          }),
          i.jsx(re, { variant: 'outline', onClick: () => navigate('/telegram/users'), children: '← All users' }),
        ],
      }),
      i.jsxs('div', {
        className: 'grid gap-4 md:grid-cols-2',
        children: [
          i.jsxs(Ke, {
            className: 'p-5',
            children: [
              i.jsx('h2', { className: 'font-display text-lg font-bold text-burgundy', children: 'Profile' }),
              i.jsxs('dl', {
                className: 'mt-4 space-y-2 text-sm',
                children: [
                  i.jsxs('div', { className: 'flex justify-between gap-4', children: [i.jsx('dt', { className: 'text-brown-muted', children: 'Language' }), i.jsx('dd', { className: 'uppercase', children: user.languageCode })] }),
                  i.jsxs('div', { className: 'flex justify-between gap-4', children: [i.jsx('dt', { className: 'text-brown-muted', children: 'Joined' }), i.jsx('dd', { children: fmt(user.firstSeenAt) })] }),
                  i.jsxs('div', { className: 'flex justify-between gap-4', children: [i.jsx('dt', { className: 'text-brown-muted', children: 'Last active' }), i.jsx('dd', { children: fmt(user.lastInteractAt) })] }),
                  i.jsxs('div', { className: 'flex justify-between gap-4', children: [i.jsx('dt', { className: 'text-brown-muted', children: 'Status' }), i.jsx('dd', { className: 'capitalize', children: user.status || (user.isBlocked ? 'blocked' : 'active') })] }),
                ],
              }),
              i.jsx(re, { variant: 'outline', className: 'mt-4', disabled: saving, onClick: toggleBlocked, children: user.isBlocked ? 'Unblock user' : 'Block user' }),
            ],
          }),
          i.jsxs(Ke, {
            className: 'p-5',
            children: [
              i.jsx('h2', { className: 'font-display text-lg font-bold text-burgundy', children: 'Activity' }),
              i.jsx('p', { className: 'mt-4 font-display text-4xl text-burgundy', children: user.requests?.length || 0 }),
              i.jsx('p', { className: 'text-sm text-brown-muted', children: 'Requests submitted via Telegram' }),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Request history' }) }),
          i.jsx(xt, {
            children: i.jsx('ul', {
              className: 'divide-y divide-border/50',
              children: (user.requests || []).length
                ? user.requests.map((request) =>
                    i.jsx('li', {
                      className: 'py-4',
                      children: i.jsxs('div', {
                        className: 'flex flex-wrap items-center justify-between gap-3',
                        children: [
                          i.jsxs('div', {
                            children: [
                              i.jsx('p', { className: 'font-medium', children: request.reference }),
                              i.jsxs('p', {
                                className: 'text-sm text-brown-muted',
                                children: [request.service?.name || 'Service', ' · ', fmt(request.createdAt)],
                              }),
                            ],
                          }),
                          i.jsxs('div', {
                            className: 'flex items-center gap-3',
                            children: [
                              i.jsx('span', { className: 'rounded-full bg-burgundy/10 px-2.5 py-0.5 text-xs text-burgundy', children: request.status }),
                              i.jsx(ci, { to: `/requests/${request.id}`, className: 'text-sm text-burgundy', children: 'View' }),
                            ],
                          }),
                        ],
                      }),
                    }, request.id),
                  )
                : i.jsx('li', { className: 'py-8 text-center text-sm text-brown-muted', children: 'No request history.' }),
            }),
          }),
        ],
      }),
    ],
  })
}
