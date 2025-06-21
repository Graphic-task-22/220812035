import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import ModelAnimation from './animation.js';
import { ParticleSystem } from './ParticleSystem.js';
import { ErrorHandler, DebugTools, PerformanceMonitor, Utils } from './utils.js';

export class GameScene {
    constructor() {
        // 检查WebGL支持
        if (!Utils.checkWebGLSupport()) {
            throw new Error('WebGL不受支持，无法运行游戏');
        }
        
        // 初始化核心对象
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // 游戏状态
        this.isRunning = false;
        this.clock = new THREE.Clock();
        
        // 角色相关
        this.player = null;
        this.playerAnimation = null;
        this.playerVelocity = new THREE.Vector3();
        this.playerDirection = new THREE.Vector3();
        this.playerOnGround = false;
        
        // 控制相关
        this.keys = {};
        this.controls = null; // 用于 OrbitControls
        
        // 物理相关
        this.raycaster = new THREE.Raycaster();
        this.groundObjects = [];
        this.collisionObjects = [];
        
        // 场景对象
        this.island = null;
        this.particleSystem = null;
        this.starSystem = null; // 添加星星系统
        
        // 环境设置
        this.currentSeason = 'spring';
        this.currentTime = 'noon';
        this.currentWeather = 'sunny';
        
        // 摄像机固定距离设置
        this.fixedDistance = 2.0; // 固定距离
        this.minFixedDistance = 0.5; // 最小固定距离
        this.maxFixedDistance = 30.0; // 最大固定距离（从10.0增加到30.0）
        this.zoomSpeed = 0.5; // 缩放速度
        
        // 特效状态管理
        this.activeEffects = {
            petal: false,
            firefly: false,
            leaf: false,
            snow: false
        };
        
        // 特效模式控制
        this.effectMode = 'auto'; // 'auto', 'petal', 'firefly', 'leaf', 'snow', 'none'
        
        // 性能监控
        this.performanceMonitor = new PerformanceMonitor();
        
        this.initRenderer();
        this.initLights();
        this.initEventListeners();
        
        // 启动调试工具
        if (process.env.NODE_ENV === 'development') {
            DebugTools.showFPS(this.renderer);
        }
    }

    // 初始化渲染器
    initRenderer() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.getElementById('gameContainer').appendChild(this.renderer.domElement);
    }

    // 初始化光源
    initLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // 主光源（太阳）
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        this.directionalLight.position.set(20, 30, 20);
        this.directionalLight.castShadow = true;
        this.directionalLight.shadow.mapSize.width = 2048;
        this.directionalLight.shadow.mapSize.height = 2048;
        this.directionalLight.shadow.camera.near = 0.5;
        this.directionalLight.shadow.camera.far = 500;
        this.directionalLight.shadow.camera.left = -100;
        this.directionalLight.shadow.camera.right = 100;
        this.directionalLight.shadow.camera.top = 100;
        this.directionalLight.shadow.camera.bottom = -100;
        this.scene.add(this.directionalLight);

        // 添加一些点光源来增强场景效果
        const pointLight1 = new THREE.PointLight(0xffffcc, 0.5, 50);
        pointLight1.position.set(10, 5, 10);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xccffff, 0.3, 30);
        pointLight2.position.set(-10, 3, -10);
        this.scene.add(pointLight2);
    }

    // 初始化事件监听器
    initEventListeners() {
        // 键盘事件
        this.handleKeyDown = (event) => {
            this.keys[event.code] = true;
        };

        this.handleKeyUp = (event) => {
            this.keys[event.code] = false;
        };

        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        // 窗口大小变化
        this.handleResize = () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', this.handleResize);
        
        // 调试快捷键
        document.addEventListener('keydown', (event) => {
            if (event.code === 'F1') {
                event.preventDefault();
                DebugTools.logSceneInfo(this.scene);
            }
            if (event.code === 'F2') {
                event.preventDefault();
                DebugTools.logPlayerInfo(this.player);
            }
            if (event.code === 'F3') {
                event.preventDefault();
                console.log('性能报告:', this.performanceMonitor.getPerformanceReport());
            }
        });

        // 时间控制
        document.getElementById('timeSelect').addEventListener('change', (e) => {
            this.currentTime = e.target.value;
            this.updateEnvironment();
        });

        // 季节控制
        document.getElementById('seasonSelect').addEventListener('change', (e) => {
            this.currentSeason = e.target.value;
            this.updateEnvironment();
        });

        // 天气控制
        document.getElementById('weatherSelect').addEventListener('change', (e) => {
            this.currentWeather = e.target.value;
            this.updateEnvironment();
        });

        // 隐藏动画控制按钮，因为现在是静态模型
        const animationButtons = ['idleBtn', 'walkBtn', 'runBtn', 'jumpBtn'];
        animationButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = 'none';
            }
        });
    }

    // 初始化游戏
    async init() {
        try {
            // 设置初始场景背景
            this.updateEnvironment();
            
            // 加载角色模型
            await this.loadPlayer();
            
            // 加载海岛模型
            await this.loadIsland();
            
            // 创建地面 (可选，因为岛屿本身就是地面)
            // this.createGround(); 
            
            // 设置摄像机和控制器
            this.camera.position.set(0, 0.3, 0.8); // 进一步拉近摄像机距离(y=0.3, z=0.8)
            this.setupOrbitControls();
            
            // 创建粒子系统
            this.particleSystem = new ParticleSystem(this.scene);
            this.particleSystem.setParticleType('spring'); // 默认春季效果
            
            // 创建星星系统
            this.createStarSystem();
            
            console.log('游戏初始化完成');
            
        } catch (error) {
            console.error('游戏初始化失败:', error);
            ErrorHandler.handleModelLoadError(error, '游戏场景');
        }
    }

    // 加载角色模型
    async loadPlayer() {
        return new Promise((resolve, reject) => {
            console.log('开始加载角色模型...');
            const loader = new GLTFLoader();
            const modelPath = './src/models/Assets/role.glb';
            
            loader.load(
                modelPath,
                (gltf) => {
                    try {
                        console.log('角色模型 GLTF 加载成功:', gltf);
                        
                        if (!gltf.scene || !gltf.scene.isObject3D) {
                             throw new Error('GLTF 文件中没有有效的场景对象');
                        }

                        this.player = gltf.scene;
                        this.player.scale.set(0.7, 0.7, 0.7); // 保持放大
                        this.player.position.set(30, 30, 0);    // 更右且更高，避免掉落
                        
                        // 设置角色阴影
                        this.player.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        
                        this.scene.add(this.player);
                        console.log('角色模型已成功添加到场景中');
                        
                        // 静态模型处理
                        console.log('角色模型作为静态模型处理');
                        resolve();
                        
                    } catch (error) {
                        console.error('处理角色模型时出错:', error);
                        reject(error);
                    }
                },
                (progress) => {
                    const percent = (progress.loaded / progress.total * 100).toFixed(2);
                    console.log(`角色模型加载进度: ${percent}%`);
                },
                (error) => {
                    console.error('加载角色模型失败 (XHR Error):', error);
                    reject(error);
                }
            );
        });
    }

    // 加载海岛模型
    async loadIsland() {
        return new Promise((resolve, reject) => {
            console.log('开始加载海岛模型...');
            const loader = new GLTFLoader();
            const modelPath = './src/models/statan/shatan.glb';
            
            loader.load(
                modelPath,
                (gltf) => {
                    try {
                        console.log('海岛模型加载成功:', gltf);
                        this.island = gltf.scene;
                        this.island.scale.set(30, 30, 30); // 调整缩放
                        // 调整海岛位置，确保角色能站在上面
                        this.island.position.set(0, 0, 0);
                        this.island.rotation.y = Math.PI / 4;
                        
                        // 设置海岛阴影和碰撞检测
                        let meshCount = 0;
                        this.island.traverse((child) => {
                            if (child.isMesh) {
                                meshCount++;
                                child.receiveShadow = true;
                                child.castShadow = true;
                                
                                // 添加到碰撞检测对象
                                this.collisionObjects.push(child);
                                
                                // 所有网格都作为地面对象，用于射线检测
                                this.groundObjects.push(child);
                            }
                        });
                        
                        console.log(`海岛模型包含 ${meshCount} 个网格`);
                        
                        this.scene.add(this.island);
                        console.log('海岛模型加载完成');
                        resolve();
                        
                    } catch (error) {
                        console.error('海岛模型处理失败:', error);
                        ErrorHandler.handleModelLoadError(error, '海岛模型');
                        reject(error);
                    }
                },
                (progress) => {
                    console.log('海岛模型加载进度:', (progress.loaded / progress.total * 100).toFixed(2) + '%');
                },
                (error) => {
                    console.error('海岛模型加载失败:', error);
                    ErrorHandler.handleModelLoadError(error, '海岛模型');
                    reject(error);
                }
            );
        });
    }

    // 创建地面
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90,
            transparent: true,
            opacity: 0.3
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5; // 调整地面位置
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // 添加到地面对象数组
        this.groundObjects.push(ground);
    }

    // 创建星星系统
    createStarSystem() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 2000; // 星星数量
        
        const positions = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            // 在球面上随机分布星星
            const radius = 500 + Math.random() * 200; // 距离范围
            const theta = Math.random() * Math.PI * 2; // 水平角度
            const phi = Math.random() * Math.PI; // 垂直角度
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            
            // 随机大小
            sizes[i] = Math.random() * 2 + 0.5;
            
            // 随机颜色（白色到淡蓝色）
            const color = new THREE.Color();
            color.setHSL(0.6, 0.1, 0.8 + Math.random() * 0.2);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 1,
            vertexColors: true,
            transparent: true,
            alphaTest: 0.5,
            depthWrite: false
        });
        
        this.starSystem = new THREE.Points(starGeometry, starMaterial);
        this.starSystem.visible = false; // 默认隐藏
        this.scene.add(this.starSystem);
    }

    // 设置 OrbitControls 控制器
    setupOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // 启用阻尼（惯性）
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false; // 不允许屏幕空间平移
        this.controls.enableZoom = false; // 禁用默认的滚轮缩放
        this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // 限制垂直角度，防止摄像机到地面以下
        
        if (this.player) {
            this.controls.target.copy(this.player.position);
        }
        
        // 添加自定义滚轮事件
        this.setupCustomZoom();
        
        this.controls.update();
    }

    // 设置自定义缩放功能
    setupCustomZoom() {
        const handleWheel = (event) => {
            event.preventDefault();
            
            // 根据滚轮方向调整固定距离
            if (event.deltaY > 0) {
                // 滚轮向下，拉远
                this.fixedDistance = Math.min(this.maxFixedDistance, this.fixedDistance + this.zoomSpeed);
            } else {
                // 滚轮向上，拉近
                this.fixedDistance = Math.max(this.minFixedDistance, this.fixedDistance - this.zoomSpeed);
            }
        };
        
        // 添加滚轮事件监听器
        this.renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });
        
        // 保存事件监听器引用，以便后续清理
        this.wheelHandler = handleWheel;
    }

    // 设置UI面板的控制器
    setupControls() {
        // 季节控制
        document.getElementById('seasonSelect').addEventListener('change', (e) => {
            this.currentSeason = e.target.value;
            this.updateEnvironment();
        });

        // 时间控制
        document.getElementById('timeSelect').addEventListener('change', (e) => {
            this.currentTime = e.target.value;
            this.updateEnvironment();
        });

        // 天气控制
        document.getElementById('weatherSelect').addEventListener('change', (e) => {
            this.currentWeather = e.target.value;
            this.updateEnvironment();
        });

        // 隐藏动画控制按钮，因为现在是静态模型
        const animationButtons = ['idleBtn', 'walkBtn', 'runBtn', 'jumpBtn'];
        animationButtons.forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = 'none';
            }
        });
    }

    // 更新环境设置
    updateEnvironment() {
        // 根据季节和时间更新背景色
        let backgroundColor, lightColor, lightIntensity, particleType;
        
        switch (this.currentSeason) {
            case 'spring':
                backgroundColor = 0xE6F3FF; // 更柔和的淡蓝色
                lightColor = 0xFFFFE0;
                lightIntensity = 1.2;
                break;
            case 'summer':
                backgroundColor = 0xFFE4B5; // 更柔和的米黄色
                lightColor = 0xFFFF00;
                lightIntensity = 1.5;
                break;
            case 'autumn':
                backgroundColor = 0xF4A460; // 更柔和的沙棕色
                lightColor = 0xFFA500;
                lightIntensity = 1.0;
                break;
            case 'winter':
                backgroundColor = 0xF0F8FF; // 保持冬天的冷色调
                lightColor = 0xFFFFFF;
                lightIntensity = 0.8;
                break;
        }
        
        // 根据时间调整
        switch (this.currentTime) {
            case 'morning':
                backgroundColor = new THREE.Color(backgroundColor).lerp(new THREE.Color(0xFFE4E1), 0.4); // 更柔和的粉色
                lightIntensity *= 0.8;
                break;
            case 'noon':
                // 冬天中午保持冷色调，其他季节更温暖
                if (this.currentSeason !== 'winter') {
                    backgroundColor = new THREE.Color(backgroundColor).lerp(new THREE.Color(0xFFFACD), 0.2); // 更柔和的金色调
                }
                lightIntensity *= 1.2;
                break;
            case 'evening':
                backgroundColor = new THREE.Color(backgroundColor).lerp(new THREE.Color(0xFFB6C1), 0.6); // 更柔和的粉红色
                lightIntensity *= 0.6;
                break;
            case 'night':
                backgroundColor = new THREE.Color(0x2F2F4F); // 更柔和的深蓝灰色
                lightIntensity *= 0.1; // 大幅降低光照强度
                break;
        }
        
        // 根据季节设置粒子类型
        particleType = this.currentSeason;
        
        // 应用环境设置
        this.scene.background = backgroundColor;
        this.directionalLight.color.setHex(lightColor);
        this.directionalLight.intensity = lightIntensity;
        
        // 控制星星显示
        if (this.starSystem) {
            this.starSystem.visible = (this.currentTime === 'night');
        }
        
        // 更新粒子系统
        if (this.particleSystem && this.particleSystem.getParticleType() !== particleType) {
            this.particleSystem.setParticleType(particleType);
        }
        
        // 更新特效
        this.updateEffects();
    }

    // 更新特效系统
    updateEffects() {
        if (!this.particleSystem) return;
        
        // 根据特效模式决定显示哪些特效
        let activeEffects = [];
        
        // 首先检查天气特效
        if (this.currentWeather === 'rainy') {
            activeEffects.push('rain');
        }
        
        switch (this.effectMode) {
            case 'auto':
                // 自动模式：根据季节和时间自动显示特效（但雨天优先）
                if (this.currentWeather !== 'rainy') { // 如果不是雨天才显示季节特效
                    if (this.currentSeason === 'spring') {
                        activeEffects.push('petal');
                    } else if (this.currentSeason === 'summer' && this.currentTime === 'night') {
                        activeEffects.push('firefly');
                    } else if (this.currentSeason === 'autumn') {
                        activeEffects.push('leaf');
                    } else if (this.currentSeason === 'winter') {
                        activeEffects.push('snow');
                    }
                }
                break;
                
            case 'petal':
                if (this.currentWeather !== 'rainy') {
                    activeEffects.push('petal');
                }
                break;
                
            case 'firefly':
                if (this.currentWeather !== 'rainy') {
                    activeEffects.push('firefly');
                }
                break;
                
            case 'leaf':
                if (this.currentWeather !== 'rainy') {
                    activeEffects.push('leaf');
                }
                break;
                
            case 'snow':
                if (this.currentWeather !== 'rainy') {
                    activeEffects.push('snow');
                }
                break;
                
            case 'rain':
                activeEffects.push('rain');
                break;
                
            case 'none':
                // 不显示任何特效
                break;
        }
        
        // 更新粒子系统的特效
        this.particleSystem.setActiveEffects(activeEffects);
    }

    // 设置特效模式
    setEffectMode(mode) {
        this.effectMode = mode;
        this.updateEffects();
    }

    // 射线检测 - 已被合并
    checkGroundCollision() {}

    // 碰撞检测 - 暂时简化
    checkCollision(newPosition) {
        return false; 
    }

    // 处理角色移动 (已重构)
    handlePlayerMovement(deltaTime) {
        if (!this.player) return;

        const speed = 5;
        const jumpSpeed = 8;
        const gravity = 25;

        // --- 1. 获取输入和计算移动方向 ---
        const moveForward = this.keys['KeyW'] || false;
        const moveBackward = this.keys['KeyS'] || false;
        const moveLeft = this.keys['KeyA'] || false;
        const moveRight = this.keys['KeyD'] || false;
        const jump = this.keys['Space'] || false;
        const run = this.keys['ShiftLeft'] || false;

        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        // 修正: right = forward x up
        const rightDirection = new THREE.Vector3().crossVectors(cameraDirection, this.camera.up).normalize();

        const moveDirection = new THREE.Vector3(0, 0, 0);
        if (moveForward) moveDirection.add(cameraDirection);
        if (moveBackward) moveDirection.sub(cameraDirection);
        // 修正: A 向左，D 向右
        if (moveLeft) moveDirection.sub(rightDirection);
        if (moveRight) moveDirection.add(rightDirection);
        moveDirection.normalize();

        // --- 2. 更新水平速度 ---
        const currentSpeed = run ? speed * 1.5 : speed;
        this.playerVelocity.x = moveDirection.x * currentSpeed;
        this.playerVelocity.z = moveDirection.z * currentSpeed;

        // --- 3. 处理垂直速度（重力和跳跃） ---
        if (jump && this.playerOnGround) {
            this.playerVelocity.y = jumpSpeed;
            this.playerOnGround = false;
        }
        this.playerVelocity.y -= gravity * deltaTime;

        // --- 4. 计算并应用位移 ---
        const deltaPosition = this.playerVelocity.clone().multiplyScalar(deltaTime);
        this.player.position.add(deltaPosition);

        // --- 5. 地面检测和校正 ---
        const groundRayStart = this.player.position.clone();
        groundRayStart.y += 2;
        this.raycaster.set(groundRayStart, new THREE.Vector3(0, -1, 0));
        const intersects = this.raycaster.intersectObjects(this.groundObjects, true);

        if (intersects.length > 0) {
            const groundHeight = intersects[0].point.y;
            const playerFeetOffset = 0.4; // 放大后脚底偏移也要适当增大

            if (this.player.position.y < groundHeight + playerFeetOffset) {
                this.player.position.y = groundHeight + playerFeetOffset;
                this.playerVelocity.y = 0;
                this.playerOnGround = true;
            }
        } else {
            this.playerOnGround = false;
        }

        // --- 6. 更新角色朝向 ---
        if (moveDirection.lengthSq() > 0) {
            const angle = Math.atan2(moveDirection.x, moveDirection.z);
            this.player.rotation.y = angle;
        }
    }

    // 更新摄像机已由 OrbitControls 处理，我们只需要更新它的目标
    updateCamera() {
        if (this.player && this.controls) {
            // 让控制器的目标平滑地跟随角色
            const targetPosition = this.player.position.clone();
            targetPosition.y += 0.6; // 进一步降低视角中心点，更贴近角色
            this.controls.target.lerp(targetPosition, 0.3); // 更快的跟随速度
            
            // 强制设置摄像机距离，确保始终贴近角色
            const currentDistance = this.camera.position.distanceTo(this.controls.target);
            if (currentDistance > 20) { // 如果距离超过20，强制拉近到20
                const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
                this.camera.position.copy(this.controls.target).add(direction.multiplyScalar(20));
            }
            
            // 应用固定距离
            this.applyFixedDistance();
        }
    }

    // 应用固定距离
    applyFixedDistance() {
        if (!this.player || !this.controls) return;
        
        // 计算当前摄像机到目标的方向
        const direction = new THREE.Vector3().subVectors(this.camera.position, this.controls.target).normalize();
        
        // 如果方向无效（摄像机在目标位置），使用默认方向
        if (direction.lengthSq() === 0) {
            direction.set(0, 0, 1); // 默认向后看
        }
        
        // 计算新的摄像机位置
        const newPosition = this.controls.target.clone().add(direction.multiplyScalar(this.fixedDistance));
        
        // 平滑地更新摄像机位置
        this.camera.position.lerp(newPosition, 0.1);
    }

    // 游戏主循环
    animate() {
        if (!this.isRunning) return;
        
        this.performanceMonitor.startFrame();
        
        const deltaTime = this.clock.getDelta();
        
        // 处理角色移动 (已包含地面检测)
        this.handlePlayerMovement(deltaTime);
        
        // 更新摄像机目标
        this.updateCamera();

        // 更新 OrbitControls
        if (this.controls) {
            this.controls.update();
        }
        
        // 更新粒子系统
        if (this.particleSystem) {
            this.particleSystem.update(deltaTime);
        }
        
        // 更新星星闪烁效果
        if (this.starSystem && this.starSystem.visible) {
            this.updateStarTwinkle(deltaTime);
        }
        
        this.renderer.render(this.scene, this.camera);
        
        this.performanceMonitor.endFrame(this.renderer);
        
        requestAnimationFrame(() => this.animate());
    }

    // 启动游戏
    start() {
        this.isRunning = true;
        this.animate();
    }

    // 停止游戏
    stop() {
        this.isRunning = false;
    }
    
    // 清理资源
    dispose() {
        this.stop();
        
        if (this.particleSystem) {
            this.particleSystem.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // 清理事件监听器
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('resize', this.handleResize);
        
        // 清理滚轮事件监听器
        if (this.renderer && this.wheelHandler) {
            this.renderer.domElement.removeEventListener('wheel', this.wheelHandler);
        }
    }

    // 更新星星闪烁效果
    updateStarTwinkle(deltaTime) {
        if (!this.starSystem) return;
        
        const positions = this.starSystem.geometry.attributes.position;
        const sizes = this.starSystem.geometry.attributes.size;
        const colors = this.starSystem.geometry.attributes.color;
        
        for (let i = 0; i < positions.count; i++) {
            // 随机闪烁
            const twinkleSpeed = 2 + Math.random() * 3;
            const twinkleAmount = 0.3 + Math.random() * 0.4;
            const twinkle = Math.sin(Date.now() * 0.001 * twinkleSpeed + i) * twinkleAmount + 1;
            
            // 更新大小
            sizes.array[i] = (Math.random() * 2 + 0.5) * twinkle;
            
            // 更新颜色亮度
            const baseColor = new THREE.Color();
            baseColor.setHSL(0.6, 0.1, 0.8 + Math.random() * 0.2);
            baseColor.multiplyScalar(twinkle);
            
            colors.array[i * 3] = baseColor.r;
            colors.array[i * 3 + 1] = baseColor.g;
            colors.array[i * 3 + 2] = baseColor.b;
        }
        
        sizes.needsUpdate = true;
        colors.needsUpdate = true;
    }
} 