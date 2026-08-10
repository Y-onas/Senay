// Validated source for About page editor — minify into admin bundle as function w6
function w6() {
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

  const normalizeParagraphs = (list) => {
    if (!Array.isArray(list)) return []
    return list.map((entry) => normalizeField(entry))
  }

  const normalizeValues = (list) => {
    if (!Array.isArray(list)) return []
    return list.map((entry) => ({
      title: normalizeField(entry?.title),
      text: normalizeField(entry?.text),
    }))
  }

  const normalizeMilestones = (list) => {
    if (!Array.isArray(list)) return []
    return list.map((entry) => ({
      year: typeof entry?.year === 'string' ? entry.year : '',
      text: normalizeField(entry?.text),
    }))
  }

  const normalizeDraft = (raw) => {
    const data = raw ?? {}
    return {
      eyebrow: normalizeField(data.eyebrow),
      title: normalizeField(data.title),
      description: normalizeField(data.description),
      sectionLabel: normalizeField(data.sectionLabel),
      sectionTitle: normalizeField(data.sectionTitle),
      paragraphs: normalizeParagraphs(data.paragraphs),
      values: normalizeValues(data.values),
      milestones: normalizeMilestones(data.milestones),
    }
  }

  const emptyDraft = () => ({
    eyebrow: { en: '', am: '' },
    title: { en: '', am: '' },
    description: { en: '', am: '' },
    sectionLabel: { en: '', am: '' },
    sectionTitle: { en: '', am: '' },
    paragraphs: [],
    values: [],
    milestones: [],
  })

  const [draft, setDraft] = x.useState(emptyDraft)
  const [loading, setLoading] = x.useState(true)
  const [saving, setSaving] = x.useState(false)

  x.useEffect(() => {
    Ws.settings
      .get('page:about')
      .then((data) => setDraft(normalizeDraft(data)))
      .finally(() => setLoading(false))
  }, [])

  const setField = (key, lang, text) => {
    setDraft((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setParagraphsFromText = (lang, text) => {
    const parts = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean)
    setDraft((prev) => {
      const existing = Array.isArray(prev.paragraphs) ? prev.paragraphs : []
      const next = parts.map((part, index) => writeLocale(existing[index], lang, part))
      return { ...prev, paragraphs: next }
    })
  }

  const setValues = (updater) => {
    setDraft((prev) => ({
      ...prev,
      values: typeof updater === 'function' ? updater(prev.values ?? []) : updater,
    }))
  }

  const setValueField = (index, key, lang, text) => {
    setDraft((prev) => {
      const list = Array.isArray(prev.values) ? [...prev.values] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, values: list }
    })
  }

  const setMilestones = (updater) => {
    setDraft((prev) => ({
      ...prev,
      milestones: typeof updater === 'function' ? updater(prev.milestones ?? []) : updater,
    }))
  }

  const setMilestoneField = (index, key, lang, text) => {
    if (key === 'year') {
      setDraft((prev) => {
        const list = Array.isArray(prev.milestones) ? [...prev.milestones] : []
        const current = list[index]
        if (!current) return prev
        list[index] = { ...current, year: text }
        return { ...prev, milestones: list }
      })
      return
    }
    setDraft((prev) => {
      const list = Array.isArray(prev.milestones) ? [...prev.milestones] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, text: writeLocale(current.text, lang, text) }
      return { ...prev, milestones: list }
    })
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        eyebrow: ensureLocalized(draft.eyebrow),
        title: ensureLocalized(draft.title),
        description: ensureLocalized(draft.description),
        sectionLabel: ensureLocalized(draft.sectionLabel),
        sectionTitle: ensureLocalized(draft.sectionTitle),
        paragraphs: (draft.paragraphs ?? [])
          .map((entry) => ensureLocalized(entry))
          .filter((entry) => entry.en.trim() || entry.am.trim()),
        values: (draft.values ?? [])
          .map((entry) => ({
            title: ensureLocalized(entry.title),
            text: ensureLocalized(entry.text),
          }))
          .filter((entry) => entry.title.en || entry.title.am || entry.text.en || entry.text.am),
        milestones: (draft.milestones ?? [])
          .map((entry) => ({
            year: (entry.year ?? '').trim(),
            text: ensureLocalized(entry.text),
          }))
          .filter((entry) => entry.year || entry.text.en || entry.text.am),
      }
      await Ws.settings.update('page:about', payload)
      setDraft(normalizeDraft(payload))
      we.success('About page saved')
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

  const paragraphsEn = (draft.paragraphs ?? []).map((entry) => readLocale(entry, 'en')).join('\n\n')
  const paragraphsAm = (draft.paragraphs ?? []).map((entry) => readLocale(entry, 'am')).join('\n\n')
  const values = Array.isArray(draft.values) ? draft.values : []
  const milestones = Array.isArray(draft.milestones) ? draft.milestones : []

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
                children: 'About Us',
              }),
              i.jsx('p', {
                className: 'text-brown-muted',
                children: 'Edit the full About page — hero, story, values and timeline.',
              }),
            ],
          }),
          i.jsxs(re, {
            onClick: save,
            disabled: saving,
            children: [
              i.jsx(ha, { className: 'w-4 h-4 mr-2' }),
              saving ? 'Saving...' : 'Save About page',
            ],
          }),
        ],
      }),
      i.jsx(Ke, {
        className: 'border-yellow-brand/30 bg-yellow-brand/5 p-4',
        children: i.jsxs('p', {
          className: 'text-sm text-brown-muted',
          children: [
            'The homepage About preview is edited under ',
            i.jsx(ci, {
              to: '/',
              className: 'font-semibold text-burgundy underline',
              children: 'Home → About Preview',
            }),
            '. Story images and value icons stay fixed in the theme for now. Timeline section labels are also fixed.',
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
                'About Us',
                'ስለ እኛ',
              ),
              localeInputPair(
                'Title',
                readLocale(draft.title, 'en'),
                readLocale(draft.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                'The story of Senay Tela',
                'የሰናይ ቴላ ታሪክ',
              ),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'Description' }),
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
                            value: readLocale(draft.description, 'en'),
                            placeholder:
                              'A family kitchen keeping Ethiopian tradition alive — one stew, one ceremony, one celebration at a time.',
                            onChange: (event) =>
                              setField('description', 'en', event.target.value),
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
                            value: readLocale(draft.description, 'am'),
                            placeholder:
                              'ኢትዮጵያዊ traditionን የሚያስቀመጥ የቤተሰብ ወጥ ቤት — አንድ stew፣ አንድ ceremony፣ አንድ celebration በአንድ ጊዜ።',
                            onChange: (event) =>
                              setField('description', 'am', event.target.value),
                            rows: 3,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, {
            children: i.jsxs('div', {
              children: [
                i.jsx(Mt, { children: 'Our story' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted font-normal',
                  children: 'Main text block on the About page',
                }),
              ],
            }),
          }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              localeInputPair(
                'Section small label',
                readLocale(draft.sectionLabel, 'en'),
                readLocale(draft.sectionLabel, 'am'),
                (text) => setField('sectionLabel', 'en', text),
                (text) => setField('sectionLabel', 'am', text),
                'Who we are',
                'እኛ ማን ነን',
              ),
              localeInputPair(
                'Section title',
                readLocale(draft.sectionTitle, 'en'),
                readLocale(draft.sectionTitle, 'am'),
                (text) => setField('sectionTitle', 'en', text),
                (text) => setField('sectionTitle', 'am', text),
                'More than a restaurant — a living tradition',
                'ከሬስቶራን በላይ — ህያው tradition',
              ),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'Story paragraphs' }),
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
                            value: paragraphsEn,
                            rows: 6,
                            placeholder: 'First paragraph\n\nSecond paragraph',
                            onChange: (event) =>
                              setParagraphsFromText('en', event.target.value),
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
                            value: paragraphsAm,
                            rows: 6,
                            placeholder: 'First paragraph\n\nSecond paragraph',
                            onChange: (event) =>
                              setParagraphsFromText('am', event.target.value),
                          }),
                        ],
                      }),
                    ],
                  }),
                  i.jsx('p', {
                    className: 'text-xs text-brown-muted',
                    children: 'Press Enter twice between paragraphs',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, {
            children: i.jsxs('div', {
              children: [
                i.jsx(Mt, { children: 'Our values' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted font-normal',
                  children: 'Four boxes with title + description',
                }),
              ],
            }),
          }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              values.map((entry, index) =>
                i.jsxs(
                  Ke,
                  {
                    className: 'p-4 space-y-3',
                    children: [
                      i.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          i.jsxs(Mt, { className: 'text-sm', children: ['Value ', index + 1] }),
                          i.jsx(re, {
                            size: 'sm',
                            variant: 'ghost',
                            onClick: () =>
                              setValues((list) => list.filter((_, i) => i !== index)),
                            children: i.jsx(Zt, { className: 'w-4 h-4 text-destructive' }),
                          }),
                        ],
                      }),
                      localeInputPair(
                        'Title',
                        readLocale(entry.title, 'en'),
                        readLocale(entry.title, 'am'),
                        (text) => setValueField(index, 'title', 'en', text),
                        (text) => setValueField(index, 'title', 'am', text),
                        'Cooked slowly',
                        'Cooked slowly',
                      ),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'Description' }),
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
                                    value: readLocale(entry.text, 'en'),
                                    onChange: (event) =>
                                      setValueField(index, 'text', 'en', event.target.value),
                                    rows: 2,
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
                                    value: readLocale(entry.text, 'am'),
                                    onChange: (event) =>
                                      setValueField(index, 'text', 'am', event.target.value),
                                    rows: 2,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  },
                  index,
                ),
              ),
              i.jsx(re, {
                size: 'sm',
                variant: 'outline',
                onClick: () =>
                  setValues((list) => [
                    ...list,
                    {
                      title: { en: '', am: '' },
                      text: { en: '', am: '' },
                    },
                  ]),
                children: '+ Add value',
              }),
            ],
          }),
        ],
      }),
      i.jsxs(Ke, {
        children: [
          i.jsx(Ot, {
            children: i.jsxs('div', {
              children: [
                i.jsx(Mt, { children: 'Timeline' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted font-normal',
                  children: 'Key dates in your history',
                }),
              ],
            }),
          }),
          i.jsxs(xt, {
            className: 'space-y-4',
            children: [
              milestones.map((entry, index) =>
                i.jsxs(
                  Ke,
                  {
                    className: 'p-4 space-y-3',
                    children: [
                      i.jsxs('div', {
                        className: 'flex items-center justify-between',
                        children: [
                          i.jsxs(Mt, { className: 'text-sm', children: ['Milestone ', index + 1] }),
                          i.jsx(re, {
                            size: 'sm',
                            variant: 'ghost',
                            onClick: () =>
                              setMilestones((list) => list.filter((_, i) => i !== index)),
                            children: i.jsx(Zt, { className: 'w-4 h-4 text-destructive' }),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'Year' }),
                          i.jsx(J, {
                            value: entry.year || '',
                            placeholder: '2011',
                            onChange: (event) =>
                              setMilestoneField(index, 'year', 'en', event.target.value),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-2',
                        children: [
                          i.jsx(me, { children: 'What happened' }),
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
                                    value: readLocale(entry.text, 'en'),
                                    onChange: (event) =>
                                      setMilestoneField(index, 'text', 'en', event.target.value),
                                    rows: 2,
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
                                    value: readLocale(entry.text, 'am'),
                                    onChange: (event) =>
                                      setMilestoneField(index, 'text', 'am', event.target.value),
                                    rows: 2,
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  },
                  index,
                ),
              ),
              i.jsx(re, {
                size: 'sm',
                variant: 'outline',
                onClick: () =>
                  setMilestones((list) => [
                    ...list,
                    { year: '', text: { en: '', am: '' } },
                  ]),
                children: '+ Add milestone',
              }),
            ],
          }),
        ],
      }),
    ],
  })
}
