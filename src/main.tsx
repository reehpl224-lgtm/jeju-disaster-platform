// ES 모듈 import는 본문보다 먼저 실행된다. scenarioClock이 먼저 초기화된 뒤 아래 업로드 값이 적용되므로
// 엑셀의 관측시각은 시나리오 시계로 이동하지 않고 입력한 절대 시각을 그대로 유지한다.
import { applyStoredDummyWorkbook } from './data/dummyWorkbook'
applyStoredDummyWorkbook()
import './data/scenarios'
import './data/scenarioClock'
// riverRunState는 river/* 하위 페이지에서만 import되던 걸 여기서도 import해 부트스트랩에 포함시킨다 —
// 그렇지 않으면 그 페이지들을 먼저 열지 않은 채 곧장 /dashboard 등으로 가면 저장된 실행 상태가 화면에
// 투영되지 않는다(카드·마커가 갱신 안 됨). scenarioClock 뒤에 둬야 시나리오 엑셀의 절대 시각이 옮겨지지 않는다.
import './data/riverRunState'
import { IS_SIMULATION_MODE } from './data/appEnv'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/demo10.css'
import './styles/subpage.css'
import App from './App.tsx'

// 개발 서버 또는 스테이징 빌드에서: 화면 간 상태·수치 일치 검사(콘솔 · window.__jejuConsistency())
// 배포된 스테이징은 DEV가 아니므로 VITE_DATA_MODE=simulation도 별도로 확인한다(staging-scenario-review 문서 §3).
if (import.meta.env.DEV || IS_SIMULATION_MODE) void import('./data/consistency').then((m) => m.reportConsistency())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
