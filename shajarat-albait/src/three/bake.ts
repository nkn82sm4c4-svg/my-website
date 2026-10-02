import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

const BAKED_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.85 })

/**
 * Collapses a whole tree (dozens of meshes) into one vertex-coloured mesh,
 * so a garden of 50+ trees stays at one draw call per tree.
 */
export function bake(root: THREE.Object3D): THREE.Mesh {
  root.updateMatrixWorld(true)
  const inv = root.matrixWorld.clone().invert()
  const parts: THREE.BufferGeometry[] = []
  const m = new THREE.Matrix4()
  root.traverseVisible((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || (o as THREE.InstancedMesh).isInstancedMesh) return
    const s = new THREE.Vector3()
    mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), s)
    if (Math.abs(s.x * s.y * s.z) < 1e-6) return
    let g = mesh.geometry.clone()
    if (g.index) g = g.toNonIndexed()
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal') g.deleteAttribute(name)
    m.multiplyMatrices(inv, mesh.matrixWorld)
    g.applyMatrix4(m)
    const color = (mesh.material as THREE.MeshStandardMaterial).color
    const count = g.attributes.position.count
    const colors = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) color.toArray(colors, i * 3)
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    parts.push(g)
  })
  const merged = mergeGeometries(parts, false) ?? new THREE.BufferGeometry()
  parts.forEach((p) => p.dispose())
  const out = new THREE.Mesh(merged, BAKED_MAT)
  out.castShadow = true
  out.receiveShadow = true
  out.userData.owned = true
  return out
}
