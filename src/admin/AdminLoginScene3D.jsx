import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// Builds a small 4-step gradient texture so MeshToonMaterial gets that
// classic flat, cel-shaded "cartoon" look instead of smooth PBR shading.
function createToonGradientMap() {
  const colors = new Uint8Array([80, 130, 180, 255]);
  const texture = new THREE.DataTexture(colors, colors.length, 1, THREE.RedFormat);
  texture.needsUpdate = true;
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

// A cute, rounded cartoon padlock built from primitives — no external
// models or textures needed, just toon-shaded geometry.
function buildLock(gradientMap) {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshToonMaterial({ color: 0x3fe0b0, gradientMap });
  const shackleMat = new THREE.MeshToonMaterial({ color: 0xe9bd63, gradientMap });
  const keyholeMat = new THREE.MeshToonMaterial({ color: 0x0f2b29, gradientMap });

  const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 0.7), bodyMat);
  body.position.y = -0.15;
  group.add(body);

  // Round the body's edges visually with a subtle bevel torus at the seams
  // (cheap way to avoid harsh box corners without importing extra geometry).
  const bevel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2, 8), bodyMat);
  [
    [0.75, -0.15, 0.35],
    [-0.75, -0.15, 0.35],
    [0.75, -0.15, -0.35],
    [-0.75, -0.15, -0.35],
  ].forEach(([x, y, z]) => {
    const edge = bevel.clone();
    edge.position.set(x, y, z);
    group.add(edge);
  });

  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.14, 12, 24, Math.PI), shackleMat);
  shackle.position.y = 0.65;
  shackle.rotation.z = Math.PI;
  group.add(shackle);

  const shackleLegGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.5, 12);
  const legLeft = new THREE.Mesh(shackleLegGeo, shackleMat);
  legLeft.position.set(-0.55, 0.4, 0);
  group.add(legLeft);
  const legRight = legLeft.clone();
  legRight.position.x = 0.55;
  group.add(legRight);

  const keyholeTop = new THREE.Mesh(new THREE.CircleGeometry(0.13, 16), keyholeMat);
  keyholeTop.position.set(0, 0.05, 0.36);
  group.add(keyholeTop);
  const keyholeBottom = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 4), keyholeMat);
  keyholeBottom.position.set(0, -0.22, 0.36);
  keyholeBottom.rotation.x = Math.PI;
  keyholeBottom.rotation.z = Math.PI / 4;
  group.add(keyholeBottom);

  // Simple cartoon "eyes" on the body so it reads as a friendly character.
  const eyeWhiteMat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap });
  const pupilMat = new THREE.MeshToonMaterial({ color: 0x123330, gradientMap });
  [-0.32, 0.32].forEach((x) => {
    const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), eyeWhiteMat);
    eyeWhite.position.set(x, 0.42, 0.34);
    group.add(eyeWhite);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), pupilMat);
    pupil.position.set(x, 0.42, 0.44);
    group.add(pupil);
  });

  // Scale the whole character up so it reads clearly as a full-page hero
  // visual, not a small background prop.
  group.scale.setScalar(1.5);
  return group;
}

// A small original-design mouse (round body, big ears, thin tail) — not a
// likeness of any copyrighted character, just a friendly cartoon rodent.
function buildMouse(gradientMap) {
  const group = new THREE.Group();
  const furMat = new THREE.MeshToonMaterial({ color: 0xcdb8a0, gradientMap });
  const earMat = new THREE.MeshToonMaterial({ color: 0xf3d9c4, gradientMap });
  const noseMat = new THREE.MeshToonMaterial({ color: 0xb3455a, gradientMap });
  const eyeMat = new THREE.MeshToonMaterial({ color: 0x1a1410, gradientMap });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 14), furMat);
  body.scale.set(1.15, 0.9, 1);
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), furMat);
  head.position.set(0.28, 0.06, 0);
  group.add(head);

  [-0.06, 0.06].forEach((z) => {
    const ear = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), earMat);
    ear.position.set(0.3, 0.2, z * 2.2);
    ear.lookAt(ear.position.clone().add(new THREE.Vector3(0, 0.4, z)));
    group.add(ear);
  });

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 10), noseMat);
  nose.position.set(0.42, 0.03, 0);
  group.add(nose);

  [-0.05, 0.05].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), eyeMat);
    eye.position.set(0.36, 0.1, z);
    group.add(eye);
  });

  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0, 0),
    new THREE.Vector3(-0.42, 0.08, 0.05),
    new THREE.Vector3(-0.55, 0.24, -0.05),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 12, 0.02, 6, false), furMat);
  group.add(tail);

  group.scale.setScalar(1.25);
  return group;
}

// A small original-design cat (round body, triangular ears, tail) — again,
// an original character, not a reproduction of any licensed IP.
function buildCat(gradientMap) {
  const group = new THREE.Group();
  const furMat = new THREE.MeshToonMaterial({ color: 0x6f7a8c, gradientMap });
  const bellyMat = new THREE.MeshToonMaterial({ color: 0xe7e9ee, gradientMap });
  const noseMat = new THREE.MeshToonMaterial({ color: 0xd97a86, gradientMap });
  const eyeMat = new THREE.MeshToonMaterial({ color: 0x123330, gradientMap });

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 14), furMat);
  body.scale.set(1.1, 0.95, 1);
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), bellyMat);
  belly.position.set(0.05, -0.08, 0.2);
  group.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 14, 14), furMat);
  head.position.set(0.34, 0.1, 0);
  group.add(head);

  [-0.1, 0.1].forEach((z) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.13, 4), furMat);
    ear.position.set(0.3, 0.28, z);
    ear.rotation.x = Math.PI;
    group.add(ear);
  });

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 10), noseMat);
  nose.position.set(0.52, 0.08, 0);
  group.add(nose);

  [-0.06, 0.06].forEach((z) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), eyeMat);
    eye.position.set(0.46, 0.15, z);
    group.add(eye);
  });

  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.28, 0, 0),
    new THREE.Vector3(-0.5, 0.22, 0.06),
    new THREE.Vector3(-0.6, 0.48, -0.02),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 14, 0.035, 6, false), furMat);
  group.add(tail);

  group.scale.setScalar(1.45);
  return group;
}

function buildAccentShapes(gradientMap) {
  const palette = [0xd9a441, 0x3fe0b0, 0xb33f2b, 0x1fb88f];
  const shapes = [];
  for (let i = 0; i < 6; i += 1) {
    const color = palette[i % palette.length];
    const mat = new THREE.MeshToonMaterial({ color, gradientMap });
    const geo =
      i % 2 === 0
        ? new THREE.IcosahedronGeometry(0.14, 0)
        : new THREE.TorusGeometry(0.11, 0.045, 8, 16);
    const mesh = new THREE.Mesh(geo, mat);
    const angle = (i / 6) * Math.PI * 2;
    mesh.userData.baseAngle = angle;
    mesh.userData.radius = 3.0 + (i % 2) * 0.6;
    mesh.userData.speed = 0.25 + i * 0.05;
    mesh.userData.bobOffset = i;
    shapes.push(mesh);
  }
  return shapes;
}

export default function AdminLoginScene3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    camera.position.set(0, 0.3, 7.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x3fe0b0, 0.5);
    rim.position.set(-4, -2, -3);
    scene.add(rim);

    const gradientMap = createToonGradientMap();
    const lock = buildLock(gradientMap);
    scene.add(lock);

    const mouse = buildMouse(gradientMap);
    const cat = buildCat(gradientMap);
    scene.add(mouse);
    scene.add(cat);

    const accents = buildAccentShapes(gradientMap);
    accents.forEach((mesh) => scene.add(mesh));

    let targetRotX = 0;
    let targetRotY = 0;
    const onPointerMove = (event) => {
      const rect = mount.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      targetRotY = x * 0.5;
      targetRotX = y * -0.3;
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

      // Playful bounce + wobble + gentle squash-stretch on the lock itself.
      lock.position.y = Math.sin(t * 1.6) * 0.18;
      lock.rotation.y += (targetRotY - lock.rotation.y) * 0.06;
      lock.rotation.x += (targetRotX - lock.rotation.x) * 0.06;
      lock.rotation.z = Math.sin(t * 1.6) * 0.05;
      const squash = 1 + Math.sin(t * 1.6) * 0.04;
      lock.scale.set(1 / squash, squash, 1 / squash);

      accents.forEach((mesh) => {
        const angle = mesh.userData.baseAngle + t * mesh.userData.speed;
        mesh.position.x = Math.cos(angle) * mesh.userData.radius;
        mesh.position.z = Math.sin(angle) * mesh.userData.radius - 2;
        mesh.position.y = Math.sin(t * 1.2 + mesh.userData.bobOffset) * 0.4;
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.015;
      });

      // Cat-and-mouse chase loop around the lock — comedic bursts of speed
      // (not a steady lap) plus a bouncy "gallop" bob, mouse always a step
      // ahead of the cat.
      const chaseRadius = 3.6;
      const baseSpeed = 0.55;
      const burst = 1 + Math.sin(t * 0.9) * 0.6; // speeds up and slows down in waves
      const mouseAngle = t * baseSpeed * burst;
      const catAngle = mouseAngle - 0.55 - Math.sin(t * 0.9) * 0.15; // trails behind, gap pulses

      const gallop = (phase) => Math.abs(Math.sin(t * 9 + phase)) * 0.16;

      mouse.position.set(
        Math.cos(mouseAngle) * chaseRadius,
        gallop(0) - 0.3,
        Math.sin(mouseAngle) * chaseRadius - 2
      );
      mouse.rotation.y = -mouseAngle + Math.PI / 2;
      mouse.rotation.z = Math.sin(t * 9) * 0.08;

      cat.position.set(
        Math.cos(catAngle) * chaseRadius,
        gallop(1.4) - 0.28,
        Math.sin(catAngle) * chaseRadius - 2
      );
      cat.rotation.y = -catAngle + Math.PI / 2;
      cat.rotation.z = Math.sin(t * 9 + 1.4) * 0.08;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      gradientMap.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div className="admin-login-scene-3d" ref={mountRef} aria-hidden="true" />;
}
