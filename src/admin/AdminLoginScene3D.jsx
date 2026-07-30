import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Small canvas texture for the floating "dashboard card" panels — a few
// abstract bar/line marks so they read as mini widgets, not blank tiles.
function createCardTexture(variant) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(20, 30, 32, 0.001)'; // fully transparent base
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(63, 224, 176, 0.9)';
  ctx.fillStyle = 'rgba(63, 224, 176, 0.85)';
  ctx.lineWidth = 6;

  if (variant === 'bars') {
    const bars = [40, 70, 50, 95, 65];
    bars.forEach((h, i) => {
      const x = 24 + i * 42;
      ctx.fillRect(x, 130 - h, 26, h);
    });
  } else if (variant === 'line') {
    ctx.beginPath();
    ctx.moveTo(20, 100);
    ctx.lineTo(70, 60);
    ctx.lineTo(120, 90);
    ctx.lineTo(170, 40);
    ctx.lineTo(220, 70);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(128, 80, 46, 0, Math.PI * 1.4);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildCore() {
  const group = new THREE.Group();

  const coreMat = new THREE.MeshPhysicalMaterial({
    color: 0x123330,
    emissive: 0x1fb88f,
    emissiveIntensity: 0.9,
    metalness: 0.3,
    roughness: 0.25,
    clearcoat: 0.6,
  });
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), coreMat);
  group.add(core);

  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x3fe0b0,
    transparent: true,
    opacity: 0.12,
    side: THREE.BackSide,
  });
  const glow = new THREE.Mesh(new THREE.IcosahedronGeometry(1.15, 1), glowMat);
  group.add(glow);

  return { group, core };
}

function buildRings() {
  const ringDefs = [
    { radius: 1.7, tube: 0.02, color: 0x3fe0b0, tiltX: 1.2, tiltZ: 0.2, speed: 0.25 },
    { radius: 2.15, tube: 0.015, color: 0xd9a441, tiltX: -0.6, tiltZ: 0.5, speed: -0.18 },
    { radius: 2.55, tube: 0.012, color: 0x1fb88f, tiltX: 0.3, tiltZ: -0.8, speed: 0.14 },
  ];
  return ringDefs.map((def) => {
    const mat = new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.55 });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(def.radius, def.tube, 8, 96), mat);
    mesh.rotation.x = def.tiltX;
    mesh.rotation.z = def.tiltZ;
    mesh.userData.speed = def.speed;
    return mesh;
  });
}

function buildDashboardCards() {
  const variants = ['bars', 'line', 'ring', 'bars', 'line'];
  const textures = [];
  const cards = variants.map((variant, i) => {
    const texture = createCardTexture(variant);
    textures.push(texture);
    const frameMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f2b29,
      transparent: true,
      opacity: 0.55,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.5,
    });
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.56), frameMat);

    const faceMat = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.5), faceMat);
    face.position.z = 0.005;
    frame.add(face);

    const borderGeo = new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.9, 0.56));
    const border = new THREE.LineSegments(
      borderGeo,
      new THREE.LineBasicMaterial({ color: 0x3fe0b0, transparent: true, opacity: 0.5 })
    );
    frame.add(border);

    frame.userData.baseAngle = (i / variants.length) * Math.PI * 2;
    frame.userData.radius = 3.3;
    frame.userData.speed = 0.16 + i * 0.02;
    frame.userData.bobOffset = i * 1.3;
    frame.userData.tiltY = (i % 2 === 0 ? 1 : -1) * 0.25;
    return frame;
  });
  return { cards, textures };
}

function buildSparkles() {
  const count = 140;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    const radius = 3 + Math.random() * 3.2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
    positions[i * 3 + 2] = radius * Math.cos(phi) - 1.5;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0x9fe8d3,
    size: 0.035,
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
  });
  return new THREE.Points(geometry, material);
}

export default function AdminLoginScene3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.4, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(4, 5, 6);
    scene.add(key);
    const rim = new THREE.PointLight(0x3fe0b0, 1.4, 12);
    rim.position.set(-3, 1, 3);
    scene.add(rim);
    const gold = new THREE.PointLight(0xd9a441, 0.8, 12);
    gold.position.set(3, -2, -2);
    scene.add(gold);

    const sceneGroup = new THREE.Group();
    scene.add(sceneGroup);

    const { group: coreGroup, core } = buildCore();
    sceneGroup.add(coreGroup);

    const rings = buildRings();
    rings.forEach((ring) => sceneGroup.add(ring));

    const cards = buildDashboardCards();
    cards.cards.forEach((card) => sceneGroup.add(card));

    const sparkles = buildSparkles();
    sceneGroup.add(sparkles);

    let targetRotX = 0;
    let targetRotY = 0;
    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.4;
      targetRotX = y * -0.25;
    };
    window.addEventListener('pointermove', onPointerMove);

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

    const clock = new THREE.Clock();
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      sceneGroup.rotation.y += (targetRotY - sceneGroup.rotation.y) * 0.05;
      sceneGroup.rotation.x += (targetRotX - sceneGroup.rotation.x) * 0.05;

      core.rotation.y += 0.004;
      core.rotation.x += 0.002;
      coreGroup.position.y = Math.sin(t * 0.8) * 0.12;
      const pulse = 1 + Math.sin(t * 1.6) * 0.04;
      coreGroup.scale.setScalar(pulse);

      rings.forEach((ring) => {
        ring.rotation.z += ring.userData.speed * 0.01;
      });

      cards.cards.forEach((card) => {
        const angle = card.userData.baseAngle + t * card.userData.speed;
        card.position.x = Math.cos(angle) * card.userData.radius;
        card.position.z = Math.sin(angle) * card.userData.radius - 1.5;
        card.position.y = Math.sin(t * 0.7 + card.userData.bobOffset) * 0.5;
        card.lookAt(camera.position);
        card.rotation.z = card.userData.tiltY * Math.sin(t * 0.5 + card.userData.bobOffset);
      });

      sparkles.rotation.y += 0.0006;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      cards.textures.forEach((tex) => tex.dispose());
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className="admin-login-scene-3d" ref={mountRef} aria-hidden="true" />;
}
