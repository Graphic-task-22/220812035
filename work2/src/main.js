import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// 场景、相机、渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.z = 100;
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 控制器
const controls = new OrbitControls(camera, renderer.domElement);

// 雪花参数
const snowCount = 1000;
const snowGeometry = new THREE.BufferGeometry();
const positions = [];
const velocities = [];

for (let i = 0; i < snowCount; i++) {
  const x = (Math.random() - 0.5) * 1000;
  const y = Math.random() * 500 + 100; // 更高起点
  const z = (Math.random() - 0.5) * 1000;
  positions.push(x, y, z);
  velocities.push(0, -Math.random() * 0.5 - 0.2, 0); // 速度略大
}

snowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));


const snowMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1 });
const snow = new THREE.Points(snowGeometry, snowMaterial);
scene.add(snow);

// 烟花粒子容器
const fireworks = [];

// 鼠标点击触发烟花
window.addEventListener('click', (event) => {
  const mouse = new THREE.Vector2(
    (event.clientX / window.innerWidth) * 2 - 1,
    -(event.clientY / window.innerHeight) * 2 + 1
  );

  // 转换点击点为 3D 坐标
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);
  const point = raycaster.ray.origin.clone().add(raycaster.ray.direction.clone().multiplyScalar(50));

  createFirework(point);
});

function createFirework(position) {
  const count = 100;
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const velocities = [];

  for (let i = 0; i < count; i++) {
    positions.push(position.x, position.y, position.z);

    const speed = 2 + Math.random() * 2;
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.random() * Math.PI;

    velocities.push(
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.cos(phi),
      speed * Math.sin(phi) * Math.sin(theta)
    );
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({ color: 0xff0000, size: 2 });
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  fireworks.push({ points, velocities, born: performance.now() });
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  // 雪花移动
  const positions = snow.geometry.attributes.position.array;
  for (let i = 1; i < positions.length; i += 3) {
    positions[i] -= 0.5;
    if (positions[i] < 0) {
      positions[i] = 200;
    }
  }
  snow.geometry.attributes.position.needsUpdate = true;

  // 烟花更新
  const now = performance.now();
  fireworks.forEach((f, index) => {
    const positions = f.points.geometry.attributes.position.array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i] += f.velocities[i] * 0.1;
      positions[i + 1] += f.velocities[i + 1] * 0.1;
      positions[i + 2] += f.velocities[i + 2] * 0.1;
    }
    f.points.geometry.attributes.position.needsUpdate = true;

    if (now - f.born > 2000) {
      scene.remove(f.points);
      fireworks.splice(index, 1);
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
animate();

// 自适应
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
