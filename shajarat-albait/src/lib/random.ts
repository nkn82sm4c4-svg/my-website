/** Small deterministic PRNG so a tree looks the same every time it is drawn */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 4-digit join code, e.g. 5821 (never starts with 0) */
export function joinCode(): string {
  return String(1000 + Math.floor(Math.random() * 9000))
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 2 ** 31)
}
