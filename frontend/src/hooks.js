import { useCallback, useEffect, useRef, useState } from 'react'

// Load data with loading / error / retry. `deps` re-run the loader.
export function useLoad(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const alive = useRef(true)
  const run = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    return loader()
      .then((data) => alive.current && setState({ data, error: null, loading: false }))
      .catch((error) => alive.current && setState((s) => ({ data: s.data, error, loading: false })))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => {
    alive.current = true
    run()
    return () => {
      alive.current = false
    }
  }, [run])
  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }))
  }, [])
  return { ...state, reload: run, setData }
}

// Long-press handler props (used for the hidden reset).
export function useLongPress(onLongPress, ms = 900) {
  const timer = useRef(null)
  const start = () => {
    clear()
    timer.current = setTimeout(onLongPress, ms)
  }
  const clear = () => timer.current && clearTimeout(timer.current)
  return {
    onPointerDown: start,
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e) => e.preventDefault(),
  }
}

export function readLocal(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v == null ? fallback : JSON.parse(v)
  } catch {
    return fallback
  }
}
export function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable: fine */
  }
}
