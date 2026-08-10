import { useEffect, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  loading: boolean
  error: Error | undefined
}

/**
 * Runs an async loader on mount (and when `deps` change) and tracks
 * loading/error state. Keeps page components clean while data comes from the
 * service layer.
 */
export function useAsync<T>(
  loader: () => Promise<T>,
  deps: unknown[] = [],
): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({
    data: undefined,
    loading: true,
    error: undefined,
  })

  useEffect(() => {
    let active = true
    setState((s) => ({ ...s, loading: true, error: undefined }))
    loader()
      .then((data) => {
        if (active) setState({ data, loading: false, error: undefined })
      })
      .catch((error: Error) => {
        if (active) setState({ data: undefined, loading: false, error })
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
