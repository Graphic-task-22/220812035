import * as THREE from 'three'; // 必须导入 THREE
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Box3, Vector3, MeshStandardMaterial } from 'three'; // 按需导入

export function load3DModel(scene, configs) {
  const loader = new GLTFLoader();

  configs.forEach((config) => {
    const { modelPath, position } = config;

    loader.load(modelPath, (gltf) => {
      const model = gltf.scene;
      const { x, y, z } = position;

      model.position.set(x, y, z);
      model.scale.set(50, 50, 50);
      model.rotation.y = Math.PI / 4;

      // 让岛屿接收阴影
      model.traverse((child) => {
        if (child.isMesh) {
          child.receiveShadow = true;
          // 替换 BasicMaterial（如果需要）
          if (child.material instanceof THREE.MeshBasicMaterial) {
            child.material = new MeshStandardMaterial({
              color: child.material.color,
              map: child.material.map,
            });
          }
        }
      });

      scene.add(model);
    });
  });
}