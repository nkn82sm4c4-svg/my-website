import * as THREE from 'three'
import type { TreeSpecies } from '../types'
import { clamp01, easeInOut, easeOutBack, easeOutCubic } from './easing'
import { Burst, createFlowers, createIsland, FallingLeaves, Pulses, Sparkles } from './nature'
import { Stage } from './stage'
import { TreeModel } from './treeModel'

const ISLAND_R = 2.7

/**
 * The live session view: one tree on a floating island. The React layer only
 * calls setGrowth / dropLeaf / celebrate — the scene animates everything else
 * smoothly in between.
 */
export class TreeScene extends Stage {
  private tree: TreeModel
  private island = createIsland(ISLAND_R, 11)
  private flowers = createFlowers(ISLAND_R, 18, 5, 0.35)
  private sparkles = new Sparkles(70, 2.2, 5)
  private falling = new FallingLeaves()
  private pulses = new Pulses()
  private burst = new Burst()
  private shown = 0
  private targetGrowth = 0
  private fruitShown = 0
  private fruitTarget = 0
  private tween: { from: number; to: number; t: number; dur: number } | null = null
  private blocked = false
  private lastQuarter = 0
  private glowBoost = 0
  onMilestone?: (quarter: number) => void

  constructor(container: HTMLElement, species: TreeSpecies, seed: number, growth = 0) {
    super(container)
    this.tree = new TreeModel(species, seed)
    this.tree.root.userData.seed = seed
    this.shown = this.targetGrowth = growth
    this.lastQuarter = Math.floor(growth * 4 + 1e-6)
    this.flowers.children.forEach((f, i) => (f.userData.t0 = 0.3 + (i / this.flowers.children.length) * 0.65))
    this.scene.add(this.island, this.flowers, this.tree.root, this.sparkles.points, this.falling.group, this.pulses.group, this.burst.points)
    this.azimuth = 0.5
    this.elevation = 0.24
    this.applyGrowth(0)
    this.frame(true)
    this.start()
  }

  setTree(species: TreeSpecies, seed: number) {
    if (this.tree.species === species && (this.tree.root.userData.seed as number) === seed) return
    this.scene.remove(this.tree.root)
    this.tree = new TreeModel(species, seed)
    this.tree.root.userData.seed = seed
    this.scene.add(this.tree.root)
  }

  /** Target growth 0..1 — the tree eases toward it */
  setGrowth(g: number, immediate = false) {
    this.tween = null
    this.targetGrowth = clamp01(g)
    if (immediate) this.shown = this.targetGrowth
  }

  /** Scripted growth animation (hero intro, result screen) */
  animateGrowth(from: number, to: number, seconds: number) {
    this.shown = from
    this.targetGrowth = to
    this.lastQuarter = Math.floor(from * 4 + 1e-6)
    this.tween = { from, to, t: 0, dur: Math.max(0.1, seconds) }
  }

  setFruit(f: number, immediate = false) {
    this.fruitTarget = clamp01(f)
    if (immediate) this.fruitShown = this.fruitTarget
  }

  setBlocked(b: boolean) {
    this.blocked = b
  }

  /** A family member left: one leaf turns golden and falls */
  dropLeaf() {
    const from = this.tree.takeLeaf(this.shown)
    this.falling.drop(from, this.shown < 0.3 ? '#9cc77a' : '#d0a54b')
  }

  celebrate() {
    this.burst.fire(new THREE.Vector3(0, this.tree.heightAt(1) * 0.65, 0))
    this.pulses.emit(4.5, '#fff1a8')
    setTimeout(() => this.pulses.emit(3.5, '#d7f5c8'), 350)
    this.glowBoost = 1
  }

  private applyGrowth(_dt: number) {
    this.tree.update(this.shown, this.fruitShown, this.time, this.reduced ? 0.2 : 1)
    for (const f of this.flowers.children) {
      const a = easeOutBack(clamp01((this.shown - (f.userData.t0 as number)) / 0.1))
      f.scale.setScalar(Math.max(0.0001, a))
      f.visible = a > 0.01
      f.rotation.z = Math.sin(this.time * 1.4 + (f.userData.phase as number)) * 0.08
    }
  }

  private frame(immediate = false) {
    const h = this.tree.heightAt(this.shown)
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))
    const fullH = this.tree.heightAt(1)
    const fullW = Math.max(ISLAND_R * 2 + 0.4, this.tree.fullWidth + 0.6)
    const fullFit = Math.max((fullH + 2.6) / 2 / tanHalf, fullW / 2 / (tanHalf * this.camera.aspect)) * 1.08
    const startFit = Math.max(3.6, 1.6 / (tanHalf * Math.min(1, this.camera.aspect)))
    const k = easeInOut(clamp01(this.shown * 1.15))
    const d = startFit + (fullFit - startFit) * k
    const ty = -0.55 + h * 0.5
    if (immediate) {
      this.distance = d
      this.target.y = ty
    } else {
      this.distance += (d - this.distance) * 0.06
      this.target.y += (ty - this.target.y) * 0.06
    }
  }

  protected onResize() {
    if (this.tree) this.frame(true)
  }

  protected tick(dt: number) {
    if (this.tween) {
      const tw = this.tween
      tw.t = Math.min(1, tw.t + dt / tw.dur)
      this.shown = tw.from + (tw.to - tw.from) * easeOutCubic(tw.t)
      if (tw.t >= 1) this.tween = null
    } else {
      this.shown += (this.targetGrowth - this.shown) * Math.min(1, dt * 2.5)
      if (Math.abs(this.targetGrowth - this.shown) < 0.0005) this.shown = this.targetGrowth
    }
    this.fruitShown += (this.fruitTarget - this.fruitShown) * Math.min(1, dt * 1.6)

    const quarter = Math.floor(this.shown * 4 + 1e-6)
    if (quarter > this.lastQuarter) {
      this.pulses.emit(quarter >= 4 ? 4.5 : 3)
      this.glowBoost = Math.max(this.glowBoost, 0.8)
      this.onMilestone?.(quarter)
    }
    this.lastQuarter = quarter

    this.applyGrowth(dt)
    this.frame()
    this.glowBoost = Math.max(0, this.glowBoost - dt * 0.35)
    this.sparkles.setBounds(0.8 + this.shown * 1.6, 0.8 + this.tree.heightAt(this.shown) * 1.1)
    this.sparkles.update(dt, this.time, this.blocked ? 0.05 : 0.25 + this.shown * 0.35 + this.glowBoost)
    this.falling.update(dt)
    this.pulses.update(dt)
    this.burst.update(dt)
    // Colder, dimmer light while growth is frozen
    const warm = this.blocked ? 0.55 : 1
    this.sun.intensity += (2.4 * warm - this.sun.intensity) * Math.min(1, dt * 2)
  }
}
