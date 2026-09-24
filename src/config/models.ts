import type { ModelKey } from '../types'

/**
 * 3D model registry.
 *
 * ➜ To add / replace a model: export a .glb from Blender into `public/models/`
 *   and register it here (see `blender/README.md`).
 *
 * `poster` is shown instantly while the GLB streams in (and as fallback).
 * `orbit` is the default camera angle: "<azimuth> <elevation> <distance>".
 */
export interface ModelConfig {
  src: string
  poster: string
  label: string
  orbit?: string
  /** Approximate real-world size, shown in the viewer and used for AR. */
  sizeLabel: string
}

const base = import.meta.env.BASE_URL

export const MODELS: Record<ModelKey, ModelConfig> = {
  burger: { src: `${base}models/burger.glb`, poster: `${base}images/products/burger.webp`, label: 'برجر', sizeLabel: '≈ 12 سم' },
  'double-burger': {
    src: `${base}models/double-burger.glb`,
    poster: `${base}images/products/double-burger.webp`,
    label: 'دبل برجر',
    sizeLabel: '≈ 13 سم',
  },
  fries: { src: `${base}models/fries.glb`, poster: `${base}images/products/fries.webp`, label: 'بطاطس', sizeLabel: '≈ 15 سم' },
  drink: { src: `${base}models/drink.glb`, poster: `${base}images/products/drink.webp`, label: 'مشروب', sizeLabel: '≈ 18 سم' },
  sauce: { src: `${base}models/sauce.glb`, poster: `${base}images/products/sauce.webp`, label: 'صوص', sizeLabel: '≈ 5 سم' },
  wrap: { src: `${base}models/wrap.glb`, poster: `${base}images/products/wrap.webp`, label: 'شاورما', sizeLabel: '≈ 18 سم' },
  sub: { src: `${base}models/sub.glb`, poster: `${base}images/products/sub.webp`, label: 'صاروخ', sizeLabel: '≈ 26 سم' },
  pizza: {
    src: `${base}models/pizza.glb`,
    poster: `${base}images/products/pizza.webp`,
    label: 'بيتزا',
    orbit: '0deg 55deg auto',
    sizeLabel: '≈ 30 سم',
  },
  fatayer: { src: `${base}models/fatayer.glb`, poster: `${base}images/products/fatayer.webp`, label: 'فطيرة', sizeLabel: '≈ 14 سم' },
  'pie-boat': {
    src: `${base}models/pie-boat.glb`,
    poster: `${base}images/products/pie-boat.webp`,
    label: 'سنمارية',
    sizeLabel: '≈ 24 سم',
  },
}

export const img = (name: string) => `${base}images/products/${name}.webp`
