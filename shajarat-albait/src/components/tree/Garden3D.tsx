import { useEffect, useRef, useState } from 'react'
import type { GardenScene } from '../../three/gardenScene'
import { hasWebGL } from '../../three/webgl'
import type { TreeRecord } from '../../types'

const SPECIES_EMOJI: Record<string, string> = { oak: '🌳', pine: '🌲', blossom: '🌸', olive: '🫒', citrus: '🍊' }

/** The 3D family garden; falls back to an emoji garden without WebGL */
export function Garden3D({ trees, className = '' }: { trees: TreeRecord[]; className?: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [webgl] = useState(hasWebGL)
  const [ready, setReady] = useState(false)
  const key = trees.map((t) => t.id).join()

  useEffect(() => {
    if (!webgl || !host.current) return
    let cancelled = false
    let s: GardenScene | null = null
    import('../../three/gardenScene').then(({ GardenScene }) => {
      if (cancelled || !host.current) return
      try {
        s = new GardenScene(host.current, trees)
        setReady(true)
      } catch {
        /* keep fallback */
      }
    })
    return () => {
      cancelled = true
      s?.dispose()
    }
    // Rebuild only when the set of trees changes
  }, [webgl, key])

  return (
    <div className={`relative ${className}`}>
      {webgl ? (
        <div ref={host} className="absolute inset-0" data-testid="garden-canvas" />
      ) : (
        <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-2 p-6 text-4xl">
          {trees.map((t) => (
            <span key={t.id}>{SPECIES_EMOJI[t.species]}</span>
          ))}
        </div>
      )}
      {webgl && !ready && <div className="absolute inset-0 grid place-items-center text-5xl animate-float">🌳</div>}
    </div>
  )
}

export { SPECIES_EMOJI }
