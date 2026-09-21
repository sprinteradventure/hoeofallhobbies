'use client'

import { useEffect, useRef } from 'react'

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void
  onExpire: () => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          theme?: string
        }
      ) => string
      reset: (widgetId?: string) => void
    }
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

function loadTurnstile(): Promise<Window['turnstile']> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'))
    if (window.turnstile) return resolve(window.turnstile)

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`)
    if (!existing) {
      const script = document.createElement('script')
      script.src = TURNSTILE_SRC
      script.async = true
      script.defer = true
      script.onerror = () => reject(new Error('Failed to load Turnstile'))
      document.head.appendChild(script)
    }

    const interval = window.setInterval(() => {
      if (window.turnstile) {
        window.clearInterval(interval)
        resolve(window.turnstile)
      }
    }, 100)
  })
}

export default function TurnstileWidget({ onSuccess, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const callbacksRef = useRef({ onSuccess, onExpire })
  callbacksRef.current = { onSuccess, onExpire }

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!siteKey) return
    let cancelled = false

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || widgetIdRef.current) return
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => callbacksRef.current.onSuccess(token),
          'expired-callback': () => callbacksRef.current.onExpire(),
          theme: 'light',
        })
      })
      .catch(() => {
        // Failed to load the Turnstile script — leave the container empty so
        // the rest of the form still works (signup without captcha on failure
        // is the safest degraded behavior here since Supabase only enforces
        // captcha when it is enabled in the dashboard).
      })

    return () => {
      cancelled = true
    }
  }, [siteKey])

  // No site key configured — render nothing (graceful no-op in dev/local
  // builds and on deployments before the key is set).
  if (!siteKey) return null

  return <div ref={containerRef} />
}

/** Reset the rendered Turnstile widget so the user gets a fresh challenge. */
export function resetTurnstile() {
  if (typeof window !== 'undefined' && window.turnstile) {
    try {
      window.turnstile.reset()
    } catch {
      // widget not rendered yet — nothing to reset
    }
  }
}
