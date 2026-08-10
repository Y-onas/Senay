// Validated source for hero editor — minify into admin bundle as function h7
function h7({ section: n, onSave: l }) {
  const [r, o] = x.useState(n)
  const [u, f] = x.useState(n.content ?? {})
  x.useEffect(() => {
    o(n)
    f(n.content ?? {})
  }, [n])

  const slides = Array.isArray(u.slides) ? [...u.slides] : []
  while (slides.length < 4) slides.push({ src: '', alt: '' })
  const four = slides.slice(0, 4)
  const setSlide = (index, patch) => {
    const next = [...four]
    next[index] = { ...next[index], ...patch }
    f((prev) => ({ ...prev, slides: next }))
  }

  const isLocalized = (value) =>
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('en' in value || 'am' in value)

  const readLocale = (value, lang) => {
    if (typeof value === 'string') return lang === 'en' ? value : ''
    if (!isLocalized(value)) return ''
    return typeof value[lang] === 'string' ? value[lang] : ''
  }

  const writeLocale = (value, lang, text) => {
    if (isLocalized(value)) return { ...value, [lang]: text }
    if (typeof value === 'string') return { en: value, [lang]: text }
    return { en: '', am: '', [lang]: text }
  }

  const ensureLocalized = (value) => ({
    en: readLocale(value, 'en'),
    am: readLocale(value, 'am'),
  })

  const line1En = readLocale(u.headlineLine1, 'en')
  const line1Am = readLocale(u.headlineLine1, 'am')
  const line2En = readLocale(u.headlineLine2, 'en')
  const line2Am = readLocale(u.headlineLine2, 'am')
  const eyebrowEn = readLocale(u.eyebrow, 'en')
  const eyebrowAm = readLocale(u.eyebrow, 'am')

  const save = () => {
    const headlineLine1 = ensureLocalized(u.headlineLine1)
    const headlineLine2 = ensureLocalized(u.headlineLine2)
    const eyebrow = ensureLocalized(u.eyebrow)
    const headlineEn = [headlineLine1.en, headlineLine2.en].filter(Boolean).join(' of ')
    l(r, {
      ...u,
      eyebrow,
      headlineLine1,
      headlineLine2,
      headline: headlineEn,
      slides: four,
    })
  }

  return i.jsxs(Ke, {
    children: [
      i.jsx(Ot, {
        children: i.jsxs('div', {
          className: 'flex items-center justify-between',
          children: [
            i.jsxs('div', {
              children: [
                i.jsx(Mt, { className: 'text-base', children: 'Hero' }),
                i.jsx('p', {
                  className: 'text-sm text-brown-muted',
                  children: 'Top banner text and four rotating product images.',
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
              i.jsxs('div', {
                className: 'space-y-2 md:col-span-2',
                children: [
                  i.jsx(me, { children: 'Tagline' }),
                  i.jsxs('div', {
                    className: 'grid grid-cols-1 gap-3 md:grid-cols-2',
                    children: [
                      i.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          i.jsx('p', {
                            className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'EN',
                          }),
                          i.jsx(J, {
                            value: eyebrowEn,
                            placeholder: 'Authentic • Traditional • Brewed by Chemist',
                            onChange: (event) =>
                              f((prev) => ({
                                ...prev,
                                eyebrow: writeLocale(prev.eyebrow, 'en', event.target.value),
                              })),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          i.jsx('p', {
                            className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'AM',
                          }),
                          i.jsx(J, {
                            value: eyebrowAm,
                            placeholder: 'ባህላዊ • እውነተኛ • በኬሚስት የተጠመቀ',
                            onChange: (event) =>
                              f((prev) => ({
                                ...prev,
                                eyebrow: writeLocale(prev.eyebrow, 'am', event.target.value),
                              })),
                          }),
                        ],
                      }),
                    ],
                  }),
                  i.jsx('p', {
                    className: 'text-[11px] text-brown-muted',
                    children: 'Separate phrases with • (middle dot).',
                  }),
                ],
              }),
              i.jsxs('div', {
                className: 'space-y-2',
                children: [
                  i.jsx(me, { children: 'Headline line 1' }),
                  i.jsxs('div', {
                    className: 'grid grid-cols-1 gap-3',
                    children: [
                      i.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          i.jsx('p', {
                            className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'EN',
                          }),
                          i.jsx(J, {
                            value: line1En,
                            placeholder: 'Taste the Soul',
                            onChange: (event) =>
                              f((prev) => ({
                                ...prev,
                                headlineLine1: writeLocale(
                                  prev.headlineLine1,
                                  'en',
                                  event.target.value,
                                ),
                              })),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          i.jsx('p', {
                            className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'AM',
                          }),
                          i.jsx(J, {
                            value: line1Am,
                            placeholder: 'የኢትዮጵያን ነፍስ',
                            onChange: (event) =>
                              f((prev) => ({
                                ...prev,
                                headlineLine1: writeLocale(
                                  prev.headlineLine1,
                                  'am',
                                  event.target.value,
                                ),
                              })),
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
                  i.jsx(me, { children: 'Headline line 2' }),
                  i.jsxs('div', {
                    className: 'grid grid-cols-1 gap-3',
                    children: [
                      i.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          i.jsx('p', {
                            className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'EN',
                          }),
                          i.jsx(J, {
                            value: line2En,
                            placeholder: 'Ethiopia',
                            onChange: (event) =>
                              f((prev) => ({
                                ...prev,
                                headlineLine2: writeLocale(
                                  prev.headlineLine2,
                                  'en',
                                  event.target.value,
                                ),
                              })),
                          }),
                        ],
                      }),
                      i.jsxs('div', {
                        className: 'space-y-1',
                        children: [
                          i.jsx('p', {
                            className: 'text-[11px] font-semibold uppercase tracking-wide text-brown-muted',
                            children: 'AM',
                          }),
                          i.jsx(J, {
                            value: line2Am,
                            placeholder: 'ኢትዮጵያ',
                            onChange: (event) =>
                              f((prev) => ({
                                ...prev,
                                headlineLine2: writeLocale(
                                  prev.headlineLine2,
                                  'am',
                                  event.target.value,
                                ),
                              })),
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
              i.jsx(me, { className: 'text-base', children: 'Hero images (4)' }),
              i.jsx('p', {
                className: 'text-sm text-brown-muted',
                children: 'These rotate in the carousel at the bottom of the hero.',
              }),
              four.map((slide, index) =>
                i.jsx(
                  Ke,
                  {
                    className: 'p-4',
                    children: i.jsxs('div', {
                      className: 'grid grid-cols-1 gap-4 md:grid-cols-2',
                      children: [
                        i.jsxs('div', {
                          className: 'space-y-2',
                          children: [
                            i.jsx(me, { children: `Image ${index + 1} alt text` }),
                            i.jsx(J, {
                              value: slide.alt || '',
                              onChange: (event) =>
                                setSlide(index, { alt: event.target.value }),
                            }),
                          ],
                        }),
                        i.jsx(Fn, {
                          label: `Image ${index + 1}`,
                          value: slide.src || '',
                          onChange: (value) => setSlide(index, { src: value }),
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
