export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)
export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3
export function easeOutBack(t: number) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  const c1 = 1.5
  const c3 = c1 + 1
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2
}
export function smoothstep(a: number, b: number, x: number) {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
