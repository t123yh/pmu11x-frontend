import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js"
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '#root': path.resolve(__dirname)
    }
  },
})
