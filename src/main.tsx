// 반드시 이 순서로 가장 먼저 — ① 선택한 시나리오 값을 덮어쓰고 ② 그 값의 시각을 실제 현재 시각으로 옮긴다(다른 모듈이 값을 가져가기 전에)
import './data/scenarios'
import './data/scenarioClock'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/demo10.css'
import './styles/subpage.css'
import App from './App.tsx'

// 개발 서버에서만: 화면 간 상태·수치 일치 검사(콘솔 · window.__jejuConsistency())
if (import.meta.env.DEV) void import('./data/consistency').then((m) => m.reportConsistency())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
