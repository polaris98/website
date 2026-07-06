import * as THREE from 'https://cdn.skypack.dev/three@0.129.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js';

const hero = document.querySelector('.hero-body');
const container = document.getElementById('container3D');

if (hero && container && container.parentElement !== hero) {
  hero.prepend(container);
}

const flowerScale = 4;
const mobileFlowerScale = 2.3;
const flowerX = 1.15;
const mobileFlowerX = 0.2;

const camera = new THREE.PerspectiveCamera(
    45, 
    1,
    0.1, 
    1000);
camera.position.z = 13;

const scene = new THREE.Scene();
let flower;
let mixer;
const loader = new GLTFLoader();
loader.load('model/test_FLOWER_static.glb', function (gltf) {
  console.log('Model loaded successfully:', gltf);
  flower = gltf.scene;
  flower.scale.setScalar(flowerScale);
  ///lower.rotation.x = 50 * Math.PI / 180; // Rotate 25 degrees on the X-axis
  flower.position.set(flowerX, 0, 0); // keep inside the wider hero background
  scene.add(flower);

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

  if (flower) {
    const isNarrow = width < 760;
    flower.position.x = isNarrow ? mobileFlowerX : flowerX;
    flower.scale.setScalar(isNarrow ? mobileFlowerScale : flowerScale);
  }
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
    if(mixer) mixer.update(0.01);
};

reRender3D();
