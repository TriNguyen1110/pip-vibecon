// Pip's name (CONTRACT v3.7): set once by the student ("Name your Pip"), default "Pip", used wherever the app
// refers to Pip. Module state so every screen agrees; seeded from GET /api/students/{id}.
import { useEffect, useState } from 'react'

let pipName = 'Pip'
const subs = new Set()
export function setPipName(n) {
  const v = String(n ?? '').trim().slice(0, 16) || 'Pip'
  if (v === pipName) return
  pipName = v
  subs.forEach((f) => f(pipName))
}
export function usePipName() {
  const [n, setN] = useState(pipName)
  useEffect(() => {
    subs.add(setN)
    setN(pipName)
    return () => {
      subs.delete(setN)
    }
  }, [])
  return n
}
