// Validated source for Contact page editor — minify into admin bundle as function h6
function h6() {
  const isLocalized = (value) =>
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('en' in value || 'am' in value)

  const normalizeField = (value) => {
    if (isLocalized(value)) return { en: value.en ?? '', am: value.am ?? '' }
    if (typeof value === 'string') return { en: value, am: '' }
    return { en: '', am: '' }
  }

  const readLocale = (value, lang) => {
    if (typeof value === 'string') return lang === 'en' ? value : ''
    if (!isLocalized(value)) return ''
    return typeof value[lang] === 'string' ? value[lang] : ''
  }

  const writeLocale = (value, lang, text) => {
    const base = normalizeField(value)
    return { ...base, [lang]: text }
  }

  const ensureLocalized = (value) => ({
    en: readLocale(value, 'en'),
    am: readLocale(value, 'am'),
  })

  const normalizeHours = (list) => {
    if (!Array.isArray(list)) return []
    return list.map((entry) => ({
      day: normalizeField(entry?.day),
      hours: normalizeField(entry?.hours),
    }))
  }

  const normalizeBranches = (list) => {
    if (!Array.isArray(list)) return []
    return list.map((entry) => ({
      id: typeof entry?.id === 'string' ? entry.id : '',
      name: normalizeField(entry?.name),
      area: normalizeField(entry?.area),
      mapUrl: typeof entry?.mapUrl === 'string' ? entry.mapUrl : '',
      image: typeof entry?.image === 'string' ? entry.image : '',
    }))
  }

  const defaultBranches = () => [
    {
      id: 'lebu',
      name: { en: 'Lebu Muzika Sefer', am: 'ለቡ ሙዚካ ሰፈር' },
      area: { en: 'Lebu · Addis Ababa', am: 'ለቡ · አዲስ አበባ' },
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=Lebu+Muzika+Sefer+Addis+Ababa',
      image: '',
    },
    {
      id: 'figa',
      name: { en: 'Figa Mebrat Summit Road', am: 'ፊጋ መብራት ሳሚት መንገድ' },
      area: { en: 'Summit · Addis Ababa', am: 'ሳሚት · አዲስ አበባ' },
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=Figa+Mebrat+Summit+Road+Addis+Ababa',
      image: '',
    },
    {
      id: 'jemo',
      name: { en: 'Jemo 1 Condominium', am: 'ጀሞ 1 ኮንዶሚኒየም' },
      area: { en: 'Jemo · Addis Ababa', am: 'ጀሞ · አዲስ አበባ' },
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=Jemo+1+Condominium+Addis+Ababa',
      image: '',
    },
  ]

  const defaultHours = () => [
    {
      day: { en: 'Monday – Thursday', am: 'ሰኞ – ሐሙስ' },
      hours: { en: '11:00 AM – 10:00 PM', am: '11:00 ጥዋት – 10:00 ማታ' },
    },
    {
      day: { en: 'Friday – Saturday', am: 'ዓርብ – ቅዳሜ' },
      hours: { en: '11:00 AM – 12:00 AM', am: '11:00 ጥዋት – 12:00 ጥዋት' },
    },
    {
      day: { en: 'Sunday', am: 'እሑድ' },
      hours: { en: '12:00 PM – 9:00 PM', am: '12:00 ቀን – 9:00 ማታ' },
    },
  ]

  const normalizeDraft = (raw) => {
    const data = raw ?? {}
    return {
      eyebrow: normalizeField(data.eyebrow),
      title: normalizeField(data.title),
      description: normalizeField(data.description),
      formTitle: normalizeField(data.formTitle),
      phone: typeof data.phone === 'string' ? data.phone : '',
      email: typeof data.email === 'string' ? data.email : '',
      hoursTitle: normalizeField(data.hoursTitle),
      contactTitle: normalizeField(data.contactTitle),
      openingHours:
        Array.isArray(data.openingHours) && data.openingHours.length
          ? normalizeHours(data.openingHours)
          : defaultHours(),
      locationsTitle: normalizeField(data.locationsTitle),
      locationsDescription: normalizeField(data.locationsDescription),
      locationsButtonText: normalizeField(data.locationsButtonText),
      branches:
        Array.isArray(data.branches) && data.branches.length
          ? normalizeBranches(data.branches)
          : defaultBranches(),
    }
  }

  const [draft, setDraft] = x.useState(normalizeDraft)
  const [loading, setLoading] = x.useState(true)
  const [saving, setSaving] = x.useState(false)

  x.useEffect(() => {
    Ws.settings
      .get('page:contact')
      .then((data) => setDraft(normalizeDraft(data)))
      .finally(() => setLoading(false))
  }, [])

  const setField = (key, lang, text) => {
    setDraft((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setHourField = (index, key, lang, text) => {
    setDraft((prev) => {
      const list = Array.isArray(prev.openingHours) ? [...prev.openingHours] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, openingHours: list }
    })
  }

  const setBranchField = (index, key, lang, text) => {
    if (key === 'mapUrl' || key === 'image' || key === 'id') {
      setDraft((prev) => {
        const list = Array.isArray(prev.branches) ? [...prev.branches] : []
        const current = list[index]
        if (!current) return prev
        list[index] = { ...current, [key]: text }
        return { ...prev, branches: list }
      })
      return
    }
    setDraft((prev) => {
      const list = Array.isArray(prev.branches) ? [...prev.branches] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, branches: list }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        eyebrow: ensureLocalized(draft.eyebrow),
        title: ensureLocalized(draft.title),
        description: ensureLocalized(draft.description),
        formTitle: ensureLocalized(draft.formTitle),
        phone: (draft.phone ?? '').trim(),
        email: (draft.email ?? '').trim(),
        hoursTitle: ensureLocalized(draft.hoursTitle),
        contactTitle: ensureLocalized(draft.contactTitle),
        openingHours: (draft.openingHours ?? [])
          .map((entry) => ({
            day: ensureLocalized(entry.day),
            hours: ensureLocalized(entry.hours),
          }))
          .filter(
            (entry) =>
              entry.day.en ||
              entry.day.am ||
              entry.hours.en ||
              entry.hours.am,
          ),
        locationsTitle: ensureLocalized(draft.locationsTitle),
        locationsDescription: ensureLocalized(draft.locationsDescription),
        locationsButtonText: ensureLocalized(draft.locationsButtonText),
        branches: (draft.branches ?? [])
          .map((entry, idx) => ({
            id: (entry.id ?? '').trim() || `branch-${idx + 1}`,
            name: ensureLocalized(entry.name),
            area: ensureLocalized(entry.area),
            mapUrl: (entry.mapUrl ?? '').trim(),
            image: entry.image ?? '',
          }))
          .filter(
            (entry) =>
              entry.name.en ||
              entry.name.am ||
              entry.area.en ||
              entry.area.am,
          ),
      }
      await Ws.settings.update('page:contact', payload)
      const restaurant = await Ws.settings.get('restaurant').catch(() => ({}))
      const openingHoursEn = payload.openingHours
        .map((entry) => ({
          day: entry.day.en,
          hours: entry.hours.en,
        }))
        .filter((entry) => entry.day || entry.hours)
      await Ws.settings.update('restaurant', {
        ...restaurant,
        phone: payload.phone,
        email: payload.email,
        openingHours: openingHoursEn.length ? openingHoursEn : restaurant.openingHours,
      })
      setDraft(normalizeDraft(payload))
      we.success('Contact page saved')
    } finally {
      setSaving(false)
    }
  }

  const localeInputPair = (label, valueEn, valueAm, onEn, onAm, placeholderEn, placeholderAm) =>
    i.jsxs('div', {
      className: 'space-y-2',
      children: [
        i.jsx(me, { children: label }),
        i.jsxs('div', {
          className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
          children: [
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className:
                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'EN',
                }),
                i.jsx(J, {
                  value: valueEn,
                  placeholder: placeholderEn,
                  onChange: (event) => onEn(event.target.value),
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className:
                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'AM',
                }),
                i.jsx(J, {
                  value: valueAm,
                  placeholder: placeholderAm,
                  onChange: (event) => onAm(event.target.value),
                }),
              ],
            }),
          ],
        }),
      ],
    })

  const localeTextareaPair = (label, valueEn, valueAm, onEn, onAm, placeholderEn, placeholderAm) =>
    i.jsxs('div', {
      className: 'space-y-2',
      children: [
        i.jsx(me, { children: label }),
        i.jsxs('div', {
          className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
          children: [
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className:
                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'EN',
                }),
                i.jsx(Vn, {
                  value: valueEn,
                  placeholder: placeholderEn,
                  onChange: (event) => onEn(event.target.value),
                  rows: 3,
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'space-y-1',
              children: [
                i.jsx('p', {
                  className:
                    'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                  children: 'AM',
                }),
                i.jsx(Vn, {
                  value: valueAm,
                  placeholder: placeholderAm,
                  onChange: (event) => onAm(event.target.value),
                  rows: 3,
                }),
              ],
            }),
          ],
        }),
      ],
    })

  const openingHours = Array.isArray(draft.openingHours) ? draft.openingHours : []
  const branches = Array.isArray(draft.branches) ? draft.branches : []

  if (loading) return i.jsx(ht, { className: 'h-96' })

  return i.jsxs('div', {
    className: 'space-y-6 animate-fade-in',
    children: [
      i.jsxs('div', {
        className: 'flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between',
        children: [
          i.jsxs('div', {
            children: [
              i.jsx('h1', {
                className: 'font-display text-3xl font-bold text-burgundy',
                children: 'Contact Us',
              }),
              i.jsx('p', {
                className: 'text-brown-muted',
                children:
                  'Edit the contact page hero, hours, phone, email and branch locations.',
              }),
            ],
          }),
          i.jsxs(re, {
            onClick: save,
            disabled: saving,
            children: [
              i.jsx(ha, { className: 'w-4 h-4 mr-2' }),
              saving ? 'Saving...' : 'Save contact page',
            ],
          }),
        ],
      }),
      i.jsx(Ke, {
        className: 'border-yellow-brand/30 bg-yellow-brand/5 p-4',
        children: i.jsxs('p', {
          className: 'text-sm text-brown-muted',
          children: [
            'Messages from the contact form appear in ',
            i.jsx(ci, {
              to: '/contact-messages',
              className: 'font-semibold text-burgundy underline',
              children: 'Contact Messages',
            }),
            '.',
          ],
        }),
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Page heading' }) }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              localeInputPair(
                'Eyebrow',
                readLocale(draft.eyebrow, 'en'),
                readLocale(draft.eyebrow, 'am'),
                (text) => setField('eyebrow', 'en', text),
                (text) => setField('eyebrow', 'am', text),
                'Contact',
                'እውቂያ',
              ),
              localeInputPair(
                'Title',
                readLocale(draft.title, 'en'),
                readLocale(draft.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                "We'd love to hear from you",
                'ከእናንተ መስማት እንደምንፈልግ ነው',
              ),
              localeTextareaPair(
                'Description',
                readLocale(draft.description, 'en'),
                readLocale(draft.description, 'am'),
                (text) => setField('description', 'en', text),
                (text) => setField('description', 'am', text),
                'Questions, reservations or feedback — reach out and our team will get back to you.',
                'ጥያቄዎች፣ ቦታ ማስያዝ ወይም አስተያየት — ያግኙን እና ቡድናችን ይመለስልዎታል።',
              ),
              localeInputPair(
                'Form title',
                readLocale(draft.formTitle, 'en'),
                readLocale(draft.formTitle, 'am'),
                (text) => setField('formTitle', 'en', text),
                (text) => setField('formTitle', 'am', text),
                'Send a message',
                'መልእክት ይላኩ',
              ),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Opening hours' }) }),
          i.jsxs(xt, {
            className: 'space-y-3',
            children: [
              localeInputPair(
                'Section title',
                readLocale(draft.hoursTitle, 'en'),
                readLocale(draft.hoursTitle, 'am'),
                (text) => setField('hoursTitle', 'en', text),
                (text) => setField('hoursTitle', 'am', text),
                'Opening Hours',
                'የመክፈቻ ሰዓቶች',
              ),
              openingHours.map((row, idx) =>
                i.jsxs(
                  'div',
                  {
                    className: 'rounded-xl border p-4 space-y-3',
                    children: [
                      i.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          i.jsxs(me, { children: ['Hours row ', idx + 1] }),
                          i.jsx(re, {
                            size: 'sm',
                            variant: 'ghost',
                            onClick: () =>
                              setDraft((prev) => ({
                                ...prev,
                                openingHours: prev.openingHours.filter((_, j) => j !== idx),
                              })),
                            children: i.jsx(Zt, {
                              className: 'w-4 h-4 text-destructive',
                            }),
                          }),
                        ],
                      }),
                      localeInputPair(
                        'Day label',
                        readLocale(row.day, 'en'),
                        readLocale(row.day, 'am'),
                        (text) => setHourField(idx, 'day', 'en', text),
                        (text) => setHourField(idx, 'day', 'am', text),
                        'Monday – Thursday',
                        'ሰኞ – ሐሙስ',
                      ),
                      localeInputPair(
                        'Hours',
                        readLocale(row.hours, 'en'),
                        readLocale(row.hours, 'am'),
                        (text) => setHourField(idx, 'hours', 'en', text),
                        (text) => setHourField(idx, 'hours', 'am', text),
                        '11:00 AM – 10:00 PM',
                        '11:00 ጥዋት – 10:00 ማታ',
                      ),
                    ],
                  },
                  idx,
                ),
              ),
              i.jsx(re, {
                size: 'sm',
                variant: 'outline',
                onClick: () =>
                  setDraft((prev) => ({
                    ...prev,
                    openingHours: [
                      ...(prev.openingHours ?? []),
                      {
                        day: { en: '', am: '' },
                        hours: { en: '', am: '' },
                      },
                    ],
                  })),
                children: '+ Add hours row',
              }),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Get in touch' }) }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              localeInputPair(
                'Section title',
                readLocale(draft.contactTitle, 'en'),
                readLocale(draft.contactTitle, 'am'),
                (text) => setField('contactTitle', 'en', text),
                (text) => setField('contactTitle', 'am', text),
                'Get in touch',
                'ያግኙን',
              ),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'Phone' }),
                  i.jsx(J, {
                    value: draft.phone ?? '',
                    onChange: (event) =>
                      setDraft((prev) => ({ ...prev, phone: event.target.value })),
                  }),
                ],
              }),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'Email' }),
                  i.jsx(J, {
                    value: draft.email ?? '',
                    onChange: (event) =>
                      setDraft((prev) => ({ ...prev, email: event.target.value })),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Locations section' }) }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              localeInputPair(
                'Section title',
                readLocale(draft.locationsTitle, 'en'),
                readLocale(draft.locationsTitle, 'am'),
                (text) => setField('locationsTitle', 'en', text),
                (text) => setField('locationsTitle', 'am', text),
                'Locations',
                'ቦታዎች',
              ),
              localeTextareaPair(
                'Description',
                readLocale(draft.locationsDescription, 'en'),
                readLocale(draft.locationsDescription, 'am'),
                (text) => setField('locationsDescription', 'en', text),
                (text) => setField('locationsDescription', 'am', text),
                'Visit any of our three Addis Ababa branches for authentic Ethiopian food and house-brewed drinks.',
                'ባህላዊ የኢትዮጵያ ምግብና በቤት የተጠመቁ መጠጦችን ለመገኘት በአዲስ አበባ ያሉን ሶስት ቅርንጫፎች ይጎብኙ።',
              ),
              localeInputPair(
                'Button text',
                readLocale(draft.locationsButtonText, 'en'),
                readLocale(draft.locationsButtonText, 'am'),
                (text) => setField('locationsButtonText', 'en', text),
                (text) => setField('locationsButtonText', 'am', text),
                'Explore all locations',
                'ሁሉንም ቦታዎች ይመልከቱ',
              ),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, { children: i.jsx(Mt, { children: 'Branches' }) }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              branches.map((branch, idx) =>
                i.jsxs(
                  'div',
                  {
                    className: 'rounded-xl border p-4 space-y-3',
                    children: [
                      i.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          i.jsxs(me, { children: ['Branch ', idx + 1] }),
                          i.jsx(re, {
                            size: 'sm',
                            variant: 'ghost',
                            onClick: () =>
                              setDraft((prev) => ({
                                ...prev,
                                branches: prev.branches.filter((_, j) => j !== idx),
                              })),
                            children: i.jsx(Zt, {
                              className: 'w-4 h-4 text-destructive',
                            }),
                          }),
                        ],
                      }),
                      localeInputPair(
                        'Name',
                        readLocale(branch.name, 'en'),
                        readLocale(branch.name, 'am'),
                        (text) => setBranchField(idx, 'name', 'en', text),
                        (text) => setBranchField(idx, 'name', 'am', text),
                        'Lebu Muzika Sefer',
                        'ለቡ ሙዚካ ሰፈር',
                      ),
                      localeInputPair(
                        'Area label',
                        readLocale(branch.area, 'en'),
                        readLocale(branch.area, 'am'),
                        (text) => setBranchField(idx, 'area', 'en', text),
                        (text) => setBranchField(idx, 'area', 'am', text),
                        'Lebu · Addis Ababa',
                        'ለቡ · አዲስ አበባ',
                      ),
                      i.jsxs('div', {
                        className: 'space-y-2 md:col-span-2',
                        children: [
                          i.jsx(me, { children: 'Google Maps link' }),
                          i.jsx(J, {
                            value: branch.mapUrl ?? '',
                            onChange: (event) =>
                              setBranchField(idx, 'mapUrl', null, event.target.value),
                          }),
                        ],
                      }),
                      i.jsx(Fn, {
                        label: 'Branch photo (optional)',
                        value: branch.image ?? '',
                        onChange: (url) => setBranchField(idx, 'image', null, url || ''),
                        aspect: 'wide',
                      }),
                    ],
                  },
                  branch.id || idx,
                ),
              ),
              i.jsx(re, {
                size: 'sm',
                variant: 'outline',
                onClick: () =>
                  setDraft((prev) => ({
                    ...prev,
                    branches: [
                      ...(prev.branches ?? []),
                      {
                        id: `branch-${Date.now()}`,
                        name: { en: '', am: '' },
                        area: { en: '', am: '' },
                        mapUrl: '',
                        image: '',
                      },
                    ],
                  })),
                children: '+ Add branch',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
