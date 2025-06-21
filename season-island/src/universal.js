/*//维护场景，相机对象渲染器对象辅助对象灯光
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'



// 场景对象
const scene = new THREE.Scene();

// 相机对象
const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1, 
      1000
    );

// 渲染器对象
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true
document.body.appendChild(renderer.domElement);

//添加光源
const ambientLight = new THREE.AmbientLight(0xffffff); // 环境光
scene.add(ambientLight);
const directionLight = new THREE.DirectionalLight(0xffffff, 2); // 平行光
directionLight.castShadow = true; // 开启阴影投射
directionLight.position.set(20,20,30);
scene.add(directionLight);



//加载fbx的方法
export const loadFbx = (url) => {
  const fbxLoader = new FBXLoader();
  return new Promise(resolve => {
    fbxLoader.load(url,(object) => { 
      resolve(object);
    });
  });
};

// 添加窗口大小变化响应
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


export { scene, camera, renderer };*/
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

// 1. 初始化核心Three.js对象
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  alpha: true // 可选：允许透明背景
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 更柔和的阴影
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio); // 适配高清屏幕
document.body.appendChild(renderer.domElement);

// 2. 光源设置（增强版）
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // 降低环境光强度
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(20, 30, 20); // 调整光源位置
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048; // 提高阴影质量
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// 3. 增强的FBX加载方法（带错误处理）
export const loadFbx = (url) => {
  const fbxLoader = new FBXLoader();
  return new Promise((resolve, reject) => {
    fbxLoader.load(
      url,
      (object) => {
        // 自动启用模型阴影
        object.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        resolve(object);
      },
      undefined,
      (error) => {
        console.error(`FBX加载失败: ${url}`, error);
        reject(error);
      }
    );
  });
};

// 4. 响应式设计增强
const handleResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

window.addEventListener('resize', handleResize);

// 5. 导出对象
export { 
  scene, 
  camera, 
  renderer,
  directionalLight // 可选：导出以便动态调整光源
};

