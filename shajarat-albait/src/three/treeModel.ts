import * as THREE from 'three'
import { mulberry32 } from '../lib/random'
import type { TreeSpecies } from '../types'
import { clamp01, easeInOut, easeOutBack, smoothstep } from './easing'

/**
 * Procedural low-poly tree whose shape is driven by one number: growth (0 → 1).
 *
 *   0.00  sprout: a tiny stem with two leaves 🌱
 *   0.25  main branches appear
 *   0.50  foliage clusters and many leaves
 *   0.75  the canopy is big and full
 *   1.00  complete — fruits / blossoms appear
 *
 * The same seed + species always produce the same tree, so the garden can
 * redraw every tree a family has grown.
 */

interface SpeciesStyle {
  trunkLen: number
  trunkR: number
  branches: number
  subBranches: number
  tilt: [number, number]
  cluster: number
  foliage: string[]
  wood: string
  fruit: string
  leaf: string
}

export const SPECIES_STYLE: Record<TreeSpecies, SpeciesStyle> = {
  oak: { trunkLen: 1.35, trunkR: 0.2, branches: 4, subBranches: 2, tilt: [0.55, 0.95], cluster: 0.62, foliage: ['#4f9a5a', '#5fae6e', '#3f8a4f', '#78c285'], wood: '#7d5136', fruit: '#d9493b', leaf: '#5fae6e' },
  blossom: { trunkLen: 1.25, trunkR: 0.17, branches: 4, subBranches: 2, tilt: [0.6, 1.0], cluster: 0.56, foliage: ['#f2b3c6', '#f7c9d6', '#e99ab2', '#fde3ea'], wood: '#5f3d2c', fruit: '#c2273b', leaf: '#f2b3c6' },
  olive: { trunkLen: 1.05, trunkR: 0.22, branches: 5, subBranches: 1, tilt: [0.7, 1.1], cluster: 0.5, foliage: ['#8fa97a', '#a3b98e', '#7d9a6b', '#b5c7a1'], wood: '#8a7360', fruit: '#4b4566', leaf: '#9db487' },
  citrus: { trunkLen: 1.1, trunkR: 0.16, branches: 4, subBranches: 2, tilt: [0.45, 0.8], cluster: 0.6, foliage: ['#2f7d46', '#3c8f52', '#4a9d5c', '#2a6e3e'], wood: '#6b4a33', fruit: '#f29b28', leaf: '#3c8f52' },
  pine: { trunkLen: 2.7, trunkR: 0.17, branches: 0, subBranches: 0, tilt: [0, 0], cluster: 1, foliage: ['#2e6b4a', '#367a54', '#25603f', '#3f8660'], wood: '#6b4630', fruit: '#8a5a33', leaf: '#367a54' },
}

interface Branch {
  group: THREE.Group
  mesh: THREE.Mesh
  len: number
  radius: number
  t0: number
  t1: number
  /** Fraction along the parent where this branch starts */
  attach: number
  parent: Branch | null
  /** Size at growth 0 (only the trunk is visible from the start) */
  minScale: number
  g: number
}

interface Cluster {
  group: THREE.Group
  branch: Branch
  t0: number
  size: number
  fruits: THREE.Mesh[]
}

interface LeafInstance {
  cluster: Cluster
  local: THREE.Matrix4
  t0: number
}

const BRANCH_GEO = new THREE.CylinderGeometry(0.62, 1, 1, 7, 1).translate(0, 0.5, 0)
const BLOB_GEO = new THREE.IcosahedronGeometry(1, 1)
const FRUIT_GEO = new THREE.IcosahedronGeometry(1, 2)

export function leafGeometry(): THREE.BufferGeometry {
  const s = new THREE.Shape()
  s.moveTo(0, 0)
  s.quadraticCurveTo(0.55, 0.42, 0, 1)
  s.quadraticCurveTo(-0.55, 0.42, 0, 0)
  return new THREE.ShapeGeometry(s, 6).scale(0.2, 0.2, 0.2)
}
const LEAF_GEO = leafGeometry()

const matCache = new Map<string, THREE.MeshStandardMaterial>()
export function mat(color: string, opts: { rough?: number; side?: THREE.Side; emissive?: string } = {}) {
  const key = `${color}|${opts.rough ?? 0.85}|${opts.side ?? 0}|${opts.emissive ?? ''}`
  let m = matCache.get(key)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: opts.rough ?? 0.85, metalness: 0, flatShading: true, side: opts.side ?? THREE.FrontSide })
    if (opts.emissive) {
      m.emissive = new THREE.Color(opts.emissive)
      m.emissiveIntensity = 0.25
    }
    matCache.set(key, m)
  }
  return m
}

const tmpM = new THREE.Matrix4()
const tmpM2 = new THREE.Matrix4()
const tmpV = new THREE.Vector3()
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0)

export class TreeModel {
  readonly root = new THREE.Group()
  readonly style: SpeciesStyle
  private branches: Branch[] = []
  private clusters: Cluster[] = []
  private leaves: LeafInstance[] = []
  private leafMesh: THREE.InstancedMesh | null = null
  private removed = new Set<number>()
  private sprout = new THREE.Group()
  private trunk!: Branch
  private rand: () => number
  /** Height / canopy width at full growth, for camera framing */
  readonly fullHeight: number
  readonly fullWidth: number

  readonly species: TreeSpecies

  constructor(species: TreeSpecies, seed: number, detail: 'high' | 'low' = 'high') {
    this.species = species
    this.style = SPECIES_STYLE[species]
    this.rand = mulberry32(seed)
    const r = this.rand
    const st = this.style

    // Trunk + a "leader" that continues upward give a natural silhouette
    this.trunk = this.addBranch(null, { len: st.trunkLen * (0.9 + r() * 0.2), radius: st.trunkR, t0: 0, t1: 1, attach: 0, tilt: (r() - 0.5) * 0.12, az: 0, minScale: 0.14 })

    if (species === 'pine') {
      this.buildPine(detail)
    } else {
      const leader = this.addBranch(this.trunk, { len: st.trunkLen * 0.55, radius: st.trunkR * 0.7, t0: 0.12, t1: 0.85, attach: 1, tilt: (r() - 0.5) * 0.3, az: r() * Math.PI * 2, minScale: 0 })
      const tips: Branch[] = [leader]
      const n = detail === 'low' ? Math.min(3, st.branches) : st.branches
      for (let i = 0; i < n; i++) {
        const onLeader = i % 2 === 1
        const parent = onLeader ? leader : this.trunk
        const t0 = 0.2 + (i / n) * 0.22 + r() * 0.04
        const b = this.addBranch(parent, {
          len: st.trunkLen * (0.55 + r() * 0.25),
          radius: st.trunkR * 0.55,
          t0,
          t1: Math.min(0.9, t0 + 0.4),
          attach: onLeader ? 0.35 + r() * 0.4 : 0.62 + r() * 0.3,
          tilt: st.tilt[0] + r() * (st.tilt[1] - st.tilt[0]),
          az: (i / n) * Math.PI * 2 + r() * 0.8,
          minScale: 0,
        })
        const subs = detail === 'low' ? 0 : st.subBranches
        if (subs === 0) tips.push(b)
        for (let k = 0; k < subs; k++) {
          const s0 = t0 + 0.12 + r() * 0.08
          tips.push(this.addBranch(b, { len: b.len * (0.5 + r() * 0.2), radius: b.radius * 0.6, t0: s0, t1: Math.min(0.95, s0 + 0.35), attach: 0.55 + r() * 0.4, tilt: 0.35 + r() * 0.45, az: r() * Math.PI * 2, minScale: 0 }))
        }
      }
      // Foliage clusters on every branch tip; the leader's appears first
      tips.forEach((b, i) => {
        const t0 = i === 0 ? 0.3 : 0.4 + (i / tips.length) * 0.42 + r() * 0.05
        this.addCluster(b, Math.min(0.9, t0), st.cluster * (i === 0 ? 1.15 : 0.85 + r() * 0.3), detail)
      })
    }

    this.buildSprout()
    // Pines keep their needles in the cones; loose leaves would float around them
    if (detail === 'high' && species !== 'pine') this.buildLeaves(56)
    // Measure the grown tree once so cameras can frame it exactly
    this.update(1, 0, 0, 0)
    const box = new THREE.Box3().setFromObject(this.root)
    this.fullHeight = box.max.y
    this.fullWidth = Math.max(box.max.x - box.min.x, box.max.z - box.min.z)
    this.update(0, 0, 0, 0)
  }

  private addBranch(parent: Branch | null, o: { len: number; radius: number; t0: number; t1: number; attach: number; tilt: number; az: number; minScale: number }): Branch {
    const group = new THREE.Group()
    group.quaternion.setFromEuler(new THREE.Euler(0, o.az, o.tilt, 'YXZ'))
    const mesh = new THREE.Mesh(BRANCH_GEO, mat(this.style.wood, { rough: 0.95 }))
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
    ;(parent ? parent.group : this.root).add(group)
    const b: Branch = { group, mesh, len: o.len, radius: o.radius, t0: o.t0, t1: o.t1, attach: o.attach, parent, minScale: o.minScale, g: 0 }
    this.branches.push(b)
    return b
  }

  private addCluster(branch: Branch, t0: number, size: number, detail: 'high' | 'low') {
    const r = this.rand
    const group = new THREE.Group()
    const blobs = detail === 'low' ? 3 : 4 + Math.floor(r() * 2)
    for (let i = 0; i < blobs; i++) {
      const m = new THREE.Mesh(BLOB_GEO, mat(this.style.foliage[i % this.style.foliage.length], { rough: 0.8 }))
      const s = 0.55 + r() * 0.45
      m.scale.setScalar(s)
      m.position.set((r() - 0.5) * 1.1, (r() - 0.3) * 0.7, (r() - 0.5) * 1.1)
      m.rotation.set(r() * 3, r() * 3, r() * 3)
      m.castShadow = true
      group.add(m)
    }
    const fruits: THREE.Mesh[] = []
    const fruitCount = detail === 'low' ? 2 : 3
    for (let i = 0; i < fruitCount; i++) {
      const f = new THREE.Mesh(FRUIT_GEO, mat(this.style.fruit, { rough: 0.45, emissive: this.style.fruit }))
      const dir = new THREE.Vector3(r() - 0.5, r() * 0.6 - 0.5, r() - 0.5).normalize()
      f.position.copy(dir.multiplyScalar(1.02))
      f.scale.setScalar(0)
      f.castShadow = true
      group.add(f)
      fruits.push(f)
    }
    group.scale.setScalar(0)
    branch.group.add(group)
    this.clusters.push({ group, branch, t0, size, fruits })
  }

  private buildPine(detail: 'high' | 'low') {
    const r = this.rand
    const tiers = detail === 'low' ? 4 : 5
    for (let i = 0; i < tiers; i++) {
      const group = new THREE.Group()
      const radius = 1.05 - i * 0.17
      const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, 0.95, 8, 1), mat(this.style.foliage[i % 4], { rough: 0.8 }))
      cone.position.y = 0.3
      cone.rotation.y = r() * Math.PI
      cone.castShadow = true
      group.add(cone)
      const fruits: THREE.Mesh[] = []
      for (let k = 0; k < 2; k++) {
        const f = new THREE.Mesh(FRUIT_GEO, mat(this.style.fruit, { rough: 0.7 }))
        const a = r() * Math.PI * 2
        f.position.set(Math.cos(a) * radius * 0.8, -0.05, Math.sin(a) * radius * 0.8)
        f.scale.setScalar(0)
        group.add(f)
        fruits.push(f)
      }
      // Anchor tiers along the trunk; `attach` is reused as the height fraction
      group.userData.attach = 0.28 + (i / (tiers - 1)) * 0.7
      group.scale.setScalar(0)
      this.trunk.group.add(group)
      // The top tier sprouts first so the bare trunk tip never shows
      const t0 = i === tiers - 1 ? 0.1 : 0.25 + i * 0.12
      this.clusters.push({ group, branch: this.trunk, t0, size: 1, fruits })
    }
  }

  private buildSprout() {
    const leafMat = mat('#6dbb6f', { side: THREE.DoubleSide, rough: 0.7 })
    for (const side of [-1, 1]) {
      const leaf = new THREE.Mesh(LEAF_GEO, leafMat)
      leaf.scale.setScalar(1.6)
      leaf.rotation.set(0, side > 0 ? 0 : Math.PI, side * -0.9)
      leaf.castShadow = true
      this.sprout.add(leaf)
    }
    this.trunk.group.add(this.sprout)
  }

  private buildLeaves(count: number) {
    if (!this.clusters.length) return
    const r = this.rand
    const mesh = new THREE.InstancedMesh(LEAF_GEO, mat(this.style.leaf, { side: THREE.DoubleSide, rough: 0.7 }), count)
    mesh.castShadow = true
    mesh.frustumCulled = false
    for (let i = 0; i < count; i++) {
      const cluster = this.clusters[i % this.clusters.length]
      const dir = new THREE.Vector3(r() - 0.5, r() - 0.35, r() - 0.5).normalize()
      const local = new THREE.Matrix4().compose(
        dir.multiplyScalar(0.95 + r() * 0.25),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)),
        new THREE.Vector3(1, 1, 1).multiplyScalar(0.9 + r() * 0.5),
      )
      this.leaves.push({ cluster, local, t0: Math.min(0.97, Math.max(0.45, cluster.t0 + 0.04 + r() * 0.35)) })
      mesh.setMatrixAt(i, ZERO)
    }
    this.leafMesh = mesh
    this.root.add(mesh)
  }

  /** Applies growth (0..1) and fruit (0..1) to every part of the tree */
  update(growth: number, fruit = 0, time = 0, wind = 1) {
    const g = clamp01(growth)

    for (const b of this.branches) {
      const local = clamp01((g - b.t0) / (b.t1 - b.t0))
      b.g = b.minScale + (1 - b.minScale) * easeInOut(local)
      const thick = b.parent ? b.g : 0.3 + 0.7 * easeInOut(g)
      const visible = b.g > 0.001
      b.mesh.visible = visible
      b.mesh.scale.set(b.radius * Math.max(0.05, thick), b.len * Math.max(0.001, b.g), b.radius * Math.max(0.05, thick))
      if (b.parent) b.group.position.set(0, b.parent.len * b.parent.g * b.attach, 0)
    }

    for (const c of this.clusters) {
      const appear = easeOutBack(clamp01((g - c.t0) / 0.14))
      // Canopy keeps filling out until the end (75 % → "the tree becomes big")
      const fill = 0.55 + 0.45 * smoothstep(c.t0, 1, g)
      c.group.scale.setScalar(Math.max(0.0001, appear * fill * c.size))
      c.group.visible = appear > 0.001
      const attach = (c.group.userData.attach as number | undefined) ?? 1
      c.group.position.set(0, c.branch.len * c.branch.g * attach, 0)
      c.group.rotation.y = Math.sin(time * 0.6 + c.t0 * 10) * 0.04 * wind
      c.fruits.forEach((f, i) => f.scale.setScalar(0.13 * easeOutBack(clamp01(fruit * 2.2 - i * 0.35))))
    }

    // Sprout leaves sit on the stem tip and fade out once branches take over
    this.sprout.position.set(0, this.trunk.len * this.trunk.g, 0)
    const sproutScale = 1 - smoothstep(0.18, 0.42, g)
    this.sprout.scale.setScalar(Math.max(0.0001, sproutScale))
    this.sprout.visible = sproutScale > 0.01
    this.sprout.rotation.y = Math.sin(time * 0.9) * 0.15 * wind

    // Gentle wind sway of the whole tree
    this.root.rotation.z = Math.sin(time * 0.7) * 0.018 * wind * (0.4 + g)
    this.root.rotation.x = Math.cos(time * 0.53) * 0.012 * wind * (0.4 + g)

    if (this.leafMesh) {
      this.root.updateMatrixWorld(true)
      tmpM2.copy(this.root.matrixWorld).invert()
      this.leaves.forEach((l, i) => {
        const a = this.removed.has(i) ? 0 : easeOutBack(clamp01((g - l.t0) / 0.08))
        if (a <= 0.001 || !l.cluster.group.visible) {
          this.leafMesh!.setMatrixAt(i, ZERO)
          return
        }
        tmpM.multiplyMatrices(tmpM2, l.cluster.group.matrixWorld).multiply(l.local)
        tmpM.multiply(new THREE.Matrix4().makeScale(a, a, a))
        this.leafMesh!.setMatrixAt(i, tmpM)
      })
      this.leafMesh.instanceMatrix.needsUpdate = true
    }
  }

  /** Removes one visible leaf and returns its world position (for the falling animation) */
  takeLeaf(growth: number): THREE.Vector3 {
    this.root.updateMatrixWorld(true)
    const visible = this.leaves.map((l, i) => ({ l, i })).filter(({ l, i }) => !this.removed.has(i) && growth > l.t0 + 0.02)
    if (visible.length) {
      const pick = visible[Math.floor(Math.random() * visible.length)]
      this.removed.add(pick.i)
      tmpM.multiplyMatrices(pick.l.cluster.group.matrixWorld, pick.l.local)
      return tmpV.setFromMatrixPosition(tmpM).clone()
    }
    const shown = this.clusters.filter((c) => c.group.visible)
    if (shown.length) return shown[Math.floor(Math.random() * shown.length)].group.getWorldPosition(new THREE.Vector3())
    return this.sprout.getWorldPosition(new THREE.Vector3())
  }

  /** Current approximate height, for camera framing */
  heightAt(growth: number) {
    const g = clamp01(growth)
    return 0.35 + (this.fullHeight - 0.35) * easeInOut(g)
  }
}
