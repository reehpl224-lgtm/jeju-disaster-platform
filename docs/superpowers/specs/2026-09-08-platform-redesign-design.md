# 제주 재난 AX 플랫폼 — 통합상황판·분야별 상세 재설계 + 디자인 시스템

## 배경

`제주AX프로젝트/20.재난관리플랫폼 디자인/재난관리플랫폼 디자인/` 폴더의 Figma export SVG
(`AX 기반 재난관리 플랫폼.svg`, `-1/-2/-3.svg`, `AX기반 재난관리플랫폼.svg`(로그인),
`Sidebar (AX 기반 재난관리 플랫폼)*.svg`)가 "제주 재난 컨트롤타워 와이어프레임"이다. 로그인 화면,
GIS 상황판(동네예보 패널 + 강수량 타임라인 애니메이션 + 실지명 표기 지도), 연안/하천 도메인별
사이드패널, 좌측 아이콘 레일 + 플로팅 패널 구조를 담고 있다. `src/index.css`의 색상 토큰 주석에
이미 "20.재난관리플랫폼 디자인 기준"이라고 적혀 있어, 이 폴더가 기존에도 디자인 소스로 쓰였음을
확인했다.

`AGENTS.md` §2-④에 따르면 실제 벤더 솔루션 데모(`https://demo-10.muhanit.kr/`)를 참고해
2026-09-07~08에 `/dashboard`(1~3단계)와 도메인 홈 3개(`/aqua`,`/coast`,`/river`, 2단계)에
GIS 아이콘레일·사이드패널·타임라인패널·서비스카드 패턴을 이미 적용했다. 이번 작업은 백지
재설계가 아니라 **와이어프레임 기준으로 다시 다듬고, 아직 손대지 않은 세부 워크플로 페이지까지
같은 언어로 확장하는 것**이다.

## 사용자 확인 사항 (브레인스토밍 단계에서 결정)

- 지도는 커스텀 SVG(`JejuRiskMap`) 유지 — 실제 지도 API 연동 안 함.
- "분야별 상세" 범위는 도메인 홈 3개뿐 아니라 **세부 워크플로 페이지까지 포함**한다.
- "디자인 시스템 작업"의 산출물은 **토큰 정리 + `/styleguide` 페이지**.
- 세부 워크플로 페이지는 **도메인별 병렬 서브에이전트**로 진행한다(아쿠아/연안/하천 폴더가
  이미 분리돼 있어 충돌 위험이 낮음).

## 범위 대상 페이지

- 대시보드: `DashboardPage.tsx` (1개)
- 도메인 홈: `AquaHomePage`, `CoastHomePage`, `RiverHomePage` (3개)
- 세부 워크플로 (18개):
  - 아쿠아(8): `AquaDataPage`, `AquaPredictionPage`, `AquaMonitoringPage`, `AquaClosurePage`,
    `AquaAlertPage`, `AquaResponsePage`, `AquaFarmDetailPage`, `AquaFarmsPage`
  - 연안(5): `CoastEventDetailPage`, `CoastAlertPage`, `CoastMonitoringPage`, `CoastClosurePage`,
    `CoastDispatchPage`
  - 하천(5): `RiverAlertPage`, `RiverClosurePage`, `RiverControlPage`, `RiverDispatchPage`,
    `RiverAnalysisPage`
- 신규: `/styleguide` 페이지 1개

## 불변 원칙 (AGENTS.md 준수 — 위반 금지)

- **로직·라우팅·mock 데이터 값·`RiskLevel` 값을 바꾸지 않는다.** 이번 작업은 시각 레이어
  (spacing, 카드/버튼 스타일, 타이포, 아이콘, 레이아웃 톤)만 대상이다.
- 새 텍스트·수치가 필요하면 지어내지 말고 AGENTS.md §2의 확정 사실 또는 기존 mock 데이터 범위
  안에서만 쓴다.
- `Record<RiskLevel, T>` 등 공용 타입을 건드리는 변경은 하지 않는다(디자인 시스템 0단계에서도
  `riskStyles.ts`의 매핑 값 자체는 유지하고 스타일 표현만 다듬는다).
- 커밋 전 `npm run build` 통과 확인. 작업 시작 전 `git pull --rebase origin master`, 단위
  작업 후 즉시 커밋+push(멀티 AI 협업 규칙).

## 설계

### 0단계 — 디자인 시스템 토큰 + `/styleguide`

현재 `@theme`에는 색상·폰트만 토큰화돼 있고 spacing/radius/shadow는 컴포넌트마다 Tailwind
arbitrary value로 흩어져 있다(`rounded-xl`, `p-4` 등은 일관되지만 명시적 토큰은 아님). 이 단계는:

- 와이어프레임 스크린샷 기준으로 카드 radius, 모달/플로팅 패널 그림자, 보더 톤을
  `--radius-*`, `--shadow-panel` 같은 명시적 토큰으로 승격(기존 시각 결과와 달라지지 않게,
  현재 쓰이는 값을 그대로 토큰화하는 것이 우선 — 새 디자인을 지어내지 않는다).
- `src/pages/StyleguidePage.tsx` 신규 추가, 라우트 `/styleguide`(인증 불필요, `LoginPage`와
  동급 취급). `Card`, `RiskBadge`(7종 전부), 버튼, form input, `GisIconRail` 등 **기존
  컴포넌트를 실제로 렌더링**해서 토큰이 화면에서 어떻게 보이는지 확인하는 용도 — 별도 mockup을
  새로 그리지 않는다.

### 1단계 — `DashboardPage` 재설계

- GIS 상황 탭: 와이어프레임의 동네예보(단기예보 표 + 주간 날씨) 패널, 강수량 타임라인 애니메이션
  톤을 참고해 기존 `GisSidePanel`/`GisTimelinePanel` 주변 크롬(카드 radius, 레이어 토글 드롭다운
  스타일)을 다듬는다. 새 날씨 데이터가 필요하면 `mockIncidents.ts`의 `currentWeather`를 넘어서는
  범위는 만들지 않고, 부족하면 사용자에게 먼저 확인한다.
- 종합상황/CCTV 탭도 같은 카드 언어(0단계 토큰)로 통일.
- 화면에 보이는 정보 구조(탭 3개, 아이콘 레일 항목, 서비스 카드 3개)는 유지 — 순수 톤 정리.

### 2단계 — 도메인 홈 3개

0~1단계에서 정리된 패턴을 `AquaHomePage`/`CoastHomePage`/`RiverHomePage`에 그대로 적용.
기존 GIS 쉘 구조·서브내비 진입점은 유지, 카드/타이포/spacing만 맞춘다.

### 3단계 — 세부 워크플로 18개 (병렬 서브에이전트)

0~2단계가 끝나면 아쿠아/연안/하천 3개 서브에이전트에 위임한다. 각 서브에이전트에게 공통으로:

- 이 스펙 문서 경로와 "불변 원칙" 섹션을 그대로 전달.
- 0~2단계 결과물(토큰, 대표 화면)을 먼저 읽고 패턴을 따르도록 지시.
- 자신의 도메인 폴더(`src/pages/aqua/`, `coast/`, `river/`) 안의 파일만 수정하고, 공용 파일
  (`index.css`, `riskStyles.ts`, `Card.tsx`, `GisIconRail.tsx` 등)은 읽기만 하고 수정하지
  않도록 명시 — 병렬 작업 중 공용 파일 동시 수정 충돌 방지.
- 완료 후 도메인별로 별도 커밋(예: `feat: 아쿠아 세부 페이지 디자인 시스템 적용`).

## 검증

1. `npm run build` — 각 단계마다.
2. 브라우저(Browser pane, dev server)로 단계별 대표 화면 스크린샷 확인 — 0단계는
   `/styleguide`, 1단계는 `/dashboard` 3탭, 2단계는 도메인 홈 3개, 3단계는 도메인별 대표
   서브페이지 최소 1개.
3. 콘솔 에러 없는지 확인.
4. 각 단계 완료 시 `git pull --rebase origin master` → 커밋 → `push`.

## 리스크

- 세부페이지 18개 규모라 여러 세션에 걸칠 수 있다 — 단계별/도메인별 커밋으로 중단·재개 가능하게
  구성했다.
- 병렬 서브에이전트가 공용 파일을 건드리면 병합 충돌 위험 — 위 "불변 원칙"·3단계 지시사항으로
  차단.
- 새 시각 요소(동네예보 패널 등)를 채울 데이터가 부족할 수 있음 — 그 경우 지어내지 않고 사용자와
  먼저 상의.
