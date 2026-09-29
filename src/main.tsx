// 반드시 가장 먼저 — mock 데이터의 시나리오 시각을 실제 현재 시각으로 옮긴다(다른 모듈이 값을 가져가기 전에)
import './data/scenarioClock'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/demo10.css'
import './styles/subpage.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
