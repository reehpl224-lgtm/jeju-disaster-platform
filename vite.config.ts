import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => ({
  // 프로덕션 빌드만 GitHub Pages 프로젝트 사이트 서브경로(/jeju-disaster-platform/)를 쓰고,
  // 로컬 개발 서버(vite dev)는 기존처럼 루트(/)를 유지한다.
  // 로컬 확인용 빌드(npm run build:local, --mode localhost)는 루트(/)를 쓴다.
  // 스테이징 빌드(npm run build:staging, --mode staging)는 Vercel 같은 별도 호스팅의 도메인
  // 루트에 배포하므로(§11-1) GitHub Pages 서브경로를 쓰면 안 된다 — 루트(/)를 쓴다.
  base: command === 'build' && mode !== 'localhost' && mode !== 'staging' ? '/jeju-disaster-platform/' : '/',
  plugins: [react(), tailwindcss()],
  // Vite는 PORT 환경변수를 자동으로 읽지 않아서(기본 5173 고정), 다른 세션의 dev 서버와
  // 포트가 겹칠 수 있다 — 프리뷰 런처가 지정한 PORT를 명시적으로 사용한다.
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5199,
  },
}))
