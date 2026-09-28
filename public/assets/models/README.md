# 3D hero model — drop-in slot

The hero renders a **live WebGL scene** (`src/components/hero/NinjaScene.tsx`):
a full 3D Mangekyo eye built from real geometry, a crow swarm flying on
elliptical paths, and a drifting ember field. Nothing is downloaded — it is
all generated at runtime, so the hero works offline and stays fast.

## Adding your own character model

You can drop **any** `.glb` / `.gltf` character into this folder and it will be
loaded, auto-framed (normalised to a fixed height, centred) and slowly rotated
next to the eye:

```
public/assets/models/hero.glb
```

That is the whole setup — no code changes. The scene probes for the file on
load; if it is missing, the procedural scene renders on its own.

### Where to get a model

Any glTF 2.0 character works. Good sources:

- **Sketchfab** — filter by *Downloadable* + **CC0 / CC-BY**.
- **Khronos glTF Sample Assets** — permissively licensed, small, well-formed.
- **Mixamo** — free rigged characters (export as FBX, then convert to glTF).

Keep it under ~5 MB and prefer a single mesh with baked textures.

### Reference

`public/assets/models/` is reserved for `.glb` / `.gltf` files and their
textures. The rest of the artwork lives in the parent folder.
