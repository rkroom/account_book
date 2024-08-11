import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(),
  electron([
    // 主进程入口文件
    {
      entry: 'electron/main/index.ts',
      vite: {
        build: {
          // For Debug
          sourcemap: true,
          outDir: "dist/electron/main",
        },
      },
    },
    {
      entry: "electron/preload/index.ts",
      vite: {
        build: {
          sourcemap: true,
          outDir: 'dist/electron/preload',
        },
      },
      onstart(options) {
        // Notify the Renderer-Process to reload the page when the Preload-Scripts build is complete,
        // instead of restarting the entire Electron App.
        options.reload();
      },
    },
  ]),
  ],
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      external: ['electron'],
    },
  },
})