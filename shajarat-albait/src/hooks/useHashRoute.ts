import { useCallback, useEffect, useState } from 'react'

/** Hash routing works on any static host without server rewrites */
export type RouteName = 'home' | 'setup' | 'lobby' | 'live' | 'result' | 'garden' | 'rewards' | 'how'
const ROUTES: RouteName[] = ['home', 'setup', 'lobby', 'live', 'result', 'garden', 'rewards', 'how']

export function parseHash(hash: string): RouteName {
  const name = hash.replace(/^#\/?/, '').split('/')[0]
  return ROUTES.includes(name as RouteName) ? (name as RouteName) : 'home'
}

export function navigate(name: RouteName) {
  const next = `#/${name === 'home' ? '' : name}`
  if (window.location.hash !== next) window.location.hash = next
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function useHashRoute() {
  const [route, setRoute] = useState<RouteName>(() => parseHash(window.location.hash))
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return { route, navigate: useCallback(navigate, []) }
}
