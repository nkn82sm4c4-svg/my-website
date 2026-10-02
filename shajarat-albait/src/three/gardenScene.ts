import * as THREE from 'three'
import type { TreeRecord } from '../types'
import { bake } from './bake'
import { easeOutBack, clamp01 } from './easing'
import { createFlowers, createIsland, Sparkles } from './nature'
import { Stage } from './stage'
import { mat, TreeModel } from './treeModel'

const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const SPACING = 1.15
const TREE_SCALE = 0.5
/** Draw at most this many trees; the stats still count all of them */
export const GARDEN_MAX_TREES = 150

/**
 * The family garden: every completed session is a tree on one island.
 * The island grows and gains flowers (10), a pond and bench (25), and a
 * fence with lanterns (50) as the family collects trees.
 */
export class GardenScene extends Stage {
  private world = new THREE.Group()
  private trees: { mesh: THREE.Mesh; t: number; delay: number }[] = []
  private sparkles = new Sparkles(60, 4, 4)
  private lanterns: THREE.Mesh[] = []
  private radius = 4

  constructor(container: HTMLElement, records: TreeRecord[]) {
    super(container)
    this.scene.add(this.world, this.sparkles.points)
    this.elevation = 0.52
    this.autoRotate = 0.05
    this.build(records)
    this.start()
  }

  private build(records: TreeRecord[]) {
    const list = records.slice(-GARDEN_MAX_TREES)
    const n = list.length
    const hasPond = n >= 25
    const R = Math.max(3.2, SPACING * Math.sqrt(n + (hasPond ? 8 : 0)) + 1.5)
    this.radius = R
    this.world.add(createIsland(R, 21, { rocks: 6 + Math.floor(R), tufts: Math.floor(R * 9) }))

    const pond = new THREE.Vector3(Math.cos(0.8) * R * 0.55, 0, Math.sin(0.8) * R * 0.55)
    const pondR = 1.15
    if (hasPond) this.addPond(pond, pondR)
    if (n >= 10) this.addPath(R)
    if (n >= 50) this.addFence(R)
    this.world.add(createFlowers(R, n >= 10 ? Math.floor(R * 14) : 10, 9, 0.15))

    // Trees on a sunflower spiral, skipping the pond area
    let k = 0
    list.forEach((rec, i) => {
      let p: THREE.Vector3
      do {
        const r = SPACING * Math.sqrt(k + 0.6)
        const a = k * GOLDEN
        p = new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)
        k++
      } while (hasPond && p.distanceTo(pond) < pondR + 0.75)
      const model = new TreeModel(rec.species, rec.seed, 'low')
      model.update(1, rec.perfect ? 1 : 0, 0, 0)
      const mesh = bake(model.root)
      mesh.position.copy(p)
      mesh.rotation.y = (rec.seed % 628) / 100
      mesh.scale.setScalar(0.0001)
      mesh.userData.size = TREE_SCALE * (rec.perfect ? 1.05 : 0.92)
      this.world.add(mesh)
      // Newest trees pop in last
      this.trees.push({ mesh, t: 0, delay: Math.min(1.6, i * 0.04) })
    })

    if (n === 0) {
      const sign = new THREE.Group()
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.8, 0.1), mat('#8b5e3c'))
      post.position.y = 0.4
      const board = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.45, 0.06), mat('#c49a6c'))
      board.position.y = 0.75
      sign.add(post, board)
      sign.traverse((o) => (o.castShadow = true))
      this.world.add(sign)
    }

    this.sparkles.setBounds(R * 0.8, 3)
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    this.fitDistance = (aspect: number) => Math.max(((R * 2 + 0.8) / 2 / (tanHalf * aspect)) * 0.95, ((R * 1.25) / tanHalf) * 0.82)
    this.distance = this.fitDistance(this.camera.aspect)
    this.target.set(0, 0.2, 0)
    const sc = this.sun.shadow.camera
    sc.left = sc.bottom = -R - 1
    sc.right = sc.top = R + 1
    sc.updateProjectionMatrix()
    this.sun.position.set(-R, R * 2, R * 1.2)
  }

  private fitDistance: (aspect: number) => number = () => 10

  protected onResize(w: number, h: number) {
    // Called once from the base constructor, before this class's fields exist
    if (this.fitDistance) this.distance = this.fitDistance(w / h)
  }

  private addPond(c: THREE.Vector3, r: number) {
    const water = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.95, 0.06, 32), new THREE.MeshStandardMaterial({ color: '#79c3d6', roughness: 0.15, metalness: 0.1, flatShading: true }))
    water.position.set(c.x, 0.0, c.z)
    water.receiveShadow = true
    water.userData.owned = true
    this.world.add(water)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.16, 0), mat(i % 2 ? '#d8cfbf' : '#c3b8a5', { rough: 1 }))
      s.position.set(c.x + Math.cos(a) * (r + 0.05), 0.04, c.z + Math.sin(a) * (r + 0.05))
      s.scale.y = 0.55
      s.castShadow = true
      s.userData.owned = true
      this.world.add(s)
    }
    // Wooden bench next to the pond
    const bench = new THREE.Group()
    const wood = mat('#a8774f')
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.3), wood)
    seat.position.y = 0.26
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.24, 0.05), wood)
    back.position.set(0, 0.42, -0.14)
    bench.add(seat, back)
    for (const x of [-0.38, 0.38]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.26, 0.26), mat('#6f4b31'))
      leg.position.set(x, 0.13, 0)
      bench.add(leg)
    }
    bench.traverse((o) => (o.castShadow = true))
    const dir = c.clone().normalize()
    bench.position.copy(c).addScaledVector(dir, r + 0.55)
    bench.lookAt(c.x, 0, c.z)
    this.world.add(bench)
  }

  private addPath(R: number) {
    const stone = new THREE.CylinderGeometry(0.2, 0.22, 0.05, 7)
    for (let i = 0; i < Math.floor(R * 1.6); i++) {
      const d = R - 0.4 - i * 0.5
      if (d < 0.6) break
      const a = -0.6 + Math.sin(i * 0.7) * 0.08
      const s = new THREE.Mesh(stone, mat('#e2d8c6', { rough: 1 }))
      s.position.set(Math.cos(a) * d, 0.0, Math.sin(a) * d)
      s.rotation.y = i
      s.receiveShadow = true
      this.world.add(s)
    }
  }

  private addFence(R: number) {
    const post = new THREE.BoxGeometry(0.08, 0.42, 0.08).translate(0, 0.21, 0)
    const count = Math.floor(R * 5)
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      if (Math.abs(a - (Math.PI * 2 - 0.6)) < 0.25) continue // gate for the path
      const p = new THREE.Mesh(post, mat('#b58a5e'))
      p.position.set(Math.cos(a) * (R - 0.15), 0, Math.sin(a) * (R - 0.15))
      p.castShadow = true
      this.world.add(p)
      if (i % 6 === 0) {
        const lamp = new THREE.Mesh(new THREE.IcosahedronGeometry(0.09, 1), new THREE.MeshStandardMaterial({ color: '#ffe7a3', emissive: '#ffcf6b', emissiveIntensity: 1.4 }))
        lamp.position.set(p.position.x, 0.5, p.position.z)
        lamp.userData.owned = true
        this.lanterns.push(lamp)
        this.world.add(lamp)
      }
    }
  }

  protected tick(dt: number) {
    for (const t of this.trees) {
      if (t.t >= 1) continue
      t.delay -= dt
      if (t.delay > 0) continue
      t.t = Math.min(1, t.t + dt / 0.7)
      t.mesh.scale.setScalar(Math.max(0.0001, easeOutBack(clamp01(t.t)) * (t.mesh.userData.size as number)))
    }
    this.lanterns.forEach((l, i) => {
      ;(l.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.1 + Math.sin(this.time * 2 + i) * 0.35
    })
    this.sparkles.update(dt, this.time, 0.35)
  }

  get islandRadius() {
    return this.radius
  }
}
