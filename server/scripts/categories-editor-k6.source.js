// Validated source for categories editor — minify into admin bundle as function k6
function k6({ section: n, onSave: l }) {
  const [r, o] = x.useState(n)

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

  const normalizeContent = (content) => {
    const raw = content ?? {}
    return {
      ...raw,
      eyebrow: normalizeField(raw.eyebrow),
      title: normalizeField(raw.title),
      description: normalizeField(raw.description),
      cards: (Array.isArray(raw.cards) ? raw.cards : []).map((card) => ({
        ...card,
        label: normalizeField(card.label),
      })),
    }
  }

  const [u, f] = x.useState(() => normalizeContent(n.content))

  x.useEffect(() => {
    o(n)
    f(normalizeContent(n.content))
  }, [n])

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

  const cards = Array.isArray(u.cards) ? u.cards : []

  const setField = (key, lang, text) => {
    f((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setCardField = (index, key, lang, text) => {
    f((prev) => {
      const list = Array.isArray(prev.cards) ? [...prev.cards] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, cards: list }
    })
  }

  const addCard = () => {
    f((prev) => ({
      ...prev,
      cards: [
        ...(Array.isArray(prev.cards) ? prev.cards : []),
        { label: { en: '', am: '' }, image: '' },
      ],
    }))
  }

  const moveCard = (from, to) => {
    f((prev) => {
      const list = Array.isArray(prev.cards) ? [...prev.cards] : []
      if (to < 0 || to >= list.length) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...prev, cards: list }
    })
  }

  const removeCard = (index) => {
    f((prev) => ({
      ...prev,
      cards: (Array.isArray(prev.cards) ? prev.cards : []).filter((_, i) => i !== index),
    }))
  }

  const updateCardImage = (index, image) => {
    f((prev) => {
      const list = Array.isArray(prev.cards) ? [...prev.cards] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, image }
      return { ...prev, cards: list }
    })
  }

  const save = () => {
    const next = {
      ...u,
      eyebrow: ensureLocalized(u.eyebrow),
      title: ensureLocalized(u.title),
      description: ensureLocalized(u.description),
      cards: (Array.isArray(u.cards) ? u.cards : []).map((card) => ({
        ...card,
        label: ensureLocalized(card.label),
      })),
    }
    f(next)
    l(r, next)
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

  return i.jsxs(Ke, {
    children: [
      i.jsx(Ot, {
        children: i.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            i.jsxs('div', {
              children: [
                i.jsx(Mt, { className: 'text-base', children: 'Categories' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'Image and name only — scrolling food showcase.',
                }),
              ],
            }),
            i.jsxs('div', {
              className: 'flex items-center gap-2',
              children: [
                i.jsx(rn, {
                  checked: r.enabled,
                  onCheckedChange: (value) => o((prev) => ({ ...prev, enabled: value })),
                }),
                i.jsxs(re, {
                  size: 'sm',
                  onClick: save,
                  children: [i.jsx(ha, { className: 'w-4 h-4 mr-2' }), 'Save section'],
                }),
              ],
            }),
          ],
        }),
      }),
      i.jsxs(xt, {
        className: 'space-y-6',
        children: [
          i.jsxs('div', {
            className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
            children: [
              localeInputPair(
                'Eyebrow',
                readLocale(u.eyebrow, 'en'),
                readLocale(u.eyebrow, 'am'),
                (text) => setField('eyebrow', 'en', text),
                (text) => setField('eyebrow', 'am', text),
                'Explore',
                'ያስሱ',
              ),
              localeInputPair(
                'Title',
                readLocale(u.title, 'en'),
                readLocale(u.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                'Categories',
                'ምድቦች',
              ),
              i.jsxs('div', {
                className: 'space-y-2 md:col-span-2',
                children: [
                  i.jsx(me, { children: 'Section description (optional)' }),
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
                            value: readLocale(u.description, 'en'),
                            placeholder:
                              'Browse our signature dishes, house-brewed drinks, and traditional favourites.',
                            onChange: (event) =>
                              setField('description', 'en', event.target.value),
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
                            value: readLocale(u.description, 'am'),
                            placeholder: 'ባህላዊ መመዝገቢያዎቻችንን፣ መጠጦችን እና ባህላዊ favorites ይመልከቱ።',
                            onChange: (event) =>
                              setField('description', 'am', event.target.value),
                            rows: 2,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          i.jsxs('div', {
            className: 'space-y-4',
            children: [
              i.jsxs('div', {
                className: 'flex items-center justify-between',
                children: [
                  i.jsx(me, { className: 'text-base', children: 'Category cards' }),
                  i.jsxs(re, {
                    size: 'sm',
                    variant: 'outline',
                    onClick: addCard,
                    children: [i.jsx(Qt, { className: 'w-4 h-4 mr-1' }), 'Add category'],
                  }),
                ],
              }),
              cards.map((card, index) =>
                i.jsx(
                  Ke,
                  {
                    className: 'p-4',
                    children: i.jsxs('div', {
                      className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                      children: [
                        i.jsxs('div', {
                          className: 'space-y-3',
                          children: [
                            localeInputPair(
                              'Name',
                              readLocale(card.label, 'en'),
                              readLocale(card.label, 'am'),
                              (text) => setCardField(index, 'label', 'en', text),
                              (text) => setCardField(index, 'label', 'am', text),
                              'Doro Wat',
                              'ዶሮ ወጥ',
                            ),
                            i.jsxs('div', {
                              className: 'flex gap-2',
                              children: [
                                i.jsx(re, {
                                  size: 'sm',
                                  variant: 'outline',
                                  disabled: index === 0,
                                  onClick: () => moveCard(index, index - 1),
                                  children: 'Up',
                                }),
                                i.jsx(re, {
                                  size: 'sm',
                                  variant: 'outline',
                                  disabled: index === cards.length - 1,
                                  onClick: () => moveCard(index, index + 1),
                                  children: 'Down',
                                }),
                                i.jsx(re, {
                                  size: 'sm',
                                  variant: 'ghost',
                                  onClick: () => removeCard(index),
                                  children: i.jsx(Zt, {
                                    className: 'w-4 h-4 text-destructive',
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                        i.jsx(Fn, {
                          label: 'Image',
                          value: card.image || '',
                          onChange: (value) => updateCardImage(index, value),
                          aspect: 'square',
                        }),
                      ],
                    }),
                  },
                  index,
                ),
              ),
            ],
          }),
        ],
      }),
    ],
  })
}
