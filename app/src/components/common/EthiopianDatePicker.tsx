import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ETHIOPIAN_MONTHS_AM,
  ETHIOPIAN_WEEKDAYS_EN,
  addEthiopianMonths,
  compareEthDates,
  ethDatesEqual,
  ethiopianDaysInMonth,
  ethiopianToGregorianIso,
  ethiopianWeekday,
  formatEthiopianDateAm,
  gregorianIsoToEthiopian,
  todayEthiopian,
  type EthDate,
} from '@/lib/ethiopianCalendar'

/** Native-style ↑ ↓ arrows (side-by-side, with stems) — matches Windows/Edge date picker. */
function MonthArrow({ direction }: { direction: 'up' | 'down' }) {
  const isUp = direction === 'up'
  return (
    <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true">
      {isUp ? (
        <>
          <path d="M5.5 11.5 V2.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <path
            d="M2 5.5 L5.5 2 L9 5.5"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <path d="M5.5 2.5 V11.5" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
          <path
            d="M2 8.5 L5.5 12 L9 8.5"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  )
}

function MonthMenuTriangle() {
  return (
    <svg width="8" height="5" viewBox="0 0 8 5" aria-hidden="true" className="text-[#1c1c1e]">
      <path
        d="M0.5 0.5 L4 4.5 L7.5 0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type EthiopianDatePickerProps = {
  value: string
  min?: string
  onChange: (gregorianIso: string) => void
  onClear?: () => void
  onSelectToday?: () => void
}

type DayCell = {
  eth: EthDate
  outside: boolean
}

export function EthiopianDatePicker({
  value,
  min,
  onChange,
  onClear,
  onSelectToday,
}: EthiopianDatePickerProps) {
  const selected = value ? gregorianIsoToEthiopian(value) : null
  const minEth = min ? gregorianIsoToEthiopian(min) : null
  const today = todayEthiopian()

  const [view, setView] = useState<EthDate>(() => selected ?? today)
  const [monthMenuOpen, setMonthMenuOpen] = useState(false)

  useEffect(() => {
    if (selected) setView(selected)
  }, [selected?.year, selected?.month, selected?.day])

  const shiftMonth = (delta: number) => {
    setMonthMenuOpen(false)
    setView((v) => addEthiopianMonths(v, delta))
  }

  const cells = useMemo(() => {
    const firstWeekday = ethiopianWeekday({
      year: view.year,
      month: view.month,
      day: 1,
    })
    const daysInMonth = ethiopianDaysInMonth(view.year, view.month)
    const prev = addEthiopianMonths(view, -1)
    const prevDays = ethiopianDaysInMonth(prev.year, prev.month)

    const list: DayCell[] = []

    for (let i = firstWeekday - 1; i >= 0; i -= 1) {
      list.push({
        eth: { year: prev.year, month: prev.month, day: prevDays - i },
        outside: true,
      })
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      list.push({
        eth: { year: view.year, month: view.month, day },
        outside: false,
      })
    }

    let cursor = { ...addEthiopianMonths(view, 1), day: 1 }
    const targetRows = list.length <= 35 ? 35 : 42
    while (list.length < targetRows) {
      const max = ethiopianDaysInMonth(cursor.year, cursor.month)
      list.push({
        eth: { year: cursor.year, month: cursor.month, day: cursor.day },
        outside: true,
      })
      if (cursor.day >= max) {
        cursor = { ...addEthiopianMonths(cursor, 1), day: 1 }
      } else {
        cursor = { ...cursor, day: cursor.day + 1 }
      }
    }

    return list
  }, [view.year, view.month])

  const monthLabel = `${ETHIOPIAN_MONTHS_AM[view.month - 1]} ${view.year}`

  const isDisabled = (eth: EthDate) => {
    if (!minEth) return false
    return compareEthDates(eth, minEth) < 0
  }

  const selectDay = (eth: EthDate) => {
    if (isDisabled(eth)) return
    setView(eth)
    onChange(ethiopianToGregorianIso(eth))
  }

  const selectToday = () => {
    if (minEth && compareEthDates(today, minEth) < 0) return
    setMonthMenuOpen(false)
    setView(today)
    onChange(ethiopianToGregorianIso(today))
    onSelectToday?.()
  }

  return (
    <div
      className="w-[260px] select-none rounded-[6px] border border-[#8e8e93]/40 bg-white px-3 pb-2.5 pt-2.5 text-[13px] text-[#1c1c1e] shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
      onWheel={(event) => {
        event.preventDefault()
        if (event.deltaY < 0) shiftMonth(-1)
        else if (event.deltaY > 0) shiftMonth(1)
      }}
    >
      <div className="relative mb-1.5 flex items-center justify-between">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[13px] font-semibold text-[#1c1c1e] hover:bg-black/5"
          onClick={() => setMonthMenuOpen((open) => !open)}
          aria-label="Choose Ethiopian month"
        >
          {monthLabel}
          <MonthMenuTriangle />
        </button>

        <div className="flex flex-row items-center gap-1 pr-0.5">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center text-[#1c1c1e] hover:opacity-60"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <MonthArrow direction="up" />
          </button>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center text-[#1c1c1e] hover:opacity-60"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <MonthArrow direction="down" />
          </button>
        </div>

        {monthMenuOpen && (
          <div className="absolute left-0 top-7 z-20 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
            <div className="flex items-center justify-between border-b border-gray-100 px-2 py-1.5">
              <button
                type="button"
                className="rounded px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-100"
                onClick={() => setView((v) => ({ ...v, year: v.year - 1 }))}
              >
                ‹ {view.year - 1}
              </button>
              <span className="text-xs font-semibold">{view.year}</span>
              <button
                type="button"
                className="rounded px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-100"
                onClick={() => setView((v) => ({ ...v, year: v.year + 1 }))}
              >
                {view.year + 1} ›
              </button>
            </div>
            {ETHIOPIAN_MONTHS_AM.map((name, index) => {
              const month = index + 1
              const active = month === view.month
              return (
                <button
                  key={name}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-1.5 text-left text-[13px] hover:bg-gray-100',
                    active && 'bg-[#0A84FF]/10 font-semibold text-[#0A84FF]',
                  )}
                  onClick={() => {
                    const maxDay = ethiopianDaysInMonth(view.year, month)
                    setView({
                      year: view.year,
                      month,
                      day: Math.min(view.day, maxDay),
                    })
                    setMonthMenuOpen(false)
                  }}
                >
                  <span>{name}</span>
                  <span className="text-[11px] text-gray-400">
                    {ethiopianDaysInMonth(view.year, month)}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="mb-0.5 grid grid-cols-7 text-center text-[11px] font-medium text-[#1c1c1e]">
        {ETHIOPIAN_WEEKDAYS_EN.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {cells.map((cell) => {
          const disabled = isDisabled(cell.eth)
          const selectedDay = selected ? ethDatesEqual(cell.eth, selected) : false
          const isToday = ethDatesEqual(cell.eth, today)

          return (
            <button
              key={`${cell.outside ? 'o' : 'i'}-${cell.eth.year}-${cell.eth.month}-${cell.eth.day}`}
              type="button"
              disabled={disabled}
              onClick={() => selectDay(cell.eth)}
              className={cn(
                'mx-auto flex h-[30px] w-[30px] items-center justify-center rounded-[4px] text-[13px] leading-none',
                disabled && 'cursor-not-allowed text-[#c7c7cc]',
                !disabled && cell.outside && 'text-[#c7c7cc] hover:bg-black/5',
                !disabled && !cell.outside && !selectedDay && 'text-[#1c1c1e] hover:bg-black/5',
                selectedDay &&
                  'bg-[#0A84FF] font-semibold text-white ring-2 ring-[#1c1c1e] ring-offset-0 hover:bg-[#0A84FF]',
                isToday && !selectedDay && !disabled && 'ring-1 ring-[#8e8e93]',
              )}
            >
              {cell.eth.day}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex items-center justify-between px-0.5 pt-1 text-[13px]">
        <button
          type="button"
          className="font-medium text-[#0A84FF] hover:underline"
          onClick={() => {
            onChange('')
            onClear?.()
          }}
        >
          Clear
        </button>
        <button
          type="button"
          className="font-medium text-[#0A84FF] hover:underline disabled:cursor-not-allowed disabled:opacity-40"
          disabled={minEth ? compareEthDates(today, minEth) < 0 : false}
          onClick={selectToday}
        >
          Today
        </button>
      </div>
    </div>
  )
}

export function formatEthiopianFieldValue(gregorianIso: string): string {
  const eth = gregorianIsoToEthiopian(gregorianIso)
  return eth ? formatEthiopianDateAm(eth) : ''
}
