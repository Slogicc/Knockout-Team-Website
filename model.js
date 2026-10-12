import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


import { createTimeline } from 'animejs';

// ---------- Scene setup ----------
const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 6);   // move back (e.g. 8) if the explosion gets cropped

// The pivot is what we spin; the model sits inside it
const pivot = new THREE.Group();
pivot.rotation.x = 0.3;          // slight tilt so it reads as 3D
scene.add(pivot);

// ---------- Animation state ----------
// anime.js animates these two numbers; we apply them to the 3D objects
const state = { spin: 0, explode: 0 };
const parts = [];

// ---------- Load the model ----------
new GLTFLoader().load('SwervePodAssembly.glb', (gltf) => {
  const model = gltf.scene;

  // 1. Wireframe look: dark fill + white edge lines
  const meshes = [];
  model.traverse((obj) => { if (obj.isMesh) meshes.push(obj); });

  meshes.forEach((mesh) => {
    mesh.material = new THREE.MeshBasicMaterial({
      color: 0x0b0f1a,             // match your page background
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    mesh.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 30),   // 30 = edge angle threshold
      new THREE.LineBasicMaterial({ color: 0x919191 })
    ));
  });

  // 2. Center and scale
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  model.position.sub(center);
  pivot.scale.setScalar(4 / size);  // raise/lower the 4 to resize the robot
  pivot.add(model);
  pivot.updateMatrixWorld(true);

  // 3. Find the parts: skip past single-child wrapper nodes
  let container = model;
  while (container.children.length === 1 && !container.children[0].isMesh) {
    container = container.children[0];
  }
  const found = [...container.children];
  console.log('Parts found:', found.length);

  // 4. Record each part's start position and outward direction
  pivot.rotation.set(0, 0, 0);          // measure without the tilt
  pivot.updateMatrixWorld(true);

  // The model's true center, in the model's own coordinates
  const modelCenter = model.worldToLocal(
    new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3())
  );

  found.forEach((part) => {
    model.attach(part);
    const partBox = new THREE.Box3().setFromObject(part);
    const partCenter = model.worldToLocal(partBox.getCenter(new THREE.Vector3()));

    // Direction = from the model's center toward the part
    let dir = partCenter.clone().sub(modelCenter);
    if (dir.length() < 0.0001) {
      dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5);
    }
    dir.normalize();

    parts.push({ obj: part, start: part.position.clone(), dir });
  });

  pivot.rotation.x = 0.3;               // restore the tilt

  // 5. Timeline: spin, then explode
  const distance = size * 0.6;      // how far parts fly (try 0.3 to 1.0)

  createTimeline()
    .add(state, {
      spin: Math.PI * 4,            // two full turns
      duration: 2500,
      ease: 'inOutQuad',
      onUpdate: () => { pivot.rotation.y = state.spin; },
    })
    .add(state, {
      explode: 1,
      duration: 1600,
      ease: 'outExpo',
      onUpdate: () => {
        parts.forEach((p) => {
          p.obj.position.copy(p.start).addScaledVector(p.dir, distance * state.explode);
        });
      },
    }, '-=400');                    // begin exploding just before the spin ends
});

// ---------- Render loop ----------
function render() {
  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
render();

// ---------- Handle window resizing ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});