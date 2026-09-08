# 통합상황판·분야별 상세 재설계 + 디자인 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 와이어프레임(`20.재난관리플랫폼 디자인` 폴더) 기준으로 그림자·라디우스 디자인 토큰을 정리하고, 반복되던
토글/탭 버튼 마크업을 공용 `Pill` 컴포넌트로 통합한 뒤, 이 패턴을 대시보드·도메인 홈 6개·세부 워크플로
18개 화면 전체에 일관 적용하고 `/styleguide` 참고 페이지를 추가한다.

**Architecture:** 토큰(`index.css`)과 두 개의 공용 컴포넌트(`Card`, `Pill`)를 먼저 손보면 그 두 컴포넌트를
쓰는 대부분의 화면이 자동으로 새 톤을 상속받는다(이미 `Card`·`AquaSubNav`·`DomainSubNav`를 거의 모든 화면이
재사용 중). 나머지는 화면별로 남은 ad-hoc 스타일(중복된 인라인 버튼 마크업, 토큰화 안 된 `shadow-`)을
찾아 같은 토큰/컴포넌트로 치환하는 기계적 정리 작업이다. 로직·라우팅·mock 데이터·`RiskLevel` 값은
건드리지 않는다.

**Tech Stack:** React 19 + TypeScript + Vite 8 + Tailwind CSS v4(`@theme` CSS 토큰) + react-router-dom v7.
이 리포에는 단위테스트 러너가 없다(`package.json`에 jest/vitest 없음) — "테스트 사이클"은
`npm run build`(tsc 타입체크 + vite build)와 Browser pane을 통한 실제 화면 스크린샷 확인으로 대체한다.

**Spec:** [docs/superpowers/specs/2026-09-08-platform-redesign-design.md](../specs/2026-09-08-platform-redesign-design.md)

## Global Constraints

- 로직·라우팅·mock 데이터 값·`RiskLevel` 값을 바꾸지 않는다 — 시각 레이어(className, 토큰, 컴포넌트 추출)만.
- 새 텍스트·수치를 지어내지 않는다. 부족하면 사용자에게 먼저 확인한다.
- `Record<RiskLevel, T>` 등 공용 타입 시그니처를 바꾸지 않는다.
- 매 태스크 커밋 전 `npm run build` 통과 필수(타입 에러 0).
- 작업 시작 전 `git pull --rebase origin master`, 태스크 완료 시 커밋 후 즉시 `git push`(멀티 AI 협업 규칙,
  `AGENTS.md` §8).
- Task 5~7(도메인별 세부 페이지)은 병렬로 실행되므로 각각 별도 브랜치(`feature/redesign-aqua-pages`,
  `feature/redesign-coast-pages`, `feature/redesign-river-pages`)에서 작업하고, 자기 도메인 폴더
  (`src/pages/aqua/`, `src/pages/coast/`, `src/pages/river/`, 및 각 도메인 전용 컴포넌트 폴더
  `src/components/aqua/`)의 파일만 수정한다. `src/index.css`, `riskStyles.ts`, `Card.tsx`, `Pill.tsx`,
  `GisIconRail.tsx` 등 공용 파일은 읽기만 하고 수정하지 않는다(Task 1~4에서 이미 확정됨).
- 커밋 메시지 끝에 `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` 포함.

---

## 사전 조사 결과 요약 (실행자가 알아야 할 현재 코드 상태)

- `src/index.css`의 `@theme`에는 색상·폰트 토큰만 있고 radius/shadow 토큰이 없다. 컴포넌트들은
  `rounded-lg`/`rounded-xl`/`rounded-full` 등 Tailwind 기본 스케일을 이미 일관되게 쓰고 있어 radius는
  손댈 필요가 없다. 반면 `shadow-`는 `TopBar.tsx`(`shadow-lg` ×2), `GisIconRail.tsx`/`GisSidePanel.tsx`/
  `GisTimelinePanel.tsx`/`MapToolbox.tsx`(`shadow-xl`)에만 산발적으로 쓰이고, `Card.tsx`에는 그림자가
  전혀 없다 — 와이어프레임(`AX기반 재난관리플랫폼.svg` 로그인 화면)의 카드에는 뚜렷한 드롭섀도우
  (`filter0_dd` 이중 그림자)가 있어 실제 격차다.
- 아래 정확히 동일한 클래스 조합("Pill 패턴")이 6개 파일에 중복돼 있다:
  ```
  `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
    active ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"
  }`
  ```
  - `src/pages/DashboardPage.tsx` — TOP_TABS 버튼(약 254~267행), MAP_DOMAIN_FILTERS 버튼(약 419~433행,
    `px-2.5 py-1` 축소판), CCTV_DOMAIN_FILTERS 버튼(약 286~299행, `px-2.5 py-1` 축소판)
  - `src/components/aqua/AquaSubNav.tsx` — `NavLink` className 콜백
  - `src/components/shared/DomainSubNav.tsx` — `NavLink` className 콜백(연안·하천 서브내비 공용)
  - `src/pages/heat/HeatHomePage.tsx` — REGION_FILTERS 버튼(약 82~95행, `px-2.5 py-1` 축소판)
  - `src/pages/reports/ReportsListPage.tsx`도 동일 패턴이 있지만 **이번 스펙 범위 밖**(이력·보고서는
    "통합상황판/분야별 상세"에 포함되지 않음) — 건드리지 않는다.
- `AquaHomePage.tsx`/`CoastHomePage.tsx`/`RiverHomePage.tsx`는 자체 Pill 버튼이 없다(자체 지도 도메인
  필터가 없음) — `AquaSubNav`/`DomainSubNav`만 재사용하므로 Task 2에서 그 두 컴포넌트를 고치면 이
  3개 홈 화면은 **자동으로** 새 톤을 상속받는다.
- `WindFloodHomePage.tsx`/`PropagationHomePage.tsx`는 Pill 패턴이 아예 없다(탭/필터 UI 없음, `Card`만
  사용) — Task 1에서 `Card.tsx`에 그림자를 넣으면 이 두 화면도 자동으로 적용된다.
- 세부 워크플로 18개 페이지 목록:
  - 아쿠아(8): `AquaDataPage`, `AquaPredictionPage`, `AquaFarmsPage`, `AquaFarmDetailPage`,
    `AquaAlertPage`, `AquaResponsePage`, `AquaMonitoringPage`, `AquaClosurePage`
  - 연안(5): `CoastEventDetailPage`, `CoastAlertPage`, `CoastDispatchPage`, `CoastMonitoringPage`,
    `CoastClosurePage`
  - 하천(5): `RiverAnalysisPage`, `RiverAlertPage`, `RiverControlPage`, `RiverDispatchPage`,
    `RiverClosurePage`
  - 이 페이지들은 모두 `AquaSubNav`/`DomainSubNav`로 상단 내비게이션을 렌더링하므로 Task 2 완료 시
    내비게이션 톤은 이미 상속받는다. Task 5~7은 각 페이지 본문 안에 남아있는 개별 ad-hoc 스타일만
    정리하면 된다.

---

## Task 1: 디자인 토큰 확장 — `shadow-card` / `shadow-panel`

**Files:**
- Modify: `src/index.css:30-32` (색상 토큰 블록 끝)
- Modify: `src/components/ui/Card.tsx:12`

**Interfaces:**
- Produces: Tailwind 유틸리티 클래스 `shadow-card`, `shadow-panel`(둘 다 `@theme`의 `--shadow-card`,
  `--shadow-panel`에서 Tailwind v4가 자동 생성). 이후 모든 태스크가 이 두 클래스명을 그대로 쓴다.

- [ ] **Step 1: `index.css`에 그림자 토큰 추가**

`src/index.css`의 `@theme` 블록에서 `--color-risk-offline-bg` 다음 줄에 추가:

```css
  --color-risk-offline: #8a8d90;
  --color-risk-offline-bg: #8a8d9026;

  /* 그림자 — 다크 배경(#1d1d1d)에서 Tailwind 기본 shadow(10% 불투명도)는 거의 안 보여서
     와이어프레임(20.재난관리플랫폼 디자인/AX기반 재난관리플랫폼.svg 로그인 카드의 이중 드롭섀도우)
     기준으로 불투명도를 올려 토큰화했다. */
  --shadow-card: 0 8px 20px -8px rgb(0 0 0 / 0.45);
  --shadow-panel: 0 12px 28px -6px rgb(0 0 0 / 0.55), 0 4px 10px -4px rgb(0 0 0 / 0.4);
}
```

- [ ] **Step 2: `Card.tsx`에 `shadow-card` 적용**

`src/components/ui/Card.tsx:12`을 다음으로 교체:

```tsx
    <section className={`rounded-xl border border-border-subtle bg-panel p-4 shadow-card ${className}`}>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공.

- [ ] **Step 4: 시각 확인**

Browser pane에서 `npm run dev` 실행 후 `/dashboard` 접속, 아무 카드에나 은은한 그림자가 생겼는지
스크린샷으로 확인. 레이아웃이 깨지지 않았는지 확인.

- [ ] **Step 5: 커밋 + 푸시**

```bash
git add src/index.css src/components/ui/Card.tsx
git commit -m "feat: 카드/패널 그림자 디자인 토큰 추가 (shadow-card, shadow-panel)

와이어프레임(20.재난관리플랫폼 디자인)의 카드 드롭섀도우를 기준으로 다크 테마에서
보이도록 불투명도를 올린 그림자 토큰을 추가하고 Card 컴포넌트에 적용.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push
```

---

## Task 2: `Pill` 공용 토글 버튼 컴포넌트 추출 + 전체 적용

**Files:**
- Create: `src/components/ui/Pill.tsx`
- Modify: `src/components/aqua/AquaSubNav.tsx`
- Modify: `src/components/shared/DomainSubNav.tsx`
- Modify: `src/pages/DashboardPage.tsx` (TOP_TABS, MAP_DOMAIN_FILTERS, CCTV_DOMAIN_FILTERS 버튼 3곳)
- Modify: `src/pages/heat/HeatHomePage.tsx` (REGION_FILTERS 버튼 1곳)
- Modify: `src/components/ui/GisIconRail.tsx:24` (`shadow-xl` → `shadow-panel`)
- Modify: `src/components/ui/GisSidePanel.tsx:14` (`shadow-xl` → `shadow-panel`)
- Modify: `src/components/ui/GisTimelinePanel.tsx:14` (`shadow-xl` → `shadow-panel`)
- Modify: `src/components/ui/MapToolbox.tsx:55` (`shadow-xl` → `shadow-panel`)
- Modify: `src/components/layout/TopBar.tsx:38,76` (`shadow-lg` → `shadow-panel`)

**Interfaces:**
- Consumes: Task 1의 `shadow-panel` 클래스.
- Produces: `Pill({ active, onClick, children, size? })` 컴포넌트, `pillClass(active, size?)` 함수
  (둘 다 `src/components/ui/Pill.tsx`에서 export). `size`는 `"sm" | "md"`, 기본값 `"md"`. 이후
  Task 4~7이 이 두 이름을 그대로 참조한다.

- [ ] **Step 1: `Pill.tsx` 작성**

```tsx
import type { ReactNode } from "react"

type PillSize = "sm" | "md"

const SIZE_CLASS: Record<PillSize, string> = {
  sm: "px-2.5 py-1",
  md: "px-3 py-1.5",
}

export function pillClass(active: boolean, size: PillSize = "md"): string {
  return `rounded-full ${SIZE_CLASS[size]} text-xs font-semibold transition ${
    active ? "bg-accent text-black" : "border border-border-subtle text-white/60 hover:bg-inset"
  }`
}

interface PillProps {
  active: boolean
  onClick: () => void
  children: ReactNode
  size?: PillSize
}

export function Pill({ active, onClick, children, size = "md" }: PillProps) {
  return (
    <button type="button" onClick={onClick} className={pillClass(active, size)}>
      {children}
    </button>
  )
}
```

- [ ] **Step 2: `AquaSubNav.tsx`에 `pillClass` 적용**

`src/components/aqua/AquaSubNav.tsx`에 import 추가(`import { pillClass } from "../ui/Pill"`)하고,
className 콜백을 교체:

```tsx
          className={({ isActive }) => pillClass(isActive)}
```

- [ ] **Step 3: `DomainSubNav.tsx`에 `pillClass` 적용**

`src/components/shared/DomainSubNav.tsx`에 동일하게 import 추가 후 className 콜백 교체:

```tsx
          className={({ isActive }) => pillClass(isActive)}
```

- [ ] **Step 4: `DashboardPage.tsx` — TOP_TABS 버튼을 `Pill`로 교체**

`src/pages/DashboardPage.tsx` 상단에 `import { Pill } from "../components/ui/Pill"` 추가.
`<nav className="flex flex-wrap gap-1.5 border-b border-border-subtle pb-3">` 블록 내부의
`{TOP_TABS.map(...)}`를 다음으로 교체(기존 `<button>` 통째로):

```tsx
        {TOP_TABS.map((tab) => (
          <Pill key={tab.key} active={topTab === tab.key} onClick={() => setTopTab(tab.key)}>
            {tab.label}
          </Pill>
        ))}
```

- [ ] **Step 5: `DashboardPage.tsx` — MAP_DOMAIN_FILTERS 버튼을 `Pill`로 교체 (size="sm")**

GIS 상황 탭의 `{MAP_DOMAIN_FILTERS.map(...)}` 블록(기존 `<button>` 통째로)을 교체:

```tsx
            {MAP_DOMAIN_FILTERS.map((f) => (
              <Pill key={f.id} size="sm" active={mapDomain === f.id} onClick={() => setMapDomain(f.id)}>
                {f.label}
              </Pill>
            ))}
```

- [ ] **Step 6: `DashboardPage.tsx` — CCTV_DOMAIN_FILTERS 버튼을 `Pill`로 교체 (size="sm")**

CCTV 탭의 `{CCTV_DOMAIN_FILTERS.map(...)}` 블록(기존 `<button>` 통째로)을 교체:

```tsx
              {CCTV_DOMAIN_FILTERS.map((f) => (
                <Pill key={f.id} size="sm" active={cctvDomain === f.id} onClick={() => setCctvDomain(f.id)}>
                  {f.label}
                </Pill>
              ))}
```

- [ ] **Step 7: `HeatHomePage.tsx` — REGION_FILTERS 버튼을 `Pill`로 교체 (size="sm")**

`src/pages/heat/HeatHomePage.tsx`에 `import { Pill } from "../../components/ui/Pill"` 추가.
`{REGION_FILTERS.map(...)}` 블록(기존 `<button>` 통째로)을 교체:

```tsx
              {REGION_FILTERS.map((f) => (
                <Pill key={f.id} size="sm" active={region === f.id} onClick={() => setRegion(f.id)}>
                  {f.label}
                </Pill>
              ))}
```

- [ ] **Step 8: 플로팅 패널 그림자를 `shadow-panel`로 통일**

다음 5개 파일에서 `shadow-xl` 또는 `shadow-lg` 문자열을 `shadow-panel`로 치환(각 파일 1~2곳):
`src/components/ui/GisIconRail.tsx`, `src/components/ui/GisSidePanel.tsx`,
`src/components/ui/GisTimelinePanel.tsx`, `src/components/ui/MapToolbox.tsx`,
`src/components/layout/TopBar.tsx`(2곳 모두).

- [ ] **Step 9: 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공. `AquaSubNav`/`DomainSubNav`가 더 이상 미사용 변수를 남기지 않는지도
확인(className 삼항식을 통째로 지웠으므로 다른 import가 안 남아있어야 함).

- [ ] **Step 10: 시각 확인**

`npm run dev` → `/dashboard`에서 상단 탭 3개, GIS 상황 탭의 도메인 필터, CCTV 탭의 도메인 필터를
클릭해보며 active/inactive 스타일이 이전과 동일하게 보이는지 확인(순수 리팩터링이므로 시각적으로
달라지면 안 됨). `/aqua`, `/coast`, `/river`, `/heat`에서 서브내비/필터도 동일하게 확인. 콘솔 에러
없는지 확인.

- [ ] **Step 11: 커밋 + 푸시**

```bash
git add src/components/ui/Pill.tsx src/components/aqua/AquaSubNav.tsx \
  src/components/shared/DomainSubNav.tsx src/pages/DashboardPage.tsx \
  src/pages/heat/HeatHomePage.tsx src/components/ui/GisIconRail.tsx \
  src/components/ui/GisSidePanel.tsx src/components/ui/GisTimelinePanel.tsx \
  src/components/ui/MapToolbox.tsx src/components/layout/TopBar.tsx
git commit -m "refactor: 반복된 토글 버튼 마크업을 공용 Pill 컴포넌트로 통합

6개 파일에 중복되던 동일한 활성/비활성 버튼 className을 Pill/pillClass로 추출하고,
플로팅 패널 그림자를 shadow-panel 토큰으로 통일. 순수 리팩터링 — 시각 결과 동일.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push
```

---

## Task 3: `/styleguide` 페이지 신규 추가

**Files:**
- Create: `src/pages/StyleguidePage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Card`(`src/components/ui/Card.tsx`), `RiskBadge`(`src/components/ui/RiskBadge.tsx`,
  props `{level: RiskLevel, label?: string, solid?: boolean}`), `Pill`/`pillClass`(Task 2),
  `GisIconRail`/`GIS_RAIL_ITEMS`/`GisRailKey`(`src/components/ui/GisIconRail.tsx`),
  `RiskLevel`(`src/types/domain.ts`).

- [ ] **Step 1: `StyleguidePage.tsx` 작성**

```tsx
import { useState } from "react"
import { Card } from "../components/ui/Card"
import { RiskBadge } from "../components/ui/RiskBadge"
import { Pill } from "../components/ui/Pill"
import { GisIconRail, GIS_RAIL_ITEMS, type GisRailKey } from "../components/ui/GisIconRail"
import type { RiskLevel } from "../types/domain"

const RISK_LEVELS: RiskLevel[] = ["danger", "alert", "warning", "caution", "safe", "info", "offline"]

export function StyleguidePage() {
  const [pillActive, setPillActive] = useState("a")
  const [railKey, setRailKey] = useState<GisRailKey | null>(null)

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 bg-base p-6">
      <div>
        <h1 className="text-xl font-bold text-white">디자인 시스템 스타일가이드</h1>
        <p className="mt-1 text-sm text-white/50">
          src/index.css의 @theme 토큰과 공용 컴포넌트를 실제로 렌더링해 확인하는 개발용 참고
          페이지입니다. 인증 없이 /styleguide로 바로 접근합니다.
        </p>
      </div>

      <Card title="위험등급 배지 (RiskBadge)" subtitle="src/components/ui/riskStyles.ts 7종 전부">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RISK_LEVELS.map((level) => (
            <RiskBadge key={level} level={level} />
          ))}
        </div>
      </Card>

      <Card title="Pill 토글 버튼" subtitle="size='md'(기본) / size='sm'">
        <div className="flex flex-wrap gap-2">
          {["a", "b", "c"].map((id) => (
            <Pill key={id} active={pillActive === id} onClick={() => setPillActive(id)}>
              옵션 {id.toUpperCase()}
            </Pill>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["a", "b"].map((id) => (
            <Pill key={id} size="sm" active={pillActive === id} onClick={() => setPillActive(id)}>
              작은 옵션 {id.toUpperCase()}
            </Pill>
          ))}
        </div>
      </Card>

      <Card title="카드 (Card)" subtitle="기본적으로 shadow-card 토큰이 적용됩니다">
        <p className="text-sm text-white/70">카드 본문 예시 텍스트입니다.</p>
      </Card>

      <Card title="GIS 아이콘 레일" subtitle="지도 위 플로팅 레일 — shadow-panel 토큰 적용">
        <div className="relative h-24">
          <GisIconRail
            activeKey={railKey}
            onSelect={(key) => setRailKey((prev) => (prev === key ? null : key))}
            items={GIS_RAIL_ITEMS.slice(0, 4)}
          />
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: `App.tsx`에 라우트 추가**

`src/App.tsx`에 import 추가:

```tsx
import { StyleguidePage } from "./pages/StyleguidePage"
```

`<Route path="/403" element={<ForbiddenPage />} />` 다음 줄에 인증 불필요 라우트로 추가:

```tsx
      <Route path="/styleguide" element={<StyleguidePage />} />
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공.

- [ ] **Step 4: 시각 확인**

`npm run dev` → 브라우저에서 로그인 없이 `/styleguide` 접속(인증 가드 밖이므로 바로 렌더링돼야 함),
배지 7종·Pill 2사이즈·카드 그림자·아이콘 레일이 정상 렌더링되는지 스크린샷 확인.

- [ ] **Step 5: 커밋 + 푸시**

```bash
git add src/pages/StyleguidePage.tsx src/App.tsx
git commit -m "feat: /styleguide 디자인 시스템 참고 페이지 추가

기존 컴포넌트(Card, RiskBadge, Pill, GisIconRail)를 그대로 렌더링해 토큰이
실제로 어떻게 보이는지 한 화면에서 확인할 수 있는 개발용 페이지.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push
```

---

## Task 4: 대시보드 + 홈 6개 화면 최종 검증 및 잔여 톤 정리

**Files:**
- Modify (있는 경우에만): `src/pages/DashboardPage.tsx`, `src/pages/aqua/AquaHomePage.tsx`,
  `src/pages/coast/CoastHomePage.tsx`, `src/pages/river/RiverHomePage.tsx`,
  `src/pages/windflood/WindFloodHomePage.tsx`, `src/pages/heat/HeatHomePage.tsx`,
  `src/pages/propagation/PropagationHomePage.tsx`

Task 1~3에서 `Card`/`Pill`/그림자 토큰을 공용 컴포넌트 레벨에서 고쳤기 때문에 이 7개 화면(대시보드는
탭 3개 포함)은 대부분 이미 자동으로 새 톤을 상속받는다. 이 태스크는 **새로 만드는 게 아니라 빠짐없이
확인하고, 놓친 ad-hoc 스타일이 있으면 같은 토큰으로 정리**하는 검증 태스크다.

- [ ] **Step 1: 잔여 ad-hoc 그림자 검색**

Run: `grep -rn "shadow-xl\|shadow-lg\|shadow-md\|shadow-sm" src/pages src/components --include="*.tsx"`
Expected: Task 2에서 처리한 파일 외에 남은 게 있다면, 그 요소가 카드형이면 `shadow-card`로, 플로팅
패널형이면 `shadow-panel`로 치환한다. 없으면 이 스텝은 통과.

- [ ] **Step 2: 화면별 스크린샷 확인**

`npm run dev`로 데모 계정(`jeju-ax` / `mockAuth.ts` 확인) 로그인 후 Browser pane에서 아래 7개 화면을
순서대로 열어 스크린샷을 찍고, 카드 그림자가 보이는지 / 버튼 톤이 일관되는지 / 콘솔 에러가 없는지
확인한다: `/dashboard`(종합 상황 탭 → GIS 상황 탭 → CCTV 탭 순서로 3번), `/aqua`, `/coast`, `/river`,
`/wind-flood`, `/heat`, `/propagation`.

- [ ] **Step 3: 발견된 불일치가 있으면 수정**

Step 1~2에서 남은 ad-hoc 스타일을 발견했다면 해당 파일만 최소 수정하고(예: `rounded-md` → `rounded-lg`
로 다른 카드와 맞추기 등 기존에 이미 쓰이는 값으로만 통일 — 새 값을 지어내지 않는다), 다시 Step 1~2를
반복해 확인한다.

- [ ] **Step 4: 최종 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공.

- [ ] **Step 5: 커밋 + 푸시 (수정 사항이 있었던 경우에만)**

```bash
git add -A
git commit -m "fix: 대시보드·도메인 홈 6개 화면 잔여 스타일 불일치 정리

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push
```

수정 사항이 없었다면(Step 1~2가 전부 통과) 커밋 없이 다음 태스크로 진행한다.

---

## Task 5: 아쿠아 세부 워크플로 8개 페이지 (병렬 — 브랜치 A)

**Files:**
- Modify (필요한 범위만): `src/pages/aqua/AquaDataPage.tsx`, `src/pages/aqua/AquaPredictionPage.tsx`,
  `src/pages/aqua/AquaFarmsPage.tsx`, `src/pages/aqua/AquaFarmDetailPage.tsx`,
  `src/pages/aqua/AquaAlertPage.tsx`, `src/pages/aqua/AquaResponsePage.tsx`,
  `src/pages/aqua/AquaMonitoringPage.tsx`, `src/pages/aqua/AquaClosurePage.tsx`,
  `src/components/aqua/StageTracker.tsx`, `src/components/aqua/ChecklistRow.tsx`(둘 다 아쿠아
  전용이라 이 브랜치에서 수정 가능)
- **읽기 전용(수정 금지):** `src/index.css`, `src/components/ui/Card.tsx`, `src/components/ui/Pill.tsx`,
  `src/components/ui/riskStyles.ts`, `src/components/ui/GisIconRail.tsx` 등 도메인 폴더 밖 파일 전부.

**Interfaces:**
- Consumes: Task 1~2의 `shadow-card`/`shadow-panel` 토큰, `Pill`/`pillClass`(`src/components/ui/Pill.tsx`).

이 태스크는 사전 계산된 diff가 아니라 **절차**다 — 아래 순서대로 8개 파일을 실제로 열어 확인하며
진행한다.

- [ ] **Step 1: 브랜치 생성 + 최신 master 반영**

```bash
git pull --rebase origin master
git checkout -b feature/redesign-aqua-pages
```

- [ ] **Step 2: 도메인 내 Pill 패턴 검색 및 치환**

Run: `grep -n "bg-accent text-black" src/pages/aqua/*.tsx src/components/aqua/*.tsx`

찾은 각 위치에서, 그 버튼이 "여러 옵션 중 하나를 토글 선택"하는 용도(탭/필터/구간선택 등)라면
Task 2와 동일한 패턴으로 `Pill`(또는 `pillClass`, `NavLink`인 경우)로 교체한다. 제출/승인처럼
토글이 아닌 단발성 액션 버튼이면 건드리지 않는다(그런 버튼은 보통 `bg-accent` 단독이지 삼항식
active/inactive 쌍이 아니므로 패턴 자체가 다르게 검색된다 — 애매하면 건드리지 않고 다음 스텝으로).

각 파일 수정 후 바로 `npm run build`를 돌려 타입 에러를 확인한다.

- [ ] **Step 3: 도메인 내 ad-hoc 그림자 검색 및 치환**

Run: `grep -n "shadow-" src/pages/aqua/*.tsx src/components/aqua/*.tsx`

카드형 요소인데 그림자가 없거나 다른 값이면 `shadow-card`로, 플로팅/드롭다운형이면 `shadow-panel`로
맞춘다. `Card` 컴포넌트를 쓰는 곳은 이미 자동 적용되므로 대상은 `Card`를 안 쓰고 직접
`rounded-lg border ...`로 카드 흉내를 낸 `<div>`들이다.

- [ ] **Step 4: 8개 페이지 전체 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공.

- [ ] **Step 5: 대표 화면 스크린샷 확인**

`npm run dev` → `/aqua/farms`, `/aqua/farms/:farmId`(아무 양식장 클릭), `/aqua/alerts`,
`/aqua/response` 최소 4개 화면을 Browser pane으로 열어 카드 그림자·버튼 톤이 다른 도메인과
일관되는지, 콘솔 에러가 없는지 확인.

- [ ] **Step 6: 커밋 + 푸시**

```bash
git add src/pages/aqua src/components/aqua
git commit -m "feat: 아쿠아 세부 워크플로 8개 페이지 디자인 시스템 적용

Pill/그림자 토큰을 아쿠아 도메인 세부 페이지 전반에 적용. 로직/mock 데이터 불변.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push -u origin feature/redesign-aqua-pages
```

---

## Task 6: 연안 세부 워크플로 5개 페이지 (병렬 — 브랜치 B)

**Files:**
- Modify (필요한 범위만): `src/pages/coast/CoastEventDetailPage.tsx`, `src/pages/coast/CoastAlertPage.tsx`,
  `src/pages/coast/CoastDispatchPage.tsx`, `src/pages/coast/CoastMonitoringPage.tsx`,
  `src/pages/coast/CoastClosurePage.tsx`
- **읽기 전용(수정 금지):** 도메인 폴더 밖 파일 전부(Task 5와 동일 원칙).

**Interfaces:**
- Consumes: Task 1~2의 `shadow-card`/`shadow-panel` 토큰, `Pill`/`pillClass`.

- [ ] **Step 1: 브랜치 생성 + 최신 master 반영**

```bash
git pull --rebase origin master
git checkout -b feature/redesign-coast-pages
```

- [ ] **Step 2: 도메인 내 Pill 패턴 검색 및 치환**

Run: `grep -n "bg-accent text-black" src/pages/coast/*.tsx`

Task 5 Step 2와 동일한 기준(토글성 버튼만 `Pill`로 교체, 단발성 액션 버튼은 유지)으로 적용. 파일별
수정 후 `npm run build`로 확인.

- [ ] **Step 3: 도메인 내 ad-hoc 그림자 검색 및 치환**

Run: `grep -n "shadow-" src/pages/coast/*.tsx`

Task 5 Step 3과 동일한 기준으로 `shadow-card`/`shadow-panel` 적용.

- [ ] **Step 4: 5개 페이지 전체 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공.

- [ ] **Step 5: 대표 화면 스크린샷 확인**

`npm run dev` → `/coast/events`, `/coast/alerts`, `/coast/dispatch` 최소 3개 화면을 Browser pane으로
열어 톤 일관성과 콘솔 에러 여부 확인.

- [ ] **Step 6: 커밋 + 푸시**

```bash
git add src/pages/coast
git commit -m "feat: 연안 세부 워크플로 5개 페이지 디자인 시스템 적용

Pill/그림자 토큰을 연안 도메인 세부 페이지 전반에 적용. 로직/mock 데이터 불변.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push -u origin feature/redesign-coast-pages
```

---

## Task 7: 하천 세부 워크플로 5개 페이지 (병렬 — 브랜치 C)

**Files:**
- Modify (필요한 범위만): `src/pages/river/RiverAnalysisPage.tsx`, `src/pages/river/RiverAlertPage.tsx`,
  `src/pages/river/RiverControlPage.tsx`, `src/pages/river/RiverDispatchPage.tsx`,
  `src/pages/river/RiverClosurePage.tsx`
- **읽기 전용(수정 금지):** 도메인 폴더 밖 파일 전부(Task 5와 동일 원칙). 특히
  `src/pages/river/RiverAnalysisPage.tsx`의 recharts 차트(`riverTideCorrelation`,
  `riverSuddenRainAlert` 관련 로직)는 시각 레이어가 아니라 **데이터 시각화 로직**이므로 절대 건드리지
  않는다 — 카드 래퍼의 className만 대상.

**Interfaces:**
- Consumes: Task 1~2의 `shadow-card`/`shadow-panel` 토큰, `Pill`/`pillClass`.

- [ ] **Step 1: 브랜치 생성 + 최신 master 반영**

```bash
git pull --rebase origin master
git checkout -b feature/redesign-river-pages
```

- [ ] **Step 2: 도메인 내 Pill 패턴 검색 및 치환**

Run: `grep -n "bg-accent text-black" src/pages/river/*.tsx`

Task 5 Step 2와 동일한 기준으로 적용. 파일별 수정 후 `npm run build`로 확인.

- [ ] **Step 3: 도메인 내 ad-hoc 그림자 검색 및 치환**

Run: `grep -n "shadow-" src/pages/river/*.tsx`

Task 5 Step 3과 동일한 기준으로 `shadow-card`/`shadow-panel` 적용. `RiverAnalysisPage.tsx`의
`ResponsiveContainer`/`LineChart` 내부는 건드리지 않는다(위 Files 섹션 경고 참고).

- [ ] **Step 4: 5개 페이지 전체 빌드 확인**

Run: `npm run build`
Expected: 타입 에러 없이 성공.

- [ ] **Step 5: 대표 화면 스크린샷 확인**

`npm run dev` → `/river/analysis`(돌발 강우 카드 + 조수 연계 차트가 여전히 정상 렌더링되는지 특히
확인), `/river/control`, `/river/alert` 최소 3개 화면을 Browser pane으로 확인.

- [ ] **Step 6: 커밋 + 푸시**

```bash
git add src/pages/river
git commit -m "feat: 하천 세부 워크플로 5개 페이지 디자인 시스템 적용

Pill/그림자 토큰을 하천 도메인 세부 페이지 전반에 적용. 로직/차트/mock 데이터 불변.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push -u origin feature/redesign-river-pages
```

---

## Task 8: 3개 브랜치 병합 + 최종 통합 검증

**Files:** 없음(병합 작업만).

**Interfaces:** 없음(통합 태스크).

Task 5~7이 모두 끝난 뒤 실행한다.

- [ ] **Step 1: master 기준 최신화**

```bash
git checkout master
git pull --rebase origin master
```

- [ ] **Step 2: 3개 브랜치를 순서대로 병합**

각 브랜치는 서로 다른 폴더(`aqua/`, `coast/`, `river/`)만 건드렸으므로 충돌 가능성은 낮지만, 병합
직전 각 브랜치에도 최신 master를 반영해 확인한다.

```bash
git checkout feature/redesign-aqua-pages && git pull --rebase origin master && git push --force-with-lease
git checkout feature/redesign-coast-pages && git pull --rebase origin master && git push --force-with-lease
git checkout feature/redesign-river-pages && git pull --rebase origin master && git push --force-with-lease

git checkout master
git merge --no-ff feature/redesign-aqua-pages -m "merge: 아쿠아 세부 페이지 디자인 시스템 적용 병합"
git merge --no-ff feature/redesign-coast-pages -m "merge: 연안 세부 페이지 디자인 시스템 적용 병합"
git merge --no-ff feature/redesign-river-pages -m "merge: 하천 세부 페이지 디자인 시스템 적용 병합"
```

- [ ] **Step 3: 병합 후 최종 빌드**

Run: `npm run build`
Expected: 타입 에러 없이 성공. 만약 세 브랜치가 우연히 같은 공용 파일을 건드려 충돌이 났다면(원칙상
없어야 하지만), Global Constraints의 "공용 파일 수정 금지" 원칙에 따라 master 쪽(Task 1~4에서 확정된
버전)을 기준으로 해소한다.

- [ ] **Step 4: 전체 회귀 확인**

`npm run dev` → 로그인부터 시작해 `/dashboard`(3탭), `/aqua`+세부 4화면, `/coast`+세부 3화면,
`/river`+세부 3화면, `/wind-flood`, `/heat`, `/propagation`, `/styleguide`까지 전체 화면을 순서대로
Browser pane에서 열어 콘솔 에러 없이 정상 렌더링되는지 최종 확인한다.

- [ ] **Step 5: master 푸시 + 브랜치 정리**

```bash
git push origin master
git branch -d feature/redesign-aqua-pages feature/redesign-coast-pages feature/redesign-river-pages
git push origin --delete feature/redesign-aqua-pages feature/redesign-coast-pages feature/redesign-river-pages
```

- [ ] **Step 6: `AGENTS.md` 갱신**

`AGENTS.md`에 이번 작업 이력을 한 문단으로 추가한다(기존 §2-④/§5의 서술 스타일을 따라 — 무엇을
했는지, 어떤 파일이 영향받았는지, 남은 이슈가 있다면 무엇인지). 예:

```markdown
**디자인 시스템 토큰 + 통합상황판·분야별 상세 전체 시각 정리 완료**(2026-09-08, Claude Code —
20.재난관리플랫폼 디자인 와이어프레임 기준): shadow-card/shadow-panel 토큰 추가(index.css), 반복
토글버튼을 Pill 컴포넌트로 통합(src/components/ui/Pill.tsx), /styleguide 참고 페이지 신규,
대시보드·도메인 홈 6개·세부 워크플로 18개 전체에 적용. 로직/데이터 불변 — 순수 시각 레이어.
```

```bash
git add AGENTS.md
git commit -m "docs: AGENTS.md에 디자인 시스템 재설계 작업 이력 반영

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
git push
```

---

## Self-Review 메모 (계획 작성자 기록용)

- **스펙 커버리지**: 0단계(토큰+스타일가이드)=Task 1~3, 1단계(대시보드)=Task 2 일부+Task 4,
  2단계(도메인 홈 6개 — 스펙 작성 이후 풍수해/폭염/상황전파 3개가 리포에 추가돼 있어 함께 포함)=Task 4,
  3단계(세부 워크플로 18개, 병렬)=Task 5~8. 스펙의 모든 섹션이 태스크로 매핑됨.
- **범위 변경 기록**: 스펙 작성 시점 이후 다른 AI 도구가 `/wind-flood`, `/heat`, `/propagation` 3개
  페이지를 master에 푸시했다(커밋 `564319d`, `4a88a5c`). 원 스펙의 "범위 대상 페이지" 목록에는 없었지만
  같은 "홈 화면" 성격이라 Task 4에 포함시켰다 — GIS 쉘이 없는 단순 카드형 화면이라 추가 작업량은
  거의 없다(Task 1의 Card 그림자만으로 자동 반영).
- **타입 일관성**: `Pill`의 `size` prop 이름과 `"sm"|"md"` 값을 Task 2~7 전체에서 동일하게 사용.
  `pillClass(active, size)` 시그니처도 동일 유지.
