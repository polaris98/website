import * as THREE from 'three';

function initWhimsicalBackground() {
  const container = document.getElementById('container3D');
  if (!container) return;

  // 1. Scene & Camera Setup
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.z = 25;

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  // Soft Parallax Mouse Tracking
  const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
  window.addEventListener('mousemove', (event) => {
    mouse.targetX = (event.clientX - window.innerWidth / 2) * 0.002;
    mouse.targetY = (event.clientY - window.innerHeight / 2) * 0.002;
  });

  // 2. Custom 4-Point Whimsical Star Texture
  function create4PointStarTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // Soft Radial Glow Background
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 60);
    glow.addColorStop(0, 'rgba(255, 230, 160, 0.9)');
    glow.addColorStop(0.35, 'rgba(216, 180, 254, 0.35)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 128);

    // Draw 4-Point Star Core
    ctx.save();
    ctx.beginPath();
    ctx.translate(64, 64);
    for (let i = 0; i < 4; i++) {
      ctx.lineTo(Math.cos(((i * 90) * Math.PI) / 180) * 32, -Math.sin(((i * 90) * Math.PI) / 180) * 32);
      ctx.lineTo(Math.cos(((45 + i * 90) * Math.PI) / 180) * 10, -Math.sin(((45 + i * 90) * Math.PI) / 180) * 10);
    }
    ctx.closePath();
    ctx.fillStyle = '#fff9e6';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  }

  const starTexture = create4PointStarTexture();

  // 3. Create Multi-Scale Floating Stars (75 total)
  const count = 75;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const initialY = new Float32Array(count);
  const pulseOffsets = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 40;
    const y = (Math.random() - 0.5) * 24;
    const z = (Math.random() - 0.5) * 15;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    initialY[i] = y;

    // Random star size variations (small accent sparkles vs. hero stars)
    scales[i] = Math.random() < 0.25 
      ? Math.random() * 2.5 + 2.0  // 25% larger hero stars
      : Math.random() * 1.2 + 0.5; // 75% subtle background stars

    pulseOffsets[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(scales, 1));

  // Custom Shader Material for Individual Star Sizes & Twinkle
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTexture: { value: starTexture }
    },
    vertexShader: `
      attribute float size;
      uniform float uTime;
      varying float vOpacity;
      
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (250.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
        
        // Gentle individual star twinkling opacity
        vOpacity = 0.5 + 0.5 * sin(uTime * 1.5 + position.x * 2.0 + position.y);
      }
    `,
    fragmentShader: `
      uniform sampler2D uTexture;
      varying float vOpacity;
      
      void main() {
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        gl_FragColor = vec4(texColor.rgb, texColor.a * vOpacity);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const starSystem = new THREE.Points(geometry, material);
  scene.add(starSystem);

  // 4. Subtle Floating Animation Loop
  const clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);
    const elapsedTime = clock.getElapsedTime();

    // Update uniform time for twinkling shader
    material.uniforms.uTime.value = elapsedTime;

    // Smooth Mouse Camera Parallax
    mouse.x += (mouse.targetX - mouse.x) * 0.03;
    mouse.y += (mouse.targetY - mouse.y) * 0.03;
    camera.position.x = mouse.x * 3;
    camera.position.y = -mouse.y * 3;
    camera.lookAt(scene.position);

    // Floating bobbing motion per star
    const posAttr = starSystem.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      const y = initialY[i] + Math.sin(elapsedTime * 0.6 + pulseOffsets[i]) * 0.35;
      posAttr.setY(i, y);
    }
    posAttr.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  // Responsive Canvas Resizing
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

document.addEventListener('DOMContentLoaded', initWhimsicalBackground);