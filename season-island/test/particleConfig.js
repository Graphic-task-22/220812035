// src/particleConfig.js
export const SEASON_CONFIG = {
    spring: {
      texture: 'petal.png',
      count: 800,  // 大幅增加花瓣数量
      size: 1.2,   // 显著增大花瓣尺寸
      fallSpeed: 0.015,
      swayRange: 0.08,  // 增大摇摆幅度
      rotationSpeed: 0.02,
      colors: [0xFFC0CB, 0xFFB6C1, 0xFF69B4] // 粉红色系
    },
    summer: {
      texture: 'sun.png',
      count: 150,
      size: 0.55,
      fallSpeed: 0,
      hoverSpeed: 0.02,  // 小虫悬浮运动
        // 水平移动范围
      colors: [0xFFFF00, 0xFFD700, 0xFFA500] // 黄色系
    },
    autumn: {
      texture: 'leaf.png',
      count: 600,  // 大幅增加落叶数量
      size: 1.5,   // 显著增大落叶尺寸
      fallSpeed: 0.02,
      rotationSpeed: 0.015,
      swayRange: 0.1,   // 增大摇摆幅度
      colors: [0xFF8C00, 0xFF4500, 0xD2691E] // 橙色系
    },
    winter: {
      texture: 'snow.png',
      count: 1000, // 大幅增加雪花数量
      size: 1.8,   // 显著增大雪花尺寸
      fallSpeed: 0.01,
      driftSpeed: 0.005, // 雪花漂浮感
      colors: [0xFFFFFF, 0xE0FFFF, 0xF0F8FF] // 白色系
    }
  }