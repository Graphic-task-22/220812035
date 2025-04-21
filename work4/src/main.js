import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// 路径类不变
class TunnelPath extends THREE.Curve {
  getPoint(t) {
    const x = Math.sin(t * Math.PI * 2) * 50;
    const y = Math.sin(t * Math.PI) * 10;
    const z = t * 300 - 190;
    return new THREE.Vector3(x, y, z);
  }
}

class InfiniteTunnel {
  constructor() {
    this.time = 0;  // 直接使用time来控制前进
    this.speed = 0.00009; // 控制相机移动速度
    this.init();
  }

  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.createTunnel();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(0, 100, 100);
    this.scene.add(ambientLight, dirLight);

    window.addEventListener('resize', this.onWindowResize.bind(this));

    this.animate();
  }

  createTunnel() {
    // 生成一个很长的路径
    const pathPoints = [];
    const repeats = 30; // 越多越长
    for (let i = 0; i < repeats; i++) {
      for (let t = 0; t <= 1; t += 0.02) {
        const point = new TunnelPath().getPoint(t);
        point.z += i * 300;
        pathPoints.push(point);
      }
    }
    this.path = new THREE.CatmullRomCurve3(pathPoints, false);

    // 隧道几何体
    const geometry = new THREE.TubeGeometry(this.path, 3000, 5, 16, false);

    // 隧道纹理
    const texture = new THREE.TextureLoader().load('texture2.jpg');
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(300, 2); // 非常长，产生视觉重复

    const material = new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide,
      emissive: 0x111111,
      metalness: 0.4,
      roughness: 0.6,
    });

    const tunnel = new THREE.Mesh(geometry, material);
    this.scene.add(tunnel);

    // 获取路径点
    this.cameraPositions = this.path.getSpacedPoints(10000);
  }

  updateCameraPosition() {
    // 持续递增时间，保证相机顺畅向前
    this.time += this.speed;

    // 使用循环来避免反向
    if (this.time > 1) this.time += 1; // 让时间循环，避免越界

    // 计算相机的位置
    const totalPoints = this.cameraPositions.length;
    const index = Math.floor(this.time * totalPoints);
    const position = this.cameraPositions[index];
    const lookAt = this.cameraPositions[(index - 1) % totalPoints]; // 下一个位置作为目标

    this.camera.position.copy(position); // 设置相机位置
    this.camera.lookAt(lookAt);           // 设置相机视角
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.updateCameraPosition();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// 启动
new InfiniteTunnel();
