import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { TreeScene } from '../../three/treeScene'
import { hasWebGL } from '../../three/webgl'
import type { TreeSpecies } from '../../types'
import { FallbackTree } from './FallbackTree'

interface Props {
  species: TreeSpecies
  seed: number
  growth: number
  fruit?: number
  blocked?: boolean
  /** Increment to drop one leaf */
  leafDrops?: number
  /** Increment to fire the celebration */
  celebrate?: number
  /** Scripted growth on mount (hero / result screens) */
  intro?: { from: number; to: number; seconds: number }
  onMilestone?: (quarter: number) => void
  className?: string
}

/** React wrapper around the three.js scene (loaded lazily in its own chunk) */
export function Tree3D({ species, seed, growth, fruit = 0, blocked = false, leafDrops = 0, celebrate = 0, intro, onMilestone, className = '' }: Props) {
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<TreeScene | null>(null)
  const [ready, setReady] = useState(false)
  const [webgl] = useState(hasWebGL)
  const latest = useRef({ growth, fruit, blocked, onMilestone })
  useLayoutEffect(() => {
    latest.current = { growth, fruit, blocked, onMilestone }
  })
  // Captured once: the intro only plays when the scene is first created
  const [introOnce] = useState(intro)
  const introRef = useRef(introOnce)

  useEffect(() => {
    if (!webgl || !host.current) return
    let cancelled = false
    let s: TreeScene | null = null
    import('../../three/treeScene').then(({ TreeScene }) => {
      if (cancelled || !host.current) return
      const l = latest.current
      const i = introRef.current
      try {
        s = new TreeScene(host.current, species, seed, i ? i.from : l.growth)
      } catch {
        return
      }
      if (i) s.animateGrowth(i.from, i.to, i.seconds)
      s.setFruit(l.fruit, !i)
      s.setBlocked(l.blocked)
      s.onMilestone = (q) => latest.current.onMilestone?.(q)
      scene.current = s
      setReady(true)
    })
    return () => {
      cancelled = true
      s?.dispose()
      scene.current = null
    }
    // The scene is created once per tree; later props flow in through the effects below
  }, [webgl])

  useEffect(() => scene.current?.setTree(species, seed), [species, seed, ready])
  useEffect(() => {
    if (ready && !introOnce) scene.current?.setGrowth(growth)
  }, [growth, ready, introOnce])
  useEffect(() => scene.current?.setFruit(fruit), [fruit, ready])
  useEffect(() => scene.current?.setBlocked(blocked), [blocked, ready])

  const drops = useRef(leafDrops)
  useEffect(() => {
    if (leafDrops > drops.current) scene.current?.dropLeaf()
    drops.current = leafDrops
  }, [leafDrops])
  const cel = useRef(celebrate)
  useEffect(() => {
    if (celebrate > cel.current) scene.current?.celebrate()
    cel.current = celebrate
  }, [celebrate])

  return (
    <div className={`relative ${className}`}>
      {webgl ? (
        <div ref={host} className="absolute inset-0" data-testid="tree-canvas" />
      ) : (
        <div className="absolute inset-0 p-6">
          <FallbackTree growth={intro ? intro.to : growth} fruit={fruit} />
        </div>
      )}
      {webgl && !ready && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-6xl animate-float">🌱</span>
        </div>
      )}
    </div>
  )
}
