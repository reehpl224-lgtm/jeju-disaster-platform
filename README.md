# jeju-disaster-platform

제주 재난 AX 대응 플랫폼 — 프론트엔드 프로토타입 (더미데이터 기반)

"1차년도 세부 수행계획"과 4개 유저플로우 와이어프레임(플랫폼/저염분수·고수온/연안 안전관리/하천 범람)을 기반으로,
저염분수·고수온·연안 안전·하천 범람 3개 실증 서비스를 하나의 플랫폼으로 통합해 보여주는 화면을 구현합니다.
실제 API 연동 없이 더미데이터로 동작하며, 시각 디자인은 `20.재난관리플랫폼 디자인`(다크 테마 · 라임그린 액센트)을
기준으로 합니다.

## 현재 범위

**1단계 — 플랫폼 공통 셸**
- 로그인(사원번호·비밀번호·OTP) / 권한 오류 안내 화면
- 공통 레이아웃 (사이드바 내비게이션 + 상단바)
- GIS 통합 대시보드 (KPI 카드, 제주 위험 지도, 센서 시계열 차트, 기관별 대응 상태, 최근 조치 이력)
- 시스템 모니터링 화면 (연결 현황, 이상·장애 알림, 센서/API/기관 공조 상태)

**2단계 — 양식장 대응 (저염분수·고수온)**
- 홈, 데이터 수집 현황, AI 예측 결과 대시보드, 영향 양식장 현황/상세,
  경보 생성·검토(전송 성공/실패 시뮬레이션), e-SOP 대응 절차(5단계 트래커), 실시간 모니터링, 종료 보고서

**3단계 — 연안 안전관리**
- 연안 관제 대시보드, 위험 이벤트 상세, 경보 승인, 현장 공조(해경 출동 요청), 현장 모니터링, 사건 종료 보고서

**4단계 — 하천 범람 예측·경보**
- 대시보드, 상황 분석, 경보 발송 현황, 현장 통제 관리, 출동 요청, 종료 보고

**남은 범위**: 이력·보고서(진입 스텁만 구현)

## 데모 로그인

- 사원번호 `jeju-ax` (비밀번호·OTP 아무 값) → 담당자 계정으로 로그인
- 사원번호 `guest` (비밀번호 아무 값) → 권한 없는 계정 체험 (권한 오류 안내 화면으로 이동)

## 개발 환경

- React 19 + TypeScript + Vite
- Tailwind CSS v4 — 다크 테마(`base` #1D1D1D · `panel` #272727 · `inset` #303233 · `accent` #8EC21F)
  및 시맨틱 위험등급 색상 토큰(위험/경계/주의/정상/정보/오프라인)
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
    aqua/       # AquaSubNav, StageTracker, ChecklistRow (양식장 전용)
    shared/     # DomainSubNav (연안·하천 공용 서브 내비게이션)
  data/         # mockAuth, mockDashboard, mockMonitoring, mockAqua, mockCoast, mockRiver
  pages/
    aqua/       # 양식장 대응 9개 화면
    coast/      # 연안 안전 6개 화면
    river/      # 하천 범람 6개 화면
    (root)/     # LoginPage, ForbiddenPage, DashboardPage, MonitoringPage, PlaceholderServicePage
  routes/       # RequireAuth (인증 가드)
  types/        # domain.ts, aqua.ts, coast.ts, river.ts
```

## 다음 단계

- 이력·보고서 화면 상세 구현
- 필요 시 실제 GIS 지도 연동(현재는 커스텀 SVG/플레이스홀더로 대체)

설계 결정은 `docs/superpowers/specs/`에 기록합니다.
