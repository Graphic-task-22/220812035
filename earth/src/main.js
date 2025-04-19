// 导入three.js
import * as THREE from 'three';
// 导入轨道控制器
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// 导入dat.GUI
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(
  45,  // 视角
  window.innerWidth / window.innerHeight,  // 相机宽高比
  0.1,  // 近平面
  1000  // 远平面
);
camera.position.set(100, 100, 100);
camera.lookAt(0, 0, 0);  // 默认看向原点

// 创建渲染器
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建地球的几何体和材质
const sphereGeometry = new THREE.SphereGeometry(30, 30, 30);
const textureLoader = new THREE.TextureLoader();
const dayTexture = textureLoader.load('/earth_day.jpg');
const nightTexture = textureLoader.load('/earth_night.jpg');
const textureCube = new THREE.CubeTextureLoader().setPath('./src/').load(
  ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png']
);

// 创建地球材质
let sphereMaterial = new THREE.MeshPhongMaterial({
  map: dayTexture,  // 默认是白天纹理
  envMap: textureCube,
  reflectivity: 0.3,
  color: 0xffffff,
  shininess: 100
});
const ball = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(ball);

// 加载云层贴图
const cloudTexture = textureLoader.load('/earth_cloud.jpg');

// 创建云层材质
const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudTexture,
  transparent: true,
  opacity: 0.3,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.NormalBlending
});

// 创建比地球稍大一点的球体用作云层
const cloudGeometry = new THREE.SphereGeometry(30.6, 64, 64);
const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
scene.add(cloudMesh);


// 创建大气层
const atmosphereGeometry = new THREE.SphereGeometry(30.5, 30, 30); // 稍微比地球大一点
const atmosphereMaterial = new THREE.MeshPhongMaterial({
  color: 0x87CEEB,  // 天空蓝色
  emissive: 0x87CEEB,  // 自发光效果
  transparent: true,   // 透明
  opacity: 0.3,        // 半透明
  blending: THREE.AdditiveBlending,
  depthWrite: false     // 不影响后面的物体
});
const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
scene.add(atmosphere);

// 环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// 点光源
const pointLight = new THREE.PointLight(0xffffff, 1.5);
pointLight.position.set(30, 30, 30);
scene.add(pointLight);

// 坐标轴辅助器
const axesHelper = new THREE.AxesHelper(150);
scene.add(axesHelper);

// 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;

// 创建星空背景球体
const starTexture = textureLoader.load('/stars.jpg'); // 星星背景图
const starGeometry = new THREE.SphereGeometry(500, 64, 64);  // 更大的球体
const starMaterial = new THREE.MeshBasicMaterial({
  map: starTexture,
  side: THREE.BackSide  // 星星纹理朝里
});
const starField = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starField);

// 创建GUI
const gui = new GUI();
const timeParams = { timeOfDay: 0 };  // 当前时间，0到1之间

// 创建时间进度条，用户可拖动来调整时间
gui.add(timeParams, 'timeOfDay', 0, 1).step(0.001).name('时间进度').onChange(() => {
  updateDayNightCycle();  // 每次改变时，更新日夜效果
});

// 更新时间和日夜效果
function updateDayNightCycle() {
  const time = timeParams.timeOfDay * 24;  // 时间从0到24小时

  // 控制地球自转
  ball.rotation.y = (time / 24) * Math.PI * 2;  // 根据时间调整地球的旋转

  // 切换日夜纹理
  if (time >= 6 && time < 18) {
    if (sphereMaterial.map !== dayTexture) {
      sphereMaterial.map = dayTexture;
      sphereMaterial.needsUpdate = true;
    }
  } else {
    if (sphereMaterial.map !== nightTexture) {
      sphereMaterial.map = nightTexture;
      sphereMaterial.needsUpdate = true;
    }
  }
}



// 渲染函数
function animate() {
  controls.update();
  requestAnimationFrame(animate);
  updateDayNightCycle();  // 更新日夜循环
  renderer.render(scene, camera);
  cloudMesh.rotation.y += 0.002;

}

// 自适应窗口大小
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

animate();
