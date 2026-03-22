// ──────────────────────────────────────────────
// ThreeBackground.jsx — Fullscreen particle network
// Uses @react-three/fiber Canvas + raw Three.js logic
// Group rotation (not camera), mouse repulsion
// ──────────────────────────────────────────────

import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const PARTICLE_COUNT  = 800;
const SPREAD_X        = 400;
const SPREAD_Y        = 300;
const SPREAD_Z        = 200;
const DOT_SIZE        = 1.5;
const LINE_THRESHOLD  = 120;
const REPEL_RADIUS    = 150;
const REPEL_FORCE     = 0.03;
const GROUP_ROTATE_Y  = 0.0008;

const COLOR_A = new THREE.Color(0x6c63ff);
const COLOR_B = new THREE.Color(0x00d4ff);

function ParticleSystem() {
  const groupRef = useRef();
  const pointsRef = useRef();
  const linesRef = useRef();
  const { camera } = useThree();

  const mouseRef = useRef({ x: 9999, y: 9999 });

  // Build initial data
  const { posArr, colorArr, positions, velocities, phases } = useMemo(() => {
    const posArr     = new Float32Array(PARTICLE_COUNT * 3);
    const colorArr   = new Float32Array(PARTICLE_COUNT * 3);
    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const phases     = new Float32Array(PARTICLE_COUNT);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * SPREAD_X * 2;
      positions[i3 + 1] = (Math.random() - 0.5) * SPREAD_Y * 2;
      positions[i3 + 2] = (Math.random() - 0.5) * SPREAD_Z * 2;
      posArr[i3]     = positions[i3];
      posArr[i3 + 1] = positions[i3 + 1];
      posArr[i3 + 2] = positions[i3 + 2];
      velocities[i3]     = (Math.random() - 0.5) * 0.12;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.12;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.04;
      phases[i] = Math.random() * Math.PI * 2;

      const t   = i / PARTICLE_COUNT;
      const col = COLOR_A.clone().lerp(COLOR_B, t);
      colorArr[i3]     = col.r;
      colorArr[i3 + 1] = col.g;
      colorArr[i3 + 2] = col.b;
    }
    return { posArr, colorArr, positions, velocities, phases };
  }, []);

  // Line geometry arrays
  const maxSegments = PARTICLE_COUNT * 8;
  const linePosArr = useMemo(() => new Float32Array(maxSegments * 6), [maxSegments]);
  const lineColArr = useMemo(() => new Float32Array(maxSegments * 6), [maxSegments]);

  // Mouse tracking
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const _v3   = useMemo(() => new THREE.Vector3(), []);
  const _proj = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    if (!pointsRef.current || !linesRef.current || !groupRef.current) return;

    const time = performance.now() * 0.001;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const mouse = mouseRef.current;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      positions[i3]     += velocities[i3]     + Math.sin(time + phases[i]) * 0.06;
      positions[i3 + 1] += velocities[i3 + 1] + Math.cos(time + phases[i]) * 0.06;
      positions[i3 + 2] += velocities[i3 + 2];

      if (positions[i3]     >  SPREAD_X) velocities[i3]     = -Math.abs(velocities[i3]);
      if (positions[i3]     < -SPREAD_X) velocities[i3]     =  Math.abs(velocities[i3]);
      if (positions[i3 + 1] >  SPREAD_Y) velocities[i3 + 1] = -Math.abs(velocities[i3 + 1]);
      if (positions[i3 + 1] < -SPREAD_Y) velocities[i3 + 1] =  Math.abs(velocities[i3 + 1]);
      if (positions[i3 + 2] >  SPREAD_Z) velocities[i3 + 2] = -Math.abs(velocities[i3 + 2]);
      if (positions[i3 + 2] < -SPREAD_Z) velocities[i3 + 2] =  Math.abs(velocities[i3 + 2]);

      // Mouse repulsion
      if (mouse.x < 9000) {
        _v3.set(positions[i3], positions[i3 + 1], positions[i3 + 2]);
        groupRef.current.localToWorld(_v3);
        _proj.copy(_v3).project(camera);
        const sx = (_proj.x *  0.5 + 0.5) * window.innerWidth;
        const sy = (_proj.y * -0.5 + 0.5) * window.innerHeight;
        const dx = sx - mouse.x;
        const dy = sy - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const angle = Math.atan2(dy, dx);
          const push  = (REPEL_RADIUS - dist) * REPEL_FORCE;
          positions[i3]     += Math.cos(angle) * push;
          positions[i3 + 1] += Math.sin(angle) * push;
        }
      }

      posAttr.array[i3]     = positions[i3];
      posAttr.array[i3 + 1] = positions[i3 + 1];
      posAttr.array[i3 + 2] = positions[i3 + 2];
    }
    posAttr.needsUpdate = true;

    // Group rotation
    groupRef.current.rotation.y += GROUP_ROTATE_Y;

    // Update lines
    const linePosAttr = linesRef.current.geometry.attributes.position;
    const lineColAttr = linesRef.current.geometry.attributes.color;
    let vertIdx = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = positions[i * 3];
      const iy = positions[i * 3 + 1];
      const iz = positions[i * 3 + 2];
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const jx = positions[j * 3];
        const jy = positions[j * 3 + 1];
        const jz = positions[j * 3 + 2];
        const dx = ix - jx;
        const dy = iy - jy;
        const dz = iz - jz;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < LINE_THRESHOLD) {
          if (vertIdx + 6 > linePosAttr.array.length) break;
          const alpha = 1.0 - dist / LINE_THRESHOLD;
          linePosAttr.array[vertIdx]     = ix;
          linePosAttr.array[vertIdx + 1] = iy;
          linePosAttr.array[vertIdx + 2] = iz;
          linePosAttr.array[vertIdx + 3] = jx;
          linePosAttr.array[vertIdx + 4] = jy;
          linePosAttr.array[vertIdx + 5] = jz;
          const r = 0.42 * alpha, g = 0.39 * alpha, b = 1.0 * alpha;
          lineColAttr.array[vertIdx]     = r;
          lineColAttr.array[vertIdx + 1] = g;
          lineColAttr.array[vertIdx + 2] = b;
          lineColAttr.array[vertIdx + 3] = r;
          lineColAttr.array[vertIdx + 4] = g;
          lineColAttr.array[vertIdx + 5] = b;
          vertIdx += 6;
        }
      }
      if (vertIdx + 6 > linePosAttr.array.length) break;
    }
    linesRef.current.geometry.setDrawRange(0, vertIdx / 3);
    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={posArr}
            count={PARTICLE_COUNT}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={colorArr}
            count={PARTICLE_COUNT}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={DOT_SIZE}
          vertexColors
          transparent
          opacity={0.85}
          depthWrite={false}
          sizeAttenuation
        />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={linePosArr}
            count={linePosArr.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={lineColArr}
            count={lineColArr.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial vertexColors transparent opacity={0.35} depthWrite={false} />
      </lineSegments>
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="three-bg-container">
      <Canvas
        camera={{ position: [0, 0, 600], fov: 60, near: 1, far: 2000 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ParticleSystem />
      </Canvas>
    </div>
  );
}
