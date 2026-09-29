// ES 모듈 import는 본문보다 먼저 실행된다. scenarioClock이 먼저 초기화된 뒤 아래 업로드 값이 적용되므로
// 엑셀의 관측시각은 시나리오 시계로 이동하지 않고 입력한 절대 시각을 그대로 유지한다.
import { applyStoredDummyWorkbook } from './data/dummyWorkbook'
applyStoredDummyWorkbook()
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
