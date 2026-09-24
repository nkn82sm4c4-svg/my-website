/**
 * Optional model transport for hosts that don't serve `.glb` files.
 *
 * When the build sets `VITE_MODELS_AS_JSON=1`, each `models/<name>.glb` is
 * deployed as `models/<name>.glb.json` ({ "glb": "<base64>" }). This shim
 * intercepts the viewer's `.glb` requests, loads the JSON from the same
 * origin and returns the original binary, so the 3D viewer is unchanged.
 */
export function installJsonModelTransport() {
  const originalFetch = window.fetch.bind(window)
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (!/\.glb(\?|$)/.test(url)) return originalFetch(input, init)
    const res = await originalFetch(url.replace(/\.glb(\?|$)/, '.glb.json$1'))
    if (!res.ok) return res
    const { glb } = (await res.json()) as { glb: string }
    const bytes = Uint8Array.from(atob(glb), (c) => c.charCodeAt(0))
    return new Response(bytes, { status: 200, headers: { 'Content-Type': 'model/gltf-binary' } })
  }
}
