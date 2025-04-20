import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { createNoise2D } from 'simplex-noise';

class DynamicMountain {
  constructor() {
    this.width = 200; // 地形宽度
    this.height = 200; // 地形高度
    this.segmentCount = 70; // 降低线密度
    this.noiseScale = 0.01; // 噪声缩放因子
    this.time = 0;
    this.speed = 0.0005; // 动画速度
    this.groundLevel = 10; // 地面高度

    this.noise2D = createNoise2D(); // 创建噪声实例
    this.init();
  }

  init() {
    // 场景设置
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000); // 黑色背景

    // 相机设置
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 100, 200);

    // 渲染器设置
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // 控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;

    // 创建地形
    this.createTerrain();

    // 监听窗口大小变化
    window.addEventListener('resize', this.onWindowResize.bind(this));

    // 启动动画
    this.animate();
  }

  createTerrain() {
    // 创建平面几何体作为地形基础
    const geometry = new THREE.PlaneGeometry(
      this.width,
      this.height,
      this.segmentCount,
      this.segmentCount
    );
    geometry.rotateX(-Math.PI / 2);

    // 线框材质（白色）
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
      transparent: true,
      opacity: 1.0,
    });

    // 半透明皮肤材质（白色）
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.3,
      roughness: 1.0,
      transparent: true,
      opacity: 0.3, // 半透明效果
      flatShading: true, // 保证面片边界清晰
      depthWrite: false, // 防止遮挡线框
    });

    // 创建线框和面片
    this.wireMesh = new THREE.Mesh(geometry, wireMaterial);
    this.skinMesh = new THREE.Mesh(geometry.clone(), skinMaterial);

    // 将地形添加到场景中
    this.scene.add(this.wireMesh);
    this.scene.add(this.skinMesh);

    // 光源设置
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // 环境光
    const dirLight = new THREE.DirectionalLight(0xffffff, 1); // 平行光
    dirLight.position.set(100, 200, 100); // 调整光源方向
    this.scene.add(ambientLight, dirLight);
  }

  updateTerrain() {
    const updateMesh = (geometry) => {
      const positions = geometry.attributes.position;
      const count = positions.count;

      for (let i = 0; i < count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);

        // 计算每个点的噪声值：创建山脉的起伏
        const base = Math.abs(this.noise2D(x * this.noiseScale, z * this.noiseScale + this.time));
        const detail = Math.abs(this.noise2D(x * this.noiseScale * 1, z * this.noiseScale * 1 + this.time));
        const ridge = Math.abs(this.noise2D(x * this.noiseScale * 0.5, z * this.noiseScale * 0.5 + this.time));

        // 计算y轴高度，使山体的高度差更大
        const y = base * 50 + detail * 40 + ridge * 10; // 增加山脉高度差异

        // 设置一个最低高度，确保不低于地面
        positions.setY(i, Math.max(y, this.groundLevel)); // 限制最小高度为地面高度
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals(); // 计算法线，确保光照正确
    };

    updateMesh(this.wireMesh.geometry);
    updateMesh(this.skinMesh.geometry);
  }

  animate() {
    requestAnimationFrame(() => this.animate()); // 请求下一帧动画

    this.time += this.speed; // 更新时间
    this.updateTerrain(); // 更新地形

    this.controls.update(); // 更新控制器
    this.renderer.render(this.scene, this.camera); // 渲染场景
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight; // 处理窗口大小变化
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// 创建并启动山脉系统
new DynamicMountain();

