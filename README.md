# jeju-disaster-platform

제주 재난 AX 대응 플랫폼 — 프론트엔드 프로토타입 (더미데이터 기반)

"1차년도 세부 수행계획"과 4개 유저플로우 와이어프레임(플랫폼/저염분수·고수온/연안 안전관리/하천 범람)을 기반으로,
저염분수·고수온·연안 안전·하천 범람 3개 실증 서비스를 하나의 플랫폼으로 통합해 보여주는 화면을 구현합니다.
실제 API 연동 없이 더미데이터로 동작합니다.

## 현재 범위 (1단계 — 플랫폼 공통 셸)

- 로그인 / 권한 오류 안내 화면
- 공통 레이아웃 (사이드바 내비게이션 + 상단바)
- GIS 통합 대시보드 (KPI 카드, 제주 위험 지도, 센서 시계열 차트, 기관별 대응 상태, 최근 조치 이력)
- 시스템 모니터링 화면 (연결 현황, 이상·장애 알림, 센서/API/기관 공조 상태)
- 3개 서비스(양식장 대응·연안 안전·하천 범람) 및 이력·보고서는 진입 스텁만 구현 — 다음 단계에서 상세 구현 예정

## 데모 로그인

- 기관 ID `jeju-ax` (비밀번호 아무 값) → 담당자 계정으로 로그인
- 기관 ID `guest` (비밀번호 아무 값) → 권한 없는 계정 체험 (권한 오류 안내 화면으로 이동)

## 개발 환경

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (시맨틱 위험등급 색상 토큰: 위험/경계/주의/정상/정보/오프라인)
- react-router-dom (클라이언트 라우팅), recharts (시계열 차트)
- 인증은 sessionStorage 기반 목업이며 실제 백엔드는 없음

```
npm install
npm run dev      # http://localhost:5173
npm run build
```

## 구조

```
src/
  components/
    layout/     # AppShell, TopBar, Sidebar
    ui/         # Card, KpiCard, RiskBadge, JejuRiskMap, riskStyles
  data/         # mockAuth, mockDashboard, mockMonitoring (더미데이터)
  pages/        # LoginPage, ForbiddenPage, DashboardPage, MonitoringPage, PlaceholderServicePage
  routes/       # RequireAuth (인증 가드)
  types/        # domain.ts
```

## 다음 단계

- 2단계: 양식장 대응(저염분수·고수온) 플로우 — 31개 화면(상태 분기 포함)
- 3단계: 연안 안전 플로우 — 17개 화면
- 4단계: 하천 범람 플로우 — 13개 화면
- 5단계: 이력·보고서 상세 구현

각 단계는 `docs/superpowers/specs/`에 별도 설계 문서를 작성 후 진행합니다.
