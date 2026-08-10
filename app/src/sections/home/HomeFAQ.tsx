import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { getFaqs } from '@/services/contentService'
import { useHomeSection } from '@/hooks/useHomeSection'
import { useLanguage } from '@/hooks/useLanguage'

function FAQItem({
  question,
  answer,
  isOpen,
  onClick,
  index,
}: {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
  index: number
}) {
  return (
    <motion.div
      className="border-b border-gray-200"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        onClick={onClick}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between py-5 text-left sm:py-6"
      >
        <span className="pr-4 font-display text-base font-bold uppercase text-gray-900 sm:text-lg">
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="h-5 w-5 text-gray-500 transition-colors group-hover:text-burgundy" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="pb-5 pr-8 text-sm leading-relaxed text-gray-500 sm:pb-6 sm:text-base">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function HomeFAQ() {
  const { locale } = useLanguage()
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([])
  const { content } = useHomeSection<{ eyebrow?: string; title?: string; description?: string }>('faq')

  useEffect(() => {
    getFaqs().then((rows) => {
      setFaqs(rows.map((row) => ({ question: row.question, answer: row.answer })))
    })
  }, [locale])

  const hasHeadings = Boolean(
    content?.eyebrow?.trim() || content?.title?.trim() || content?.description?.trim(),
  )

  if (!hasHeadings && !faqs.length) {
    return null
  }

  return (
    <section className="bg-cream py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-16">
          {hasHeadings ? (
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {content?.eyebrow ? (
                <div className="section-label text-burgundy">
                  <span className="text-xs sm:text-sm">{content.eyebrow}</span>
                </div>
              ) : null}
              {content?.title ? (
                <h2 className="heading-display text-3xl uppercase text-gray-900 sm:text-4xl lg:text-5xl">
                  {content.title}
                </h2>
              ) : null}
              {content?.description ? (
                <p className="mt-4 text-sm text-gray-500 sm:text-base">{content.description}</p>
              ) : null}
            </motion.div>
          ) : null}

          {faqs.length ? (
            <div className={hasHeadings ? 'lg:col-span-3' : 'lg:col-span-5'}>
              {faqs.map((faq, i) => (
                <FAQItem
                  key={`${faq.question}-${i}`}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openIndex === i}
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  index={i}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
