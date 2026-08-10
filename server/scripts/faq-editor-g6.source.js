// Validated source for FAQ admin editor — minify into admin bundle as function g6
function g6() {
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

  const normalizeHeadings = (raw) => ({
    eyebrow: normalizeField(raw?.eyebrow),
    title: normalizeField(raw?.title),
    description: normalizeField(raw?.description),
  })

  const normalizeFaq = (faq) => ({
    id: faq?.id,
    published: faq?.published ?? true,
    sortOrder: faq?.sortOrder ?? 0,
    question: isLocalized(faq?.questionI18n)
      ? normalizeField(faq.questionI18n)
      : normalizeField(faq?.question),
    answer: isLocalized(faq?.answerI18n)
      ? normalizeField(faq.answerI18n)
      : normalizeField(faq?.answer),
  })

  const faqPayload = (faq) => ({
    id: faq.id,
    published: faq.published,
    sortOrder: faq.sortOrder,
    question: readLocale(faq.question, 'en'),
    answer: readLocale(faq.answer, 'en'),
    questionI18n: ensureLocalized(faq.question),
    answerI18n: ensureLocalized(faq.answer),
  })

  const emptyNewFaq = () => ({
    question: { en: '', am: '' },
    answer: { en: '', am: '' },
  })

  const [faqs, setFaqs] = x.useState([])
  const [loading, setLoading] = x.useState(true)
  const [adding, setAdding] = x.useState(false)
  const [newFaq, setNewFaq] = x.useState(emptyNewFaq)
  const [section, setSection] = x.useState(null)
  const [headings, setHeadings] = x.useState(normalizeHeadings({}))
  const [savingHeadings, setSavingHeadings] = x.useState(false)

  const reloadFaqs = async () => {
    const rows = await Ws.faqs.list()
    setFaqs(rows.map(normalizeFaq))
  }

  x.useEffect(() => {
    let timer = setTimeout(() => setLoading(true), 300)
    Promise.all([
      reloadFaqs(),
      vt.homeSections.list().then((list) => {
        const faqSection = list.find((entry) => entry.key === 'faq')
        setSection(faqSection || null)
        setHeadings(normalizeHeadings(faqSection?.content ?? {}))
      }),
    ]).finally(() => {
      clearTimeout(timer)
      setLoading(false)
    })
  }, [])

  const setHeadingField = (key, lang, text) => {
    setHeadings((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const setFaqField = (index, key, lang, text) => {
    setFaqs((prev) => {
      const list = [...prev]
      const current = list[index]
      if (!current) return prev
      list[index] = { ...current, [key]: writeLocale(current[key], lang, text) }
      return list
    })
  }

  const setNewFaqField = (key, lang, text) => {
    setNewFaq((prev) => ({ ...prev, [key]: writeLocale(prev[key], lang, text) }))
  }

  const saveHeadings = async () => {
    if (!section) {
      we.error('Home FAQ section not found')
      return
    }
    setSavingHeadings(true)
    try {
      const content = {
        ...section.content,
        eyebrow: ensureLocalized(headings.eyebrow),
        title: ensureLocalized(headings.title),
        description: ensureLocalized(headings.description),
      }
      await vt.homeSections.update(section.id, {
        label: section.label,
        order: section.order,
        enabled: section.enabled,
        content,
      })
      setHeadings(normalizeHeadings(content))
      we.success('Section headings saved')
    } finally {
      setSavingHeadings(false)
    }
  }

  const addFaq = async () => {
    if (!readLocale(newFaq.question, 'en').trim() && !readLocale(newFaq.question, 'am').trim()) {
      we.error('Question required')
      return
    }
    setAdding(true)
    try {
      const payload = faqPayload({
        question: newFaq.question,
        answer: newFaq.answer,
        published: true,
        sortOrder: faqs.length + 1,
      })
      const created = await Ws.faqs.create(payload)
      setFaqs((prev) => [...prev, normalizeFaq(created)])
      setNewFaq(emptyNewFaq())
    } finally {
      setAdding(false)
    }
  }

  const saveFaq = async (faq) => {
    const payload = faqPayload(faq)
    const updated = await Ws.faqs.update(faq.id, payload)
    setFaqs((prev) => prev.map((entry) => (entry.id === faq.id ? normalizeFaq(updated) : entry)))
    we.success('FAQ saved')
  }

  const deleteFaq = async (id) => {
    if (!await adminConfirm({title:'Delete FAQ?',description:'This question and answer will be permanently removed from the site.',confirmLabel:'Delete FAQ'})) return
    await Ws.faqs.delete(id)
    setFaqs((prev) => prev.filter((entry) => entry.id !== id))
    we.success('Deleted')
  }

  const reorder = (from, to) => {
    if (to < 0 || to >= faqs.length) return
    const next = [...faqs]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    const reordered = next.map((entry, index) => ({ ...entry, sortOrder: index + 1 }))
    setFaqs(reordered)
    Promise.all(
      reordered.map((entry, index) =>
        Ws.faqs.update(entry.id, { ...faqPayload(entry), sortOrder: index + 1 }),
      ),
    )
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
                children: 'FAQ',
              }),
              i.jsx('p', {
                className: 'text-brown-muted',
                children: 'Add, edit, reorder and show or hide FAQs.',
              }),
            ],
          }),
        ],
      }),
      i.jsx(Ke, {
        className: 'p-4',
        children: i.jsxs('div', {
          className: 'space-y-4',
          children: [
            i.jsxs('div', {
              className: 'flex items-center justify-between gap-3',
              children: [
                i.jsxs('div', {
                  children: [
                    i.jsx(Mt, { className: 'text-base', children: 'Homepage section headings' }),
                    i.jsx('p', {
                      className: 'text-sm text-brown-muted',
                      children:
                        'Eyebrow, title and description shown beside the FAQ list on the home page.',
                    }),
                  ],
                }),
                i.jsxs(re, {
                  size: 'sm',
                  onClick: saveHeadings,
                  disabled: savingHeadings,
                  children: [
                    i.jsx(ha, { className: 'w-4 h-4 mr-2' }),
                    savingHeadings ? 'Saving...' : 'Save headings',
                  ],
                }),
              ],
            }),
            localeInputPair(
              'Eyebrow',
              readLocale(headings.eyebrow, 'en'),
              readLocale(headings.eyebrow, 'am'),
              (text) => setHeadingField('eyebrow', 'en', text),
              (text) => setHeadingField('eyebrow', 'am', text),
              'FAQ',
              'ጥያቄዎች',
            ),
            localeInputPair(
              'Title',
              readLocale(headings.title, 'en'),
              readLocale(headings.title, 'am'),
              (text) => setHeadingField('title', 'en', text),
              (text) => setHeadingField('title', 'am', text),
              'Questions? Answered.',
              'ጥያቄዎች? መልስ አለ!',
            ),
            localeTextareaPair(
              'Description',
              readLocale(headings.description, 'en'),
              readLocale(headings.description, 'am'),
              (text) => setHeadingField('description', 'en', text),
              (text) => setHeadingField('description', 'am', text),
              'Got questions about ordering, catering or our brewing? Here are the answers our guests ask most.',
              'ስለ ትዕዛዝ፣ ካትሪንግ ወይም መጠመቃችን ጥያቄዎች አሉዎት? እንግዶቻችን ብዙ ጊዜ የሚጠይቁ መልሶች እነህን ነው።',
            ),
          ],
        }),
      }),
      i.jsx(Ke, {
        className: 'p-4',
        children: i.jsxs('div', {
          className: 'space-y-4',
          children: [
            i.jsx(Mt, { className: 'text-base', children: 'Add FAQ' }),
            localeInputPair(
              'Question',
              readLocale(newFaq.question, 'en'),
              readLocale(newFaq.question, 'am'),
              (text) => setNewFaqField('question', 'en', text),
              (text) => setNewFaqField('question', 'am', text),
              'New question',
              'አዲስ ጥያቄ',
            ),
            localeTextareaPair(
              'Answer',
              readLocale(newFaq.answer, 'en'),
              readLocale(newFaq.answer, 'am'),
              (text) => setNewFaqField('answer', 'en', text),
              (text) => setNewFaqField('answer', 'am', text),
              'Answer',
              'መልስ',
            ),
            i.jsxs(re, {
              onClick: addFaq,
              disabled: adding,
              children: [
                i.jsx(Qt, { className: 'w-4 h-4 mr-2' }),
                adding ? 'Adding...' : 'Add FAQ',
              ],
            }),
          ],
        }),
      }),
      i.jsx('div', {
        className: 'space-y-3',
        children: faqs.map((faq, index) =>
          i.jsx(
            Ke,
            {
              className: 'p-4',
              children: i.jsxs('div', {
                className: 'space-y-3',
                children: [
                  localeInputPair(
                    'Question',
                    readLocale(faq.question, 'en'),
                    readLocale(faq.question, 'am'),
                    (text) => setFaqField(index, 'question', 'en', text),
                    (text) => setFaqField(index, 'question', 'am', text),
                    'Question',
                    'ጥያቄ',
                  ),
                  localeTextareaPair(
                    'Answer',
                    readLocale(faq.answer, 'en'),
                    readLocale(faq.answer, 'am'),
                    (text) => setFaqField(index, 'answer', 'en', text),
                    (text) => setFaqField(index, 'answer', 'am', text),
                    'Answer',
                    'መልስ',
                  ),
                  i.jsxs('div', {
                    className: 'flex flex-wrap items-center gap-2',
                    children: [
                      i.jsx(rn, {
                        checked: faq.published,
                        onCheckedChange: (checked) =>
                          setFaqs((prev) =>
                            prev.map((entry, idx) =>
                              idx === index ? { ...entry, published: checked } : entry,
                            ),
                          ),
                      }),
                      i.jsx(me, { className: 'mb-0', children: 'Visible' }),
                      i.jsx(re, {
                        size: 'sm',
                        variant: 'outline',
                        disabled: index === 0,
                        onClick: () => reorder(index, index - 1),
                        children: 'Up',
                      }),
                      i.jsx(re, {
                        size: 'sm',
                        variant: 'outline',
                        disabled: index === faqs.length - 1,
                        onClick: () => reorder(index, index + 1),
                        children: 'Down',
                      }),
                      i.jsxs(re, {
                        size: 'sm',
                        onClick: () => saveFaq(faq),
                        children: [i.jsx(ha, { className: 'w-4 h-4 mr-1' }), ' Save'],
                      }),
                      i.jsx(re, {
                        size: 'sm',
                        variant: 'ghost',
                        onClick: () => deleteFaq(faq.id),
                        children: i.jsx(Zt, { className: 'w-4 h-4 text-destructive' }),
                      }),
                    ],
                  }),
                ],
              }),
            },
            faq.id,
          ),
        ),
      }),
    ],
  })
}
