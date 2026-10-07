// ES 모듈 import는 본문보다 먼저 실행된다. dummyClock이 먼저 초기화된 뒤 아래 업로드 값이 적용되므로
// 엑셀의 관측시각은 더미 시계로 이동하지 않고 입력한 절대 시각을 그대로 유지한다.
import { applyStoredDummyWorkbook } from './data/dummyWorkbook'
applyStoredDummyWorkbook()
import './data/dummyClock'
import { loadJejuCctv } from './data/cctvLive'
import { loadKhoa } from './data/khoaLive'
import { loadHeatShelters } from './data/heatSheltersLive'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// 폰트는 앱에 포함해 배포한다(Noto Sans KR 가변 폰트, 필요한 글자 조각만 내려받음) — PC마다 폰트가 달라 보이지 않게.
import '@fontsource-variable/noto-sans-kr/wght.css'
import './index.css'
import './styles/demo10.css'
import './styles/subpage.css'
import App from './App.tsx'

// 제주시 감시 CCTV 목록(공공데이터포털)을 한 번 받아 대표 카메라 목록에 채운다 — 실패하면 빈 목록 그대로
void loadJejuCctv()
// 해양조사원 조위·부이 실측(모슬포·중문·제주해협·제주남부) — 비워 둔 KHOA 배열을 채운다. 실패하면 빈 채로 둔다
void loadKhoa()
// 무더위쉼터(행정안전부, 받아 둔 제주 786곳) — 비워 둔 heatShelters를 채운다
void loadHeatShelters()

// 개발 서버에서: 화면 간 상태·수치 일치 검사(콘솔 · window.__jejuConsistency())
if (import.meta.env.DEV) void import('./data/consistency').then((m) => m.reportConsistency())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
