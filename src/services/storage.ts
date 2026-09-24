/**
 * Tiny, crash-safe wrapper around localStorage (private mode / blocked storage
 * simply falls back to in-memory values). All keys are namespaced + versioned.
 */
const PREFIX = 'sinmar.demo.v1.'
const memory = new Map<string, string>()

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key) ?? memory.get(key)
      return raw ? (JSON.parse(raw) as T) : fallback
    } catch {
      return fallback
    }
  },
  set<T>(key: string, value: T) {
    const raw = JSON.stringify(value)
    memory.set(key, raw)
    try {
      localStorage.setItem(PREFIX + key, raw)
    } catch {
      /* storage unavailable — memory copy is enough for the demo */
    }
  },
  clearAll() {
    memory.clear()
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k))
    } catch {
      /* ignore */
    }
  },
}
