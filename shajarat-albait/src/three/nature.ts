import * as THREE from 'three'
import { mulberry32 } from '../lib/random'
import { leafGeometry, mat } from './treeModel'

/** Floating island of grass and soil that every tree stands on */
export function createIsland(radius: number, seed = 7, opts: { rocks?: number; tufts?: number } = {}): THREE.Group {
  const r = mulberry32(seed)
  const g = new THREE.Group()

  const soilGeo = new THREE.CylinderGeometry(radius * 0.97, radius * 0.72, radius * 0.32, 40, 2)
  jitter(soilGeo, radius * 0.035, r)
  const soil = new THREE.Mesh(soilGeo, mat('#a07a55', { rough: 1 }))
  soil.position.y = -radius * 0.16 - 0.06
  soil.receiveShadow = true
  soil.userData.owned = true
  g.add(soil)

  const under = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.72, radius * 0.55, 24, 1), mat('#7f5d40', { rough: 1 }))
  under.rotation.x = Math.PI
  under.position.y = -radius * 0.32 - radius * 0.275 - 0.06
  under.userData.owned = true
  g.add(under)

  const grassGeo = new THREE.CylinderGeometry(radius, radius * 0.98, 0.14, 48, 1)
  jitter(grassGeo, 0.025, r, true)
  const grass = new THREE.Mesh(grassGeo, mat('#7fb36a', { rough: 0.95 }))
  grass.position.y = -0.07
  grass.receiveShadow = true
  grass.userData.owned = true
  g.add(grass)

  const rockCount = opts.rocks ?? 5
  for (let i = 0; i < rockCount; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12 + r() * 0.16, 0), mat(['#cfc5b4', '#b9ae9b', '#ddd3c2'][i % 3], { rough: 1 }))
    const a = r() * Math.PI * 2
    const d = radius * (0.55 + r() * 0.38)
    rock.position.set(Math.cos(a) * d, 0.02, Math.sin(a) * d)
    rock.rotation.set(r() * 3, r() * 3, r() * 3)
    rock.scale.y = 0.6
    rock.castShadow = true
    rock.userData.owned = true
    g.add(rock)
  }

  const tuftCount = opts.tufts ?? 26
  const tuftGeo = new THREE.ConeGeometry(0.035, 0.22, 4)
  tuftGeo.translate(0, 0.11, 0)
  const tufts = new THREE.InstancedMesh(tuftGeo, mat('#5f9a52', { rough: 0.9 }), tuftCount * 3)
  const m = new THREE.Matrix4()
  let k = 0
  for (let i = 0; i < tuftCount; i++) {
    const a = r() * Math.PI * 2
    const d = radius * (0.25 + r() * 0.7)
    for (let j = 0; j < 3; j++) {
      const q = new THREE.Quaternion().setFromEuler(new THREE.Euler((r() - 0.5) * 0.7, r() * 3, (r() - 0.5) * 0.7))
      m.compose(new THREE.Vector3(Math.cos(a) * d + (r() - 0.5) * 0.08, 0, Math.sin(a) * d + (r() - 0.5) * 0.08), q, new THREE.Vector3(1, 0.7 + r() * 0.8, 1))
      tufts.setMatrixAt(k++, m)
    }
  }
  tufts.userData.owned = true
  g.add(tufts)
  return g
}

/** Small flowers scattered on the grass */
export function createFlowers(radius: number, count: number, seed = 3, inner = 0.3): THREE.Group {
  const r = mulberry32(seed)
  const g = new THREE.Group()
  const colors = ['#f6d36b', '#f4a7b9', '#ffffff', '#c9a7f0', '#f59b7a']
  const head = new THREE.IcosahedronGeometry(0.07, 0)
  const stem = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 4).translate(0, 0.08, 0)
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2
    const d = radius * (inner + r() * (0.92 - inner))
    const f = new THREE.Group()
    const s = new THREE.Mesh(stem, mat('#4f8a45'))
    const h = new THREE.Mesh(head, mat(colors[i % colors.length], { rough: 0.6 }))
    h.position.y = 0.17
    h.castShadow = true
    f.add(s, h)
    f.position.set(Math.cos(a) * d, 0, Math.sin(a) * d)
    f.userData.phase = r() * 6
    g.add(f)
  }
  return g
}

function jitter(geo: THREE.BufferGeometry, amount: number, r: () => number, topOnly = false) {
  const pos = geo.attributes.position as THREE.BufferAttribute
  const seen = new Map<string, number>()
  for (let i = 0; i < pos.count; i++) {
    const key = `${Math.round(pos.getX(i) * 1000)},${Math.round(pos.getY(i) * 1000)},${Math.round(pos.getZ(i) * 1000)}`
    let d = seen.get(key)
    if (d === undefined) {
      d = (r() - 0.5) * 2 * amount
      seen.set(key, d)
    }
    if (topOnly) {
      if (pos.getY(i) > 0) pos.setY(i, pos.getY(i) + d)
    } else {
      pos.setX(i, pos.getX(i) * (1 + d))
      pos.setZ(i, pos.getZ(i) * (1 + d))
    }
  }
  geo.computeVertexNormals()
}

function glowTexture(): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const ctx = c.getContext('2d')!
  const grd = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.35, 'rgba(255,244,200,0.55)')
  grd.addColorStop(1, 'rgba(255,240,200,0)')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, 64, 64)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}
let GLOW: THREE.Texture | null = null
const glow = () => (GLOW ??= glowTexture())

/** Soft fireflies rising around the tree; `intensity` spikes on milestones */
export class Sparkles {
  readonly points: THREE.Points
  private speeds: Float32Array
  intensity = 0.35

  private count: number
  private radius: number
  private height: number

  constructor(count: number, radius: number, height: number) {
    this.count = count
    this.radius = radius
    this.height = height
    const pos = new Float32Array(count * 3)
    this.speeds = new Float32Array(count)
    for (let i = 0; i < count; i++) this.reset(pos, i, true)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const m = new THREE.PointsMaterial({ size: 0.16, map: glow(), color: '#ffe9a8', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 })
    this.points = new THREE.Points(geo, m)
    this.points.userData.owned = true
  }

  private reset(pos: Float32Array, i: number, initial: boolean) {
    const a = Math.random() * Math.PI * 2
    const d = Math.random() * this.radius
    pos[i * 3] = Math.cos(a) * d
    pos[i * 3 + 1] = initial ? Math.random() * this.height : 0.1
    pos[i * 3 + 2] = Math.sin(a) * d
    this.speeds[i] = 0.15 + Math.random() * 0.35
  }

  setBounds(radius: number, height: number) {
    this.radius = radius
    this.height = height
  }

  update(dt: number, time: number, target: number) {
    this.intensity += (target - this.intensity) * Math.min(1, dt * 1.5)
    const attr = this.points.geometry.attributes.position as THREE.BufferAttribute
    const pos = attr.array as Float32Array
    for (let i = 0; i < this.count; i++) {
      pos[i * 3 + 1] += this.speeds[i] * dt * (0.6 + this.intensity)
      pos[i * 3] += Math.sin(time * 1.3 + i) * dt * 0.08
      if (pos[i * 3 + 1] > this.height) this.reset(pos, i, false)
    }
    attr.needsUpdate = true
    const m = this.points.material as THREE.PointsMaterial
    m.opacity = 0.25 + this.intensity * 0.75
    m.size = 0.12 + this.intensity * 0.12
  }
}

interface Falling {
  mesh: THREE.Mesh
  vy: number
  phase: number
  life: number
  landed: boolean
}

/** Leaves that detach and drift down to the ground (someone left the session) */
export class FallingLeaves {
  readonly group = new THREE.Group()
  private items: Falling[] = []
  private geo = leafGeometry()

  drop(from: THREE.Vector3, color = '#c9a24a') {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.7, side: THREE.DoubleSide, transparent: true, flatShading: true })
    const mesh = new THREE.Mesh(this.geo, m)
    mesh.scale.setScalar(1.6)
    mesh.position.copy(from)
    mesh.castShadow = true
    this.group.add(mesh)
    this.items.push({ mesh, vy: 0, phase: Math.random() * 6, life: 0, landed: false })
  }

  update(dt: number) {
    this.items = this.items.filter((it) => {
      it.life += dt
      const m = it.mesh
      if (!it.landed) {
        it.vy = Math.min(0.75, it.vy + dt * 0.9)
        m.position.y -= it.vy * dt
        m.position.x += Math.sin(it.life * 2.4 + it.phase) * dt * 0.55
        m.position.z += Math.cos(it.life * 1.9 + it.phase) * dt * 0.3
        m.rotation.set(Math.sin(it.life * 3) * 0.9, it.life * 1.5, Math.cos(it.life * 2.2) * 0.8)
        if (m.position.y <= 0.03) {
          it.landed = true
          it.life = 0
          m.position.y = 0.03
          m.rotation.set(-Math.PI / 2, it.phase, 0)
        }
        return true
      }
      const mt = m.material as THREE.MeshStandardMaterial
      if (it.life > 5) mt.opacity = Math.max(0, 1 - (it.life - 5) / 2)
      if (it.life > 7) {
        this.group.remove(m)
        mt.dispose()
        return false
      }
      return true
    })
  }
}

/** Expanding ring of light on the ground — milestone feedback */
export class Pulses {
  readonly group = new THREE.Group()
  private rings: { mesh: THREE.Mesh; t: number; max: number }[] = []
  private geo = new THREE.RingGeometry(0.85, 1, 64).rotateX(-Math.PI / 2)

  emit(max = 3, color = '#fff2b8') {
    const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(this.geo, m)
    mesh.position.y = 0.04
    this.group.add(mesh)
    this.rings.push({ mesh, t: 0, max })
  }

  update(dt: number) {
    this.rings = this.rings.filter((r) => {
      r.t += dt / 1.6
      r.mesh.scale.setScalar(0.3 + r.t * r.max)
      const mt = r.mesh.material as THREE.MeshBasicMaterial
      mt.opacity = 0.8 * (1 - r.t)
      if (r.t >= 1) {
        this.group.remove(r.mesh)
        mt.dispose()
        return false
      }
      return true
    })
  }
}

/** Celebration burst of golden particles */
export class Burst {
  readonly points: THREE.Points
  private vel: Float32Array
  private t = 1
  private count = 160

  constructor() {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.count * 3), 3))
    const colors = new Float32Array(this.count * 3)
    const palette = ['#ffe08a', '#ffffff', '#9be3a4', '#f7c9d6'].map((c) => new THREE.Color(c))
    for (let i = 0; i < this.count; i++) palette[i % 4].toArray(colors, i * 3)
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.vel = new Float32Array(this.count * 3)
    const m = new THREE.PointsMaterial({ size: 0.22, map: glow(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 })
    this.points = new THREE.Points(geo, m)
    this.points.userData.owned = true
    this.points.frustumCulled = false
  }

  fire(center: THREE.Vector3) {
    const pos = this.points.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < this.count; i++) {
      pos[i * 3] = center.x
      pos[i * 3 + 1] = center.y
      pos[i * 3 + 2] = center.z
      const a = Math.random() * Math.PI * 2
      const up = Math.random() * 2 - 0.3
      const sp = 1.6 + Math.random() * 2.6
      this.vel[i * 3] = Math.cos(a) * sp
      this.vel[i * 3 + 1] = up * sp * 0.8 + 1.2
      this.vel[i * 3 + 2] = Math.sin(a) * sp
    }
    this.t = 0
  }

  update(dt: number) {
    if (this.t >= 1) return
    this.t = Math.min(1, this.t + dt / 2.6)
    const attr = this.points.geometry.attributes.position as THREE.BufferAttribute
    const pos = attr.array as Float32Array
    for (let i = 0; i < this.count; i++) {
      this.vel[i * 3 + 1] -= 2.2 * dt
      pos[i * 3] += this.vel[i * 3] * dt
      pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt
      pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt
    }
    attr.needsUpdate = true
    ;(this.points.material as THREE.PointsMaterial).opacity = 1 - this.t
  }
}
