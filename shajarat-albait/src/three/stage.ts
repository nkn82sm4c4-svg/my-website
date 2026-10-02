import * as THREE from 'three'
import { prefersReducedMotion } from './webgl'

/**
 * Shared renderer/camera/lights/loop for every 3D view. Handles resize,
 * pausing when off-screen, horizontal drag-to-rotate (vertical swipes still
 * scroll the page on phones) and full disposal.
 */
export abstract class Stage {
  readonly renderer: THREE.WebGLRenderer
  readonly scene = new THREE.Scene()
  readonly camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200)
  protected readonly sun: THREE.DirectionalLight
  protected readonly reduced = prefersReducedMotion()
  protected time = 0
  /** Orbit around the target */
  protected azimuth = 0.6
  protected elevation = 0.32
  protected distance = 8
  protected target = new THREE.Vector3(0, 1.5, 0)
  protected autoRotate = 0.06
  private raf = 0
  private last = 0
  private visible = true
  private dragging = false
  private dragX = 0
  private idleSince = 0
  private ro: ResizeObserver
  private io: IntersectionObserver
  private disposed = false

  protected readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.05
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    const canvas = this.renderer.domElement
    canvas.style.cssText = 'width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab;outline:none'
    canvas.setAttribute('aria-hidden', 'true')
    container.appendChild(canvas)

    this.scene.add(new THREE.HemisphereLight('#fff7e6', '#5d7f4e', 1.25))
    this.sun = new THREE.DirectionalLight('#fff0d4', 2.4)
    this.sun.position.set(-5, 9, 6)
    this.sun.castShadow = true
    this.sun.shadow.mapSize.set(1024, 1024)
    this.sun.shadow.bias = -0.0008
    this.sun.shadow.normalBias = 0.02
    const sc = this.sun.shadow.camera
    sc.left = -7
    sc.right = 7
    sc.top = 9
    sc.bottom = -4
    sc.near = 1
    sc.far = 30
    this.scene.add(this.sun)
    const fill = new THREE.DirectionalLight('#d6ecff', 0.55)
    fill.position.set(6, 3, -4)
    this.scene.add(fill)

    canvas.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerup', this.onUp)
    window.addEventListener('pointercancel', this.onUp)
    document.addEventListener('visibilitychange', this.onVisibility)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(container)
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting
      if (this.visible) this.start()
    })
    this.io.observe(container)
    this.resize()
  }

  protected abstract tick(dt: number): void

  private resize() {
    const w = Math.max(1, this.container.clientWidth)
    const h = Math.max(1, this.container.clientHeight)
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.onResize(w, h)
    this.render()
  }

  protected onResize(_w: number, _h: number) {}

  private onDown = (e: PointerEvent) => {
    this.dragging = true
    this.dragX = e.clientX
    this.renderer.domElement.style.cursor = 'grabbing'
  }
  private onMove = (e: PointerEvent) => {
    if (!this.dragging) return
    const dx = e.clientX - this.dragX
    this.dragX = e.clientX
    this.azimuth -= dx * 0.008
    this.idleSince = this.time
  }
  private onUp = () => {
    this.dragging = false
    this.renderer.domElement.style.cursor = 'grab'
  }
  private onVisibility = () => {
    if (!document.hidden) this.start()
  }

  start() {
    if (this.raf || this.disposed) return
    this.last = performance.now()
    const loop = (now: number) => {
      this.raf = 0
      if (this.disposed || !this.visible || document.hidden) return
      const dt = Math.max(0, Math.min(0.1, (now - this.last) / 1000))
      this.last = now
      this.time += dt
      if (!this.dragging && !this.reduced && this.time - this.idleSince > 2.5) this.azimuth += this.autoRotate * dt
      this.tick(dt)
      this.render()
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
  }

  protected render() {
    const d = this.distance
    this.camera.position.set(
      this.target.x + Math.sin(this.azimuth) * Math.cos(this.elevation) * d,
      this.target.y + Math.sin(this.elevation) * d,
      this.target.z + Math.cos(this.azimuth) * Math.cos(this.elevation) * d,
    )
    this.camera.lookAt(this.target)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.ro.disconnect()
    this.io.disconnect()
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerup', this.onUp)
    window.removeEventListener('pointercancel', this.onUp)
    document.removeEventListener('visibilitychange', this.onVisibility)
    // Shared geometries/materials are module-level caches; only free per-scene ones
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.geometry && m.userData.owned) m.geometry.dispose()
    })
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    canvas.remove()
  }
}
