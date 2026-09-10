'use client';
/**
 * The sunbeam — a quiet Three.js canvas of flour-dust motes drifting in
 * warm kitchen light, behind the hero. Gentle, cheap (points only), and
 * it steps aside for prefers-reduced-motion.
 */
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

function makeDustTexture(): THREE.Texture {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 244, 222, 0.9)');
  g.addColorStop(0.4, 'rgba(255, 230, 190, 0.35)');
  g.addColorStop(1, 'rgba(255, 230, 190, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

export function AmbientKitchen({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const COUNT = 340;
    const positions = new Float32Array(COUNT * 3);
    const seeds = new Float32Array(COUNT * 4);
    for (let i = 0; i < COUNT; i++) {
      // a soft cloud biased toward the light (upper-left)
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 9 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      seeds[i * 4] = Math.random() * Math.PI * 2;
      seeds[i * 4 + 1] = 0.15 + Math.random() * 0.5; // speed
      seeds[i * 4 + 2] = 0.4 + Math.random() * 0.9; // size
      seeds[i * 4 + 3] = Math.random(); // warm hue bias
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.14,
      map: makeDustTexture(),
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color('#ffdfae'),
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // a few bigger, slower "steam" motes
    const SMOKE = 26;
    const sPos = new Float32Array(SMOKE * 3);
    const sSeeds = new Float32Array(SMOKE * 4);
    for (let i = 0; i < SMOKE; i++) {
      sPos[i * 3] = (Math.random() - 0.5) * 14;
      sPos[i * 3 + 1] = -3 + Math.random() * 7;
      sPos[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
      sSeeds[i * 4] = Math.random() * Math.PI * 2;
      sSeeds[i * 4 + 1] = 0.05 + Math.random() * 0.12;
      sSeeds[i * 4 + 2] = 1.6 + Math.random() * 2.4;
      sSeeds[i * 4 + 3] = Math.random();
    }
    const sGeo = new THREE.BufferGeometry();
    sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3));
    const sMat = new THREE.PointsMaterial({
      size: 0.5,
      map: makeDustTexture(),
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: new THREE.Color('#ffe9c4'),
      sizeAttenuation: true,
    });
    const smoke = new THREE.Points(sGeo, sMat);
    scene.add(smoke);

    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMouse = (e: MouseEvent) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouse, { passive: true });

    let raf = 0;
    let visible = true;
    const onVis = () => { visible = !document.hidden; };
    document.addEventListener('visibilitychange', onVis);

    const clock = new THREE.Clock();
    const drift = (arr: Float32Array, sd: Float32Array, t: number, amp: number) => {
      for (let i = 0; i < arr.length / 3; i++) {
        const ph = sd[i * 4];
        const sp = sd[i * 4 + 1];
        arr[i * 3] += Math.sin(t * sp + ph) * 0.0025 * amp + 0.0012 * amp;
        arr[i * 3 + 1] += Math.cos(t * sp * 0.8 + ph) * 0.0018 * amp + 0.0008 * amp;
        // wrap
        if (arr[i * 3] > 9) arr[i * 3] = -9;
        if (arr[i * 3 + 1] > 5.5) arr[i * 3 + 1] = -5.5;
      }
    };

    const animate = () => {
      raf = requestAnimationFrame(animate);
      if (!visible) return;
      const t = clock.getElapsedTime();
      mouse.x += (mouse.tx - mouse.x) * 0.03;
      mouse.y += (mouse.ty - mouse.y) * 0.03;

      drift(positions, seeds, t, 1);
      drift(sPos, sSeeds, t, 0.5);
      (geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      (sGeo.attributes.position as THREE.BufferAttribute).needsUpdate = true;

      // slow sway + mouse parallax; evening light drifts warmer
      points.rotation.z = Math.sin(t * 0.05) * 0.03 + mouse.x * 0.02;
      points.position.x = mouse.x * 0.6;
      points.position.y = -mouse.y * 0.35;
      smoke.rotation.z = Math.sin(t * 0.04 + 2) * 0.02;
      smoke.position.x = mouse.x * 0.3;

      const evening = document.documentElement.classList.contains('evening');
      mat.color.lerp(new THREE.Color(evening ? '#ffb35c' : '#ffdfae'), 0.02);
      mat.opacity += ((evening ? 0.9 : 0.75) - mat.opacity) * 0.02;

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = host.clientWidth, h = host.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(host);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMouse);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
      geo.dispose(); sGeo.dispose(); mat.dispose(); sMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 ${className}`} />;
}
