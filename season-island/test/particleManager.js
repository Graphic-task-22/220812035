// src/particleManager.js
import * as THREE from 'three'
import { SEASON_CONFIG } from './particleConfig.js'

export class ParticleManager {
  constructor(scene) {
    this.scene = scene
    this.textureLoader = new THREE.TextureLoader()
    this.activeSeason = null
    this.particleSystems = {} // 存储所有季节的粒子系统
    
    // 预加载所有纹理
    this.textures = {};
    Object.keys(SEASON_CONFIG).forEach(season => {
      const { texture } = SEASON_CONFIG[season]
      this.textures[season] = this.textureLoader.load(`/textures/${texture}`)
    })
    
    // 预创建粒子系统（但不添加到场景）
    this.createAllParticleSystems()
  }

  createParticleSystem(season) {
    const config = SEASON_CONFIG[season]
    const geometry = new THREE.BufferGeometry()
    const count = config.count
    
    // 位置、速度、旋转、颜色等属性
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const rotations = new Float32Array(count)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // 初始位置 - 大幅扩大覆盖范围，覆盖整个地图
      positions[i * 3] = (Math.random() - 0.5) * 200     // 扩大x轴范围到200
      positions[i * 3 + 1] = Math.random() * 80 + 20     // 扩大y轴范围到80+20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200 // 扩大z轴范围到200
      
      // 初始速度
      velocities[i * 3] = (Math.random() - 0.5) * 0.02
      velocities[i * 3 + 1] = -config.fallSpeed * (0.8 + Math.random() * 0.4)
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02
      
      // 初始旋转
      rotations[i] = Math.random() * Math.PI * 2
      
      // 大小变化 - 增加随机性，让粒子大小更丰富
      sizes[i] = config.size * (0.6 + Math.random() * 0.8)
      
      // 随机颜色变化
      const colorIdx = Math.floor(Math.random() * config.colors.length)
      const color = new THREE.Color(config.colors[colorIdx])
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    const material = new THREE.PointsMaterial({
      size: config.size,
      map: this.textures[season],
      vertexColors: true, // 启用顶点颜色
      transparent: true,
      alphaTest: 0.5,
      depthWrite: false
    })
    
    return new THREE.Points(geometry, material)
  }

  createAllParticleSystems() {
    Object.keys(SEASON_CONFIG).forEach(season => {
      this.particleSystems[season] = this.createParticleSystem(season)
      this.particleSystems[season].visible = false // 初始隐藏
      this.scene.add(this.particleSystems[season])
    })
  }

  setParticleEffect(season) {
    if (this.activeSeason) {
      this.particleSystems[this.activeSeason].visible = false
    }
    
    this.activeSeason = season
    if (this.particleSystems[season]) {
      this.particleSystems[season].visible = true
    }
  }

  clearParticles() {
    if (this.activeSeason && this.particleSystems[this.activeSeason]) {
      this.particleSystems[this.activeSeason].visible = false
    }
    this.activeSeason = null
  }

  update() {
    if (!this.activeSeason) return
    
    const particles = this.particleSystems[this.activeSeason]
    const config = SEASON_CONFIG[this.activeSeason]
    const positions = particles.geometry.attributes.position
    const velocities = particles.geometry.attributes.velocity
    const rotations = particles.geometry.attributes.rotation
    
    for (let i = 0; i < positions.count; i++) {
      // 季节特有行为
      switch(this.activeSeason) {
        case 'spring':
          // 花瓣摇摆效果
          positions.array[i * 3] += Math.sin(Date.now() * 0.001 + i) * config.swayRange * 0.01
          rotations.array[i] += config.rotationSpeed
          break
          
        case 'summer':
          // 小虫悬浮运动
          positions.array[i * 3] += (Math.sin(Date.now() * 0.001 + i * 0.1) - 0.5) * 0.02
          positions.array[i * 3 + 1] += Math.cos(Date.now() * 0.002 + i) * config.hoverSpeed
          break
          
        case 'autumn':
          // 树叶旋转飘落
          positions.array[i * 3] += Math.sin(Date.now() * 0.001 + i) * config.swayRange * 0.01
          rotations.array[i] += config.rotationSpeed
          break
          
        case 'winter':
          // 雪花漂浮感
          positions.array[i * 3] += (Math.random() - 0.5) * config.driftSpeed
          positions.array[i * 3 + 2] += (Math.random() - 0.5) * config.driftSpeed
          break
      }
      
      // 通用位置更新
      positions.array[i * 3] += velocities.array[i * 3]
      positions.array[i * 3 + 1] += velocities.array[i * 3 + 1]
      positions.array[i * 3 + 2] += velocities.array[i * 3 + 2]
      
      // 边界重置 - 扩大重置范围，确保覆盖整个地图
      if (positions.array[i * 3 + 1] < -20) {
        positions.array[i * 3] = (Math.random() - 0.5) * 200     // 扩大x轴重置范围
        positions.array[i * 3 + 1] = Math.random() * 20 + 80     // 扩大y轴重置范围
        positions.array[i * 3 + 2] = (Math.random() - 0.5) * 200 // 扩大z轴重置范围
      }
    }
    
    positions.needsUpdate = true
    rotations.needsUpdate = true
  }
}