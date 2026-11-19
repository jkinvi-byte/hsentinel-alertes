'use client'

import { useEffect, useState } from 'react'

/** Advances 0..count, holds on the final state, then restarts. Shows everything at once for reduced motion. */
export function useLoopStep(count: number, stepMs = 900, holdMs = 2600) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStep(count)
      return
    }
    let current = 0
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      current = current >= count ? 0 : current + 1
      setStep(current)
      timer = setTimeout(tick, current === count ? holdMs : stepMs)
    }
    timer = setTimeout(tick, stepMs)
    return () => clearTimeout(timer)
  }, [count, stepMs, holdMs])

  return step
}
