// src/rainManager.js
import * as THREE from 'three'

export class RainManager {
  constructor(scene) {
    this.scene = scene
    this.rainGroup = new THREE.Group()
    this.scene.add(this.rainGroup)
    this.isRaining = false
    this.rainIntensity = 1.0
    this.currentSeason = null
    
    // 创建雨滴
    this.rainDrops = this.createRainDrops()
    this.rainGroup.add(this.rainDrops)
    
    // 创建水渍效果
    this.waterEffects = this.createWaterEffects()
    this.rainGroup.add(this.waterEffects)
    
    // 初始状态：隐藏
    this.rainGroup.visible = false
  }
  
  createRainDrops() {
    const geometry = new THREE.BufferGeometry()
    const count = 2000
    
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      // 初始位置
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = Math.random() * 30 + 20
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      
      // 初始速度 - 添加微微歪斜效果
      const angle = Math.random() * Math.PI / 6 // -30°到30°的倾斜角度
      const baseSpeed = 1.5 + Math.random() * 1.0
      
      // X和Z分量使雨滴斜着下落
      velocities[i * 3] = Math.sin(angle) * baseSpeed * 0.3
      velocities[i * 3 + 1] = -baseSpeed
      velocities[i * 3 + 2] = Math.cos(angle) * baseSpeed * 0.3
      
      sizes[i] = 0.05 + Math.random() * 0.1
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    
    // 创建细线状纹理
    const rainTexture = this.createRainTexture()
    
    const material = new THREE.PointsMaterial({
      map: rainTexture,
      color: 0xCCCCCC, // 灰色调
      size: 0.5,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // 叠加混合使雨丝更柔和
      sizeAttenuation: true // 随距离衰减
    })
    
    return new THREE.Points(geometry, material)
  }
  
  // 创建雨滴纹理（细线状）
  createRainTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    
    // 透明背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0)'
    ctx.fillRect(0, 0, 32, 64)
    
    // 绘制细线状雨滴（带渐变透明）
    const gradient = ctx.createLinearGradient(0, 0, 0, 64)
    gradient.addColorStop(0, 'rgba(200, 200, 220, 0)') // 顶部透明
    gradient.addColorStop(0.3, 'rgba(200, 200, 220, 0.8)') // 中间不透明
    gradient.addColorStop(1, 'rgba(200, 200, 220, 0)') // 底部透明
    
    ctx.fillStyle = gradient
    ctx.fillRect(15, 0, 2, 64) // 细线
    
    return new THREE.CanvasTexture(canvas)
  }
  
  createWaterEffects() {
    // 创建水滴效果平面
    const planeGeometry = new THREE.PlaneGeometry(30, 30, 20, 20)
    
    // 创建水滴纹理材质
    const material = new THREE.MeshStandardMaterial({
      color: 0x4488FF,
      transparent: true,
      opacity: 0.3,
      roughness: 0.9,
      metalness: 0.1
    })
    
    const plane = new THREE.Mesh(planeGeometry, material)
    plane.rotation.x = -Math.PI / 2
    plane.position.y = 0.1
    
    // 添加波动效果
    const positionAttr = plane.geometry.attributes.position
    this.originalPositions = new Float32Array(positionAttr.array)
    this.waveOffsets = new Float32Array(positionAttr.count)
    
    for (let i = 0; i < this.waveOffsets.length; i++) {
      this.waveOffsets[i] = Math.random() * Math.PI * 2
    }
    
    return plane
  }
  
  setSeason(season) {
    this.currentSeason = season
    this.updateRainEffect()
  }
  
  setRainState(isRaining, intensity = 1.0) {
    this.isRaining = isRaining
    this.rainIntensity = intensity
    this.rainGroup.visible = isRaining
    this.updateRainEffect()
  }
  
  updateRainEffect() {
    if (!this.isRaining) return
    
    // 根据季节调整雨滴效果
    let seasonFactor = 1.0
    let rainColor = 0xCCCCCC // 基础灰色
    
    switch(this.currentSeason) {
      case 'spring':
        seasonFactor = 0.8
        rainColor = 0xB0E0E6 // 春雨偏浅蓝灰
        break
      case 'summer':
        seasonFactor = 1.8 * this.rainIntensity
        rainColor = 0x88AAFF // 夏雨偏蓝灰
        break
      case 'autumn':
        seasonFactor = 1.0
        rainColor = 0xAAAAAA // 秋雨偏中性灰
        break
      case 'winter':
        // 冬季没有雨
        this.rainGroup.visible = false
        return
    }
    
    // 确保冬季不会显示雨
    if (this.currentSeason === 'winter') {
      this.rainGroup.visible = false
      return
    }
    
    // 更新雨滴颜色
    this.rainDrops.material.color.set(rainColor)
    
    // 更新雨滴速度
    const velocities = this.rainDrops.geometry.attributes.velocity.array
    for (let i = 0; i < velocities.length; i += 3) {
      velocities[i + 1] = -1.5 - Math.random() * 2 * seasonFactor
    }
    this.rainDrops.geometry.attributes.velocity.needsUpdate = true
    
    // 更新水渍效果
    this.waterEffects.material.opacity = 0.3 * this.rainIntensity
    this.waterEffects.material.color.set(rainColor)
  }
  
  update() {
    if (!this.isRaining || this.currentSeason === 'winter') return
    
    const positions = this.rainDrops.geometry.attributes.position.array
    const velocities = this.rainDrops.geometry.attributes.velocity.array
    
    for (let i = 0; i < positions.length; i += 3) {
      // 添加轻微晃动，使雨丝更自然
      const sway = Math.sin(Date.now() * 0.001 + i) * 0.01
      
      positions[i] += velocities[i] + sway
      positions[i + 1] += velocities[i + 1]
      positions[i + 2] += velocities[i + 2]
      
      // 重置超出范围的雨滴
      if (positions[i + 1] < -10) {
        positions[i] = (Math.random() - 0.5) * 40
        positions[i + 1] = Math.random() * 30 + 30
        positions[i + 2] = (Math.random() - 0.5) * 40
        
        // 重置时添加新的随机倾斜
        const angle = Math.random() * Math.PI / 6
        velocities[i] = Math.sin(angle) * 0.3
        velocities[i + 2] = Math.cos(angle) * 0.3
      }
    }
    
    this.rainDrops.geometry.attributes.position.needsUpdate = true
    
    // 更新水波动画
    const time = Date.now() * 0.001
    const positionsAttr = this.waterEffects.geometry.attributes.position
    const originalPositions = this.originalPositions
    
    for (let i = 0; i < positionsAttr.count; i++) {
      const offset = this.waveOffsets[i]
      const waveHeight = 0.1 * this.rainIntensity
      const waveSpeed = 0.5 + Math.sin(offset) * 0.3
      
      positionsAttr.setY(
        i,
        originalPositions[i * 3 + 1] + 
        Math.sin(time * waveSpeed + offset) * waveHeight
      )
    }
    
    positionsAttr.needsUpdate = true
  }
}