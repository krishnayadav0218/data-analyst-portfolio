import { useEffect, useRef } from 'react';
import './Hero3D.css';

// An advanced, dependency-free 3D data-network animation for the hero banner.
// A cloud of nodes sits inside a tilted "Saturn ring" of orbiting data points,
// everything rotated every frame with real perspective projection. Layered on
// top: a parallax starfield, glowing pulsing nodes, depth fog, periodic
// "data pulse" comets that race along the links, and a drag-to-spin control
// so visitors can grab the scene and turn it themselves.
const NODE_COUNT = 40;
const RING_COUNT = 34;
const STAR_COUNT = 80;
const FOCAL_LENGTH = 2.4;
const LINK_DISTANCE = 118;

function randomSpherePoint() {
  const u = Math.random();
  const v = Math.random();
  const theta = u * 2 * Math.PI;
  const phi = Math.acos(2 * v - 1);
  const radius = 0.5 + Math.random() * 0.4;
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.sin(phi) * Math.sin(theta),
    z: radius * Math.cos(phi),
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.6 + Math.random() * 0.8,
  };
}

function ringPoint(index) {
  const angle = (index / RING_COUNT) * Math.PI * 2;
  const radius = 0.98 + Math.sin(angle * 3) * 0.03;
  return {
    angle,
    radius,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.5 + Math.random() * 0.6,
  };
}

function randomStar() {
  return {
    x: Math.random(),
    y: Math.random(),
    depth: 0.25 + Math.random() * 0.75,
    twinklePhase: Math.random() * Math.PI * 2,
    twinkleSpeed: 0.4 + Math.random() * 1.1,
  };
}

export default function Hero3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = canvas?.parentElement;
    if (!canvas || !wrapper) return undefined;

    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let width = 0;
    let height = 0;
    let animId = null;
    let angleY = 0;
    let angleYVelocity = 0.16;
    let driftX = 0;
    let manualTiltX = 0;
    let elapsed = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetPointerX = 0;
    let targetPointerY = 0;
    let lastTime = performance.now();

    let isDragging = false;
    let dragLastX = 0;
    let dragLastY = 0;
    let dragVelocity = 0;

    const nodes = Array.from({ length: NODE_COUNT }, randomSpherePoint);
    const ring = Array.from({ length: RING_COUNT }, (_, i) => ringPoint(i));
    const stars = Array.from({ length: STAR_COUNT }, randomStar);
    const themeHost = document.querySelector('main') || document.body;

    // Active "data pulse" comets: each rides a specific edge between two
    // node indices from `t = 0` to `t = 1`.
    let pulses = [];
    let pulseCooldown = 1.2;

    function resize() {
      const rect = wrapper.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function getColors() {
      const styles = getComputedStyle(themeHost);
      return {
        teal: styles.getPropertyValue('--teal').trim() || '#1d6b66',
        gold: styles.getPropertyValue('--gold').trim() || '#d9a441',
      };
    }

    function rotate3D(x, y, z) {
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const x1 = x * cosY - z * sinY;
      const z1 = x * sinY + z * cosY;

      const angleX = 0.2 + driftX + manualTiltX;
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);
      const y1 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;

      return { x: x1, y: y1, z: z2 };
    }

    function project(point) {
      const rotated = rotate3D(point.x, point.y, point.z);
      const scale = FOCAL_LENGTH / (FOCAL_LENGTH + rotated.z);
      const spread = Math.min(width, height) * 0.44;
      return {
        x: width / 2 + (rotated.x + pointerX * 0.35) * scale * spread,
        y: height / 2 + (rotated.y + pointerY * 0.28) * scale * spread,
        scale,
        z: rotated.z,
      };
    }

    function projectRing(point) {
      const x = Math.cos(point.angle) * point.radius;
      const z = Math.sin(point.angle) * point.radius * 0.34;
      const y = Math.sin(point.angle) * 0.1;
      return project({ x, y, z });
    }

    function drawStars(dt) {
      stars.forEach((star) => {
        star.twinklePhase += dt * star.twinkleSpeed;
        const twinkle = 0.3 + 0.7 * ((Math.sin(star.twinklePhase) + 1) / 2);
        const x = (star.x + pointerX * 0.015 * star.depth) * width;
        const y = (star.y + pointerY * 0.012 * star.depth) * height;
        const radius = 0.4 + star.depth * 1.1;
        ctx.globalAlpha = twinkle * 0.32 * star.depth;
        ctx.fillStyle = '#e7c98a';
        ctx.beginPath();
        ctx.arc(((x % width) + width) % width, ((y % height) + height) % height, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function drawRing(dt, teal, gold) {
      const projected = ring.map(projectRing);
      const order = projected
        .map((point, index) => ({ point, index }))
        .sort((a, b) => a.point.z - b.point.z);

      order.forEach(({ point, index }) => {
        const node = ring[index];
        node.pulsePhase += dt * node.pulseSpeed;
        const pulse = 0.55 + 0.45 * ((Math.sin(node.pulsePhase) + 1) / 2);
        const behind = point.z < 0;
        const radius = (1.1 * point.scale + 0.4) * (behind ? 0.75 : 1);

        ctx.globalAlpha = Math.min(1, point.scale) * (behind ? 0.28 : 0.7) * pulse;
        ctx.fillStyle = index % 6 === 0 ? gold : teal;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function maybeSpawnPulse(edges) {
      pulseCooldown -= 1 / 60;
      if (pulseCooldown > 0 || edges.length === 0) return;
      pulseCooldown = 0.85 + Math.random() * 1.5;
      if (pulses.length >= 3) return;
      const edge = edges[Math.floor(Math.random() * edges.length)];
      pulses.push({ ...edge, t: 0, speed: 0.55 + Math.random() * 0.35 });
    }

    function drawPulses(projected, gold) {
      pulses = pulses.filter((pulse) => pulse.t <= 1);
      pulses.forEach((pulse) => {
        const a = projected[pulse.i];
        const b = projected[pulse.j];
        if (!a || !b) return;
        const x = a.x + (b.x - a.x) * pulse.t;
        const y = a.y + (b.y - a.y) * pulse.t;
        const glowRadius = 3.2 * ((a.scale + b.scale) / 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius * 3.2);
        gradient.addColorStop(0, gold);
        gradient.addColorStop(1, 'transparent');
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff8ea';
        ctx.beginPath();
        ctx.arc(x, y, glowRadius * 0.7, 0, Math.PI * 2);
        ctx.fill();

        pulse.t += pulse.speed / 60;
      });
      ctx.globalAlpha = 1;
    }

    function drawFrame(dt) {
      ctx.clearRect(0, 0, width, height);
      const { teal, gold } = getColors();

      drawStars(dt);

      pointerX += (targetPointerX - pointerX) * 0.05;
      pointerY += (targetPointerY - pointerY) * 0.05;

      drawRing(dt, teal, gold);

      const projected = nodes.map(project);
      const edges = [];

      for (let i = 0; i < projected.length; i += 1) {
        for (let j = i + 1; j < projected.length; j += 1) {
          const a = projected[i];
          const b = projected[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DISTANCE) {
            edges.push({ i, j });
            const depthFog = Math.min(1, (a.scale + b.scale) / 2);
            ctx.globalAlpha = (1 - dist / LINK_DISTANCE) * 0.18 * depthFog;
            ctx.strokeStyle = teal;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        node.pulsePhase += dt * node.pulseSpeed;
      });

      projected.forEach((point, index) => {
        const node = nodes[index];
        const pulse = 0.6 + 0.4 * ((Math.sin(node.pulsePhase) + 1) / 2);
        const baseRadius = 1.3 * point.scale + 0.5;
        const isGold = index % 5 === 0;
        const color = isGold ? gold : teal;

        // Soft outer glow so nodes read as luminous data points, not flat dots.
        const glow = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          baseRadius * 5 * pulse,
        );
        glow.addColorStop(0, color);
        glow.addColorStop(1, 'transparent');
        ctx.globalAlpha = Math.min(1, point.scale) * 0.22 * pulse;
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(point.x, point.y, baseRadius * 5 * pulse, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.globalAlpha = Math.min(1, point.scale) * (0.65 + 0.35 * pulse);
        ctx.arc(point.x, point.y, baseRadius * (0.85 + 0.3 * pulse), 0, Math.PI * 2);
        ctx.fill();
      });

      if (!prefersReducedMotion) {
        maybeSpawnPulse(edges);
        drawPulses(projected, gold);
      }

      ctx.globalAlpha = 1;
    }

    function tick(now) {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      if (!isDragging) {
        // Ease the spin speed back to its resting drift after a manual flick.
        angleYVelocity += (0.16 - angleYVelocity) * 0.02;
        angleY += dt * angleYVelocity;
        driftX = Math.sin(elapsed * 0.12) * 0.09;
      }

      drawFrame(dt);
      animId = requestAnimationFrame(tick);
    }

    function onPointerMove(event) {
      const rect = wrapper.getBoundingClientRect();
      targetPointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      targetPointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      if (isDragging) {
        const dx = event.clientX - dragLastX;
        const dy = event.clientY - dragLastY;
        angleY += dx * 0.006;
        manualTiltX = Math.max(-0.6, Math.min(0.6, manualTiltX + dy * 0.004));
        angleYVelocity = dx * 0.006;
        dragVelocity = dx * 0.006;
        dragLastX = event.clientX;
        dragLastY = event.clientY;
      }
    }

    function onPointerDown(event) {
      if (prefersReducedMotion) return;
      isDragging = true;
      dragLastX = event.clientX;
      dragLastY = event.clientY;
      canvas.classList.add('is-grabbing');
    }

    function endDrag() {
      if (!isDragging) return;
      isDragging = false;
      angleYVelocity = dragVelocity || angleYVelocity;
      canvas.classList.remove('is-grabbing');
    }

    resize();

    if (prefersReducedMotion) {
      drawFrame(0);
    } else {
      animId = requestAnimationFrame(tick);
      wrapper.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointerleave', endDrag);
    }

    window.addEventListener('resize', resize);

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      wrapper.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointerleave', endDrag);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero3d-canvas" aria-hidden="true" />;
}
