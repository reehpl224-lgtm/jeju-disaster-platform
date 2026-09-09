import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // 프로덕션 빌드만 GitHub Pages 프로젝트 사이트 서브경로(/jeju-disaster-platform/)를 쓰고,
  // 로컬 개발 서버(vite dev)는 기존처럼 루트(/)를 유지한다.
  base: command === 'build' ? '/jeju-disaster-platform/' : '/',
  plugins: [react(), tailwindcss()],
}))
