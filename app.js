import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';

const hero = document.querySelector('.hero-body');
const container = document.getElementById('container3D');

if (hero && container && container.parentElement !== hero) {
  hero.prepend(container);
}

const flowerScale = 4;
const mobileFlowerScale = 2.3;


const camera = new THREE.PerspectiveCamera(
  45,
  1,
  0.1,
  1000
);
camera.position.z = 13;

const scene = new THREE.Scene();
let flower;
let mixer;

const getVisibleSize = () => {
  const distance = camera.position.z;
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
  const visibleWidth = visibleHeight * camera.aspect;

  return { visibleWidth, visibleHeight };
};

const placeFlowerInRightCorner = () => {
  if (!flower || !container.clientWidth || !container.clientHeight) return;

  const { visibleWidth, visibleHeight } = getVisibleSize();
  const padding = Math.min(visibleWidth, visibleHeight) * 0.04;
  const desiredScale = container.clientWidth < 760 ? mobileFlowerScale : flowerScale;

  flower.scale.setScalar(desiredScale);
  flower.position.set(0, 0, 0);
  flower.updateMatrixWorld(true);

  let box = new THREE.Box3().setFromObject(flower);
  let size = box.getSize(new THREE.Vector3());

  const fitScale = Math.min(
    1,
    (visibleWidth - padding * 2) / size.x,
    (visibleHeight - padding * 2) / size.y
  );

  if (fitScale < 1) {
    flower.scale.setScalar(desiredScale * fitScale);
    flower.position.set(0, 0, 0);
    flower.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(flower);
    size = box.getSize(new THREE.Vector3());
  }

  const center = box.getCenter(new THREE.Vector3());

  flower.position.x = visibleWidth / 2 - size.x / 2 - padding - center.x;
  flower.position.y = -visibleHeight / 2 + size.y / 2 + padding - center.y +1;
};

const loader = new GLTFLoader();
loader.load('model/test_FLOWER_static.glb', function (gltf) {
  console.log('Model loaded successfully:', gltf);
  flower = gltf.scene;
  scene.add(flower);
  placeFlowerInRightCorner();

  mixer = new THREE.AnimationMixer(flower);
  mixer.clipAction(gltf.animations[0]).play();
  mixer.update(0.01);
  console.log(gltf.animations);
},
function (xhr) {
  console.log('Loading progress:', (xhr.loaded / xhr.total * 100) + '%');
},
function (error) {
  console.error('Error loading model:', error);
});

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
console.log('Renderer created, container:', container);
container.appendChild(renderer.domElement);
console.log('Renderer appended to DOM');

const hemiLight = new THREE.HemisphereLight(
  0xffffff,
  0x444444,
  1
);
hemiLight.castShadow = true;
scene.add(hemiLight);

const topLight = new THREE.DirectionalLight(0xffffff, 0);
topLight.position.set(11, 10, 5);

topLight.castShadow = true;
scene.add(topLight);

const resizeToHero = () => {
  const width = container.clientWidth;
  const height = container.clientHeight;

  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  placeFlowerInRightCorner();
};

resizeToHero();

if ('ResizeObserver' in window) {
  new ResizeObserver(resizeToHero).observe(container);
} else {
  window.addEventListener('resize', resizeToHero);
}

const reRender3D = () => {
  requestAnimationFrame(reRender3D);
  renderer.render(scene, camera);
  if (mixer) mixer.update(0.01);
};

reRender3D();

