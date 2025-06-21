// 工具函数集合

// 错误处理类
export class ErrorHandler {
    static handleModelLoadError(error, modelName) {
        console.error(`模型加载失败 (${modelName}):`, error);
        
        // 创建错误提示元素
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 0, 0, 0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            font-family: Arial, sans-serif;
            text-align: center;
        `;
        errorDiv.innerHTML = `
            <h3>模型加载失败</h3>
            <p>无法加载 ${modelName} 模型</p>
            <p>请检查文件路径是否正确</p>
            <button onclick="this.parentElement.remove()" style="margin-top: 10px; padding: 5px 10px;">关闭</button>
        `;
        document.body.appendChild(errorDiv);
        
        // 5秒后自动移除
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
    
    static handleAnimationError(error, animationName) {
        console.warn(`动画播放失败 (${animationName}):`, error);
    }
}

// 调试工具类
export class DebugTools {
    static showFPS(renderer) {
        const stats = {
            fps: 0,
            frameCount: 0,
            lastTime: performance.now()
        };
        
        const updateStats = () => {
            stats.frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - stats.lastTime >= 1000) {
                stats.fps = Math.round((stats.frameCount * 1000) / (currentTime - stats.lastTime));
                stats.frameCount = 0;
                stats.lastTime = currentTime;
                
                // 更新FPS显示
                this.updateFPSDisplay(stats.fps);
            }
            
            requestAnimationFrame(updateStats);
        };
        
        updateStats();
    }
    
    static updateFPSDisplay(fps) {
        let fpsDisplay = document.getElementById('fps-display');
        if (!fpsDisplay) {
            fpsDisplay = document.createElement('div');
            fpsDisplay.id = 'fps-display';
            fpsDisplay.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                font-family: monospace;
                z-index: 1000;
            `;
            document.body.appendChild(fpsDisplay);
        }
        fpsDisplay.textContent = `FPS: ${fps}`;
    }
    
    static logSceneInfo(scene) {
        console.log('场景信息:', {
            children: scene.children.length,
            objects: scene.children.map(child => ({
                name: child.name || '未命名',
                type: child.type,
                visible: child.visible
            }))
        });
    }
    
    static logPlayerInfo(player) {
        if (!player) {
            console.log('角色未加载');
            return;
        }
        
        console.log('角色信息:', {
            position: player.position.toArray(),
            rotation: player.rotation.toArray(),
            scale: player.scale.toArray(),
            visible: player.visible
        });
    }
}

// 性能监控类
export class PerformanceMonitor {
    constructor() {
        this.metrics = {
            frameTime: [],
            memoryUsage: [],
            renderCalls: 0
        };
    }
    
    startFrame() {
        this.frameStart = performance.now();
    }
    
    endFrame(renderer) {
        const frameTime = performance.now() - this.frameStart;
        this.metrics.frameTime.push(frameTime);
        
        // 保持最近100帧的数据
        if (this.metrics.frameTime.length > 100) {
            this.metrics.frameTime.shift();
        }
        
        // 记录渲染调用次数
        if (renderer && renderer.info) {
            this.metrics.renderCalls = renderer.info.render.calls;
        }
    }
    
    getAverageFrameTime() {
        if (this.metrics.frameTime.length === 0) return 0;
        const sum = this.metrics.frameTime.reduce((a, b) => a + b, 0);
        return sum / this.metrics.frameTime.length;
    }
    
    getPerformanceReport() {
        return {
            averageFrameTime: this.getAverageFrameTime(),
            renderCalls: this.metrics.renderCalls,
            frameCount: this.metrics.frameTime.length
        };
    }
}

// 工具函数
export const Utils = {
    // 限制数值范围
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // 线性插值
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    },
    
    // 角度转弧度
    degToRad(degrees) {
        return degrees * Math.PI / 180;
    },
    
    // 弧度转角度
    radToDeg(radians) {
        return radians * 180 / Math.PI;
    },
    
    // 生成随机颜色
    randomColor() {
        return Math.random() * 0xFFFFFF;
    },
    
    // 格式化时间
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    // 检查WebGL支持
    checkWebGLSupport() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) {
            console.error('WebGL不受支持');
            return false;
        }
        
        return true;
    },
    
    // 检查设备性能
    checkDevicePerformance() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl');
        
        if (!gl) return 'low';
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            if (renderer.includes('Intel') || renderer.includes('AMD')) {
                return 'medium';
            } else if (renderer.includes('NVIDIA') || renderer.includes('Apple')) {
                return 'high';
            }
        }
        
        return 'unknown';
    }
};

// 导出所有工具
export default {
    ErrorHandler,
    DebugTools,
    PerformanceMonitor,
    Utils
}; 