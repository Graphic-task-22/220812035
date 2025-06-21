import * as THREE from 'three';

// 粒子系统配置
const SEASON_CONFIG = {
    spring: {
      texture: 'petal.png',
      count: 800,  // 大幅增加花瓣数量
      size: 1.2,   // 显著增大花瓣尺寸
      fallSpeed: 0.02,
      swayRange: 0.08,  // 增大摇摆幅度
      rotationSpeed: 0.02,
      colors: [0xFFC0CB, 0xFFB6C1, 0xFF69B4]
    },
    summer: {
      texture: 'sun.png',
      count: 150,
      size: 0.55,
      fallSpeed: 0.015,
      hoverSpeed: 0.03,
      colors: [0xFFFF00, 0xFFD700, 0xFFA500]
    },
    autumn: {
      texture: 'leaf.png',
      count: 600,  // 大幅增加落叶数量
      size: 1.5,   // 显著增大落叶尺寸
      fallSpeed: 0.025,
      rotationSpeed: 0.015,
      swayRange: 0.1,  // 增大摇摆幅度
      colors: [0xFF8C00, 0xFF4500, 0xD2691E]
    },
    winter: {
      texture: 'snow.png',
      count: 1000, // 大幅增加雪花数量
      size: 1.8,   // 显著增大雪花尺寸
      fallSpeed: 0.035,
      driftSpeed: 0.008,
      colors: [0xFFFFFF, 0xE0FFFF, 0xF0F8FF]
    }
};

// 特效配置
const EFFECT_CONFIG = {
    petal: {
        texture: 'petal.png',
        count: 400,
        size: 1.0,
        fallSpeed: 0.02,
        swayRange: 0.08,
        rotationSpeed: 0.02,
        colors: [0xFFC0CB, 0xFFB6C1, 0xFF69B4]
    },
    firefly: {
        texture: 'sun.png',
        count: 200,
        size: 0.4,
        fallSpeed: 0.01,
        hoverSpeed: 0.04,
        colors: [0xFFFF00, 0xFFD700, 0xFFFFE0]
    },
    leaf: {
        texture: 'leaf.png',
        count: 300,
        size: 1.2,
        fallSpeed: 0.025,
        rotationSpeed: 0.015,
        swayRange: 0.1,
        colors: [0xFF8C00, 0xFF4500, 0xD2691E]
    },
    snow: {
        texture: 'snow.png',
        count: 500,
        size: 1.5,
        fallSpeed: 0.035,
        driftSpeed: 0.008,
        colors: [0xFFFFFF, 0xE0FFFF, 0xF0F8FF]
    },
    rain: {
        texture: 'snow.png', // 暂时使用雪花纹理，稍后我们会创建专门的雨滴效果
        count: 800, // 减少数量，让每个雨滴更明显
        size: 3.0, // 显著增大雨滴尺寸
        fallSpeed: 0.15, // 更快的下落速度
        colors: [0xADD8E6, 0x87CEEB, 0x4682B4, 0x6495ED, 0x1E90FF] // 更亮的蓝色系雨滴
    }
};

export class ParticleSystem {
    constructor(scene) {
        this.scene = scene;
        this.textureLoader = new THREE.TextureLoader();
        this.activeSeason = null;
        this.particleSystems = {}; // 存储所有季节的粒子系统
        this.effectSystems = {}; // 存储所有特效的粒子系统
        this.activeEffects = new Set(); // 当前激活的特效
        
        // 预加载所有纹理
        this.textures = {};
        Object.keys(SEASON_CONFIG).forEach(season => {
            const { texture } = SEASON_CONFIG[season];
            this.textures[season] = this.textureLoader.load(`/textures/${texture}`);
        });
        
        // 预加载特效纹理
        Object.keys(EFFECT_CONFIG).forEach(effect => {
            const { texture } = EFFECT_CONFIG[effect];
            if (!this.textures[effect]) {
                this.textures[effect] = this.textureLoader.load(`/textures/${texture}`);
            }
        });
        
        // 预创建粒子系统（但不添加到场景）
        this.createAllParticleSystems();
        this.createAllEffectSystems();
    }

    createParticleSystem(season) {
        const config = SEASON_CONFIG[season];
        const geometry = new THREE.BufferGeometry();
        const count = config.count;
        
        // 位置、速度、旋转、颜色等属性
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const rotations = new Float32Array(count);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            // 初始位置 - 大幅扩大覆盖范围，覆盖整个地图
            positions[i * 3] = (Math.random() - 0.5) * 200;     // 扩大x轴范围到200
            positions[i * 3 + 1] = Math.random() * 80 + 20;     // 扩大y轴范围到80+20
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // 扩大z轴范围到200
            
            // 初始速度
            velocities[i * 3] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 1] = -config.fallSpeed * (0.8 + Math.random() * 0.4);
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
            
            // 初始旋转
            rotations[i] = Math.random() * Math.PI * 2;
            
            // 大小变化 - 增加随机性，让粒子大小更丰富
            sizes[i] = config.size * (0.6 + Math.random() * 0.8);
            
            // 随机颜色变化
            const colorIdx = Math.floor(Math.random() * config.colors.length);
            const color = new THREE.Color(config.colors[colorIdx]);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: config.size,
            map: this.textures[season],
            vertexColors: true, // 启用顶点颜色
            transparent: true,
            alphaTest: 0.5,
            depthWrite: false
        });
        
        return new THREE.Points(geometry, material);
    }

    createAllParticleSystems() {
        Object.keys(SEASON_CONFIG).forEach(season => {
            this.particleSystems[season] = this.createParticleSystem(season);
            this.particleSystems[season].visible = false; // 初始隐藏
            this.scene.add(this.particleSystems[season]);
        });
    }

    createEffectSystem(effectType) {
        const config = EFFECT_CONFIG[effectType];
        const geometry = new THREE.BufferGeometry();
        const count = config.count;
        
        // 位置、速度、旋转、颜色等属性
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count * 3);
        const rotations = new Float32Array(count);
        const sizes = new Float32Array(count);
        const colors = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            // 初始位置 - 覆盖整个地图
            positions[i * 3] = (Math.random() - 0.5) * 200;
            positions[i * 3 + 1] = Math.random() * 80 + 20;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200;
            
            // 初始速度
            velocities[i * 3] = (Math.random() - 0.5) * 0.02;
            velocities[i * 3 + 1] = -config.fallSpeed * (0.8 + Math.random() * 0.4);
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
            
            // 初始旋转
            rotations[i] = Math.random() * Math.PI * 2;
            
            // 大小变化
            sizes[i] = config.size * (0.6 + Math.random() * 0.8);
            
            // 随机颜色变化
            const colorIdx = Math.floor(Math.random() * config.colors.length);
            const color = new THREE.Color(config.colors[colorIdx]);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        geometry.setAttribute('rotation', new THREE.BufferAttribute(rotations, 1));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        let material;
        if (effectType === 'rain') {
            // 为雨天创建专门的着色器材质
            const rainVertexShader = `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (500.0 / -mvPosition.z); // 增大基础大小倍数
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // 根据位置计算透明度
                    vAlpha = 1.0 - (position.y + 20.0) / 100.0;
                    vAlpha = clamp(vAlpha, 0.0, 1.0);
                }
            `;
            
            const rainFragmentShader = `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    // 创建雨滴形状
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    // 雨滴是椭圆形的
                    float aspect = 3.0; // 雨滴的长宽比
                    float normalizedDist = sqrt(center.x * center.x * aspect * aspect + center.y * center.y);
                    
                    if (normalizedDist > 0.5) {
                        discard;
                    }
                    
                    // 雨滴的渐变效果
                    float alpha = 1.0 - normalizedDist * 2.0;
                    alpha = pow(alpha, 1.5); // 调整边缘柔和度
                    
                    gl_FragColor = vec4(vColor, alpha * vAlpha * 1.2); // 增加整体透明度
                }
            `;
            
            material = new THREE.ShaderMaterial({
                vertexShader: rainVertexShader,
                fragmentShader: rainFragmentShader,
                transparent: true,
                depthWrite: false,
                blending: THREE.AdditiveBlending
            });
        } else {
            // 其他特效使用纹理
            material = new THREE.PointsMaterial({
                size: config.size,
                map: this.textures[effectType],
                vertexColors: true,
                transparent: true,
                alphaTest: 0.5,
                depthWrite: false
            });
        }
        
        return new THREE.Points(geometry, material);
    }

    createAllEffectSystems() {
        Object.keys(EFFECT_CONFIG).forEach(effect => {
            this.effectSystems[effect] = this.createEffectSystem(effect);
            this.effectSystems[effect].visible = false; // 初始隐藏
            this.scene.add(this.effectSystems[effect]);
        });
    }

    setParticleType(type) {
        if (this.activeSeason) {
            this.particleSystems[this.activeSeason].visible = false;
        }
        
        this.activeSeason = type;
        if (this.particleSystems[type]) {
            this.particleSystems[type].visible = true;
        }
    }

    getParticleType() {
        return this.activeSeason;
    }

    // 特效切换方法
    toggleEffect(effectType, enabled) {
        if (enabled) {
            this.activeEffects.add(effectType);
            if (this.effectSystems[effectType]) {
                this.effectSystems[effectType].visible = true;
            }
        } else {
            this.activeEffects.delete(effectType);
            if (this.effectSystems[effectType]) {
                this.effectSystems[effectType].visible = false;
            }
        }
    }

    // 获取当前激活的特效
    getActiveEffects() {
        return Array.from(this.activeEffects);
    }

    // 设置激活的特效列表
    setActiveEffects(effectList) {
        // 先隐藏所有特效
        Object.keys(this.effectSystems).forEach(effect => {
            if (this.effectSystems[effect]) {
                this.effectSystems[effect].visible = false;
            }
        });
        
        // 清空当前激活特效集合
        this.activeEffects.clear();
        
        // 激活指定的特效
        effectList.forEach(effect => {
            if (this.effectSystems[effect]) {
                this.effectSystems[effect].visible = true;
                this.activeEffects.add(effect);
            }
        });
        
        console.log('特效已更新:', effectList);
    }

    update(deltaTime) {
        // 更新季节粒子系统
        if (this.activeSeason) {
            this.updateParticleSystem(this.particleSystems[this.activeSeason], SEASON_CONFIG[this.activeSeason], this.activeSeason);
        }
        
        // 更新特效系统
        this.activeEffects.forEach(effectType => {
            if (this.effectSystems[effectType]) {
                this.updateParticleSystem(this.effectSystems[effectType], EFFECT_CONFIG[effectType], effectType);
            }
        });
    }

    updateParticleSystem(particles, config, type) {
        if (!particles || !particles.visible) return;
        
        const positions = particles.geometry.attributes.position;
        const velocities = particles.geometry.attributes.velocity;
        const rotations = particles.geometry.attributes.rotation;
        
        for (let i = 0; i < positions.count; i++) {
            // 类型特有行为
            switch(type) {
                case 'spring':
                case 'petal':
                    // 花瓣摇摆效果
                    positions.array[i * 3] += Math.sin(Date.now() * 0.001 + i) * config.swayRange * 0.01;
                    rotations.array[i] += config.rotationSpeed;
                    break;
                    
                case 'summer':
                case 'firefly':
                    // 小虫悬浮运动
                    positions.array[i * 3] += (Math.sin(Date.now() * 0.001 + i * 0.1) - 0.5) * 0.02;
                    positions.array[i * 3 + 1] += Math.cos(Date.now() * 0.002 + i) * config.hoverSpeed;
                    break;
                    
                case 'autumn':
                case 'leaf':
                    // 树叶旋转飘落
                    positions.array[i * 3] += Math.sin(Date.now() * 0.001 + i) * config.swayRange * 0.01;
                    rotations.array[i] += config.rotationSpeed;
                    break;
                    
                case 'winter':
                case 'snow':
                    // 雪花漂浮感
                    positions.array[i * 3] += (Math.random() - 0.5) * config.driftSpeed;
                    positions.array[i * 3 + 2] += (Math.random() - 0.5) * config.driftSpeed;
                    break;
                    
                case 'rain':
                    // 雨滴直线下落，稍微有点倾斜
                    positions.array[i * 3] += (Math.random() - 0.5) * 0.01; // 轻微的水平漂移
                    // 雨滴下落时稍微倾斜
                    positions.array[i * 3] += Math.sin(Date.now() * 0.001 + i * 0.1) * 0.005;
                    break;
            }
            
            // 通用位置更新
            positions.array[i * 3] += velocities.array[i * 3];
            positions.array[i * 3 + 1] += velocities.array[i * 3 + 1];
            positions.array[i * 3 + 2] += velocities.array[i * 3 + 2];
            
            // 边界重置 - 扩大重置范围，确保覆盖整个地图
            if (positions.array[i * 3 + 1] < -20) {
                positions.array[i * 3] = (Math.random() - 0.5) * 200;     // 扩大x轴重置范围
                positions.array[i * 3 + 1] = Math.random() * 20 + 80;     // 扩大y轴重置范围
                positions.array[i * 3 + 2] = (Math.random() - 0.5) * 200; // 扩大z轴重置范围
            }
        }
        
        positions.needsUpdate = true;
        rotations.needsUpdate = true;
    }

    dispose() {
        // 清理季节粒子系统
        Object.values(this.particleSystems).forEach(particles => {
            this.scene.remove(particles);
            particles.geometry.dispose();
            particles.material.dispose();
        });
        this.particleSystems = {};
        this.activeSeason = null;
        
        // 清理特效系统
        Object.values(this.effectSystems).forEach(particles => {
            this.scene.remove(particles);
            particles.geometry.dispose();
            particles.material.dispose();
        });
        this.effectSystems = {};
        this.activeEffects.clear();
    }
}