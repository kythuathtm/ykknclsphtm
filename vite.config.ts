
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' giúp đường dẫn tài nguyên (js, css) là tương đối, 
  // cho phép chạy app trong thư mục con (ví dụ: domain.com/app)
  base: './',
  build: {
    outDir: 'dist',
  }
})
