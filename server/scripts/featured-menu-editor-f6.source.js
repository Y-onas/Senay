// Validated source for featured menu editor — minify into admin bundle as function f6
function f6({ section: n, onSave: l }) {
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
      buttonText: normalizeField(raw.buttonText),
      buttonLink: typeof raw.buttonLink === 'string' ? raw.buttonLink : '/contact',
      items: (Array.isArray(raw.items) ? raw.items : []).map((item) => ({
        ...item,
        name: normalizeField(item.name),
        description: normalizeField(item.description),
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

  const items = Array.isArray(u.items) ? u.items : []

  const setField = (key, lang, text) => {
    f((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setItemField = (index, key, lang, text) => {
    f((prev) => {
      const list = Array.isArray(prev.items) ? [...prev.items] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, items: list }
    })
  }

  const setItemPatch = (index, patch) => {
    f((prev) => {
      const list = Array.isArray(prev.items) ? [...prev.items] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, ...patch }
      return { ...prev, items: list }
    })
  }

  const moveItem = (from, to) => {
    f((prev) => {
      const list = Array.isArray(prev.items) ? [...prev.items] : []
      if (to < 0 || to >= list.length) return prev
      const [item] = list.splice(from, 1)
      list.splice(to, 0, item)
      return { ...prev, items: list }
    })
  }

  const removeItem = (index) => {
    f((prev) => ({
      ...prev,
      items: (Array.isArray(prev.items) ? prev.items : []).filter((_, i) => i !== index),
    }))
  }

  const addItem = () => {
    f((prev) => {
      const list = Array.isArray(prev.items) ? prev.items : []
      if (list.length >= 5) {
        we.error('Maximum 5 menu items')
        return prev
      }
      return {
        ...prev,
        items: [
          ...list,
          {
            id: `item-${Date.now()}`,
            name: { en: 'New dish', am: '' },
            description: { en: '', am: '' },
            price: 0,
            image: '',
            category: 'food',
          },
        ],
      }
    })
  }

  const save = () => {
    const next = {
      ...u,
      eyebrow: ensureLocalized(u.eyebrow),
      title: ensureLocalized(u.title),
      description: ensureLocalized(u.description),
      buttonText: ensureLocalized(u.buttonText),
      buttonLink: u.buttonLink || '/contact',
      items: (Array.isArray(u.items) ? u.items : []).map((item) => ({
        ...item,
        name: ensureLocalized(item.name),
        description: ensureLocalized(item.description),
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
                i.jsx(Mt, { className: 'text-base', children: 'Our Menu' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'List up to 5 dishes — name, description, price and image.',
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
                'From the Menu',
                'ከምናሌው',
              ),
              localeInputPair(
                'Title',
                readLocale(u.title, 'en'),
                readLocale(u.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                "Chef's Selection",
                'የሼፍ ምርጫ',
              ),
              i.jsxs('div', {
                className: 'space-y-2 md:col-span-2',
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
                            value: readLocale(u.description, 'en'),
                            placeholder:
                              'Small plates and favourites we are proud to serve every day.',
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
                            placeholder:
                              'በየቀኑ በفخر የምናቀርባቸው ትናንሽ መנהአቀራረብ እና ተወዳጆች።',
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
              localeInputPair(
                'View menu button text',
                readLocale(u.buttonText, 'en'),
                readLocale(u.buttonText, 'am'),
                (text) => setField('buttonText', 'en', text),
                (text) => setField('buttonText', 'am', text),
                'visit us',
                'ይጎብኙን',
              ),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'View menu button link' }),
                  i.jsx(J, {
                    value: u.buttonLink || '',
                    placeholder: '/contact',
                    onChange: (event) =>
                      f((prev) => ({ ...prev, buttonLink: event.target.value })),
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
                  i.jsxs(me, {
                    className: 'text-base',
                    children: ['Dishes (', items.length, '/5)'],
                  }),
                  i.jsxs(re, {
                    size: 'sm',
                    variant: 'outline',
                    onClick: addItem,
                    disabled: items.length >= 5,
                    children: [i.jsx(Qt, { className: 'w-4 h-4 mr-1' }), 'Add dish'],
                  }),
                ],
              }),
              items.map((item, index) =>
                i.jsx(
                  Ke,
                  {
                    className: 'p-4',
                    children: i.jsxs('div', {
                      className: 'space-y-4',
                      children: [
                        i.jsxs('div', {
                          className: 'flex items-center justify-between gap-2',
                          children: [
                            i.jsxs(Mt, {
                              className: 'text-sm font-semibold',
                              children: [
                                '#',
                                index + 1,
                                ' ',
                                readLocale(item.name, 'en') ||
                                  readLocale(item.name, 'am') ||
                                  'Untitled dish',
                              ],
                            }),
                            i.jsxs('div', {
                              className: 'flex gap-2',
                              children: [
                                i.jsx(re, {
                                  size: 'sm',
                                  variant: 'outline',
                                  disabled: index === 0,
                                  onClick: () => moveItem(index, index - 1),
                                  children: 'Up',
                                }),
                                i.jsx(re, {
                                  size: 'sm',
                                  variant: 'outline',
                                  disabled: index === items.length - 1,
                                  onClick: () => moveItem(index, index + 1),
                                  children: 'Down',
                                }),
                                i.jsx(re, {
                                  size: 'sm',
                                  variant: 'ghost',
                                  onClick: () => removeItem(index),
                                  children: i.jsx(Zt, {
                                    className: 'w-4 h-4 text-destructive',
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                        i.jsxs('div', {
                          className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                          children: [
                            i.jsxs('div', {
                              className: 'space-y-3',
                              children: [
                                localeInputPair(
                                  'Dish name',
                                  readLocale(item.name, 'en'),
                                  readLocale(item.name, 'am'),
                                  (text) => setItemField(index, 'name', 'en', text),
                                  (text) => setItemField(index, 'name', 'am', text),
                                  'Doro Wat',
                                  'ዶሮ ወጥ',
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
                                              value: readLocale(item.description, 'en'),
                                              placeholder:
                                                'Ethiopian chicken stew slow-cooked in berbere and spiced butter, served with injera.',
                                              onChange: (event) =>
                                                setItemField(
                                                  index,
                                                  'description',
                                                  'en',
                                                  event.target.value,
                                                ),
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
                                              value: readLocale(item.description, 'am'),
                                              placeholder:
                                                'በበርበሬ እና በቅቤ የተቀመጠ የኢትዮጵያ ዶሮ stew፣ ከእንጀራ ጋር።',
                                              onChange: (event) =>
                                                setItemField(
                                                  index,
                                                  'description',
                                                  'am',
                                                  event.target.value,
                                                ),
                                              rows: 3,
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                i.jsxs('div', {
                                  className: 'space-y-2',
                                  children: [
                                    i.jsx(me, { children: 'Price (ETB)' }),
                                    i.jsx(J, {
                                      type: 'number',
                                      min: '0',
                                      value: item.price ?? 0,
                                      onChange: (event) =>
                                        setItemPatch(index, {
                                          price: Number(event.target.value) || 0,
                                        }),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            i.jsx(Fn, {
                              label: 'Dish image',
                              value: item.image || '',
                              onChange: (value) => setItemPatch(index, { image: value }),
                              aspect: 'wide',
                            }),
                          ],
                        }),
                      ],
                    }),
                  },
                  item.id || index,
                ),
              ),
            ],
          }),
        ],
      }),
    ],
  })
}
