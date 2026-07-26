import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Draws the front face of the card: name, role, and a small bar-chart glyph —
// exactly the kind of "at a glance" identity card a data analyst would want.
function drawFrontTexture(profile) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#0f2b29');
  bg.addColorStop(1, '#123a37');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid, echoes the dashboard/BI theme of the rest of the site.
  ctx.strokeStyle = 'rgba(63, 224, 176, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Corner accent border.
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.fillStyle = '#eef7f5';
  ctx.font = '700 64px Inter, sans-serif';
  ctx.fillText(profile.name || 'Krishna Yadav', 60, 150);

  ctx.fillStyle = '#3fe0b0';
  ctx.font = '600 34px Inter, sans-serif';
  ctx.fillText((profile.role || 'Data Analyst').split('|')[0].trim(), 60, 205);

  // Mini bar-chart glyph, bottom-left — a nod to dashboards/BI work.
  const bars = [0.4, 0.65, 0.5, 0.85, 0.7, 0.95];
  const barWidth = 34;
  const gap = 14;
  const baseY = 560;
  const maxH = 220;
  bars.forEach((h, i) => {
    const x = 60 + i * (barWidth + gap);
    const height = h * maxH;
    const grad = ctx.createLinearGradient(0, baseY - height, 0, baseY);
    grad.addColorStop(0, '#d9a441');
    grad.addColorStop(1, '#1d6b66');
    ctx.fillStyle = grad;
    ctx.fillRect(x, baseY - height, barWidth, height);
  });

  ctx.fillStyle = 'rgba(238, 247, 245, 0.65)';
  ctx.font = '500 26px Inter, sans-serif';
  ctx.fillText('Dashboards · SQL · Python · Automation', 60, 610);

  return canvas;
}

// Back face: quick stack + stats, like the back of a badge.
function drawBackTexture(profile) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  bg.addColorStop(0, '#122024');
  bg.addColorStop(1, '#0f2b29');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#1d6b66';
  ctx.lineWidth = 6;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  ctx.fillStyle = '#eef7f5';
  ctx.font = '700 44px Inter, sans-serif';
  ctx.fillText('Tech Stack', 60, 110);

  const stack = ['Python', 'SQL', 'Power BI', 'React', 'Node.js', 'Pandas'];
  const chipY = 160;
  const chipH = 58;
  let cx = 60;
  let cy = chipY;
  ctx.font = '600 30px Inter, sans-serif';
  stack.forEach((label) => {
    const textWidth = ctx.measureText(label).width;
    const chipW = textWidth + 48;
    if (cx + chipW > canvas.width - 60) {
      cx = 60;
      cy += chipH + 20;
    }
    ctx.fillStyle = 'rgba(63, 224, 176, 0.14)';
    ctx.strokeStyle = '#3fe0b0';
    ctx.lineWidth = 2;
    roundRect(ctx, cx, cy, chipW, chipH, 16);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eef7f5';
    ctx.fillText(label, cx + 24, cy + 39);
    cx += chipW + 18;
  });

  const metrics = Array.isArray(profile.metrics) ? profile.metrics.slice(0, 3) : [];
  const statsY = 470;
  const colW = (canvas.width - 120) / Math.max(metrics.length, 1);
  metrics.forEach((metric, i) => {
    const x = 60 + i * colW;
    ctx.fillStyle = '#d9a441';
    ctx.font = '700 52px Inter, sans-serif';
    ctx.fillText(String(metric.value), x, statsY);
    ctx.fillStyle = 'rgba(238, 247, 245, 0.65)';
    ctx.font = '500 22px Inter, sans-serif';
    wrapText(ctx, metric.label, x, statsY + 40, colW - 20, 26);
  });

  ctx.fillStyle = 'rgba(238, 247, 245, 0.45)';
  ctx.font = '500 22px Inter, sans-serif';
  ctx.fillText('Drag to spin · auto-rotates', 60, 600);

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  let cursorY = y;
  words.forEach((word, i) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
    } else {
      line = test;
    }
    if (i === words.length - 1) ctx.fillText(line, x, cursorY);
  });
}

export default function TechStackCard3D({ profile }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    // Lighting: a warm key light + a cool teal rim light to match the site palette.
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const keyLight = new THREE.DirectionalLight(0xd9a441, 1.1);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x3fe0b0, 0.9);
    rimLight.position.set(-5, -3, -4);
    scene.add(rimLight);

    const frontTexture = new THREE.CanvasTexture(drawFrontTexture(profile));
    const backTexture = new THREE.CanvasTexture(drawBackTexture(profile));
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.colorSpace = THREE.SRGBColorSpace;

    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1d6b66,
      metalness: 0.35,
      roughness: 0.45,
    });
    const frontMaterial = new THREE.MeshStandardMaterial({ map: frontTexture, roughness: 0.35 });
    const backMaterial = new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.35 });

    const geometry = new THREE.BoxGeometry(3.4, 2.1, 0.1);
    const card = new THREE.Mesh(geometry, [
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      edgeMaterial,
      frontMaterial,
      backMaterial,
    ]);
    scene.add(card);

    let autoRotate = true;
    let velocityY = 0.006;
    let dragging = false;
    let lastX = 0;
    let idleTimer = null;
    let clock = new THREE.Clock();

    const resumeAutoRotateSoon = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        autoRotate = true;
      }, 1600);
    };

    const onPointerDown = (event) => {
      dragging = true;
      autoRotate = false;
      lastX = event.clientX ?? event.touches?.[0]?.clientX ?? 0;
      clearTimeout(idleTimer);
    };
    const onPointerMove = (event) => {
      if (!dragging) return;
      const clientX = event.clientX ?? event.touches?.[0]?.clientX ?? lastX;
      const deltaX = clientX - lastX;
      lastX = clientX;
      card.rotation.y += deltaX * 0.008;
      velocityY = deltaX * 0.0009;
    };
    const onPointerUp = () => {
      dragging = false;
      resumeAutoRotateSoon();
    };

    mount.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    mount.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const resize = () => {
      const { clientWidth, clientHeight } = mount;
      if (!clientWidth || !clientHeight) return;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      if (autoRotate) {
        card.rotation.y += velocityY;
        velocityY += (0.006 - velocityY) * 0.02; // settle back to a gentle spin
      } else if (!dragging) {
        card.rotation.y += velocityY;
        velocityY *= 0.94; // inertia after a flick
      }

      // Gentle float + tilt so it never looks static, even while auto-rotating.
      card.position.y = Math.sin(t * 0.9) * 0.08;
      card.rotation.x = Math.sin(t * 0.6) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(idleTimer);
      resizeObserver.disconnect();
      mount.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      mount.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      geometry.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      edgeMaterial.dispose();
      frontTexture.dispose();
      backTexture.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [profile]);

  return <div className="tech-card-3d" ref={mountRef} aria-label="Interactive 3D tech-stack card, drag to rotate" />;
}
