"""
Sinmar 3D food models — procedural Blender pipeline.

Builds every menu model from code, then for each one:
  1. exports a mobile-friendly GLB   -> public/models/<name>.glb
  2. renders a transparent product shot -> public/images/products/<name>.webp

Run with the Blender CLI:
    blender -b -P blender/scripts/build_models.py
or with the `bpy` Python module (pip install bpy, Python 3.11):
    python blender/scripts/build_models.py [--only burger,fries] [--no-render]

Design choices for mobile performance:
  * low/medium poly (roughly 2k–15k triangles per model)
  * no image textures at all — colour is baked into vertex colours (COLOR_0),
    so every GLB is tiny and needs no texture decoding on the phone
  * real-world scale (1 build unit = 6 cm) so AR placement looks right
"""

import math
import os
import random
import sys

import bpy  # noqa: I001  (bpy must be imported before bmesh when used as a module)
import bmesh
from mathutils import Matrix, Vector, noise

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
MODELS_DIR = os.path.join(ROOT, "public", "models")
IMAGES_DIR = os.path.join(ROOT, "public", "images", "products")
UNIT_TO_METERS = 0.06

# --------------------------------------------------------------------------- #
# Small helpers
# --------------------------------------------------------------------------- #


def srgb(c):
    """sRGB (what designers pick) -> linear (what glTF/Blender store)."""
    return tuple(pow(max(0.0, x), 2.2) for x in c)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def n3(p, s=1.0, off=0.0):
    return noise.noise(Vector((p[0] * s + off, p[1] * s - off, p[2] * s + off * 0.5)))


def clamp01(x):
    return max(0.0, min(1.0, x))


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


MATS = {}


def material(name, rough=0.5, coat=0.0, sheen=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        out = nt.nodes.get("Material Output") or nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(bsdf.outputs[0], out.inputs[0])
    col = nt.nodes.new("ShaderNodeVertexColor")
    col.layer_name = "Col"
    nt.links.new(col.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    if coat:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.15
    if sheen:
        bsdf.inputs["Sheen Weight"].default_value = sheen
    MATS[name] = m
    return m


def activate(o):
    for other in bpy.context.view_layer.objects:
        other.select_set(False)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)


def from_bmesh(bm, name="part"):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(o)
    return o


def uv_sphere(seg=32, rings=16, r=1.0):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=r)
    return from_bmesh(bm, "sphere")


def cylinder(verts=32, r=1.0, depth=1.0, cap_top=True, cap_bottom=True, rings=1):
    """Open-ended tube with `rings` horizontal loops, z from 0 to depth."""
    bm = bmesh.new()
    loops = []
    for i in range(rings + 1):
        z = depth * i / rings
        loops.append([bm.verts.new((r * math.cos(2 * math.pi * j / verts),
                                    r * math.sin(2 * math.pi * j / verts), z))
                      for j in range(verts)])
    for i in range(rings):
        for j in range(verts):
            a, b = loops[i][j], loops[i][(j + 1) % verts]
            c, d = loops[i + 1][(j + 1) % verts], loops[i + 1][j]
            bm.faces.new((a, b, c, d))
    if cap_bottom:
        bm.faces.new(list(reversed(loops[0])))
    if cap_top:
        bm.faces.new(loops[-1])
    return from_bmesh(bm, "cyl")


def polar_disc(rings, segs, radius_fn, z_fn):
    """Disc built from concentric rings so vertex colours / waves have detail."""
    bm = bmesh.new()
    center = bm.verts.new((0, 0, z_fn(0, 0, 0)))
    grid = []
    for i in range(1, rings + 1):
        t = i / rings
        row = []
        for j in range(segs):
            a = 2 * math.pi * j / segs
            r = radius_fn(a) * t
            row.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z_fn(t, a, r))))
        grid.append(row)
    for j in range(segs):
        bm.faces.new((center, grid[0][j], grid[0][(j + 1) % segs]))
    for i in range(rings - 1):
        for j in range(segs):
            bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][(j + 1) % segs], grid[i][(j + 1) % segs]))
    return from_bmesh(bm, "disc")


def deform(o, fn):
    for v in o.data.vertices:
        v.co = fn(v.co.copy())
    o.data.update()


def displace(o, fn):
    """Push each vertex along its normal by fn(co)."""
    o.data.update()
    normals = [v.normal.copy() for v in o.data.vertices]
    for v, nrm in zip(o.data.vertices, normals):
        v.co = v.co + nrm * fn(v.co.copy())
    o.data.update()


def modifier(o, kind, **props):
    activate(o)
    m = o.modifiers.new(kind.lower(), kind)
    for k, v in props.items():
        setattr(m, k, v)
    bpy.ops.object.modifier_apply(modifier=m.name)


def solidify(o, thickness, offset=-1.0):
    modifier(o, "SOLIDIFY", thickness=thickness, offset=offset)


def subsurf(o, levels=1):
    modifier(o, "SUBSURF", levels=levels, render_levels=levels)


def finish(o, mat, color_fn, smooth=True):
    """Paint vertex colours (fn(co, normal) -> sRGB) and assign material."""
    me = o.data
    me.update()
    attr = me.color_attributes.new("Col", "FLOAT_COLOR", "POINT")
    for i, v in enumerate(me.vertices):
        c = srgb(color_fn(v.co, v.normal))
        attr.data[i].color = (c[0], c[1], c[2], 1.0)
    me.color_attributes.active_color = attr
    try:
        me.color_attributes.render_color_index = me.color_attributes.active_color_index
    except Exception:
        pass
    me.materials.clear()
    me.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = smooth
    return o


def join(parts):
    activate(parts[0])
    for p in parts:
        p.select_set(True)
    bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def place(o, loc=(0, 0, 0), rot=(0, 0, 0), scale=1.0):
    o.location = loc
    o.rotation_euler = rot
    o.scale = (scale, scale, scale)
    activate(o)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return o


def seeds_on(points_normals, size, color, mat, jitter=0.12, subdiv=1):
    """Instance tiny ellipsoids (sesame, nigella…) on the given surface points."""
    bm = bmesh.new()
    for p, nrm in points_normals:
        rot = nrm.to_track_quat("Z", "Y").to_matrix().to_4x4() @ Matrix.Rotation(random.uniform(0, math.pi), 4, "Z")
        s = Matrix.Diagonal((size[0] * random.uniform(0.85, 1.15), size[1], size[2], 1.0))
        bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0,
                                   matrix=Matrix.Translation(p + nrm * size[2] * 0.4) @ rot @ s)
    o = from_bmesh(bm, "seeds")
    return finish(o, mat, lambda co, n: mix(color, (1, 1, 1), 0.15 + jitter * n3(co, 9)))


# --------------------------------------------------------------------------- #
# Food parts
# --------------------------------------------------------------------------- #

BREAD = lambda: material("Bread", rough=0.62, sheen=0.25)   # noqa: E731
MEAT = lambda: material("Meat", rough=0.55, coat=0.15)      # noqa: E731
CHEESE = lambda: material("Cheese", rough=0.32, coat=0.2)   # noqa: E731
VEG = lambda: material("Veg", rough=0.38, coat=0.25)        # noqa: E731
SAUCE = lambda: material("Sauce", rough=0.18, coat=0.5)     # noqa: E731
PAPER = lambda: material("Paper", rough=0.78)               # noqa: E731
PLASTIC = lambda: material("Plastic", rough=0.28, coat=0.3)  # noqa: E731


def bun_top(z0, r=1.0, h=0.62, seeds=44):
    o = uv_sphere(48, 24, 1.0)
    top_brown, edge = (0.66, 0.35, 0.1), (0.9, 0.63, 0.3)

    def shape(c):
        x, y, z = c
        z = h * (z ** 0.85) if z >= 0 else z * 0.14
        k = r * (1 + 0.025 * n3(c, 1.6, 3))
        return Vector((x * k, y * k, z + z0))

    deform(o, shape)

    def color(co, nrm):
        if nrm.z < -0.35:
            return mix((0.95, 0.85, 0.64), (0.88, 0.74, 0.5), 0.5 + 0.5 * n3(co, 7))
        t = clamp01((co.z - z0) / h) ** 0.55
        c = mix(edge, top_brown, t)
        c = mix(c, (0.45, 0.2, 0.05), clamp01(0.15 + 0.35 * n3(co, 2.2, 5)))
        return mix(c, (0.98, 0.8, 0.5), clamp01(n3(co, 6, 9) - 0.2) * 0.5)

    finish(o, BREAD(), color)
    pts = []
    for _ in range(seeds):
        a = random.uniform(0, 2 * math.pi)
        s = math.sqrt(random.uniform(0.0, 0.72))
        x, y = s * math.cos(a) * r, s * math.sin(a) * r
        z = h * (math.sqrt(max(0.0, 1 - s * s)) ** 0.85)
        nrm = Vector((x / r ** 2, y / r ** 2, z / (h ** 2) * 0.55)).normalized()
        pts.append((Vector((x, y, z + z0)), nrm))
    return [o, seeds_on(pts, (0.042, 0.022, 0.014), (0.96, 0.9, 0.72), BREAD())]


def bun_bottom(r=0.98, top=0.36):
    o = uv_sphere(48, 16, 1.0)

    def shape(c):
        x, y, z = c
        z = z * 0.04 if z >= 0 else z * (top - 0.04)
        k = r * (1 + 0.02 * n3(c, 1.8, 7))
        return Vector((x * k, y * k, z + top - 0.04))

    deform(o, shape)

    def color(co, nrm):
        if nrm.z > 0.55:
            return mix((0.97, 0.88, 0.66), (0.9, 0.76, 0.52), 0.5 + 0.5 * n3(co, 8))
        return mix((0.88, 0.6, 0.28), (0.7, 0.42, 0.15), 0.4 + 0.4 * n3(co, 3))

    return finish(o, BREAD(), color)


def patty(zc, r=1.1, half=0.16):
    o = uv_sphere(48, 20, 1.0)

    def shape(c):
        x, y, z = c
        z = math.copysign(abs(z) ** 0.38, z) * half
        k = r * (1 + 0.035 * n3(c, 2.2, zc * 10))
        return Vector((x * k, y * k, z + zc))

    deform(o, shape)
    displace(o, lambda c: 0.022 * n3(c, 6.5, 1.3) + 0.01 * n3(c, 17))

    def color(co, nrm):
        base = mix((0.36, 0.18, 0.08), (0.2, 0.09, 0.04), 0.5 + 0.6 * n3(co, 5))
        char = clamp01(n3(co, 11, 4) * 2.2)
        base = mix(base, (0.09, 0.045, 0.02), char * 0.8)
        side = 1 - abs(nrm.z)
        return mix(base, (0.5, 0.28, 0.12), side * 0.35 * (0.5 + n3(co, 9)))

    return finish(o, MEAT(), color)


def cheese(z0, rp=1.08, size=2.0, rot=0.3):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=22, y_segments=22, size=size / 2)
    o = from_bmesh(bm, "cheese")
    ca, sa = math.cos(math.pi / 4 + rot), math.sin(math.pi / 4 + rot)

    def shape(c):
        x, y = c.x * ca - c.y * sa, c.x * sa + c.y * ca
        rr = math.hypot(x, y)
        if rr > rp * 1.12:  # round the corners off
            x, y, rr = x * rp * 1.12 / rr, y * rp * 1.12 / rr, rp * 1.12
        edge = rp * 0.86
        over = max(0.0, rr - edge)
        droop = min(0.3, over * 0.95 + over ** 2 * 0.9)
        k = 1 - droop * 0.2
        return Vector((x * k, y * k, z0 - droop + 0.012 * n3(c, 5)))

    deform(o, shape)
    solidify(o, 0.035, offset=1.0)
    return finish(o, CHEESE(), lambda co, n: mix((1.0, 0.74, 0.16), (1.0, 0.6, 0.08), clamp01(z0 - co.z) * 3 + 0.15 * n3(co, 6)))


def lettuce(z0, r=1.2, waves=15, amp=0.09):
    ph = random.uniform(0, 6)

    def radius(a):
        return r * (1 + 0.06 * math.sin(a * 7 + ph) + 0.04 * n3((math.cos(a), math.sin(a), 0), 3))

    def z(t, a, rr):
        return z0 + amp * (t ** 2) * math.sin(a * waves + 2.2 * n3((math.cos(a), math.sin(a), t), 2)) + 0.02 * t

    o = polar_disc(7, 96, radius, z)
    solidify(o, 0.022)

    def color(co, nrm):
        t = clamp01(math.hypot(co.x, co.y) / r)
        c = mix((0.33, 0.58, 0.14), (0.62, 0.84, 0.3), t ** 1.6)
        return mix(c, (0.25, 0.45, 0.08), 0.25 * (0.5 + n3(co, 8)))

    return finish(o, VEG(), color)


def tomato(z0, cx, cy, r=0.44):
    o = polar_disc(5, 40, lambda a: r, lambda t, a, rr: 0)
    solidify(o, 0.075, offset=-1.0)
    deform(o, lambda c: Vector((c.x + cx, c.y + cy, c.z + z0)))

    def color(co, nrm):
        rr = math.hypot(co.x - cx, co.y - cy) / r
        a = math.atan2(co.y - cy, co.x - cx)
        if rr > 0.82 or abs(nrm.z) < 0.5:
            return (0.82, 0.12, 0.06)
        chamber = 0.5 + 0.5 * math.cos(a * 4)
        return mix((0.9, 0.2, 0.1), (0.98, 0.5, 0.32), chamber * clamp01((rr - 0.25) * 3) * 0.8)

    return finish(o, VEG(), color)


def sauce_layer(z0, r=1.08, color=(0.98, 0.93, 0.78), drips=9):
    ph = random.uniform(0, 6)

    def radius(a):
        drip = max(0.0, math.sin(a * drips + ph)) ** 6 * 0.14
        return r * (0.9 + 0.05 * n3((math.cos(a), math.sin(a), 0), 3)) + drip

    o = polar_disc(4, 96, radius, lambda t, a, rr: z0 - max(0.0, rr - r * 0.9) * 0.9)
    solidify(o, 0.03, offset=1.0)
    return finish(o, SAUCE(), lambda co, n: mix(color, (1, 1, 1), 0.08 * n3(co, 6)))


# --------------------------------------------------------------------------- #
# Products
# --------------------------------------------------------------------------- #


def build_burger(double=False):
    parts = [bun_bottom()]
    z = 0.36
    stack = 2 if double else 1
    for i in range(stack):
        parts.append(patty(z + 0.15))
        parts.append(cheese(z + 0.315, rot=0.5 * i))
        z += 0.33
    parts.append(sauce_layer(z + 0.02, color=(0.97, 0.52, 0.16) if double else (0.98, 0.93, 0.78)))
    parts.append(tomato(z + 0.05, 0.28, 0.12))
    parts.append(tomato(z + 0.06, -0.3, -0.18))
    parts.append(lettuce(z + 0.15))
    parts += bun_top(z + 0.22)
    return join(parts)


def build_fries():
    random.seed(21)
    h = 1.5
    o = cylinder(72, 1.0, 1.0, cap_top=False, cap_bottom=True, rings=16)

    def shape(c):
        a = math.atan2(c.y, c.x)
        t = c.z
        ca, sa = math.cos(a), math.sin(a)
        w, d = 0.5 + 0.16 * t, 0.26 + 0.12 * t
        x = math.copysign(abs(ca) ** 0.35, ca) * w
        y = math.copysign(abs(sa) ** 0.35, sa) * d
        top = h - 0.34 * (sa ** 2)
        return Vector((x, y, t * top))

    deform(o, shape)
    solidify(o, 0.025)

    def color(co, nrm):
        t = co.z / h
        return mix((0.84, 0.08, 0.07), (0.6, 0.04, 0.04), 0.45 * (1 - t))

    finish(o, PAPER(), color)
    bm = bmesh.new()
    for i in range(58):
        L = random.uniform(1.0, 1.55)
        x = random.uniform(-0.36, 0.36)
        y = random.uniform(-0.13, 0.13)
        tilt = Matrix.Rotation(-x * 0.45 + random.uniform(-0.08, 0.08), 4, "Y") @ Matrix.Rotation(-y * 0.6 + random.uniform(-0.05, 0.05), 4, "X")
        m = Matrix.Translation((x, y, 0.3 + L / 2 + random.uniform(0, 0.25))) @ tilt @ \
            Matrix.Rotation(random.uniform(0, 1.5), 4, "Z") @ Matrix.Diagonal((0.064, 0.064, L / 2, 1))
        ret = bmesh.ops.create_cube(bm, size=2.0, matrix=m)
        edges = list({e for v in ret["verts"] for e in v.link_edges})
        bmesh.ops.bevel(bm, geom=edges + ret["verts"], offset=0.02, segments=1, affect="EDGES")
    fries = from_bmesh(bm, "fries")

    def fcol(co, nrm):
        t = clamp01((co.z - 1.0) / 1.1)
        c = mix((0.99, 0.8, 0.36), (0.82, 0.48, 0.12), t ** 1.6)
        c = mix(c, (0.74, 0.44, 0.1), clamp01(n3(co, 3.5, 2) * 1.5) * 0.6)
        return mix(c, (1.0, 0.88, 0.55), clamp01(-n3(co, 6, 5)) * 0.35)

    finish(fries, BREAD(), fcol)
    return join([o, fries])


def build_drink():
    h = 2.3
    cup = cylinder(56, 1.0, 1.0, cap_top=False, cap_bottom=True, rings=12)
    radius = lambda t: 0.46 + 0.16 * t  # noqa: E731
    deform(cup, lambda c: Vector((c.x * radius(c.z), c.y * radius(c.z), c.z * h)))
    solidify(cup, 0.02)
    finish(cup, PAPER(), lambda co, n: mix((0.82, 0.07, 0.06), (0.62, 0.03, 0.03), 1 - co.z / h))
    bands = []
    for t0, t1, col, grow in ((0.4, 0.62, (0.99, 0.97, 0.93), 0.006), (0.385, 0.4, (1.0, 0.74, 0.2), 0.009),
                              (0.62, 0.635, (1.0, 0.74, 0.2), 0.009)):
        b = cylinder(56, 1.0, 1.0, cap_top=False, cap_bottom=False, rings=2)
        deform(b, lambda c, t0=t0, t1=t1, grow=grow: Vector((
            c.x * (radius(t0 + (t1 - t0) * c.z) + grow), c.y * (radius(t0 + (t1 - t0) * c.z) + grow), (t0 + (t1 - t0) * c.z) * h)))
        bands.append(finish(b, PAPER(), lambda co, n, col=col: col))
    lid = uv_sphere(56, 16, 1.0)
    deform(lid, lambda c: Vector((c.x * 0.66, c.y * 0.66, h + max(c.z, -0.05) * 0.14)))
    finish(lid, PLASTIC(), lambda co, n: (0.96, 0.95, 0.93))
    rim = cylinder(56, 0.665, 0.08, rings=1)
    deform(rim, lambda c: Vector((c.x, c.y, c.z + h - 0.04)))
    finish(rim, PLASTIC(), lambda co, n: (0.92, 0.91, 0.9))
    straw = cylinder(16, 0.05, 1.3, rings=18)
    place(straw, (0.12, 0.05, h), (0.18, -0.1, 0))

    def scol(co, nrm):
        a = math.atan2(co.y - 0.05, co.x - 0.12)
        return (0.85, 0.1, 0.1) if math.sin(a + co.z * 14) > 0.3 else (0.99, 0.99, 0.99)

    finish(straw, PLASTIC(), scol)
    return join([cup, *bands, lid, rim, straw])


def build_sauce():
    cup = cylinder(56, 1.0, 1.0, cap_top=False, cap_bottom=True, rings=4)

    def shape(c):
        a = math.atan2(c.y, c.x)
        r = (0.36 + 0.1 * c.z) * (1 + 0.025 * math.sin(a * 28) * c.z)
        return Vector((math.cos(a) * r, math.sin(a) * r, c.z * 0.42))

    deform(cup, shape)
    solidify(cup, 0.015)
    finish(cup, PAPER(), lambda co, n: mix((0.99, 0.98, 0.95), (0.9, 0.88, 0.84), 0.5 + 0.5 * n.x))
    top = polar_disc(8, 56, lambda a: 0.45, lambda t, a, r: 0.36 + 0.09 * (1 - t ** 2) + 0.025 * math.sin(a * 3 + t * 9) * t)
    finish(top, SAUCE(), lambda co, n: mix((0.95, 0.48, 0.1), (0.85, 0.28, 0.05), 0.5 + 0.8 * n3(co, 5)))
    return join([cup, top])


def build_wrap():
    random.seed(5)
    L = 2.9
    w = cylinder(40, 0.36, 1.0, cap_top=False, cap_bottom=False, rings=24)

    def shape(c):
        a = math.atan2(c.y, c.x)
        t = c.z
        top = L - 0.35 - 0.35 * math.cos(a)
        z = t * top
        r = 0.36 * (1 + 0.05 * n3(c, 3)) * (min(1.0, (t * 8)) ** 0.5 * 0.4 + 0.6)
        return Vector((math.cos(a) * r, math.sin(a) * r, z))

    deform(w, shape)
    solidify(w, 0.03)

    def tcol(co, nrm):
        base = mix((0.95, 0.84, 0.58), (0.88, 0.72, 0.45), 0.5 + 0.5 * n3(co, 4))
        spot = clamp01((n3(co, 7, 2) - 0.2) * 3)
        return mix(base, (0.55, 0.3, 0.1), spot * 0.8)

    finish(w, BREAD(), tcol)
    # filling peeking out of the diagonal cut
    bm = bmesh.new()
    kinds = []
    for i in range(34):
        a = random.uniform(0, 2 * math.pi)
        rr = random.uniform(0, 0.27)
        top = L - 0.35 - 0.35 * math.cos(a)
        p = Vector((rr * math.cos(a), rr * math.sin(a), top - random.uniform(0.02, 0.18)))
        kind = random.choice(["chicken", "chicken", "chicken", "pickle", "fry"])
        sc = {"chicken": (0.1, 0.07, 0.06), "pickle": (0.08, 0.08, 0.02), "fry": (0.035, 0.035, 0.16)}[kind]
        m = Matrix.Translation(p) @ Matrix.Rotation(random.uniform(0, 3), 4, "X") @ Matrix.Rotation(random.uniform(0, 3), 4, "Z") @ Matrix.Diagonal((*sc, 1))
        ret = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=m)
        kinds += [kind] * len(ret["verts"])
    fill = from_bmesh(bm, "fill")
    idx = {"chicken": (0.78, 0.45, 0.18), "pickle": (0.45, 0.6, 0.15), "fry": (1.0, 0.8, 0.4)}
    me = fill.data
    finish(fill, MEAT(), lambda co, n: (1, 1, 1))
    attr = me.color_attributes["Col"]
    for i, v in enumerate(me.vertices):
        c = srgb(mix(idx[kinds[i]], (0.4, 0.2, 0.05), 0.25 * (0.5 + n3(v.co, 12))))
        attr.data[i].color = (*c, 1)
    garlic = uv_sphere(20, 10, 1.0)
    deform(garlic, lambda c: Vector((c.x * 0.2 + 0.05, c.y * 0.16, c.z * 0.07 + L - 0.62)))
    finish(garlic, SAUCE(), lambda co, n: (0.99, 0.97, 0.9))
    # paper wrapper
    paper = cylinder(40, 0.385, 1.0, cap_top=False, cap_bottom=True, rings=36)

    def pshape(c):
        a = math.atan2(c.y, c.x)
        zig = 0.08 * abs(((a * 6 / math.pi) % 2) - 1)
        return Vector((c.x, c.y, c.z * (1.45 + zig + 0.15 * math.cos(a))))

    deform(paper, pshape)
    solidify(paper, 0.012, offset=1.0)
    finish(paper, PAPER(), lambda co, n: (0.8, 0.08, 0.06) if 0.45 < co.z < 0.62 else (0.99, 0.97, 0.93))
    return join([w, fill, garlic, paper])


def build_sub():
    random.seed(9)
    Lx, Wy = 2.2, 0.45

    def loaf(top, z0):
        o = uv_sphere(64, 20, 1.0)

        def shape(c):
            x, y, z = c
            taper = 1 - 0.25 * abs(x) ** 4
            if top:
                z = 0.42 * z if z > 0 else z * 0.03
            else:
                z = 0.03 * z if z > 0 else z * 0.3
            return Vector((x * Lx, y * Wy * taper, z * taper + z0))

        deform(o, shape)
        displace(o, lambda c: 0.02 * n3(c, 3.2, 1 if top else 4))

        def color(co, nrm):
            if (top and nrm.z < -0.5) or (not top and nrm.z > 0.5):
                return mix((0.97, 0.9, 0.7), (0.9, 0.78, 0.55), 0.5 + 0.5 * n3(co, 8))
            t = clamp01(nrm.z)
            c = mix((0.93, 0.7, 0.38), (0.72, 0.42, 0.14), t if top else 0.2)
            return mix(c, (0.5, 0.26, 0.08), 0.2 * (0.5 + n3(co, 5)))

        return finish(o, BREAD(), color)

    bottom = loaf(False, 0.3)
    parts = [bottom]
    # lettuce strip
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=60, y_segments=6, size=1.0)
    let = from_bmesh(bm, "let")
    deform(let, lambda c: Vector((c.x * Lx * 0.95, c.y * (Wy * 1.18 + 0.035 * math.sin(c.x * 22)), 0.36 + 0.05 * math.sin(c.x * 40) * abs(c.y) * 2)))
    solidify(let, 0.02)
    parts.append(finish(let, VEG(), lambda co, n: mix((0.36, 0.6, 0.16), (0.62, 0.85, 0.3), clamp01(abs(co.y) / Wy))))
    # meat chunks
    bm = bmesh.new()
    for i in range(60):
        x = random.uniform(-Lx * 0.85, Lx * 0.85)
        m = Matrix.Translation((x, random.uniform(-0.3, 0.3), 0.44)) @ Matrix.Rotation(random.uniform(0, 3), 4, "Z") @ \
            Matrix.Rotation(random.uniform(-0.4, 0.4), 4, "X") @ Matrix.Diagonal((random.uniform(0.12, 0.2), 0.08, 0.06, 1))
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=m)
    meat = from_bmesh(bm, "meat")
    parts.append(finish(meat, MEAT(), lambda co, n: mix((0.62, 0.32, 0.12), (0.35, 0.16, 0.05), 0.5 + 0.8 * n3(co, 9))))
    # cheese sauce ribbon
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=60, y_segments=3, size=1.0)
    ch = from_bmesh(bm, "cheese")
    deform(ch, lambda c: Vector((c.x * Lx * 0.9, c.y * 0.14 + 0.12 * math.sin(c.x * 9), 0.53 + 0.02 * math.sin(c.x * 20))))
    solidify(ch, 0.035, offset=1.0)
    parts.append(finish(ch, SAUCE(), lambda co, n: (1.0, 0.72, 0.15)))
    top = loaf(True, 0.0)
    place(top, (0, -0.05, 0.62), (0.18, 0, 0))
    parts.append(top)
    return join(parts)


def build_pizza():
    random.seed(3)
    R = 2.4
    base = polar_disc(14, 120, lambda a: R, lambda t, a, r: 0.12 + 0.008 * n3((r * math.cos(a), r * math.sin(a), 0), 4))
    solidify(base, 0.12)

    def bcol(co, nrm):
        r = math.hypot(co.x, co.y) / R
        a = math.atan2(co.y, co.x)
        if nrm.z < 0.5:
            return (0.85, 0.6, 0.3)
        cheese_c = mix((1.0, 0.86, 0.45), (0.96, 0.72, 0.28), 0.5 + 0.7 * n3(co, 3))
        brown = clamp01((n3(co, 5, 7) - 0.25) * 3)
        cheese_c = mix(cheese_c, (0.78, 0.45, 0.14), brown * 0.7)
        if r > 0.86:
            cheese_c = mix(cheese_c, (0.8, 0.22, 0.08), clamp01((r - 0.86) * 12))
        cut = abs(((a / (math.pi / 4)) % 1) - 0.5)
        if cut > 0.49 and r < 0.9:
            cheese_c = mix(cheese_c, (0.7, 0.45, 0.2), 0.5)
        return cheese_c

    finish(base, CHEESE(), bcol)
    tor = bpy.data.meshes.new("crust")
    bmt = bmesh.new()
    seg, ring = 120, 14
    verts = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        lump = 1 + 0.12 * n3((math.cos(a) * 3, math.sin(a) * 3, 0), 1.5)
        row = []
        for j in range(ring):
            b = 2 * math.pi * j / ring
            rr = 0.19 * lump
            x = (R + rr * math.cos(b)) * math.cos(a)
            y = (R + rr * math.cos(b)) * math.sin(a)
            z = 0.2 + rr * math.sin(b) * 1.05
            row.append(bmt.verts.new((x, y, z)))
        verts.append(row)
    for i in range(seg):
        for j in range(ring):
            bmt.faces.new((verts[i][j], verts[(i + 1) % seg][j], verts[(i + 1) % seg][(j + 1) % ring], verts[i][(j + 1) % ring]))
    bmt.to_mesh(tor)
    bmt.free()
    crust = bpy.data.objects.new("crust", tor)
    bpy.context.collection.objects.link(crust)
    finish(crust, BREAD(), lambda co, n: mix((0.93, 0.66, 0.32), (0.66, 0.36, 0.1), clamp01(n.z + 0.3) * 0.7 + 0.25 * n3(co, 4)))
    parts = [base, crust]
    # pepperoni
    bm = bmesh.new()
    spots = []
    for ring_r, count, off in ((0.6, 5, 0.3), (1.35, 9, 0.1), (1.95, 12, 0.5)):
        for k in range(count):
            a = 2 * math.pi * k / count + off
            spots.append((ring_r * math.cos(a), ring_r * math.sin(a)))
    for x, y in spots:
        ret = bmesh.ops.create_cone(bm, cap_ends=True, segments=24, radius1=0.24, radius2=0.23, depth=0.035,
                                    matrix=Matrix.Translation((x, y, 0.27)))
        for v in ret["verts"]:
            v.co.z += (math.hypot(v.co.x - x, v.co.y - y) / 0.24) ** 2 * 0.03
    pep = from_bmesh(bm, "pep")

    def pcol(co, nrm):
        return mix((0.72, 0.12, 0.07), (0.45, 0.06, 0.04), 0.4 + 0.6 * n3(co, 14))

    parts.append(finish(pep, MEAT(), pcol))
    # olives + peppers
    bm = bmesh.new()
    olive_idx = []
    for i in range(22):
        a, r = random.uniform(0, 6.28), random.uniform(0.2, 2.0)
        m = Matrix.Translation((r * math.cos(a), r * math.sin(a), 0.27)) @ Matrix.Rotation(random.uniform(0, 3), 4, "Z")
        if i % 2:
            ret = bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=0.08, radius2=0.08, depth=0.04, matrix=m)
        else:
            ret = bmesh.ops.create_cube(bm, size=1, matrix=m @ Matrix.Diagonal((0.28, 0.05, 0.03, 1)))
        olive_idx += [i % 2] * len(ret["verts"])
    extra = from_bmesh(bm, "extra")
    finish(extra, VEG(), lambda co, n: (1, 1, 1))
    attr = extra.data.color_attributes["Col"]
    for i, v in enumerate(extra.data.vertices):
        c = (0.08, 0.07, 0.06) if olive_idx[i] else (0.2, 0.55, 0.12)
        attr.data[i].color = (*srgb(c), 1)
    parts.append(extra)
    return join(parts)


def build_fatayer(boat=False):
    random.seed(12 if boat else 13)
    if boat:
        o = uv_sphere(64, 24, 1.0)

        def shape(c):
            x, y, z = c
            taper = (1 - abs(x) ** 2.2) ** 0.6
            rim = math.hypot(x / 1.0, y / max(0.2, taper)) if taper > 0 else 1
            zz = z * 0.32 if z < 0 else z * 0.3
            inner = abs(y) < 0.72 * taper and abs(x) < 0.82 and z > 0
            if inner:
                zz = 0.05
            return Vector((x * 2.0, y * 0.75 * taper, zz + 0.32))

        deform(o, shape)
        displace(o, lambda c: 0.015 * n3(c, 4))
        finish(o, BREAD(), lambda co, n: mix((0.94, 0.68, 0.32), (0.7, 0.38, 0.1), clamp01(co.z - 0.3) * 2 + 0.2 * n3(co, 5)))
        fill = polar_disc(8, 64, lambda a: 1.0, lambda t, a, r: 0.42 + 0.06 * (1 - t ** 2) + 0.03 * n3((r * math.cos(a), r * math.sin(a), 0), 5))
        deform(fill, lambda c: Vector((c.x * 1.55, c.y * 0.42 * (1 - abs(c.x) ** 4), c.z)))
        finish(fill, CHEESE(), lambda co, n: mix((1.0, 0.85, 0.45), (0.85, 0.52, 0.16), clamp01(n3(co, 6) * 2 + 0.25)))
        bm = bmesh.new()
        for i in range(26):
            x = random.uniform(-1.3, 1.3)
            m = Matrix.Translation((x, random.uniform(-0.25, 0.25) * (1 - abs(x / 1.5) ** 4), 0.5)) @ Matrix.Diagonal((0.07, 0.06, 0.035, 1))
            bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0, matrix=m)
        top = from_bmesh(bm, "top")
        finish(top, MEAT(), lambda co, n: mix((0.55, 0.26, 0.1), (0.3, 0.13, 0.04), 0.5 + n3(co, 9)))
        return join([o, fill, top])
    o = uv_sphere(72, 24, 1.0)
    n_sides = 3

    def tri(c):
        x, y, z = c
        a = math.atan2(y, x) - math.pi / 2
        k = math.cos(math.pi / n_sides) / math.cos((a % (2 * math.pi / n_sides)) - math.pi / n_sides)
        k = k ** 0.8 * 1.35
        zz = 0.34 * (z ** 0.8) if z >= 0 else z * 0.1
        return Vector((x * k, y * k, zz + 0.1))

    deform(o, tri)
    seam_angles = [math.pi / 2 + k * 2 * math.pi / 3 for k in range(3)]

    def seam_d(c):
        a = math.atan2(c.y, c.x)
        r = math.hypot(c.x, c.y)
        return min(abs(math.sin(a - s)) * r + (0 if math.cos(a - s) > 0 else 9) for s in seam_angles)

    displace(o, lambda c: 0.045 * math.exp(-(seam_d(c) / 0.06) ** 2) * (c.z > 0.25) + 0.01 * n3(c, 5))

    def col(co, nrm):
        c = mix((0.95, 0.72, 0.38), (0.75, 0.42, 0.13), clamp01(nrm.z) * 0.9)
        c = mix(c, (0.55, 0.28, 0.08), 0.6 * math.exp(-(seam_d(co) / 0.07) ** 2) * (co.z > 0.25))
        return mix(c, (0.5, 0.25, 0.06), 0.18 * (0.5 + n3(co, 6)))

    finish(o, BREAD(), col)
    me = o.data
    pts = []
    polys = [p for p in me.polygons if p.normal.z > 0.6]
    for p in random.sample(polys, min(28, len(polys))):
        pts.append((p.center.copy(), p.normal.copy()))
    return join([o, seeds_on(pts, (0.018, 0.011, 0.008), (0.08, 0.07, 0.07), BREAD(), jitter=0.02)])


PRODUCTS = {
    "burger": (lambda: build_burger(False), 0.12),
    "double-burger": (lambda: build_burger(True), 0.14),
    "fries": (build_fries, 0.15),
    "drink": (build_drink, 0.18),
    "sauce": (build_sauce, 0.05),
    "wrap": (build_wrap, 0.2),
    "sub": (build_sub, 0.26),
    "pizza": (build_pizza, 0.3),
    "fatayer": (lambda: build_fatayer(False), 0.14),
    "pie-boat": (lambda: build_fatayer(True), 0.24),
}

# --------------------------------------------------------------------------- #
# Render + export
# --------------------------------------------------------------------------- #


def normalize(o):
    """Centre on XY, rest on z=0."""
    bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
    minv = Vector((min(v.x for v in bb), min(v.y for v in bb), min(v.z for v in bb)))
    maxv = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
    center = (minv + maxv) / 2
    deform(o, lambda c: Vector((c.x - center.x, c.y - center.y, c.z - minv.z)))
    return (maxv - minv)


def setup_render_scene(objs, elevation=26, azimuth=-38, size=640, samples=64):
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.device = "CPU"
    scene.cycles.samples = samples
    try:
        scene.cycles.use_denoising = True
    except Exception:
        pass
    scene.render.film_transparent = True
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    try:
        scene.view_settings.view_transform = "AgX"
        scene.view_settings.look = "AgX - Punchy"
    except Exception:
        pass

    world = bpy.data.worlds.new("w")
    scene.world = world
    try:
        world.use_nodes = True
    except Exception:
        pass
    bg = world.node_tree.nodes.get("Background")
    bg.inputs[0].default_value = (1.0, 0.93, 0.85, 1)
    bg.inputs[1].default_value = 0.55

    pts = []
    for o in objs:
        pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    minv = Vector((min(v.x for v in pts), min(v.y for v in pts), min(v.z for v in pts)))
    maxv = Vector((max(v.x for v in pts), max(v.y for v in pts), max(v.z for v in pts)))
    center = (minv + maxv) / 2
    radius = (maxv - minv).length / 2

    floor = bpy.data.objects.new("floor", bpy.data.meshes.new("floor"))
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=radius * 10)
    bm.to_mesh(floor.data)
    bm.free()
    scene.collection.objects.link(floor)
    floor.location.z = minv.z
    floor.is_shadow_catcher = True

    def light(name, energy, loc, size_, color=(1, 1, 1)):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy * radius ** 2
        ld.size = size_ * radius
        ld.color = color
        lo = bpy.data.objects.new(name, ld)
        scene.collection.objects.link(lo)
        lo.location = center + Vector(loc) * radius
        lo.rotation_euler = (center - lo.location).to_track_quat("-Z", "Y").to_euler()

    light("key", 260, (-2.2, -2.4, 3.2), 3.2, (1.0, 0.95, 0.88))
    light("fill", 70, (3.0, -1.5, 1.2), 3.0, (1.0, 0.98, 0.95))
    light("rim", 220, (0.8, 3.0, 2.4), 1.2, (1.0, 0.9, 0.78))

    cam_d = bpy.data.cameras.new("cam")
    cam_d.lens = 70
    cam = bpy.data.objects.new("cam", cam_d)
    scene.collection.objects.link(cam)
    scene.camera = cam
    el, az = math.radians(elevation), math.radians(azimuth)
    fov = 2 * math.atan(cam_d.sensor_width / 2 / cam_d.lens)
    dist = radius / math.sin(fov / 2) * 1.0
    direction = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el)))
    target = center + Vector((0, 0, -radius * 0.04))
    cam.location = target + direction * dist
    cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()


def render_to(path_webp, quality=82):
    png = path_webp.replace(".webp", ".png")
    bpy.context.scene.render.filepath = png
    bpy.ops.render.render(write_still=True)
    try:
        from PIL import Image
        Image.open(png).save(path_webp, "WEBP", quality=quality, method=6)
        os.remove(png)
    except ImportError:
        print("  Pillow not installed — kept PNG:", png)


def export_glb(o, name, real_size):
    deform(o, lambda c: c * UNIT_TO_METERS)
    activate(o)
    o.name = name
    path = os.path.join(MODELS_DIR, name + ".glb")
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_vertex_color="ACTIVE",
        export_normals=True,
        export_texcoords=False,
        export_materials="EXPORT",
    )
    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    print(f"  -> {path}  ({os.path.getsize(path) / 1024:.0f} KB, {tris} tris, ~{real_size * 100:.0f} cm)")


def build_one(name, render=True):
    random.seed(hash(name) % 1000)
    reset()
    builder, real = PRODUCTS[name]
    o = builder()
    normalize(o)
    if render:
        setup_render_scene([o])
        render_to(os.path.join(IMAGES_DIR, name + ".webp"))
    export_glb(o, name, real)


def build_combo(name, layout):
    """Render-only group shots for offers (no GLB)."""
    reset()
    objs = []
    for key, loc, rot_z, scale in layout:
        random.seed(hash(key) % 1000)
        o = PRODUCTS[key][0]()
        normalize(o)
        place(o, loc, (0, 0, rot_z), scale)
        objs.append(o)
    setup_render_scene(objs, elevation=22, azimuth=-30, size=900)
    render_to(os.path.join(IMAGES_DIR, name + ".webp"))
    print("  -> combo", name)


COMBOS = {
    "combo-meal": [("burger", (0, 0, 0), 0.3, 1.0), ("fries", (1.55, 0.9, 0), 0.2, 1.0),
                   ("drink", (-1.5, 1.1, 0), 0, 1.0), ("sauce", (0.95, -0.9, 0), 0, 1.0)],
    "family-box": [("pizza", (0, 1.0, 0), 0.4, 1.0), ("wrap", (-2.2, -0.9, 0), 0, 1.0),
                   ("fries", (2.2, -0.6, 0), 0.3, 1.0), ("sauce", (0.5, -2.0, 0), 0, 1.0),
                   ("sauce", (-0.5, -2.2, 0), 0, 1.0)],
    "double-deal": [("double-burger", (-1.1, 0, 0), 0.2, 1.0), ("double-burger", (1.2, 0.6, 0), -0.4, 1.0),
                    ("fries", (0.1, 1.9, 0), 0, 1.0)],
}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
    only = None
    render = "--no-render" not in argv
    if "--only" in argv:
        only = argv[argv.index("--only") + 1].split(",")
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(IMAGES_DIR, exist_ok=True)
    for name in PRODUCTS:
        if only and name not in only:
            continue
        print("Building", name)
        build_one(name, render)
    if render:
        for name, layout in COMBOS.items():
            if only and name not in only:
                continue
            build_combo(name, layout)


if __name__ == "__main__":
    main()
