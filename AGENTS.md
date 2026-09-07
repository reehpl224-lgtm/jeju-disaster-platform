# AGENTS.md — AI 협업 컨텍스트 문서

이 저장소는 **한 명의 기획자가 여러 AI 코딩 도구(Claude Code, Manus AI, Gemini 등)를 함께 사용해**
개발을 진행합니다. 이 문서는 어떤 AI 도구가 작업에 투입되든 동일한 맥락에서 시작할 수 있도록
프로젝트 배경, 확정된 사실, 컨벤션, 알려진 미해결 이슈를 정리한 것입니다.

**다른 AI 도구(Manus, Gemini 등)는 작업을 시작하기 전에 이 문서 전체를 반드시 읽어주세요.**
특히 "확정된 사실(Ground Truth)"과 "위험등급 체계"는 화면 하나만 보고 추측하면 반드시 틀리는
부분이므로 꼭 확인해야 합니다.

---

## 1. 프로젝트 성격 — 반드시 지킬 것

이 프로젝트는 **1차년도 진행을 위한 프로토타입**입니다. 실사용자 요구사항이 아직 확정되지 않은
상태에서, 기획자가 화면을 눈으로 보면서 "무엇이 필요한지"를 미리 점검하기 위한 용도입니다.

- 모든 데이터는 **더미데이터**입니다. `src/data/mock*.ts` 안의 값은 실제 관측값이 아닙니다.
- 실제 백엔드 API·인증 서버·GIS 서버 연동이 없습니다. 인증은 `sessionStorage` 기반 목업입니다.
- **정확도 경쟁이나 실시간 연동이 목표가 아니라 "업무 흐름 검증"이 목표**입니다. 화면에 예쁜 숫자를
  넣는 것보다, 담당자가 위험 근거를 이해하고 판단할 수 있는 구조가 더 중요합니다.
- 새 기능을 추가할 때 **과설계하지 마세요.** 지금 필요한 화면 범위를 넘어서는 인증 체계, 실제 API
  연동, 대규모 상태관리 라이브러리 등을 미리 깔지 않습니다.

## 2. 소스 오브 트루스 (Ground Truth) — 임의로 바꾸지 말 것

아래 값들은 기획자가 실제 계획서·확정 자료를 근거로 직접 확인해 준 사실입니다. 화면을 만들다가
"이게 맞나?" 싶어도 **아래 값과 다르게 임의로 지어내지 마세요.** 바꿔야 한다면 사용자에게 먼저
확인하세요.

### ① 저염분수·고수온 예측·경보 시스템 (양식장, `/aqua`)
- 대상지: 제주 서남부 한경·대정 육상양식장 — 확정 관측지점 3곳: **한경 금등, 한경 용수, 대정 일과**
  (성산·서귀포는 대상 아님)
- 목표: 예측 정합도 85%↑, 공간해상도 1km 이하
- AI 라벨: `Low_Salinity_Plume`, `High_Temp_Water`
- **위험등급 임계값** (`src/data/marineAlertThresholds.ts`에 로직으로 구현되어 있음, 출처:
  `제주AX프로젝트/플랫폼 데이터 리스트.xlsx` 저염분수·고수온 시트 — 국립수산과학원 기준, 2026-09-07 확인):
  - 5단계: 정상/관심/주의/경보(→앱 라벨 '경계')/심각(→앱 라벨도 동일하게 '심각')
  - 염분: 정상 ≥31.0psu · 관심 28.0~31.0 · 주의 26.0~28.0 · 경계 24.0~26.0 · **심각 <24.0psu**
  - 수온: 정상 <25.0℃ · 관심 25.0~28.0℃ · 주의(28.0℃ 도달) · 경계(28.0℃↑ 1~2일 지속) ·
    **심각(28.0℃↑ 3일 이상 지속)**
  - 복합 규칙: 수온≥28.0℃ AND 염분≤26.0psu → 무조건 심각 / 수온≥28.0℃ AND 염분≤28.0psu →
    최소 경계(경보) / 수온 26.0~28.0℃ AND 염분≤28.0psu → 최소 주의로 승격
  - 새 양식장 더미데이터를 추가/수정할 때는 반드시 `classifyMarineRiskLevel()` 함수로 등급을 계산해서
    넣으세요. 손으로 등급을 지어내면 위 임계값과 어긋납니다. 온도만 있고 지속일수 정보가 없는 경우
    함수 기본값(0일=방금 도달)이 적용되므로, 장기 지속을 표현하려면 `classifyTemperature(temp, days)`를
    직접 호출해 확인 후 등급을 정하세요.

### ② 연안 안전관리시스템 (`/coast`)
- 대상지: **함덕·삼양·협재 해수욕장** (3개 관리구역 확정)
- 목표: 사전 감지율 90%↑, 위험 감지 정확도 85%↑
- 인프라: AIoT 스마트폴 신설(지능형 CCTV + 기상센서 + 경보스피커) — **공유수면 점용허가 등 인허가 필요**
- AI 라벨: `Person_In_Water`, `Danger_Zone_Person`, `Rip_Current`, `Overtopping`

### ③ 하천 범람예측·경보 시스템 (`/river`)
- 대상지: **서귀포 효돈천 (돈내코·쇠소깍)** — 하천은 이 한 곳뿐입니다. 임의로 다른 하천(예: "하천 B")을
  추가하지 마세요.
- 목표: 예측 일치율 85%↑, 예보 선행시간 1시간 이하
- 인프라: 신규 강우레이더 1식 + 신규 수위계, 레거시 침수정보센서 연계(제주시 66개소·서귀포시 69개소)
- AI 라벨: `Water_Level_High`, `Flood_Imminent`, `Debris_Flow`
- 단계 번호 컨벤션: **1단계=주의, 2단계=경계, 3단계=심각** (아래 위험등급 체계와 동일한 순서)

이 세 서비스가 1차년도 실증 대상의 전부입니다. 통합 대시보드(`/dashboard`)는 이 세 서비스를 한 화면에서
보여주는 GIS 요약이고, 시스템 상태(`/monitoring`)·이력·보고서(`/reports`)는 공통 인프라입니다.

**예외**: `src/data/mockIncidents.ts`는 위 3개 실증서비스와 무관한 **범재난(호우·강풍·산불 등) 일반
현황** 더미데이터입니다(로컬 `더미데이터_템플릿.json` 반영, 2026-09-07). 4번째 실증서비스가 아니라
`/dashboard` GIS 화면의 플로팅 패널(아래 ④ 참고)을 채우는 보조 정보이니, 이 데이터를 새 서비스의
근거로 쓰거나 위 3개 서비스와 같은 급으로 취급하지 마세요.

### ④ 참고: 실제 벤더 솔루션 (`/dashboard` 레이아웃의 근거)

`https://demo-10.muhanit.kr/`은 이 프로젝트가 따라가야 할 **실제 벤더 솔루션 데모**입니다(로그인 필요,
자격증명은 기획자에게 확인). 2026-09-07에 로그인해서 확인한 "GIS 상황" 화면 구조를 `/dashboard`에
반영했습니다: 지도 위에 좌측 아이콘 레일로 전환되는 플로팅 패널(`GisSidePanel`), 우측 타임라인/발효중
특보 플로팅 패널(`GisTimelinePanel`), 지도 하단의 서비스별 주의/경계/심각 카운트 카드 그리드
(`ServiceStatusCard`). 지도 자체는 네이버 지도 API 키가 없어 기존 커스텀 SVG(`JejuRiskMap`)를 그대로
쓰고 주변 UI만 재구성했습니다 — 상세 계획은 `C:\Users\saiwooda\.claude\plans\spicy-hugging-thacker.md`
참고.

**2단계(도메인 홈 화면)까지 완료**했습니다(2026-09-07). `/aqua`, `/coast`, `/river` 홈 화면에도 동일한
GIS 쉘(지도+아이콘레일+플로팅 패널)을 추가했고, 각 도메인 데이터(양식장 목록, 연안 스마트폴, 하천 통제
지점 등)로 채워져 있습니다. `GisSidePanel`/`GisTimelinePanel`은 이때 내용을 `content`/`tabs` prop으로
주입받는 범용 컴포넌트로 일반화됐으니, 새 화면에 GIS 쉘을 또 붙일 땐 이 두 컴포넌트를 그대로 재사용하고
데이터만 그 화면 것으로 바꿔서 넣으면 됩니다(각 도메인 홈 페이지 파일에 예시 있음).

**아직 안 한 것**: 경보 승인·e-SOP 대응·종료 보고서 같은 세부 워크플로 페이지(양식장 9개/연안 6개/
하천 6개 중 홈 제외 나머지)는 참고 사이트 구조로 옮기지 않고 지금처럼 별도 라우트로 유지하기로
사용자와 합의했습니다(플로팅 패널에 다단계 승인 절차를 욱여넣지 않기 위함). 상단 탭(종합 상황/GIS
상황/CCTV)도 추가하지 않았습니다. 이 부분을 더 진행할지는 사용자와 먼저 상의하세요.

## 3. 위험등급 체계 (RiskLevel) — 전체 앱 공통, 최근 변경됨

`src/types/domain.ts`의 `RiskLevel` 타입이 앱 전체의 유일한 위험등급 소스입니다.

```ts
export type RiskLevel = "danger" | "alert" | "warning" | "caution" | "safe" | "info" | "offline"
```

**심각도 순서(낮음→높음): `safe(정상) < caution(관심) < warning(주의) < alert(경계) < danger(심각)`**
`info`(정보)·`offline`(오프라인)은 심각도 등급이 아니라 별도 상태(공조 진행 중, 장비 오프라인 등)입니다.

| 값 | 라벨 | 의미 |
| --- | --- | --- |
| `safe` | 정상 | |
| `caution` | 관심 | |
| `warning` | 주의 | |
| `alert` | 경계 | 2026-09-07에 새로 추가된 5번째 단계 (기존엔 정상/관심/주의/위험 4단계였음) |
| `danger` | 심각 | 라벨 변천사: 경보 → 위험 → **심각**(2026-09-07 최종). 실제 솔루션 데모
  (`https://demo-10.muhanit.kr/`, §2-④ 참고)에서 최상위 등급이 "심각"으로 쓰이는 걸 로그인 후
  직접 확인하고 맞춤 — 화면 하나만 보고 "위험"이 맞겠거니 짐작하지 말 것. |

**색상 토큰**은 `src/index.css`의 `@theme` 블록에 정의되어 있고(`--color-risk-*`), Tailwind v4가
`bg-risk-alert`, `text-risk-danger` 같은 클래스를 자동 생성합니다. 새 색상이 필요하면 이 파일에
`--color-risk-xxx`, `--color-risk-xxx-bg` 두 변수를 추가하면 됩니다.

**라벨·스타일 매핑**은 `src/components/ui/riskStyles.ts` 한 곳에서만 관리합니다. 화면에 등급 배지를
그릴 때는 항상 `<RiskBadge level={...} />` (`src/components/ui/RiskBadge.tsx`)를 쓰고, 라벨 텍스트를
하드코딩하지 마세요 — `label` prop은 등급과 다른 부가 텍스트(예: 단계명)를 덧붙일 때만 씁니다.

**주의 — `Record<RiskLevel, T>` 타입을 쓰는 곳은 전부 5개 항목 + info/offline까지 채워야 컴파일됩니다.**
새 RiskLevel별 매핑이 필요하면 `npm run build`를 돌려서 TypeScript가 누락된 항목을 알려주는지
확인하세요 (실제로 `alert` 추가 시 `JejuRiskMap.tsx`의 두 Record가 컴파일 에러로 걸렸습니다).

**GIS 지도**(`src/components/ui/JejuRiskMap.tsx`)에서 SVG 요소에 색을 줄 때는 **Tailwind `bg-*`/`text-*`
클래스가 SVG의 `fill`/`stroke`로 변환되지 않는다는 점**을 주의하세요. `MARKER_COLOR`/`CALLOUT_FILL`처럼
`var(--color-risk-*)`를 직접 참조하는 방식을 씁니다.

## 4. 데이터/등급 정합성 원칙

과거 여러 차례 "표시 텍스트는 경계인데 배지 색은 danger" 같은 불일치가 발견되어 수정한 이력이
있습니다. 더미데이터를 새로 쓰거나 수정할 때 아래를 지켜주세요.

- 같은 사건(예: 효돈천 쇠소깍)을 여러 화면(GIS 마커, 하천 상세, 통합 모니터링)에서 참조할 때
  **`level` 필드와 표시 텍스트("2단계 · 경계" 등)가 항상 일치**해야 합니다.
- 양식장 염분·수온처럼 정량 임계값이 있는 데이터는 `marineAlertThresholds.ts`의 분류 함수로 등급을
  계산하세요. 손으로 등급을 지어내면 나중에 재검증할 때 다시 틀립니다.
- 하나의 도메인 안에서 단계 번호("1단계", "2단계"...)를 쓸 때는 위 3번 표의 순서(주의=1, 경계=2,
  심각=3)를 따르세요.

## 5. 알려진 미해결 이슈 (다음에 손댈 후보)

- **`aquaStages`**(`src/data/mockAqua.ts`)와 `이력·보고서`(`src/data/mockReports.ts`)의
  `incidentRecords`는 `관심/주의/경계/심각/해제`라는 **e-SOP 대응 진행상태**(마지막에 "해제"로 끝남) 어휘를
  씁니다. 2026-09-07에 앱 전역 `danger` 라벨을 "심각"으로 맞추면서 앞 4단계 이름은 이제 우연히 일치하지만,
  `정상` 단계가 없고 마지막이 "해제"라는 점에서 위험등급(RiskLevel)과는 여전히 별개 개념입니다. 두 체계를
  아예 하나로 합칠지는 아직 결정 안 됐으니, 손대기 전에 사용자와 먼저 상의하세요.
- MVP 기획 가이드(Manus AI 작성, 2026-09-07) 대조 결과 아직 구현 안 된 항목들 — 급하지 않지만 서비스가
  15개로 늘어나기 전에 검토 예정:
  - 시나리오 선택·재생 UI (지금은 고정 더미데이터만 있음)
  - 화면 상단 `시뮬레이션 데이터` 배지 + 전역 최종갱신시각 표시 — **2026-09-07 부분 적용**:
    `/dashboard`의 "제주 전역 재난 현황" 섹션(`src/data/mockIncidents.ts`)에만 배지를 달아둠. 다른
    화면·서비스에도 동일 배지를 확대 적용할지는 아직 결정 안 됨.
  - 경보 상태머신 (`초안→검토중→승인→모의전파완료→조치중→종료` + 보류/반려) — 지금은 승인 버튼만
    있고 반려/보류는 UI만 있고 실제로 연결 안 된 곳이 많음
  - 역할별 화면/권한 분리 (관제자/승인권자/현장담당자/관리자) — 지금은 데모 로그인 1종류뿐
  - 전역 메뉴를 재난종류별(현재)이 아니라 업무단위별(통합상황판/서비스관제/경보대응/지도자산/
    데이터품질/시나리오/관리)로 재편하는 안 — Figma 승인된 구조를 갈아엎는 큰 결정이라 신중히

## 6. 기술 스택 & 개발 명령어

- React 19 + TypeScript + Vite 8 + Tailwind CSS v4 (CSS-first `@theme` 토큰, `src/index.css`)
- react-router-dom v7 (클라이언트 라우팅), recharts (시계열 차트)
- 인증은 `sessionStorage` 기반 목업 (`src/data/mockAuth.ts`, `src/routes/RequireAuth.tsx`)

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build — 커밋 전 항상 실행해서 타입 에러 확인
```

## 7. 디렉터리 구조

```
src/
  components/
    layout/     # AppShell, TopBar, Sidebar
    ui/         # Card, KpiCard(현재 미사용, 재사용 대기), RiskBadge, JejuRiskMap, riskStyles,
                # WeatherTimeline, MapToolbox, GisIconRail/GisSidePanel/GisTimelinePanel/
                # ServiceStatusCard(/dashboard GIS 커맨드센터, 2026-09-07 추가 — §2-④ 참고)
    aqua/       # AquaSubNav, StageTracker, ChecklistRow (양식장 전용)
    shared/     # DomainSubNav (연안·하천 공용 서브 내비게이션)
  data/         # mockAuth, mockDashboard, mockMonitoring, mockAqua, mockCoast, mockRiver,
                # mockReports, marineAlertThresholds (염분·수온 등급 분류 로직),
                # mockIncidents (통합 대시보드의 범재난 현황 보조 섹션, 3대 서비스와 무관)
  pages/
    aqua/       # 양식장 대응 9개 화면
    coast/      # 연안 안전 6개 화면
    river/      # 하천 범람 6개 화면
    reports/    # 이력·보고서 2개 화면
    (root)/     # LoginPage, ForbiddenPage, DashboardPage, MonitoringPage
  routes/       # RequireAuth (인증 가드)
  types/        # domain.ts(RiskLevel 등 공통 타입), aqua.ts, coast.ts, river.ts, reports.ts
```

도메인 하나를 새로 추가한다면 이 패턴(타입 → mock 데이터 → 서브내비 → 페이지들)을 그대로 따르세요.

## 8. Git 협업 규칙 (여러 AI 도구 동시 사용)

이 저장소는 `https://github.com/reehpl224-lgtm/jeju-disaster-platform` (private)에 연결되어
있고, 기본 브랜치는 `master`입니다. 한 사람이 Claude Code·Manus AI·Gemini 등 여러 도구를 번갈아/함께
쓰기 때문에, 사람이 여러 명인 팀보다 **"낡은 로컬 상태에서 시작해 서로 덮어쓰는 것"**이 더 큰 위험입니다.

### 순차적으로 한 도구씩 쓸 때 (기본 워크플로)
1. **작업 시작 전 항상**: `git pull --rebase origin master` 로 다른 도구가 올린 최신 커밋을 먼저 받습니다.
2. 작업은 되도록 작게 쪼개서, 의미 단위(기능 하나·버그 하나)마다 커밋합니다. 큰 변경을 하루 종일
   커밋 안 하고 들고 있지 마세요 — 다른 도구가 그 사이 같은 파일을 건드릴 수 있습니다.
3. **작업이 끝나면 바로 push**: `git add -A && git commit -m "..." && git push`. 로컬에만 두고
   끝내지 않습니다 (다음 도구가 이어받을 수 있어야 함).
4. 커밋 메시지 끝에는 어떤 도구가 작업했는지 남깁니다. Claude Code는
   `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` 형식을 씁니다. 다른 도구도 자기
   이름으로 동일하게 남겨주면 나중에 "이 변경이 어디서 왔는지" 추적하기 쉽습니다.
5. `RiskLevel`처럼 **여러 파일에 영향을 주는 구조 변경**을 했다면 커밋 메시지에 왜 바꿨는지, 어떤
   파일들이 영향받는지 간단히 적어주세요. 다른 도구가 맥락 없이 되돌리는 걸 방지합니다.

### 여러 도구를 동시(같은 시간대)에 병렬로 쓸 때
- `master`에 바로 커밋하지 말고 **기능별 브랜치**(`feature/<도구명>-<작업내용>`)를 파서 작업한 뒤,
  끝나면 `master`로 병합합니다. `gh pr create`로 PR을 만들면 병합 전에 diff를 한 번 더 확인할 수
  있습니다.
- 같은 mock 데이터 파일(`src/data/*.ts`)이나 `riskStyles.ts`, `domain.ts`처럼 **공용 파일을 여러
  도구가 동시에 건드리는 상황은 피하세요.** 겹치면 병합 충돌이 나기 쉽습니다.

### 공통 규칙
- `main`/`master`에 강제 푸시(`git push --force`)하지 않습니다.
- 커밋 전 `npm run build`로 타입 에러가 없는지 확인합니다 (TypeScript가 `RiskLevel` 같은 공용 타입의
  누락을 자동으로 잡아줍니다).
- `.env`, 자격증명, API 키 등 민감 정보는 절대 커밋하지 않습니다 (현재 이 프로젝트엔 실제 백엔드가
  없어 해당 사항 없음, 추후 실 API 연동 시 주의).
