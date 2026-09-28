import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * ============================================================================
 *  UCHIHA FIGURE — a fully procedural character for the hero
 * ============================================================================
 *  Every part is built from three.js geometry, so there is no binary asset to
 *  download and nothing licensed to embed. It reads as Itachi through
 *  silhouette language rather than a copied model:
 *
 *    • a long black cloak shaped on a lathe and wrapped in a generated texture
 *      of red cloud motifs (the Akatsuki read, drawn from scratch on a canvas)
 *    • a high collar and a shadowed head with two glowing red eyes
 *    • long hair framing the face, arms folded across the chest
 *    • idle sway + breathing, and eyes that brighten as the pointer moves
 *
 *  This is also the drop-in fallback: if you add `public/assets/models/hero.glb`
 *  the scene prefers your model and this figure steps aside.
 * ============================================================================
 */

/* -------------------------------------------------------------------------- */
/*  Generated textures                                                        */
/* -------------------------------------------------------------------------- */

/** The cloak fabric: near-black cloth with hand-drawn red cloud motifs. */
function useCloakTexture(): THREE.CanvasTexture | null {
  return useMemo(() => {
    const size = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.fillStyle = "#090608";
    ctx.fillRect(0, 0, size, size);

    // Soft vertical sheen so the fabric is not a flat black.
    const sheen = ctx.createLinearGradient(0, 0, 0, size);
    sheen.addColorStop(0, "rgba(96,14,20,0.32)");
    sheen.addColorStop(0.45, "rgba(24,7,12,0.12)");
    sheen.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, size, size);

    const blobs: Array<[number, number, number]> = [
      [-0.3, 0.1, 0.3],
      [0.16, -0.02, 0.36],
      [0.3, 0.24, 0.22],
      [-0.12, 0.3, 0.2],
    ];

    const drawCloud = (cx: number, cy: number, scale: number) => {
      // Bone-coloured rim first, red fill second — the fill covers every
      // interior edge, leaving only a clean outline.
      ctx.fillStyle = "rgba(233,228,223,0.82)";
      blobs.forEach(([bx, by, r]) => {
        ctx.beginPath();
        ctx.arc(cx + bx * 100 * scale, cy + by * 100 * scale, (r * 100 + 9) * scale, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "rgba(179,17,21,0.9)";
      blobs.forEach(([bx, by, r]) => {
        ctx.beginPath();
        ctx.arc(cx + bx * 100 * scale, cy + by * 100 * scale, r * 100 * scale, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    (
      [
        [196, 292, 1.0],
        [648, 236, 0.86],
        [418, 470, 1.12],
        [868, 566, 0.78],
        [150, 706, 0.92],
        [704, 792, 1.0],
      ] as Array<[number, number, number]>
    ).forEach(([x, y, s]) => drawCloud(x, y, s));

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 4;
    return texture;
  }, []);
}

/** A soft radial sprite used for the eye bloom. */
function useEyeGlowTexture(): THREE.CanvasTexture {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      g.addColorStop(0, "rgba(255,130,130,0.95)");
      g.addColorStop(0.34, "rgba(214,31,38,0.5)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
}

/** The cloak profile — revolved around Y to build the garment in one mesh. */
function useCloakGeometry(): THREE.LatheGeometry {
  return useMemo(() => {
    const profile = [
      new THREE.Vector2(0.66, 0.0),
      new THREE.Vector2(0.69, 0.12),
      new THREE.Vector2(0.64, 0.36),
      new THREE.Vector2(0.56, 0.74),
      new THREE.Vector2(0.47, 1.08),
      new THREE.Vector2(0.4, 1.34),
      new THREE.Vector2(0.37, 1.5),
      new THREE.Vector2(0.46, 1.62),
      new THREE.Vector2(0.31, 1.72),
      new THREE.Vector2(0.21, 1.76),
    ];
    const geometry = new THREE.LatheGeometry(profile, 64);
    geometry.computeVertexNormals();
    return geometry;
  }, []);
}

/* -------------------------------------------------------------------------- */
/*  Figure                                                                    */
/* -------------------------------------------------------------------------- */

export default function UchihaFigure({
  position = [0, 0, 0],
  scale = 1,
}: {
  position?: [number, number, number];
  scale?: number;
}) {
  const root = useRef<THREE.Group>(null);
  const cloakGeometry = useCloakGeometry();
  const cloakTexture = useCloakTexture();
  const eyeGlowTexture = useEyeGlowTexture();

  const clothMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#0b0709",
        roughness: 0.74,
        metalness: 0.14,
        emissive: new THREE.Color("#260307"),
        emissiveIntensity: 0.32,
      }),
    [],
  );

  const cloakMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: cloakTexture ?? undefined,
        color: cloakTexture ? "#ffffff" : "#0a0709",
        roughness: 0.7,
        metalness: 0.18,
        emissive: new THREE.Color("#2a0306"),
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide,
      }),
    [cloakTexture],
  );

  const hairMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#070509", roughness: 0.92, metalness: 0.05 }),
    [],
  );

  const skinMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#241a19", roughness: 0.8, metalness: 0.05 }),
    [],
  );

  const eyeMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a0407",
        emissive: new THREE.Color("#ff2f2f"),
        emissiveIntensity: 1.3,
        roughness: 0.2,
        metalness: 0.3,
      }),
    [],
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: eyeGlowTexture,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [eyeGlowTexture],
  );

  // Release everything we allocated, once, on unmount.
  useEffect(
    () => () => {
      cloakGeometry.dispose();
      cloakTexture?.dispose();
      eyeGlowTexture.dispose();
      clothMaterial.dispose();
      cloakMaterial.dispose();
      hairMaterial.dispose();
      skinMaterial.dispose();
      eyeMaterial.dispose();
      glowMaterial.dispose();
    },
    [
      cloakGeometry,
      cloakTexture,
      eyeGlowTexture,
      clothMaterial,
      cloakMaterial,
      hairMaterial,
      skinMaterial,
      eyeMaterial,
      glowMaterial,
    ],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    const g = root.current;
    if (g) {
      // Idle: a slow turn, a whisper of sway, and a breathing float.
      g.rotation.y = -0.16 + Math.sin(t * 0.22) * 0.05;
      g.rotation.z = Math.sin(t * 0.34) * 0.008;
      g.position.y = Math.sin(t * 0.62) * 0.022;
    }

    // The eyes answer the pointer — a subtle Mangekyo activation.
    const proximity = Math.min(1, Math.hypot(state.pointer.x, state.pointer.y));
    const pulse = 1 + Math.sin(t * 1.7) * 0.14;
    eyeMaterial.emissiveIntensity = (0.95 + proximity * 1.5) * pulse;
    glowMaterial.opacity = 0.3 + proximity * 0.42;
  });

  return (
    <group position={position} scale={scale}>
      <group ref={root}>
        {/* Cloak — one lathe mesh carries the whole garment and its motifs. */}
        <mesh geometry={cloakGeometry} material={cloakMaterial} />

        {/* Shoulders give the cloak a top edge rather than a cut-off cone. */}
        <mesh position={[0.31, 1.6, 0.04]} material={clothMaterial}>
          <sphereGeometry args={[0.141, 24, 24]} />
        </mesh>
        <mesh position={[-0.31, 1.6, 0.04]} material={clothMaterial}>
          <sphereGeometry args={[0.141, 24, 24]} />
        </mesh>

        {/* High collar. */}
        <mesh position={[0, 1.71, 0]} material={clothMaterial}>
          <cylinderGeometry args={[0.29, 0.23, 0.36, 40, 1, true]} />
        </mesh>

        {/* Arms folded across the chest. */}
        <mesh position={[0, 1.31, 0.36]} rotation={[0.06, 0, 0.6]} material={clothMaterial}>
          <capsuleGeometry args={[0.1, 0.6, 8, 18]} />
        </mesh>
        <mesh position={[0, 1.22, 0.38]} rotation={[0.04, 0, -0.52]} material={clothMaterial}>
          <capsuleGeometry args={[0.1, 0.54, 8, 18]} />
        </mesh>
        <mesh position={[0.3, 1.29, 0.4]} material={clothMaterial}>
          <sphereGeometry args={[0.075, 18, 18]} />
        </mesh>
        <mesh position={[-0.28, 1.23, 0.41]} material={clothMaterial}>
          <sphereGeometry args={[0.075, 18, 18]} />
        </mesh>

        {/* Hair mass behind the head, then the face. */}
        <mesh position={[0, 1.79, -0.02]} scale={[1.06, 1.24, 1.06]} material={hairMaterial}>
          <sphereGeometry args={[0.185, 28, 28]} />
        </mesh>
        <mesh position={[0, 1.84, 0.03]} scale={[0.96, 1.06, 0.96]} material={skinMaterial}>
          <sphereGeometry args={[0.16, 28, 28]} />
        </mesh>

        {/* Long strands framing the face. */}
        <mesh position={[0.15, 1.62, 0.07]} rotation={[0.08, 0, 0.17]} material={hairMaterial}>
          <capsuleGeometry args={[0.045, 0.52, 6, 14]} />
        </mesh>
        <mesh position={[-0.15, 1.62, 0.07]} rotation={[0.08, 0, -0.17]} material={hairMaterial}>
          <capsuleGeometry args={[0.045, 0.52, 6, 14]} />
        </mesh>

        {/* The eyes — two embers under the brow. */}
        <mesh position={[0.058, 1.85, 0.145]} material={eyeMaterial}>
          <sphereGeometry args={[0.024, 18, 18]} />
        </mesh>
        <mesh position={[-0.058, 1.85, 0.145]} material={eyeMaterial}>
          <sphereGeometry args={[0.024, 18, 18]} />
        </mesh>

        {/* Bloom behind each eye. */}
        <mesh position={[0.058, 1.85, 0.16]} material={glowMaterial}>
          <planeGeometry args={[0.19, 0.19]} />
        </mesh>
        <mesh position={[-0.058, 1.85, 0.16]} material={glowMaterial}>
          <planeGeometry args={[0.19, 0.19]} />
        </mesh>
      </group>
    </group>
  );
}
