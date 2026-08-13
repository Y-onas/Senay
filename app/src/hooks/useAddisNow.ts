import { useEffect, useState } from 'react'
import { getAddisNow, type AddisNow } from '@/lib/addisTime'

/** Ticks with Addis Ababa local time so "now" stays accurate while the form is open. */
export function useAddisNow(intervalMs = 30_000): AddisNow {
  const [now, setNow] = useState<AddisNow>(() => getAddisNow())

  useEffect(() => {
    const tick = () => setNow(getAddisNow())
    tick()
    const id = window.setInterval(tick, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
