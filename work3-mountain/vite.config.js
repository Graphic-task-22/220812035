import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: ['simplex-noise'],
  },
  server: {
    open: true, // 自动打开浏览器
    port: 3000, // 可以自定义端口
  },
  build: {
    outDir: 'dist', // 构建输出目录
    sourcemap: true, // 生成源映射，便于调试
  },
});
