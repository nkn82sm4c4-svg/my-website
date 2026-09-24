import type { DetailedHTMLProps, HTMLAttributes } from 'react'

/** JSX typing for the <model-viewer> web component (loaded lazily). */
type ModelViewerAttributes = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & {
  src?: string
  poster?: string
  alt?: string
  ar?: boolean | string
  'ar-modes'?: string
  'ar-scale'?: string
  'camera-controls'?: boolean | string
  'auto-rotate'?: boolean | string
  'auto-rotate-delay'?: string | number
  'rotation-per-second'?: string
  'camera-orbit'?: string
  'min-camera-orbit'?: string
  'max-camera-orbit'?: string
  'min-field-of-view'?: string
  'max-field-of-view'?: string
  'field-of-view'?: string
  'interaction-prompt'?: string
  'shadow-intensity'?: string | number
  'shadow-softness'?: string | number
  exposure?: string | number
  'environment-image'?: string
  'tone-mapping'?: string
  loading?: 'auto' | 'lazy' | 'eager'
  reveal?: 'auto' | 'manual'
  'touch-action'?: string
  'interpolation-decay'?: string | number
  'disable-tap'?: boolean | string
}

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerAttributes
    }
  }
}
