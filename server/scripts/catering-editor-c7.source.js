// Validated source for catering editor — minify into admin bundle as function c7
function c7({ section: n, onSave: l }) {
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

  const emptyDish = () => ({
    label: { en: '', am: '' },
    name: { en: '', am: '' },
    description: { en: '', am: '' },
    image: '',
    category: 'food',
  })

  const normalizeDish = (dish) => ({
    ...emptyDish(),
    ...dish,
    label: normalizeField(dish?.label),
    name: normalizeField(dish?.name),
    description: normalizeField(dish?.description),
    image: typeof dish?.image === 'string' ? dish.image : '',
    category: typeof dish?.category === 'string' ? dish.category : 'food',
  })

  const normalizeContent = (content) => {
    const raw = content ?? {}
    const list = Array.isArray(raw.dishes) ? raw.dishes : []
    return {
      ...raw,
      eyebrow: normalizeField(raw.eyebrow),
      title: normalizeField(raw.title),
      description: normalizeField(raw.description),
      buttonText: normalizeField(raw.buttonText),
      buttonLink: typeof raw.buttonLink === 'string' ? raw.buttonLink : '/catering',
      dishes: Array.from({ length: 3 }, (_, index) => normalizeDish(list[index] ?? {})),
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

  const dishes = Array.isArray(u.dishes) ? u.dishes : []

  const setField = (key, lang, text) => {
    f((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setDishField = (index, key, lang, text) => {
    f((prev) => {
      const list = Array.isArray(prev.dishes) ? [...prev.dishes] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return { ...prev, dishes: list }
    })
  }

  const setDishPatch = (index, patch) => {
    f((prev) => {
      const list = Array.isArray(prev.dishes) ? [...prev.dishes] : []
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, ...patch }
      return { ...prev, dishes: list }
    })
  }

  const save = () => {
    const next = {
      ...u,
      eyebrow: ensureLocalized(u.eyebrow),
      title: ensureLocalized(u.title),
      description: ensureLocalized(u.description),
      buttonText: ensureLocalized(u.buttonText),
      buttonLink: u.buttonLink || '/catering',
      dishes: (Array.isArray(u.dishes) ? u.dishes : []).map((dish) => ({
        ...dish,
        label: ensureLocalized(dish.label),
        name: ensureLocalized(dish.name),
        description: ensureLocalized(dish.description),
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
                i.jsx(Mt, { className: 'text-base', children: 'Catering' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'Three catering cards with image, labels and book button.',
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
                'Catering',
                'ካተሪንግ',
              ),
              localeInputPair(
                'Title',
                readLocale(u.title, 'en'),
                readLocale(u.title, 'am'),
                (text) => setField('title', 'en', text),
                (text) => setField('title', 'am', text),
                'Bring the Feast to Your Event',
                'የግብ ግብዣውን ወደ ዝግጅትዎ ያምጡ',
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
                              'From intimate dinners to weddings and holidays, we cater with tradition.',
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
                              'ከትንሽ ድራር እስከ ጋብቻዎች እና በዓላት ድረስ፣ በባህል እናቀርባለን።',
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
                'Button text',
                readLocale(u.buttonText, 'en'),
                readLocale(u.buttonText, 'am'),
                (text) => setField('buttonText', 'en', text),
                (text) => setField('buttonText', 'am', text),
                'Book Catering',
                'ካተሪንግ ይዘዙ',
              ),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'Button link' }),
                  i.jsx(J, {
                    value: u.buttonLink || '',
                    placeholder: '/catering',
                    onChange: (event) =>
                      f((prev) => ({ ...prev, buttonLink: event.target.value })),
                  }),
                ],
              }),
            ],
          }),
          i.jsx(me, { className: 'text-base', children: 'Catering cards' }),
          dishes.map((dish, index) =>
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
                        i.jsxs(Mt, {
                          className: 'text-sm',
                          children: ['Card ', index + 1],
                        }),
                        localeInputPair(
                          'Category label',
                          readLocale(dish.label, 'en'),
                          readLocale(dish.label, 'am'),
                          (text) => setDishField(index, 'label', 'en', text),
                          (text) => setDishField(index, 'label', 'am', text),
                          index === 0
                            ? 'Wedding Catering'
                            : index === 1
                              ? 'Holiday Box'
                              : 'Vegan Tray',
                          index === 0
                            ? 'የጋብቻ ካተሪንግ'
                            : index === 1
                              ? 'Holiday Box'
                              : 'Vegan Tray',
                        ),
                        localeInputPair(
                          'Title',
                          readLocale(dish.name, 'en'),
                          readLocale(dish.name, 'am'),
                          (text) => setDishField(index, 'name', 'en', text),
                          (text) => setDishField(index, 'name', 'am', text),
                          index === 0
                            ? 'Full Mesob Spread'
                            : index === 1
                              ? 'Festival Package'
                              : 'Fasting',
                          index === 0
                            ? 'Full Mesob Spread'
                            : index === 1
                              ? 'Festival Package'
                              : 'Fasting',
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
                                      value: readLocale(dish.description, 'en'),
                                      placeholder:
                                        index === 0
                                          ? 'Enough for any celebration'
                                          : index === 2
                                            ? 'Colourful fasting selection'
                                            : '',
                                      onChange: (event) =>
                                        setDishField(
                                          index,
                                          'description',
                                          'en',
                                          event.target.value,
                                        ),
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
                                      value: readLocale(dish.description, 'am'),
                                      placeholder: '',
                                      onChange: (event) =>
                                        setDishField(
                                          index,
                                          'description',
                                          'am',
                                          event.target.value,
                                        ),
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
                    i.jsx(Fn, {
                      label: 'Card image',
                      value: dish.image || '',
                      onChange: (value) => setDishPatch(index, { image: value }),
                      aspect: 'wide',
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
  })
}
