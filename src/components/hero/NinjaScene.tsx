import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { useDeviceTier, usePrefersReducedMotion } from "../../lib/hooks";
import Sharingan from "./Sharingan";
import UchihaFigure from "./UchihaFigure";

/**
 * ============================================================================
 *  NINJA SCENE — real-time WebGL hero
 * ============================================================================
 *  A genuine three.js scene rendered through react-three-fiber:
 *
 *    • a full 3D Mangekyo Sharingan — extruded tomoe blades on real rings,
 *      lit from behind, slowly counter-rotating in perspective
 *    • a procedurally built Uchiha figure standing in front of the eye
 *      (`UchihaFigure`) — cloak, red cloud motifs and glowing eyes
 *    • a swarm of crows flying on elliptical paths through the volume
 *    • a drifting ember field for atmosphere
 *    • optional drop-in character model: put any .glb at
 *      `public/assets/models/hero.glb` and it is loaded, framed and rotated
 *      automatically, taking the place of the procedural figure.
 *
 *  Everything is procedural, so there are no binary assets to fetch, and the
 *  whole thing degrades to a canvas-free fallback on low-end or
 *  reduced-motion devices (see `Hero`).
 * ============================================================================
 */

/** Where a drop-in character model is looked for at runtime. */
export const MODEL_URL = `${import.meta.env.BASE_URL}assets/models/hero.glb`;

/* -------------------------------------------------------------------------- */
/*  Textures — generated on the fly so nothing has to be downloaded           */
/* -------------------------------------------------------------------------- */

type Stop = [number, string];

const IRIS_STOPS: Stop[] = [
  [0, "rgba(255,214,210,0.95)"],
  [0.16, "rgba(224,23,28,0.85)"],
  [0.46, "rgba(140,11,16,0.55)"],
  [0.78, "rgba(58,4,7,0.35)"],
  [1, "rgba(5,3,4,0)"],
];

const GLOW_STOPS: Stop[] = [
  [0, "rgba(214,31,38,0.55)"],
  [0.4, "rgba(140,11,16,0.22)"],
  [1, "rgba(0,0,0,0)"],
];

const EMBER_STOPS: Stop[] = [
  [0, "rgba(255,190,180,1)"],
  [0.3, "rgba(214,31,38,0.7)"],
  [1, "rgba(0,0,0,0)"],
];

/** Radial-gradient sprite generated on the canvas — nothing to download. */
function useRadialTexture(stops: Stop[], size = 256) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      stops.forEach(([offset, color]) => g.addColorStop(offset, color));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [size, stops]);
}

/* -------------------------------------------------------------------------- */
/*  Mangekyo Sharingan — the centrepiece                                      */
/* -------------------------------------------------------------------------- */

function Tomoe({ radius }: { radius: number }) {
  /**
   * A magatama is a comma: a thick tapering arc with a ball at its head.
   * Building it from a real torus segment + sphere keeps it genuinely 3D
   * (it has volume, catches the rim light and reads correctly from any angle).
   */
  const geometry = useMemo(() => new THREE.TorusGeometry(radius, radius * 0.17, 20, 64, Math.PI * 1.15), [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} position={[0, 0, 0]}>
        <meshStandardMaterial color="#16060a" roughness={0.35} metalness={0.55} emissive="#4a0308" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[radius, 0, 0]}>
        <sphereGeometry args={[radius * 0.26, 24, 24]} />
        <meshStandardMaterial color="#2a0409" roughness={0.2} metalness={0.4} emissive="#7d0a10" emissiveIntensity={1.1} />
      </mesh>
    </group>
  );
}

function Mangekyo({ scale = 1 }: { scale?: number }) {
  const group = useRef<THREE.Group>(null);
  const tomoe = useRef<THREE.Group>(null);
  const iris = useRadialTexture(IRIS_STOPS);
  const glow = useRadialTexture(GLOW_STOPS);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.z = Math.sin(t * 0.09) * 0.16;
      group.current.position.y = Math.sin(t * 0.32) * 0.09;
    }
    if (tomoe.current) tomoe.current.rotation.z += delta * 0.14;
  });

  return (
    <group ref={group} scale={scale}>
      {/* Bloom card behind the eye — cheap volumetric glow, no post-processing. */}
      <mesh position={[0, 0, -1.4]} scale={5.4}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* The lit iris itself. */}
      <mesh>
        <circleGeometry args={[2.1, 96]} />
        <meshBasicMaterial map={iris} transparent depthWrite={false} />
      </mesh>

      {/* Real geometry rings, each on its own plane for parallax. */}
      <mesh position={[0, 0, 0.06]}>
        <torusGeometry args={[2.08, 0.012, 12, 200]} />
        <meshStandardMaterial color="#3a0407" emissive="#b31115" emissiveIntensity={1.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.12]}>
        <torusGeometry args={[1.58, 0.022, 14, 200]} />
        <meshStandardMaterial color="#1e0203" emissive="#8c0b10" emissiveIntensity={0.9} roughness={0.3} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <torusGeometry args={[0.94, 0.018, 14, 160]} />
        <meshStandardMaterial color="#1e0203" emissive="#d61f26" emissiveIntensity={0.7} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* Three tomoe, 120° apart — the signature Mangekyo pattern. */}
      <group ref={tomoe} position={[0, 0, 0.24]}>
        {[0, 120, 240].map((angle) => (
          <group key={angle} rotation={[0, 0, THREE.MathUtils.degToRad(angle)]}>
            <Tomoe radius={1.16} />
          </group>
        ))}
      </group>

      {/* Pupil + inner halo. */}
      <mesh position={[0, 0, 0.3]}>
        <sphereGeometry args={[0.34, 32, 32]} />
        <meshStandardMaterial color="#120205" roughness={0.08} metalness={0.9} emissive="#e0171c" emissiveIntensity={1.6} />
      </mesh>
      <mesh position={[0, 0, 0.34]}>
        <torusGeometry args={[0.52, 0.01, 10, 96]} />
        <meshBasicMaterial color="#ff6a6a" transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Crow swarm                                                                */
/* -------------------------------------------------------------------------- */

function CrowSwarm({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const wing = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.5, 0.42, 1.15, 0.06);
    shape.quadraticCurveTo(0.6, 0.02, 0, -0.16);
    shape.quadraticCurveTo(-0.6, 0.02, -1.15, 0.06);
    shape.quadraticCurveTo(-0.5, 0.42, 0, 0);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: 14,
    });
    geo.center();
    return geo;
  }, []);

  const crows = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const seed = i * 2.399;
        return {
          radiusX: 3.4 + ((i * 1.7) % 3.6),
          radiusY: 1.7 + ((i * 0.9) % 2.1),
          radiusZ: 1.9 + ((i * 2.3) % 3.2),
          speed: 0.13 + ((i % 5) * 0.035),
          phase: seed,
          size: 0.24 + ((i % 4) * 0.07),
          spin: 0.3 + ((i % 3) * 0.25),
        };
      }),
    [count],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const c = crows[i];
      if (!c) return;
      const a = t * c.speed + c.phase;
      child.position.set(
        Math.cos(a) * c.radiusX,
        Math.sin(a * 1.28 + c.phase) * c.radiusY,
        Math.sin(a) * c.radiusZ,
      );
      child.rotation.set(Math.sin(a * 1.7) * 0.5, -a + Math.PI / 2, Math.sin(a * 2.1) * c.spin);
    });
  });

  return (
    <group ref={group}>
      {crows.map((c, i) => (
        <mesh key={i} geometry={wing} scale={c.size}>
          <meshStandardMaterial color="#0b0508" roughness={0.85} metalness={0.15} emissive="#2a0306" emissiveIntensity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ember field                                                               */
/* -------------------------------------------------------------------------- */

function EmberField({ count }: { count: number }) {
  const points = useRef<THREE.Points>(null);
  const sprite = useRadialTexture(EMBER_STOPS);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 9 - 1;
      speeds[i] = 0.16 + Math.random() * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geo, positions, speeds };
  }, [count]);

  useFrame((state, delta) => {
    const { positions, speeds } = geometry;
    for (let i = 0; i < count; i++) {
      const y = i * 3 + 1;
      positions[y] += speeds[i] * delta;
      if (positions[y] > 5.5) positions[y] = -5.5;
    }
    geometry.geo.attributes.position.needsUpdate = true;
    if (points.current) points.current.rotation.y = state.clock.elapsedTime * 0.02;
  });

  useEffect(() => () => geometry.geo.dispose(), [geometry]);

  return (
    <points ref={points} geometry={geometry.geo}>
      <pointsMaterial
        map={sprite}
        size={0.16}
        sizeAttenuation
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        color="#ff6a6a"
      />
    </points>
  );
}

/* -------------------------------------------------------------------------- */
/*  Drop-in character model                                                   */
/* -------------------------------------------------------------------------- */

function DropInModel({ url, side }: { url: string; side: 1 | -1 }) {
  const gltf = useLoader(GLTFLoader, url);
  const group = useRef<THREE.Group>(null);

  // Frame whatever came in: normalise to a known height and centre it.
  const prepared = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const target = 4.1;
    const s = size.y > 0 ? target / size.y : 1;
    scene.position.sub(center);
    scene.position.y += 0.1;
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return { scene, scale: s };
  }, [gltf]);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    g.rotation.y += delta * 0.16;
    g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.12;
  });

  return (
    <group ref={group} position={[side * 2.55, -0.35, 1.1]} scale={prepared.scale}>
      <primitive object={prepared.scene} />
    </group>
  );
}

/* -------------------------------------------------------------------------- */
/*  Camera rig — pointer parallax with damping                                */
/* -------------------------------------------------------------------------- */

function Rig({ intensity }: { intensity: number }) {
  useFrame((state, delta) => {
    const k = 1 - Math.pow(0.0025, delta);
    const targetX = state.pointer.x * 0.5 * intensity;
    const targetY = state.pointer.y * 0.28 * intensity;
    state.camera.position.x += (targetX - state.camera.position.x) * k;
    state.camera.position.y += (targetY - state.camera.position.y) * k;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

/* -------------------------------------------------------------------------- */
/*  Scene                                                                     */
/* -------------------------------------------------------------------------- */

function Scene({
  tier,
  modelUrl,
}: {
  tier: "low" | "mid" | "high";
  modelUrl: string | null;
}) {
  const crows = tier === "high" ? 16 : tier === "mid" ? 11 : 7;
  const embers = tier === "high" ? 220 : tier === "mid" ? 130 : 70;

  return (
    <>
      <fog attach="fog" args={["#050304", 7, 18]} />

      <ambientLight intensity={0.26} color="#3a1b20" />
      <pointLight position={[-6, 2, 4]} intensity={38} distance={22} color="#d61f26" />
      <pointLight position={[5, -3, 3]} intensity={22} distance={18} color="#8c0b10" />
      {/* Cold rim light so the silhouettes separate from the background. */}
      <directionalLight position={[3, 6, -6]} intensity={0.7} color="#9fb0d0" />
      {/* Modest front fill: the character is near-black cloth, so it needs
          enough edge light to read without lifting the mood. */}
      <pointLight position={[1.8, 1.4, 4.4]} intensity={13} distance={15} color="#b9c4dd" />

      {/* The eye sits behind the character as a halo, not a lone circle. */}
      <group position={[-1.15, 0.62, -2.7]} rotation={[0, -0.42, 0.06]}>
        <Mangekyo scale={tier === "low" ? 0.86 : 1.02} />
      </group>

      <CrowSwarm count={crows} />
      <EmberField count={embers} />

      {modelUrl ? (
        <Suspense fallback={null}>
          <DropInModel url={modelUrl} side={1} />
        </Suspense>
      ) : (
        <UchihaFigure position={[0.42, -1.98, 0.7]} scale={1.45} />
      )}

      <Rig intensity={tier === "low" ? 0.5 : 1} />
    </>
  );
}

/* -------------------------------------------------------------------------- */
/*  Public component                                                          */
/* -------------------------------------------------------------------------- */

export default function NinjaScene({ className = "" }: { className?: string }) {
  const tier = useDeviceTier();
  const reduced = usePrefersReducedMotion();
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  // WebGL availability check — never mount a canvas we cannot render.
  const [webgl, setWebgl] = useState(false);
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const ok = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
      setWebgl(ok);
    } catch {
      setWebgl(false);
    }
  }, []);

  /**
   * Optional model: `public/assets/models/hero.glb`. We probe for it so a
   * missing file costs one 404 rather than crashing the scene.
   */
  useEffect(() => {
    let cancelled = false;
    fetch(MODEL_URL, { method: "HEAD" })
      .then((res) => {
        const type = res.headers.get("content-type") ?? "";
        // Dev servers answer 200 with text/html for unknown paths.
        if (res.ok && !type.includes("text/html")) {
          if (!cancelled) setModelUrl(MODEL_URL);
        }
      })
      .catch(() => {
        /* no model — the procedural scene stands on its own */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Graceful degradation: reduced-motion users, machines without WebGL and
   * renderer failures all fall back to the vector Mangekyo, so the hero is
   * never empty and never janky.
   */
  if (reduced || !webgl || failed) {
    return (
      <div className={`${className} relative flex items-center justify-center`} aria-hidden="true">
        {/* The vector Mangekyo still glows behind the figure. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="aspect-square w-[82%] max-w-[540px] opacity-50">
            <Sharingan />
          </div>
        </div>
        {/* The cloaked silhouette keeps the character dominant without WebGL. */}
        <img
          src={`${import.meta.env.BASE_URL}assets/hero-shadow.svg`}
          alt=""
          aria-hidden="true"
          className="relative h-[94%] w-auto max-w-[92%] object-contain opacity-95"
          decoding="async"
        />
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <Canvas
        dpr={tier === "high" ? [1, 1.9] : [1, 1.5]}
        camera={{ position: [0, 0, 7.6], fov: tier === "low" ? 52 : 46 }}
        gl={{ antialias: tier !== "low", alpha: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        onError={() => setFailed(true)}
      >
        <Scene tier={tier} modelUrl={modelUrl} />
      </Canvas>
    </div>
  );
}
