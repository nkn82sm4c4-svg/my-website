import { useCallback, useEffect, useState } from 'react'

/**
 * Minimal hash router (#/menu/pizza). Hash routing works on any static host
 * and inside QR deep links without server rewrites.
 */
export type RouteName = 'home' | 'menu' | 'offers' | 'loyalty' | 'cart' | 'scan'
export interface Route {
  name: RouteName
  param?: string
}

const ROUTES: RouteName[] = ['home', 'menu', 'offers', 'loyalty', 'cart', 'scan']

export function parseHash(hash: string): Route {
  const [name, param] = hash.replace(/^#\/?/, '').split('/')
  return ROUTES.includes(name as RouteName) ? { name: name as RouteName, param } : { name: 'home' }
}

export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash))

  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  const navigate = useCallback((name: RouteName, param?: string) => {
    const next = `#/${name === 'home' ? '' : name}${param ? `/${param}` : ''}`
    if (window.location.hash !== next) window.location.hash = next
    else window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  return { route, navigate }
}
