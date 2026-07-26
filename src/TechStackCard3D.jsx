import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const CARD_W = 3.4;
const CARD_H = 2.1;
const TEX_W = 1536;
const TEX_H = 950;

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

// Front face: a clean, editorial "ID card" layout — monogram, name, role,
// a small proof-of-work bar chart, and a foil-style divider line.
function drawFrontTexture(profile) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  bg.addColorStop(0, '#0c1f1e');
  bg.addColorStop(0.55, '#123330');
  bg.addColorStop(1, '#0a1e1d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Soft diagonal sheen — the thing that reads as "premium metal card"
  // rather than a flat poster.
  ctx.save();
  const sheen = ctx.createLinearGradient(0, 0, TEX_W, TEX_H * 0.6);
  sheen.addColorStop(0, 'rgba(255,255,255,0.05)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0.01)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.07)');
  sheen.addColorStop(0.65, 'rgba(255,255,255,0.01)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  ctx.restore();

  // Vignette for depth.
  const vignette = ctx.createRadialGradient(TEX_W / 2, TEX_H / 2, TEX_H * 0.2, TEX_W / 2, TEX_H / 2, TEX_W * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Outer foil border.
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.55)';
  ctx.lineWidth = 3;
  roundRect(ctx, 26, 26, TEX_W - 52, TEX_H - 52, 28);
  ctx.stroke();

  // Monogram badge, top-left.
  const initials = (profile.name || 'Krishna Yadav')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  const badgeCx = 118;
  const badgeCy = 118;
  const badgeR = 62;
  const badgeGrad = ctx.createLinearGradient(badgeCx - badgeR, badgeCy - badgeR, badgeCx + badgeR, badgeCy + badgeR);
  badgeGrad.addColorStop(0, '#2a8f78');
  badgeGrad.addColorStop(1, '#123330');
  ctx.beginPath();
  ctx.arc(badgeCx, badgeCy, badgeR, 0, Math.PI * 2);
  ctx.fillStyle = badgeGrad;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(217, 164, 65, 0.85)';
  ctx.stroke();
  ctx.fillStyle = '#f4ede0';
  ctx.font = '700 52px "Inter", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials || 'KY', badgeCx, badgeCy + 4);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Role pill, top-right.
  const roleLabel = (profile.role || 'Data Analyst').split('|')[0].trim().toUpperCase();
  ctx.font = '600 26px "Inter", "Segoe UI", sans-serif';
  const pillPadding = 30;
  const pillW = ctx.measureText(roleLabel).width + pillPadding * 2;
  const pillH = 56;
  const pillX = TEX_W - 70 - pillW;
  const pillY = 66;
  ctx.fillStyle = 'rgba(63, 224, 176, 0.12)';
  ctx.strokeStyle = 'rgba(63, 224, 176, 0.55)';
  ctx.lineWidth = 2;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#8ff3d0';
  ctx.textBaseline = 'middle';
  ctx.fillText(roleLabel, pillX + pillPadding, pillY + pillH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // Name + subtitle.
  ctx.fillStyle = '#f4faf8';
  ctx.font = '700 84px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(profile.name || 'Krishna Yadav', 68, 320);

  ctx.fillStyle = 'rgba(244, 250, 248, 0.68)';
  ctx.font = '500 32px "Inter", "Segoe UI", sans-serif';
  ctx.fillText(profile.role || 'Data Analyst | BI Developer | Web Application Builder', 68, 372);

  // Foil divider.
  const divider = ctx.createLinearGradient(68, 0, TEX_W - 68, 0);
  divider.addColorStop(0, 'rgba(217, 164, 65, 0.05)');
  divider.addColorStop(0.5, 'rgba(217, 164, 65, 0.85)');
  divider.addColorStop(1, 'rgba(217, 164, 65, 0.05)');
  ctx.fillStyle = divider;
  ctx.fillRect(68, 420, TEX_W - 136, 2);

  // Mini bar chart — same growth-story motif as the hero dashboard.
  const bars = [0.42, 0.68, 0.54, 0.82, 0.73, 0.94];
  const barW = 46;
  const gap = 22;
  const baseY = 780;
  const maxH = 250;
  bars.forEach((h, i) => {
    const x = 68 + i * (barW + gap);
    const height = h * maxH;
    const grad = ctx.createLinearGradient(0, baseY - height, 0, baseY);
    grad.addColorStop(0, '#e9bd63');
    grad.addColorStop(1, '#1d6b66');
    ctx.fillStyle = grad;
    roundRect(ctx, x, baseY - height, barW, height, 8);
    ctx.fill();
  });

  ctx.fillStyle = 'rgba(244, 250, 248, 0.55)';
  ctx.font = '500 28px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('Dashboards · SQL · Python · Automation', 68, 860);

  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(244, 250, 248, 0.3)';
  ctx.font = '600 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('01 / 02', TEX_W - 68, 860);
  ctx.textAlign = 'left';

  return canvas;
}

// Back face: tech stack chips + highlight stats, laid out like a spec sheet.
function drawBackTexture(profile) {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  bg.addColorStop(0, '#0a1e1d');
  bg.addColorStop(1, '#112b28');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  const vignette = ctx.createRadialGradient(TEX_W / 2, TEX_H / 2, TEX_H * 0.2, TEX_W / 2, TEX_H / 2, TEX_W * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  ctx.strokeStyle = 'rgba(63, 224, 176, 0.4)';
  ctx.lineWidth = 3;
  roundRect(ctx, 26, 26, TEX_W - 52, TEX_H - 52, 28);
  ctx.stroke();

  ctx.fillStyle = '#f4faf8';
  ctx.font = '700 56px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('Tech Stack', 68, 128);

  ctx.fillStyle = 'rgba(244, 250, 248, 0.5)';
  ctx.font = '500 26px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('Tools used across dashboards, pipelines & web builds', 68, 168);

  const stack = ['Python', 'SQL', 'Power BI', 'React', 'Node.js', 'Pandas'];
  let cx = 68;
  let cy = 210;
  const chipH = 64;
  ctx.font = '600 30px "Inter", "Segoe UI", sans-serif';
  stack.forEach((label) => {
    const textWidth = ctx.measureText(label).width;
    const chipW = textWidth + 60;
    if (cx + chipW > TEX_W - 68) {
      cx = 68;
      cy += chipH + 22;
    }
    ctx.fillStyle = 'rgba(63, 224, 176, 0.1)';
    ctx.strokeStyle = 'rgba(63, 224, 176, 0.55)';
    ctx.lineWidth = 2;
    roundRect(ctx, cx, cy, chipW, chipH, chipH / 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eef7f5';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx + 30, cy + chipH / 2 + 2);
    ctx.textBaseline = 'alphabetic';
    cx += chipW + 20;
  });

  const divider = ctx.createLinearGradient(68, 0, TEX_W - 68, 0);
  divider.addColorStop(0, 'rgba(217, 164, 65, 0.05)');
  divider.addColorStop(0.5, 'rgba(217, 164, 65, 0.75)');
  divider.addColorStop(1, 'rgba(217, 164, 65, 0.05)');
  ctx.fillStyle = divider;
  ctx.fillRect(68, cy + chipH + 46, TEX_W - 136, 2);

  const metrics = Array.isArray(profile.metrics) && profile.metrics.length
    ? profile.metrics.slice(0, 3)
    : [
        { value: '6+', label: 'featured projects' },
        { value: '5', label: 'IBM data certificates' },
        { value: '2025', label: 'MCA Data Science' },
      ];

  const statsTop = cy + chipH + 78;
  const statH = TEX_H - 52 - statsTop - 90;
  const gap = 20;
  const statW = (TEX_W - 136 - gap * (metrics.length - 1)) / metrics.length;

  metrics.forEach((metric, i) => {
    const x = 68 + i * (statW + gap);
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.strokeStyle = 'rgba(217, 164, 65, 0.35)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, statsTop, statW, statH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e9bd63';
    ctx.font = '700 54px "Inter", "Segoe UI", sans-serif';
    ctx.fillText(String(metric.value), x + 26, statsTop + 66);

    ctx.fillStyle = 'rgba(244, 250, 248, 0.62)';
    ctx.font = '500 22px "Inter", "Segoe UI", sans-serif';
    wrapText(ctx, metric.label, x + 26, statsTop + 104, statW - 44, 28);
  });

  ctx.fillStyle = 'rgba(244, 250, 248, 0.32)';
  ctx.font = '500 24px "Inter", "Segoe UI", sans-serif';
  ctx.fillText('Drag to spin · auto-rotates', 68, TEX_H - 60);
  ctx.textAlign = 'right';
  ctx.fillText('02 / 02', TEX_W - 68, TEX_H - 60);
  ctx.textAlign = 'left';

  return canvas;
}

export default function TechStackCard3D({ profile }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(1.05, 0.55, 6.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    // Procedural studio environment (no external HDRI needed) so the
    // physical materials below get real reflections instead of looking flat.
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const keyLight = new THREE.DirectionalLight(0xffe3b0, 1.4);
    keyLight.position.set(4, 5.5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x3fe0b0, 0.7);
    rimLight.position.set(-5, -2, -4);
    scene.add(rimLight);
    const fillLight = new THREE.HemisphereLight(0x9fd8c9, 0x0a1210, 0.4);
    scene.add(fillLight);

    // Soft contact shadow beneath the card — cheap, reliable, and reads as
    // "grounded" without needing real-time shadow maps.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sctx = shadowCanvas.getContext('2d');
    const rg = sctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    rg.addColorStop(0, 'rgba(0,0,0,0.45)');
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = rg;
    sctx.fillRect(0, 0, 512, 512);
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 3.0), shadowMaterial);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -1.35;
    scene.add(shadowMesh);

    const frontTexture = new THREE.CanvasTexture(drawFrontTexture(profile));
    const backTexture = new THREE.CanvasTexture(drawBackTexture(profile));
    frontTexture.colorSpace = THREE.SRGBColorSpace;
    backTexture.colorSpace = THREE.SRGBColorSpace;
    frontTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    backTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    // Warm metallic-gold trim for the card's edges, echoing the foil
    // accents used inside the artwork itself.
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb8862f,
      metalness: 0.85,
      roughness: 0.32,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.15,
    });
    const faceMaterialOptions = {
      roughness: 0.34,
      metalness: 0.06,
      clearcoat: 0.55,
      clearcoatRoughness: 0.28,
      envMapIntensity: 0.9,
    };
    const frontMaterial = new THREE.MeshPhysicalMaterial({ map: frontTexture, ...faceMaterialOptions });
    const backMaterial = new THREE.MeshPhysicalMaterial({ map: backTexture, ...faceMaterialOptions });

    const geometry = new RoundedBoxGeometry(CARD_W, CARD_H, 0.16, 6, 0.075);
    // RoundedBoxGeometry produces a single material group; assign per-face
    // groups so the flat front/back get the artwork and the rounded rim
    // gets the metal trim.
    geometry.clearGroups();
    const positionCount = geometry.attributes.position.count;
    geometry.addGroup(0, positionCount, 0);
    const card = new THREE.Mesh(geometry, edgeMaterial);
    scene.add(card);

    // Thin overlay planes carry the crisp artwork on the front/back — more
    // reliable across three.js versions than re-mapping UVs on a beveled box.
    const overlayGeometry = new THREE.PlaneGeometry(CARD_W - 0.12, CARD_H - 0.12);
    const frontOverlay = new THREE.Mesh(overlayGeometry, frontMaterial);
    frontOverlay.position.z = 0.081;
    card.add(frontOverlay);
    const backOverlay = new THREE.Mesh(overlayGeometry, backMaterial);
    backOverlay.position.z = -0.081;
    backOverlay.rotation.y = Math.PI;
    card.add(backOverlay);

    card.rotation.y = 0.18;

    let autoRotate = true;
    let velocityY = 0.006;
    let dragging = false;
    let lastX = 0;
    let idleTimer = null;
    const clock = new THREE.Clock();

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
        velocityY += (0.006 - velocityY) * 0.02;
      } else if (!dragging) {
        card.rotation.y += velocityY;
        velocityY *= 0.94;
      }

      card.position.y = Math.sin(t * 0.9) * 0.07;
      card.rotation.x = Math.sin(t * 0.6) * 0.045;
      shadowMesh.material.opacity = 0.55 - Math.abs(card.position.y) * 1.4;

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
      overlayGeometry.dispose();
      frontMaterial.dispose();
      backMaterial.dispose();
      edgeMaterial.dispose();
      frontTexture.dispose();
      backTexture.dispose();
      shadowMaterial.dispose();
      shadowTexture.dispose();
      envRT.texture.dispose();
      pmremGenerator.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, [profile]);

  return <div className="tech-card-3d" ref={mountRef} aria-label="Interactive 3D tech-stack card, drag to rotate" />;
}
