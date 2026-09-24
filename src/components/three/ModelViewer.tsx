import { Box, Expand, Hand, Minus, Pause, Play, Plus, RotateCcw, ScanLine, Shrink } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MODELS } from '../../config/models'
import { cx } from '../../lib/format'
import { analytics } from '../../services/analyticsService'
import type { ModelKey } from '../../types'

/** Subset of the <model-viewer> element API we use. */
interface ModelViewerElement extends HTMLElement {
  cameraOrbit: string
  fieldOfView: string
  autoRotate: boolean
  canActivateAR: boolean
  zoom: (steps: number) => void
  activateAR: () => Promise<void>
  resetTurntableRotation: (theta?: number) => void
}

// The web component (and three.js) is only downloaded the first time a 3D view opens.
let libPromise: Promise<unknown> | null = null
const loadLib = () => (libPromise ??= import('@google/model-viewer'))

const PRESETS = [
  { id: 'hero', label: '¾', orbit: null },
  { id: 'front', label: 'أمامي', orbit: '0deg 82deg auto' },
  { id: 'side', label: 'جانبي', orbit: '90deg 80deg auto' },
  { id: 'top', label: 'علوي', orbit: '0deg 12deg auto' },
] as const

const DEFAULT_ORBIT = '-32deg 68deg 110%'

interface Props {
  model: ModelKey
  className?: string
  /** Compact = no control bar (used for inline previews). */
  compact?: boolean
  autoRotate?: boolean
  tint?: string
}

export function ModelViewer({ model, className, compact, autoRotate = true, tint }: Props) {
  const cfg = MODELS[model]
  const ref = useRef<ModelViewerElement | null>(null)
  const [libReady, setLibReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const [rotating, setRotating] = useState(autoRotate)
  const [preset, setPreset] = useState<string>('hero')
  const [canAR, setCanAR] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const baseOrbit = cfg.orbit ?? DEFAULT_ORBIT

  useEffect(() => {
    let alive = true
    loadLib()
      .then(() => alive && setLibReady(true))
      .catch(() => alive && setFailed(true))
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !libReady) return
    setLoaded(false)
    setProgress(0)
    const onProgress = (e: Event) => setProgress((e as CustomEvent<{ totalProgress: number }>).detail.totalProgress)
    const onLoad = () => {
      setLoaded(true)
      setCanAR(!!el.canActivateAR)
      analytics.track('productViews3d')
    }
    const onError = () => setFailed(true)
    const onCamera = (e: Event) => {
      if ((e as CustomEvent<{ source: string }>).detail.source === 'user-interaction') {
        setInteracted(true)
        setPreset('')
      }
    }
    el.addEventListener('progress', onProgress)
    el.addEventListener('load', onLoad)
    el.addEventListener('error', onError)
    el.addEventListener('camera-change', onCamera)
    return () => {
      el.removeEventListener('progress', onProgress)
      el.removeEventListener('load', onLoad)
      el.removeEventListener('error', onError)
      el.removeEventListener('camera-change', onCamera)
    }
  }, [libReady, model, expanded])

  const goTo = (id: string, orbit: string | null) => {
    const el = ref.current
    if (!el) return
    setPreset(id)
    el.cameraOrbit = orbit ?? baseOrbit
    el.fieldOfView = 'auto'
  }
  const zoom = (steps: number) => ref.current?.zoom(steps)
  const reset = () => {
    const el = ref.current
    if (!el) return
    el.resetTurntableRotation(0)
    goTo('hero', null)
  }
  const toggleRotate = () => {
    const el = ref.current
    if (!el) return
    el.autoRotate = !rotating
    setRotating(!rotating)
  }

  const viewer = (
    <div
      className={cx(
        'isolate overflow-hidden',
        expanded ? 'fixed inset-0 z-[60] bg-gradient-to-b from-[#fff8ee] via-cream to-sand' : 'relative h-full w-full',
        !expanded && className,
      )}
    >
      {/* soft spotlight backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_45%,#fff_0%,transparent_70%)]" />

      {libReady && !failed ? (
        <model-viewer
          ref={ref as React.Ref<HTMLElement>}
          // the WebGL canvas is laid out with physical offsets — keep it LTR inside the RTL page
          dir="ltr"
          src={cfg.src}
          poster={cfg.poster}
          alt={`نموذج ثلاثي الأبعاد: ${cfg.label}`}
          camera-controls=""
          touch-action="pan-y"
          auto-rotate={rotating ? '' : undefined}
          auto-rotate-delay="1200"
          rotation-per-second="22deg"
          camera-orbit={baseOrbit}
          min-camera-orbit="auto 5deg auto"
          max-camera-orbit="auto 100deg auto"
          min-field-of-view="12deg"
          max-field-of-view="42deg"
          interpolation-decay="120"
          interaction-prompt="none"
          shadow-intensity="1.1"
          shadow-softness="0.85"
          exposure="1.05"
          environment-image="neutral"
          tone-mapping="neutral"
          ar={!compact ? '' : undefined}
          ar-modes="webxr scene-viewer quick-look"
          ar-scale="fixed"
          style={{ filter: tint }}
        />
      ) : (
        <img src={cfg.poster} alt="" style={{ filter: tint }} className="absolute inset-0 m-auto h-[82%] w-[82%] object-contain" />
      )}

      {/* loading bar */}
      {!loaded && !failed && (
        <div className="pointer-events-none absolute inset-x-10 bottom-5 flex flex-col items-center gap-2">
          <div className="h-1.5 w-full max-w-48 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${Math.max(8, progress * 100)}%` }} />
          </div>
          <span className="text-[11px] font-medium text-muted">جاري تحميل تجربة 3D…</span>
        </div>
      )}

      {failed && (
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-white/90 p-3 text-center text-xs text-ink-soft shadow-card">
          تعذّر تحميل النموذج — نعرض الصورة بدلًا منه.
        </div>
      )}

      {/* gesture hint */}
      {loaded && !interacted && (
        <div className={cx('pointer-events-none absolute inset-x-0 flex justify-center', compact ? 'bottom-2' : 'top-14')}>
          <span className="flex animate-fade-up items-center gap-1.5 rounded-full bg-ink/80 px-3 py-1.5 text-[11px] font-medium text-cream backdrop-blur">
            <Hand className="size-3.5" /> اسحب للتدوير • قرّب بإصبعين
          </span>
        </div>
      )}

      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm backdrop-blur">
        <Box className="size-3.5 text-brand" /> 3D
        <span className="font-medium text-muted">· {cfg.sizeLabel}</span>
      </div>

      {!compact && (
        <>
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <IconBtn label={expanded ? 'تصغير' : 'ملء الشاشة'} onClick={() => setExpanded((v) => !v)}>
              {expanded ? <Shrink className="size-4" /> : <Expand className="size-4" />}
            </IconBtn>
            <IconBtn label="تكبير" onClick={() => zoom(1)}>
              <Plus className="size-4" />
            </IconBtn>
            <IconBtn label="تصغير العرض" onClick={() => zoom(-1)}>
              <Minus className="size-4" />
            </IconBtn>
            <IconBtn label={rotating ? 'إيقاف الدوران' : 'تشغيل الدوران'} onClick={toggleRotate}>
              {rotating ? <Pause className="size-4" /> : <Play className="size-4" />}
            </IconBtn>
            <IconBtn label="إعادة الضبط" onClick={reset}>
              <RotateCcw className="size-4" />
            </IconBtn>
          </div>

          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2">
            <div className="flex gap-1 rounded-2xl bg-white/85 p-1 shadow-sm backdrop-blur">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goTo(p.id, p.orbit)}
                  className={cx(
                    'tap h-8 rounded-xl px-2.5 text-xs font-semibold transition-colors',
                    preset === p.id ? 'bg-ink text-cream' : 'text-ink-soft',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {canAR && (
              <button
                onClick={() => ref.current?.activateAR()}
                className="tap flex h-10 items-center gap-1.5 rounded-2xl bg-brand px-3 text-xs font-bold text-white shadow-float"
              >
                <ScanLine className="size-4" /> شاهده على طاولتك
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )

  // Fullscreen renders through a portal so no ancestor (sheet transforms, overflow) can clip it.
  // The GLB is cached by the browser, so the remount is near-instant.
  return expanded ? createPortal(viewer, document.body) : viewer
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className="tap grid size-9 place-items-center rounded-full bg-white/85 text-ink shadow-sm backdrop-blur"
    >
      {children}
    </button>
  )
}
