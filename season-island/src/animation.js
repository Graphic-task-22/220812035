/*import { AnimationMixer } from "three"
export default class ModelAnimation{
    constructor(model){
        this.mixer = new AnimationMixer(model)
        this.animations = model.animations;
        this.actionObj = {};
        this.currentAct = null;
        this.previousAct = null;
    }
    start(name){
        this.actionInit();
    }
    actionInit(name){
        this.animations.forEach((clip)=>{
            const action = this.mixer.clipAction(clip);
            this.actionObj[clip.name] = action;
        });
        console.log(this.actionObj);
        this.currentAct = this.actionObj[name];
        this.currentAct.play();
        console.log(this.actionObj);
    }
    updated(dx) {
        this.mixer.update(dt);
    }
}*/
import { AnimationMixer } from "three";

export default class ModelAnimation {
    constructor(model) {
        this.mixer = new AnimationMixer(model);
        this.animations = model.animations || [];
        this.actionObj = {};
        this.currentAct = null;
        this.currentAnimationName = '';
        
        console.log('ModelAnimation 初始化:', {
            modelName: model.name || '未命名模型',
            animationsCount: this.animations.length,
            animations: this.animations.map(a => a.name)
        });
    }

    start(name) {
        if (!name) {
            console.warn("未提供动画名称。可用动画:", this.animations.map(a => a.name));
            return;
        }
        
        // 如果当前动画已经在播放，不需要重新开始
        if (this.currentAnimationName === name) {
            return;
        }
        
        this.actionInit(name.toLowerCase());
    }

    actionInit(name) {
        // 初始化所有动画动作（如果还没有初始化）
        if (Object.keys(this.actionObj).length === 0) {
            this.animations.forEach((clip) => {
                const action = this.mixer.clipAction(clip);
                action.clampWhenFinished = true;
                action.setLoop(THREE.LoopRepeat, Infinity); // 设置循环播放
                this.actionObj[clip.name.toLowerCase()] = action;
            });
            
            console.log('已初始化动画动作:', Object.keys(this.actionObj));
        }

        // 停止当前动画
        if (this.currentAct) {
            this.currentAct.stop();
        }

        // 查找匹配的动画（支持部分匹配）
        const matchedName = Object.keys(this.actionObj).find(key => 
            key.includes(name) || name.includes(key)
        );
        
        if (matchedName) {
            this.currentAct = this.actionObj[matchedName];
            this.currentAct.reset().play();
            this.currentAnimationName = matchedName;
            console.log(`正在播放动画: ${matchedName}`);
        } else {
            console.warn(`未找到动画 "${name}"。可用动画:`, Object.keys(this.actionObj));
            
            // 如果没有找到匹配的动画，尝试播放第一个可用的动画
            const firstAnimation = Object.keys(this.actionObj)[0];
            if (firstAnimation) {
                this.currentAct = this.actionObj[firstAnimation];
                this.currentAct.reset().play();
                this.currentAnimationName = firstAnimation;
                console.log(`播放默认动画: ${firstAnimation}`);
            }
        }
    }

    update(delta) {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }

    stop() {
        if (this.currentAct) {
            this.currentAct.stop();
            this.currentAnimationName = '';
        }
    }

    // 暂停动画
    pause() {
        if (this.currentAct) {
            this.currentAct.paused = true;
        }
    }

    // 恢复动画
    resume() {
        if (this.currentAct) {
            this.currentAct.paused = false;
        }
    }

    // 获取当前播放的动画名称
    getCurrentAnimation() {
        return this.currentAnimationName;
    }

    // 获取所有可用的动画名称
    getAvailableAnimations() {
        return Object.keys(this.actionObj);
    }

    // 检查动画是否存在
    hasAnimation(name) {
        return Object.keys(this.actionObj).some(key => 
            key.includes(name.toLowerCase()) || name.toLowerCase().includes(key)
        );
    }
}