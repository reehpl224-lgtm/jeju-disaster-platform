# AGENTS.md — AI 협업 컨텍스트 문서

이 저장소는 **한 명의 기획자가 여러 AI 코딩 도구(Claude Code, Manus AI, Gemini 등)를 함께 사용해**
개발을 진행합니다. 이 문서는 어떤 AI 도구가 작업에 투입되든 동일한 맥락에서 시작할 수 있도록
프로젝트 배경, 확정된 사실, 컨벤션, 알려진 미해결 이슈를 정리한 것입니다.

**다른 AI 도구(Manus, Gemini 등)는 작업을 시작하기 전에 이 문서 전체를 반드시 읽어주세요.**
특히 "확정된 사실(Ground Truth)"과 "위험등급 체계"는 화면 하나만 보고 추측하면 반드시 틀리는
부분이므로 꼭 확인해야 합니다.

### 2026-09-30 스테이징 시나리오 검토 인계

사용자는 **기존 사이트와 별도인 스테이징에서 시나리오를 실행하고 대시보드로 재난대응을 검토**하는 방향에 동의했습니다.
스테이징의 실시간 운영 데이터는 동네예보만 유지하고, 나머지는 고정 모의 기본 목록·사용자 입력 시계열·모의 규칙·사용자 대응 조작으로 함께 갱신하는 방향입니다.
Claude 검토용 상세 문서: [스테이징 시나리오 재검토 및 인계](docs/staging-scenario-review-2026-09-30.md).
기존 하천 Q% 파일럿·별도 수집 엑셀·확정 위험기준은 유지합니다. 후속 검토에서 §11을 결정안으로 구체화했습니다: 별도 Vercel 프런트엔드 프로젝트(`staging` 브랜치 push 자동 배포, 실제 URL은 프로젝트 생성 때 확정), 1단계는 한 브라우저 독립 시연, 돈내코·쇠소깍별 고정 모의 시설 3개와 등급별 영향/권고 규칙, 수위·강우 모의 시계열은 1단계 제외(Q% 중심)입니다.
현재 대시보드 구독은 이미 보완됐지만 자동 재생은 상태 플래그만 있으며, 주변 모의 영향/확인 자료 연결과 배포 환경 분리가 필요하다는 코드 확인 결과를 문서에 남겼습니다.
같은 계정의 Pages 저장소를 추가해도 origin이 같을 수 있으므로 저장 키·BroadcastChannel 분리가 필요합니다.
이번 작업은 문서 작성만 했으며 기능 구현·커밋·푸시·배포는 하지 않았습니다. 관련 후속 작업 전에 위 문서를 읽어 주세요.

**같은 날 §9 1~2단계 구현 착수(사용자 승인 — "환경 분리 + 실호출 차단" 범위로 확인)**: 호스팅·배포(§11 미정 사항)는 건드리지 않고, 코드 쪽 환경/실호출 분리만 구현했습니다.
- `src/data/appEnv.ts`(신규) — `IS_SIMULATION_MODE`(`VITE_DATA_MODE=simulation`일 때 참, `vite --mode staging`), `scopedKey(key)`(스테이징이면 `staging-` 접두어).
- 저장 키·채널·상세 창 이름 분리: `riverRunState.ts`(`STORAGE_KEY`/`CHANNEL_NAME`), `dummyWorkbook.ts`, `scenarios.ts`, `mockAuth.ts`의 `STORAGE_KEY`, `PanelParts.tsx`의 `DETAIL_WINDOW` 모두 `scopedKey()`로 감쌌습니다.
- 실호출 차단: `warningsApi.ts`/`rainfallApi.ts`/`marineApi.ts`/`typhoonApi.ts`가 스테이징이면 프록시를 호출하지 않고 모의값(특보·강우는 소량 모의 데이터, 태풍은 "진행 중 없음"과 동일한 빈 배열)을 반환합니다. 동네예보(`weatherApi.ts`)는 그대로 실호출 유지(§5 원칙).
- 출처 표시 정합: `dataSource.ts`에 `SIMULATED` 소스 종류 추가, `SourceTag.tsx`가 "모의(스테이징)"로 표시. `domainParts.tsx`의 `LiveBlock`에 `simulated` prop을 추가하고 `domainConfigs.tsx`의 특보·해양·태풍·우량 블록에서만 `IS_SIMULATION_MODE`를 넘겨 동네예보 블록(`LIVE_FORECAST`)은 그대로 "실시간"으로 남깁니다. 각 패널의 하단 고지 문구도 스테이징에서 "실제 기관 발표가 아님"으로 바뀝니다.
- 진단·표시: `main.tsx`의 일치 검사(`consistency.ts`)를 `DEV`뿐 아니라 `IS_SIMULATION_MODE`에서도 등록. `Header.tsx`에 "스테이징 · 모의 재난대응" 배지 상시 표시.
- 빌드: `package.json`에 `build:staging`/`preview:staging`(`vite --mode staging`, `dist-staging`) 추가, `.env.staging.example`(커밋 대상, `.gitignore`에 예외 추가) 신규 — 로컬에서 `.env.staging`으로 복사해 씀.
- 검증: `npm run build`·`build:staging`·`lint`(src 0 경고)·`node --test tests/*.test.mjs`(9개 통과) 모두 통과. `vite --mode staging`으로 직접 띄워 로그인 세션이 스테이징 저장 키 분리로 다시 요구되는 것, "모의(스테이징)" 표식과 모의 특보 노출, 동네예보만 실측 유지, 헤더 배지, 콘솔의 `[일치 검사] 어긋남 없음`을 모두 브라우저로 확인했습니다.
- 하지 않은 것(§9 3~6단계, §11 미정): 하천 모의 기본 세트(시설·구역·영향 규칙), 화면 동기화 확장, 자동 재생 타이머, 다른 서비스 확대. 아직 커밋·푸시는 하지 않았습니다 — 별도 요청 시 진행.

**같은 날 §11 검토 + Vercel 실배포(사용자 요청 2건 순차 승인)**: 먼저 §11 권장 결정안을 미커밋 코드와 대조 검토했다(코드는 안 건드림, 상세는 `docs/staging-scenario-review-2026-09-30.md`의 "Claude 검토" 절). 발견한 충돌 1건(`vite.config.ts`의 base가 `--mode staging`에서도 `/jeju-disaster-platform/`을 써서 Vercel 루트 배포 시 빈 화면이 뜨는 버그, `vite preview`로 직접 재현)과 누락 2건(§11-1의 `VITE_APP_ENV` 미구현, §11-2의 "이 실행은 현재 브라우저에만 저장됩니다" 문구 미구현) 중, 사용자는 base path 수정과 문구 추가만 진행하도록 결정했고 `VITE_APP_ENV`는 보류했다(현재 아무 코드도 안 읽는 변수라 추가해도 동작에 영향 없음 — 실제로 스테이징 표시와 모의 데이터 여부가 갈리는 요구가 생기면 추가).
- `vite.config.ts` — base 조건에 `mode !== 'staging'` 추가(한 줄).
- `RiverScenarioPage.tsx` — 헤더 아래 "이 실행은 현재 브라우저에만 저장됩니다 — 다른 PC·다른 브라우저·시크릿 창과 공유되지 않습니다." 문구 추가.
- 이어서 사용자가 "Vercel에 실제로 배포해줘"를 요청해 실제 배포까지 진행했다. Vercel CLI가 이미 이 계정(`reehpl224@gmail.com`)으로 로그인돼 있어 새 계정을 만들지 않고 새 프로젝트만 만들었다: `vercel.json`(신규, `buildCommand: npm run build:staging`, `outputDirectory: dist-staging`, SPA `rewrites`)·`.vercelignore`(신규, `.claude`·`Improve Jeju Disaster Platform UI_UX`·`run-local.bat`·`README.md`·`.env*`·`tests`·`docs` 등 제외)를 만들고 `vercel link`로 **`rhkim/jeju-disaster-platform-staging`** 프로젝트를 생성한 뒤, 빌드 타임 환경변수(`VITE_DATA_MODE=simulation`, `VITE_WEATHER_PROXY_URL`은 기존 `.env`의 공개 프록시 URL 재사용)를 넘겨 `vercel deploy --prod`로 배포했다. 결과 주소는 **https://jeju-disaster-platform-staging.vercel.app** — §11-1이 제안한 이름과 정확히 일치한다. 로그인 → 대시보드 → `/river/scenario`까지 실제 배포 사이트에서 브라우저로 열어 스테이징 배지·문구·콘솔 무오류를 확인했다.
- **부작용**: `vercel link`가 `.gitignore` 끝에 CRLF로 `.vercel`·`.env*`를 추가했는데, 뒤에 덧붙은 `.env*`가 기존 `!.env.example`/`!.env.staging.example` 예외보다 순서가 늦어 두 예제 파일을 다시 무시 대상으로 만드는 실제 버그였다 — 발견 즉시 `.env*` 줄만 제거하고 `.vercel`은 유지해 고쳤다(`git check-ignore`로 `.env.staging.example`이 다시 안 걸리는 것 확인).

**같은 날 GitHub 연동 + staging 브랜치 전환(사용자 요청 3건 순차 승인)**: 처음 `vercel git connect`는 Claude Code 자동 모드 안전 분류기가 차단했다 — 우회하지 않고 멈춘 뒤 사용자에게 두 가지 방법(Vercel 대시보드에서 직접 연결 / Claude Code 권한 규칙 추가)을 물었고, 사용자가 후자를 선택했다.
- `.claude/settings.local.json`(신규, 미커밋 — `.claude/`는 커밋 제외 대상)에 `Bash(npx vercel git connect:*)`/`Bash(vercel git connect:*)` 허용 규칙 추가 → 재시도로 `reehpl224-lgtm/jeju-disaster-platform` 저장소 연동 성공(API로 `link.type: github` 확인).
- 이어서 "staging 브랜치로 바꿔줘" 요청으로 실제 커밋·푸시를 진행했다: `git fetch`·상태 확인 후 `.github/workflows/deploy-pages.yml`이 `master` push에서만 트리거됨을 먼저 확인(staging push가 기존 운영 배포에 영향 없음 검증) → `npm run build`·`lint`(src 0 경고)·테스트 통과 확인 → `git checkout -b staging` → README.md·`.claude/`·`Improve Jeju Disaster Platform UI_UX/`·`run-local.bat`를 제외한 33개 파일을 명시적으로 스테이징해 커밋(`e70b7c8`) → `git push -u origin staging`. push 직후 Git 연동이 실제로 Preview 배포를 자동 생성하는 것도 확인했다.
- Vercel Production Branch(`master`→`staging`) 전환은 REST API에 해당 필드가 없어(`PATCH /v9/projects/{id}`가 `link`/`productionBranch`를 거부 — Vercel 공식 문서로 "대시보드 Environments 화면 전용" 기능임을 재확인) CLI/API로 대신할 수 없었다 — 사용자에게 직접 Settings → Environments → Production Branch를 `staging`으로 바꿔 달라고 요청했고, 사용자가 저장한 뒤 "확인해줘"라고 요청해 API로 `productionBranch: staging` 반영을 확인했다.
- 브랜치 전환 저장은 기존 배포를 소급 승격하지 않는다는 것을 발견 — 방금 push된 staging 커밋의 배포가 여전히 "Preview"로 남아 있어 `vercel promote <preview-url> --yes`로 수동 승격했다. 승격 후 `https://jeju-disaster-platform-staging.vercel.app`(공개 주소)이 새 Production 배포를 가리키는 것을 브라우저로 재확인(`/river/scenario`의 "이 실행은 현재 브라우저에만 저장됩니다" 문구까지 라이브에서 확인).
- 이제 `staging` 브랜치 push → Vercel이 자동으로 Production 배포·도메인 갱신까지 하는 구조가 완성됐다(§11-1과 일치). `master`는 이 스테이징 프로젝트와 완전히 분리됐다(기존 GitHub Pages 운영 배포만 그대로 `master` 트리거 유지).
- 로컬 `master` 브랜치는 이번 커밋 이전 상태 그대로다 — `staging`에만 새 커밋이 있고, `master`로의 병합은 별도 요청 전까지 하지 않는다. (이후 사용자가 "문제 없으면 master로 병합해줘"→"응, 푸시해줘"를 요청해 fast-forward 병합·빌드/lint/테스트 재검증 후 `master`에도 푸시했다 — GitHub Pages 운영 배포 성공 확인함. `staging`에도 같은 커밋을 push해 Vercel 자동 배포까지 확인했다.)

**같은 날 §11-3 하천 모의 영향·권고 자원 + 동일 관측시각 묶음 처리 구현(`docs/staging-river-scenario-sample-2026-09-30.md` 반영, 사용자 요청)**: 입력 엑셀은 3열(지점·관측시각·계획홍수량비율)을 그대로 유지하고 수위(m)는 여전히 건드리지 않았다 — 이번 작업은 등급별 모의 영향·권고 자원 계산과 시점 진행 방식만 다룬다.
- `src/data/riverMockImpact.ts`(신규) — 고정 모의 시설 카탈로그(돈내코 D-01~03, 쇠소깍 S-01~03), 등급별 영향(시설 수·모의 영향대상 인원)·권고 자원 표(§11-3 표와 동일), `riverImpactForPoint()`·`riverRecommendedQty()`·`riverImpactSummary()`.
- `riverRunState.ts` — `advance()`를 같은 `observedAt`의 여러 행을 한 묶음으로 처리하도록 재작성(`applyPointObservation()`으로 지점별 판정 로직 분리, `playheadIndex`는 묶음의 마지막 행까지 이동). `projectToMock()`이 `riverImpactSummary()` 결과를 `RV.riverImpact`(면적→"모의 영향 구역 N개", 인구→"모의 영향대상 N명", 시설→활성 시설명 목록)에 반영 — 대피 경로는 근거 있는 모의 경로 카탈로그가 없어 손대지 않음(§11-4 원칙 유지).
- `RiverScenarioPage.tsx` — ② 재생 제어 상태줄이 두 지점 Q%를 동시에 보여주도록 수정, 지점 카드에 "모의 영향 시설 N개 · 영향대상 N명" 추가, 자원 카드에 "현재 등급 권장 N건" 배지 추가(요청은 여전히 담당자가 수행 — 자동 배치 아님, §11-3 원칙).
- `leaderBriefs.ts`의 `riverBrief()` evidence에 "모의 영향(§11-3)" 줄 추가(대시보드·상황분석·브리핑이 같은 영향값을 보게 함).
- `tests/riverRunRestart.test.mjs`에 동일 관측시각 묶음 처리 테스트 추가(총 10개 테스트 통과).
- **검증**: `npm run build`·`lint`(src 0 경고)·`node --test`(10개 통과) 후, `outputs/01a0eb63-.../하천_스테이징_시나리오_전체흐름_샘플.xlsx`(28행)를 로컬(`localhost:5173`)에 실제 업로드해 브라우저로 전체 흐름을 끝까지 실행했다: 28행 오류 없이 파싱 → 시점마다 두 지점 동시 반영(예: 시점 0→2, 시점 2→4로 항상 2행씩 이동) → 정상→관심→주의→경계→심각 상향은 즉시, 심각→경계→주의→관심→정상 하향은 각 단계 30분 유지 후 한 단계씩 적용됨을 확인 → 경계 단계에서 경보·출동 승인, 통제 인력 2건 요청→승인→(15분 후)도착→복귀까지 이력에 시나리오 시각으로 기록됨을 확인 → 대시보드 서비스 카드(경계 02)·상황분석의 "영향 범위"(모의 영향 구역 6개·영향대상 60명·시설 6곳 이름)·지도 마커가 모두 일치함을 확인 → 정상 등급 30분 유지+자원 복귀 후 정상 종료 확인(종료 보고서의 3개 조건 모두 ✔) → 같은 파일 재업로드 시 새 runId로 처음부터 재시작됨을 확인. 콘솔 에러 없음.
- 커밋하지 않았다 — 별도 요청 전까지 진행 안 함.

### 2026-09-30 더미데이터 요구사항 검토 인계

사용자가 **직접 입력한 서비스별 시간별 수치로 위험등급 변화를 확인하고, 가상 인력·장비로 대응 절차를 시험**하려는 목적을 설명했습니다.
Claude 검토용 상세 문서: [더미데이터 기반 재난대응 시나리오 검토 인계](docs/dummy-scenario-handoff-2026-09-30.md).
이 문서는 사용자 요구사항·현재 코드 확인 결과·미확정 제안을 구분한 **검토 자료**입니다. 기능 구현 완료나 전체 구현 승인을 뜻하지 않습니다.
더미데이터 관련 후속 작업 전에 읽고, 기존 빈 기준선·실시간 API·미커밋 변경을 보존하세요.
이 인계 요청에는 커밋·푸시·배포 승인이 포함되지 않습니다. 기존 사용자 지시대로 별도 요청 전에는 하지 않습니다.

Claude 검토 응답: [더미데이터 시나리오 인계 검토 — Claude 응답](docs/dummy-scenario-review-2026-09-30-claude.md).
코덱스 문서의 기술적 주장을 코드로 대조 확인했고(전부 정확함), 사용자가 두 가지를 결정했습니다:
① 하천범람만 파일럿으로 먼저 만든다(저염분·연안·호우·폭염·태풍은 이번 착수 대상 아님),
② 시계열 시나리오 엑셀은 기존 수집상태 엑셀과 완전히 별도 파일로 간다.
구현 순서·미확정 사항은 위 문서 참고. **이 응답 문서도 착수 승인을 뜻하지 않습니다** — 구현 시작 전
사용자의 별도 착수 지시가 필요합니다.

**같은 날 Codex 재검토 반영(사용자 요청)**: 위 Claude 응답 문서의 §2-1~2-6·§3을 보완했습니다.
객체 직접 변경만으로 React/별도 창이 동기화된다는 설명을 정정하고, 독립 실행 상태·변경 구독·창 간 동기화,
근거 있는 조기경보 입력, 실행 중 자원 배치 검사, 시나리오 시간·종료 조건을 구분했습니다.
하천 단독 파일럿·별도 엑셀 결정은 유지하며, 추가 제안은 설계 확인 대상입니다. 앱 기능은 아직 구현하지 않았습니다.

**같은 날 Claude 재검증 + 사용자 결정**: Codex 보완(§2-5·§2-6·§3)을 코드로 재대조해 전부 정확함을 확인했습니다
(`DETAIL_WINDOW` 별도 창, `scenarios.ts` 1회 덮어쓰기 패턴, `consistency.ts:84` 근거). 이어서 §2-3의 미확정
사항 6가지(입력 단위·하향 유지시간·종료 조건·시험 시간 기준·조기경보 입력 범위·시점 사이 값 처리)를
사용자가 채팅에서 직접 확정했습니다 — **입력은 Q%만, 하향 유지 30분(연안과 동일), 종료는 유지시간+조치
완료+자원 복귀+사용자 확인(예외 강제 종료 허용), 시나리오 시계 기준, 조기경보는 이번 파일럿 제외, 결측은
직전 값 유지.** 위 문서 §2-3에 반영 완료.

**같은 날 하천 파일럿 §3 구현 착수(사용자 승인)**: `docs/dummy-scenario-review-2026-09-30-claude.md` §3의 1~7단계를
구현했습니다.
- `src/data/riverAlertThresholds.ts` — `classifyRiverRisk(flowRatioPercent)` 신규(20/50/70/100 경계, `riverStageCriteria`와 동기).
- `src/types/riverRun.ts` + `src/data/riverRunState.ts` — 독립 실행 상태(`RiverScenarioRun`): 시계열 재생(다음 시점·일시정지),
  지점별 하향 유지시간(30분, 한 단계씩), 가상 자원 요청→승인→모의 출동(15분 지연)→도착→복귀, 정상/예외 종료. `localStorage` +
  `BroadcastChannel`로 창 간 동기화, `useSyncExternalStore`(`riverRunHooks.ts`)로 React 갱신. 경보·출동 승인 시점의 등급은
  이후 등급이 바뀌어도 바뀌지 않게 스냅샷으로 얼려서 기록한다(`alertSnapshot`/`dispatchSnapshot`).
- `src/data/riverTimelineWorkbook.ts` + `public/하천_시나리오_시간별입력_템플릿.xlsx` — 수집상태 엑셀과 완전 별도인
  시계열 입력 파일(지점·관측시각·계획홍수량비율(%)만 받음). "지점+관측시각" 키로 중복만 막는다(항목ID 로직 재사용 안 함).
- `src/pages/river/RiverScenarioPage.tsx`(`/river/scenario`, 신규 nav) — 업로드·재생·자원 배치·종료 처리 통합 화면.
  `RiverAlertPage`·`RiverDispatchPage`·`RiverClosurePage`에도 실행 상태 연동 승인 버튼을 추가했다.
- `consistency.ts` — 시나리오 실행 중에는 "정상=흐름 비어 있어야" 가정을 적용하지 않고, 종료 기록·자원 중복 배치를 검사하도록
  보완. 서비스 카드 집계·지도 마커(`mockDashboard.ts`)도 `riverStatuses`와 함께 갱신하도록 `riverRunState.ts`에 추가(안 했으면
  `window.__jejuConsistency()`가 바로 잡아낸 실제 회귀였음).
- 브라우저로 업로드→재생→경보 승인→자원 요청/승인/도착/복귀→예외 강제 종료까지 전체 흐름을 실행해 확인했고, `npm run build`·
  `npm run lint`(src/ 경고 0)·`node --test tests/*.test.mjs`(7개 전부 통과) 모두 통과했다.
- **알아둘 축소 범위(과설계 금지 원칙에 따라 의도적으로 뺀 것)**: 현재 활성 실행 1개만 보관(과거 실행 아카이브 없음),
  되감기 없음(재시작만), 경보 승인은 한 실행에 1회(재상향 시 재승인 UI 없음— 필요해지면 후속 작업), 자원 도착 지연은
  고정 15분. 이런 부분이 필요해지면 별도로 다시 설계·확인한다.
- 아직 커밋·푸시·배포는 하지 않았다 — 별도 요청 시 진행.

**같은 날 고정 항목·시나리오 가변 수치 싱크 점검(사용자 요청)**: 방향 자체는 가능하다. 단, 현재 하천 파일럿은 Q% 입력에 따른 판정·카드·지도·일부 대응 상태까지만 투영한다. 고정 지표 `itemId` 카탈로그, 고정 센서 목록과 재생 값, 분석 근거·그래프까지 전 화면이 같은 시점 값을 보도록 하는 싱크는 아직 완성되지 않았다. 상세 현황과 권장 데이터 계약은 `docs/dummy-scenario-review-2026-09-30-claude.md`의 **“고정 더미 항목과 시나리오별 가변 수치의 싱크 점검”** 절을 읽는다. 수집상태(정상·지연·오류·누락)는 위험값과 별개이며, Q%(계획홍수량 대비 비율)를 수위(m)로 취급하지 않는다. 이 점검은 설계 인계일 뿐 추가 구현 승인이 아니며, 앱 코드는 수정하지 않았다.

**같은 날 Claude 재검토**: Codex의 진단을 코드로 재대조해 전부 정확함을 확인했다(`RiverHomePage`·`RiverAnalysisPage`·`leaderBriefs.riverBrief()`의 근거 카드가 시나리오 재생 중에도 "관측값 없음"으로 고정되는 것 실제 확인). 다만 `itemId` 카탈로그 전면 도입(Codex 권장안 1~2)은 **지금은 과설계로 판단해 보류를 권한다** — 현재 파일럿은 지점당 지표가 Q% 하나뿐이라 `location` 자체가 이미 `itemId` 역할을 하고, 지표가 2개 이상(수위·강우 추가 시)이 될 때가 카탈로그가 실제로 필요해지는 시점이다. 대신 최소 범위로 "현재 Q% 값 자체를 evidence 카드에 노출"하는 작업을 권장한다(상세는 위 리뷰 문서의 "Claude 검토" 하위 절). `riverSensorCheck`·`riverSuddenRainAlert`·`riverWaterLevelAiForecast`는 이번 파일럿 범위 밖이므로 억지로 채우지 않고 그대로 둔다. 이번 재검토도 설계 제안일 뿐이며 앱 코드는 건드리지 않았다.

**사용자 운영 방식 추가 확인**: 시나리오 엑셀은 입력 수단이며, 사용자는 업로드 후 **통합/하천 대시보드에서 시점별 수치·등급·근거를 보고 기존 경보·출동·자원·종료 흐름을 직접 진행**하려 한다. 열린 대시보드의 즉시 갱신과 상세 화면에서 처리한 상태의 대시보드 반영이 필요하다. `/river/scenario`에서만 전 과정을 수행하는 시연으로 완료 처리하지 않는다. 실제 화면 경로와 검증 기준은 `docs/dummy-scenario-review-2026-09-30-claude.md`의 **“사용자 운영 흐름 추가 확인”** 절을 따른다.

**같은 날 Claude 재검토**: 원인을 코드 줄 단위로 확인했다 — `DomainBoardPage.tsx:18`의 `useMemo(() => build(), [build])`가 `build`(안정적 함수 참조)만 의존해 `riverConfig()`(따라서 `riverBrief()`)를 보드 화면이 처음 열릴 때 딱 한 번만 계산하고 이후 절대 재계산하지 않는다. `DashboardPage.tsx`는 이런 메모는 없지만 `useRiverRun` 구독이 아예 없다. 두 화면 다 `useRiverRun()`을 붙이고, `DomainBoardPage`는 그 값을 `useMemo` 의존성에 추가해야 열어 둔 대시보드가 다른 창(`DETAIL_WINDOW`)·다른 탭의 진행/승인을 즉시 따라간다. `RiverAlertPage`·`RiverDispatchPage`·`RiverClosurePage`·`RiverScenarioPage`는 이미 구독 중이라 문제없다. 사용자의 6단계 완료 기준 중 ②·③·⑤·⑥이 "화면을 새로 열거나 이동해 들어가면 맞고, 열어 둔 채로는 다음 상호작용까지 안 보일 수 있음"이라는 같은 원인으로 걸린다. 상세 대조표와 권장 수정은 위 리뷰 문서의 "Claude 검토" 하위 절 참고. 이번에도 앱 코드는 건드리지 않았다.

**2026-10-01 스테이징 연관 모의 수치 연결(사용자 요청)**: 사용자가 Q% 시나리오를 토대로 연관 데이터·수치도 함께 변하도록 범위를 확장했다. `riverScenarioObservations.ts`(신규)가 현재 재생 시점의 Q% 묶음에서 시간당·일누적 모의 강우, 강우대, 누적 토양 포화도, Q% 추세를 난수 없이 계산하고, 일누적은 엑셀 관측시각의 실제 간격(10·15·30분 등)을 적분한다. `rainfallApi.ts`의 스테이징 우량 패널과 `riverRunState.projectToMock()`의 `riverRiskBasis`가 같은 결과를 공유한다. 팀장 브리핑과 `/river/analysis`는 `수위 지표(Q%)`·`모의 강우량`·`모의 레이더`·`모의 토양 포화도`를 표시한다. Q%를 실제 수위(m)로 환산하지 않고 실제 센서·조위·교차검증 목록은 채우지 않는다. 모의 주변값은 상황 설명용이며 위험등급의 유일한 입력은 계속 Q%다. `riverSuddenRainAlert`에는 동일한 모의 강우를 참고값으로만 투영하고 독립 AI 판정은 하지 않는다. `build:staging`·테스트 13개 통과, 로컬 스테이징에서 Q% 78/85%(경계) 시 카드 85%·15mm/h·강한 강우대·포화도 76%, 우량 패널 15mm/h가 일치하고 콘솔 일치 검사도 어긋남 없음으로 확인했다. 기능 커밋 `69e5274`를 `staging` 브랜치에 푸시했고, Vercel Production 배포가 Ready 상태로 `https://jeju-disaster-platform-staging.vercel.app`에 반영됐다. 운영 `master`에는 병합하지 않았다.

**2026-10-01 통합화면 연결·지점 표시 구분·메뉴 재배치(Codex 검토 문서 기반, 사용자 요청)**: Codex가 작성한 [스테이징 하천 시나리오 화면 연결·지점 표시·메뉴 검토](docs/staging-river-dashboard-review-2026-10-01.md)(커밋 `47ab65f` 기준)를 코드와 대조 검토한 뒤 ①②③ 순서로 구현했다.
- ① 종합상황·GIS상황 연결: `riverRunState.projectToMock()`이 GIS 마커(`riskMarkers`) `value`에 `riverFlowRatioAnalysis()`로 구한 지점별 Q%·등급·마지막 관측시각·"시나리오 모의" 표식을 채운다. `DashboardPage.tsx`의 종합상황·GIS상황 양쪽 대응 패널에 전용 "하천 시나리오" 탭(`dummy: true`)을 새로 추가해 실행 상태·지점별 Q%·Q% 추이 그래프(`riverFlowRatioAnalysis` 재사용)·판단 근거 모의값(`riverRiskBasis`, `IS_SIMULATION_MODE`에서만)·시나리오 활동 이력(`run.history`)·가상 자원·모의 영향을 보여준다. 기존 `dashboardSensors`/`timeSeries`/`disasterIncidents`(실제 피해접수로 오인될 수 있는 배열)는 전혀 건드리지 않고 전용 영역에만 표시했다.
- ② 돈내코·쇠소깍 개별 구분: `projectToMock()`의 `riverStatuses[].eta`/`.updatedAt` 계산을 근본적으로 고쳤다 — 관측 없음(`시나리오 미입력`)·하향 유지 대기(`OO 하향 대기 중 — 30분 유지 필요`)·관측됨+비정상·진짜 정상을 구분하고, `updatedAt`은 배치 공통 시각이 아니라 `riverFlowRatioAnalysis().latest[loc]`로 구한 그 지점의 실제 마지막 관측시각을 쓴다. 이 두 필드를 그대로 쓰는 `leaderBriefs.ts`(팀장 브리핑)·`RiverHomePage.tsx`("하천 위험 요약" 카드)는 코드 수정 없이 자동으로 개선됐다. `leaderBriefs.ts`의 "판단 근거" Q% 줄도 `돈내코 78% · 경계 · 관측 2026-09-30 09:30 · 쇠소깍 85% · 경계 · 관측 2026-09-30 09:30` 형식으로 두 지점을 항상 함께 보여주게 바꿨다.
- ③ 메뉴 재배치: `riverNav.ts`의 `RIVER_NAV` 순서를 `상세 대시보드 → 상황 분석 → 경보 발송 → 출동 요청 → 현장 통제 → 종료 보고 → 데이터 수집`으로, `시나리오 실행`은 맨 뒤로 분리했다. 사이드바(`DomainSidebar.tsx`)와 보드 탭(`domainConfigs.tsx`의 `navTabs()`)이 이 배열 하나를 공유하므로 양쪽 다 자동 반영된다. `NavItem`에 `divider?: boolean`을 추가해 사이드바에만 "시나리오 설정" 구분선을 넣었다 — 보드 쪽 세로 탭 레일(`SideTabsDock`, 다른 도메인과 공유)에는 넣지 않았다(하지 않은 것).
- 다른 도메인의 메뉴 순서·`SideTabsDock` 등 공유 렌더러는 건드리지 않았다. Q%를 실제 수위(m)로 바꾸지 않고, 실제 피해접수·기관 전파 완료를 임의로 만들지 않았다.
- 검증: `build`·`build:staging`·`lint`(src 0 경고)·`node --test`(14개, §3 분기 테스트 신규 1개) 통과. 로컬 스테이징에서 종합상황·GIS상황의 "하천 시나리오" 탭 수치 일치, GIS 마커 팝업 Q% 노출, 사이드바·보드 탭 순서, `window.__jejuConsistency()` 어긋남 0건을 확인했다.
- 운영 `master`에는 병합하지 않았다. 기능 커밋 `cff59aa`를 `staging` 브랜치에 푸시했고, Vercel Production 배포가 42초 만에 Ready 상태가 돼 `https://jeju-disaster-platform-staging.vercel.app`에 정상 aliased됐다. 배포된 번들(`index-*.js`, `DashboardPage-*.js`)을 직접 내려받아 `시나리오 Q% 입력 없음`·`시나리오 미입력`·`하향 대기 중`·`시나리오 설정`·`하천 시나리오` 문자열이 실제로 포함된 것을 확인했다.

**2026-10-01 ①②(통합화면 연결·지점 표시 구분) 원복(사용자 요청)**: 배포 후 사용자가 종합상황·GIS상황에서 바로 확인했을 때 "하천 시나리오" 탭이 우측/좌측 패널의 세로 탭 레일 맨 끝(11번째)에 숨어 있어 찾기 어렵다는 걸 지적했고, 애초에 요청한 방향과 다르다며 ①②를 되돌려 달라고 했다(재요청 예정). `src/data/riverRunState.ts`·`src/pages/DashboardPage.tsx`·`src/pages/domain/leaderBriefs.ts`·`tests/riverRunRestart.test.mjs` 4개 파일을 `47ab65f` 시점 내용으로 정확히 되돌렸다(`git checkout 47ab65f -- <path>`, 해당 4개 파일은 이 라운드에서만 바뀌었으므로 다른 손실 없음). ③(메뉴 재배치, `riverNav.ts`/`domainSidebarUtils.ts`/`DomainSidebar.tsx`)은 되돌리지 않고 그대로 유지했다 — 사용자가 원복 대상으로 지목한 건 1·2번뿐이다. `build`·`build:staging`·`lint`·`node --test`(13개, ①②용으로 추가했던 §3 테스트도 함께 제거되어 원래 개수로 복귀) 모두 통과 확인. 기능 커밋 `f991430`을 `staging`에 푸시했고 Vercel Production 배포가 Ready — 배포된 번들에서 ①② 관련 문자열은 사라지고 ③("시나리오 설정")은 남아있는 것을 직접 확인했다.

**2026-10-01 ①을 올바른 요청대로 재구현 — 새 탭이 아니라 기존 타임라인·대응현황 패널에 연결**: 사용자가 원복 직후 스크린샷으로 정확한 의도를 짚어줬다 — 종합상황 좌측 "타임라인" 패널과 GIS상황 좌/우 사이드패널("타임라인"·"대응현황")에 하천 시나리오 데이터가 안 보인다는 것. 처음 구현(새 "하천 시나리오" 탭 추가)은 요청과 다른 방향이었다. 이번엔 이미 있는 패널을 그대로 확장했다: `DashboardPage.tsx`의 `railContent.timeline`(GIS 좌측 패널)과 `timelineTabs[0]`(종합상황 좌측 패널 + GIS 우측 `HorizontalTabsDock`, 둘이 같은 배열을 공유)에 `riverRun.history`를 `disasterIncidents` 목록 뒤에 이어 붙이되 `[하천 시나리오]` 표시와 "모의 — 실제 피해접수 아님" 문구로 구분했다. `railContent.response`(종합상황·GIS 양쪽의 "대응현황" 탭)에는 `riverRun.resourceRequests`가 있을 때만 "하천 시나리오 — 가상 자원(모의)" 그룹을 추가했다. 새 탭·마커 팝업 Q%·Q% 추이 그래프·판단 근거 모의값은 이번엔 요청받지 않아 다시 만들지 않았다(필요하면 별도 요청). `build`·`build:staging`·`lint`·`node --test`(13개, 변경 없음 — DashboardPage.tsx는 테스트 대상 아님) 통과. 로컬 스테이징에서 종합상황 좌측 타임라인·대응현황, GIS상황 좌/우 패널 모두 기본 탭 상태에서 바로(새 탭 클릭 없이) 하천 시나리오 이력·자원 요청이 보이는 것을 확인했고 `window.__jejuConsistency()` 어긋남 0건.

**2026-10-01 Codex 추가 검토(§7~8) 반영 — 센서정보·자산현황에 고정 모의 카탈로그 노출**: Codex가 로컬 검토 기준 `1073e63`로 [스테이징 하천 시나리오 화면 연결·지점 표시·메뉴 검토](docs/staging-river-dashboard-review-2026-10-01.md)에 §7(고정 모의 센서·자산 목록과 GIS 패널 역할 분리)·§8을 추가했다. 코드와 대조해 사실 확인했고(`RIVER_NAV` 순서, 타임라인·대응현황 연결, `mockRiverResources.ts` 자원 6개, `RIVER_MOCK_FACILITIES` 시설 6개, GIS 좌/우 "타임라인" 중복 전부 코드로 재확인), 사용자는 §7-3(고정 카탈로그 노출)만 먼저 진행하고 §7-4·7-5(GIS 패널 역할 재분리·선택-상세 UX)는 다른 시나리오 완료 후로 미뤘다. `DashboardPage.tsx`의 기존 "센서정보" 탭(`railContent.sensor`, 종합상황·GIS 양쪽 공유)에 돈내코·쇠소깍 Q% 가상 관측지점 2개를, "자산현황" 탭(`railContent.asset`)에 `RIVER_MOCK_FACILITIES`의 모의 시설 6개(`riverImpactForPoint()`로 현재 등급의 점검 대상 여부 판정)와 `mockRiverResources.ts`의 가상 자원 6개(가용/전체 수량)를 기존 `dashboardSensors`/`shelters` 목록 뒤에 이어 붙였다. 이름·ID·담당 지점·보유 수량은 고정이고 시나리오 진행에 따라 관측값·점검 대상 여부·가용 수량만 바뀐다. 시나리오 업로드 전에는 "시나리오 미입력"/"관측값 없음"/"비활성"으로, 실제 수위센서·대피소 데이터는 그대로 유지하고 섞지 않았다. `build`·`build:staging`·`lint`(src 0 경고)·`node --test`(13개) 통과. 로컬 스테이징에서 로그인 직후(시나리오 없음) 두 지점 모두 미입력으로, Q% 78%(경계) 진행 후 두 지점 관측값·시설 6개 전부 "점검 대상"으로 바뀌는 것과 `window.__jejuConsistency()` 어긋남 0건을 확인했다. §7-4·7-5(GIS 반복 탭 제거, 선택→상세 UX)는 이번에 구현하지 않았다 — 사용자가 다음 라운드에 요청하면 진행한다.

**2026-10-01 저염분 고수온 "e-SOP 대응" 메뉴 복원**: `aquaNav.ts`에서 2026-09-28에 주석 처리됐던 `{ to: "/aqua/response", label: "e-SOP 대응", also: ["/aqua/monitoring"] }`을 되살리고, 그걸 가리던 "경보 발송"의 임시 `also` 묶음을 제거했다. 화면·라우트·`navTabs()` 콘텐츠 연결은 원래 그대로였어서 메뉴 배열 복원만으로 끝났다. 사이드바·보드 탭 양쪽에서 정상 노출, 클릭 시 e-SOP 단계·체크리스트·실시간 모니터링 정상 표시, 콘솔 에러 없음·`window.__jejuConsistency()` 0건 확인. `build`·`build:staging`·`lint`·`node --test`(13개) 통과. 커밋 `2df8a3c`.

**2026-10-01 staging → master 병합·배포(사용자 요청 — "스테이징에 있는 내용 본 사이트에 다 덮어줘")**: `master`(`1ada039`)가 `staging`의 순수 조상이라 충돌 없이 fast-forward 병합했다(`1ada039..2df8a3c`). `master`에서 `npm run build`(스테이징 모드 아님)·`lint`·`node --test` 다시 통과 확인 후 `origin/master`에 푸시 — `Deploy to GitHub Pages` 워크플로가 1m15s 만에 success로 끝났다. 실제 서비스 주소 `https://reehpl224-lgtm.github.io/jeju-disaster-platform/`에서 배포된 번들을 직접 내려받아 이번에 병합된 기능(`e-SOP 대응`, `하천 모의 시설`, `하천 가상 인력·장비`, `Q% 가상 관측지점`, `모의 — 실제 피해접수 아님`)이 실제로 포함된 것과, 브라우저로 열었을 때 정상 렌더링·콘솔 에러 없음을 확인했다. 스테이징 전용 모의값(`IS_SIMULATION_MODE` 게이팅)은 운영 빌드에서 그대로 비활성 상태임을 디자인대로 유지한다. 이로써 staging의 모든 하천 시나리오 기능과 이번 세션의 전체 변경사항이 실제 프로토타입 사이트에 반영됐다.

**2026-10-02 종합상황 S1(화면목록) 반영 — 새 재난 3종 + 실증 3사 샘플 배치(사용자 요청)**: `TP-P21-000 화면 기능 목록` S1 항목 중 구현 가능한 부분을 스테이징에 적용했다(아직 커밋·배포 전).
- **산불·지진해일·대설**(`/wildfire`·`/tsunami`·`/snow`): 호우·태풍과 같은 틀(헤더 메뉴·서비스 스트립 카드·보드 + 상세 5화면·사이드바·결재함)로 추가. 한 정의(`src/data/mockHazards.ts`)에서 `hazardConfig()`(domainConfigs)·`HazardPages.tsx`(상세 5화면)·`hazardBrief()`(leaderBriefs)가 모두 만들어진다. 자체 관측·시나리오가 없어 경보·종료 양식은 비운 평시 상태이고, 화면 값은 기상청 특보(건조·강풍 D·W / 지진해일·해일 N·O / 대설·한파 S·C)와 **키 없는 공개 API**만 쓴다 — Open-Meteo 시간별 예보(`openMeteoApi.ts`, 산불=습도·풍속, 대설=적설·기온)와 USGS 최근 지진(`usgsQuakeApi.ts`, 동아시아 M4.5+). 둘 다 **참고 지표**일 뿐 위험등급 판정에 쓰지 않으며, 산림청 산불위험예보·기상청 지진통보가 아님을 화면에 적었다. 레거시 연계는 조사 전이라 "미연계"로만 적었다(민방위경보 `ls-5`, 교통정보센터 `ls-7`은 호우 mock에서 재사용).
- **실증 3사 샘플 배치**(`src/data/pilotBatch/`): 실증사 데이터가 붙기 전 자리 채움용 **임의 데이터**. `generate.ts`가 같은 시(hour)에 항상 같은 값을 내는 결정적 생성기이고, `npm run batch:pilot`이 `public/data/pilot-batch.json`(gitignore)을 만든다. 화면(`usePilotBatch`)은 그 파일이 있으면 쓰고 없으면 같은 생성기로 직접 만든다. **실증사 데이터가 오면 같은 모양(`PilotBatch`)의 JSON을 그 경로에 두면 교체된다.** 종합상황 우측 탭에 연결: 센서정보(하천 6개소·스마트폴), 센서 추이(수위 예측 10·30·60분·수위×조위·연안 이용객 밀집·염분/수온), AI 분석(연안 VLM 10분 요약·취수구 ETA·저염수 확산 히트맵 48/120h), 대응현황(연안 4단계·저염분 4항목 체크리스트), 상황전파(스마트폴 가용률). 확정 관측지점은 돈내코·쇠소깍뿐이고 나머지 4개소·스마트폴·취수구는 이름에 "(샘플)"을 붙였다. 하천 Q% 시나리오와는 별개 값이다.
- 그 밖: 지도 하단 상태 바에 **상황단계** 칩(서비스 전체 최고 등급, 없으면 평시)·하단 서비스 카드에 `레거시`/`실증AX` 태그·상황전파 탭의 **전파·경보 인프라 현황**(`propagationInfra.ts`)·센서 추이의 하천 Q% 차트·호우 화면에 기상청 AWS 실시간 우량 관측 연결·보드 타임라인 빈 상태 문구. 상태 바 건수와 헤더 메뉴 위험 점은 모듈 로드 때 한 번만 계산해 시나리오가 진행돼도 안 바뀌던 문제를 렌더 시점 계산으로 고쳤다. `useRiverRun`에 서버 스냅샷(3번째 인자)을 넣어 `renderToString` 테스트가 통과한다.
- **적용하지 않은 것**: 하천 2D/3D 수계 위험도·e-SOP 팝업, 연안 함덕·삼양 위험구역(AI 객체감지), 태풍 대피정보·결항정보(공개 API 없음·키 필요), 좌측 레일(홈·레이어·이력·알림 — 사용자의 "레일 탭을 늘리지 않는다" 방침), 종합상황 지역선택(도→행정시→읍면동)·시스템 스트립 "전파" 그룹.
- 검증: `build`·`build:staging`·`lint`(src 신규 경고 0)·`node --test`(13개) 통과, 로컬에서 새 도메인 3종·샘플 배치 블록·파일 없음 폴백 확인.

**2026-10-02 보드 사이드패널 정리 + 데이터 시스템 연계현황 서비스별 구성 + 상세 메뉴 순서(사용자 요청)**: ① GIS 보드(`DomainBoardPage`)에서 좌측 "데이터 수집" 탭과 우측 "연계 시스템"·"실시간 연동" 탭을 숨겼다(`config.tabs`의 `key==="data"`, `config.right`의 `legacy`·`live`를 걸러냄 — 설정 자체는 그대로 둠). "해양 관측"·"기관 현황" 같은 다른 우측 탭은 그대로다. ② 운영 > `데이터 시스템 연계현황`(`DataSystemPage`)에 서비스 선택 버튼(전체·9개 서비스, `?system=<id>`)을 넣고, 서비스를 고르면 **데이터 수집 / 연계 시스템·레거시 / 연계 시스템·외부 API / 실시간 연동** 4개 카드를 보여준다. 데이터 수집·실시간 연동 내용은 보드 설정(`DOMAIN_CONFIGS`)의 `data` 탭·`live` 우측 탭을 그대로 재사용하고, 레거시는 `LEGACY_TARGETS`(산불·지진해일·대설은 `HAZARDS[id].legacy`), 외부 API는 `API_TARGETS` 연결로 서비스별로 거른다. "전체"는 기존 화면 그대로. ③ 상세 대시보드 사이드바(`*Nav.ts`) 순서를 하천범람(`RIVER_NAV`) 기준으로 맞췄다 — "데이터 수집"을 종료 보고 뒤(맨 끝)로 이동. 없는 메뉴(출동 요청·현장 통제·시나리오 실행 등)는 새로 만들지 않았다. `DOMAINS`(domainSidebarUtils)를 export해 연계현황 페이지가 쓴다. ④ 보드에서 하천범람의 "시나리오 실행" 탭도 숨김(상세 사이드바에는 유지). ⑤ 보드 우측 **타임라인 상단에 서비스별 "특보 요약"**(`WarningsSummary`, 최대 3건 + "외 N건") — `DomainConfig.wrn.codes`(기상청 특보 종류: 호우·하천 R·W / 태풍 T / 폭염 H·K / 연안 V·O·N / 산불 D·W / 지진해일 N·O / 대설 S·C)로 거른 **최근 24시간 발표분**이며 해제 여부를 모르므로 "발효 중"이라 쓰지 않는다. 스테이징은 모의 특보라 "모의(스테이징)" 표식. 저염분 고수온은 기상청 특보 대상이 아니라 수산과학원 연동 전까지 `src/data/aquaAdvisories.ts`의 임의 샘플 1건(`*` 더미 표식, "연동 전 샘플")을 보여준다 — 연동하면 그 배열을 API 응답으로 바꾸고, 빈 배열이면 "특보 없음". ⑧ **e-SOP 대응을 운영 메뉴로 이동**(`/esop`, `EsopPage`): e-SOP(단계·체크리스트·승인)는 실증 3서비스의 개념이라 저염분 고수온에만 있던 전용 메뉴를 운영 > "e-SOP 대응"으로 옮기고 저염분 사이드바·보드 좌측 탭에서는 뺐다(`AQUA_NAV`에서 제거, `/aqua/response` 경로는 유지하고 "경보 발송"의 `also`로 묶음 — 팀장 브리핑 링크·일관성 검사가 경로를 찾음. 같이 묶여 있던 "실시간 모니터링"(`/aqua/monitoring`)은 독립 메뉴로 올려 경보 발송 뒤에 둠 — 보드 좌측 탭에도 나옴). 화면은 서비스 선택 버튼(`ServicePills` — 데이터 시스템 연계현황과 공용) + 전체 적용 현황 표: 저염분은 기존 `AquaResponsePage`를 `embedded`로 그대로, 저염분·하천범람·연안 3개는 **같은 공통 구성**(`EsopStatusView`)을 쓴다 — 머리말(서비스명 + 처리 화면 링크) · 현재 재난 상황(공통 줄: 위험 등급·감지 시각·발생 위치 + 서비스 고유 지표) · 진행 단계 요약(관심→주의→경계→심각→해제 트래커) · 단계별 대응 절차(기준표의 단계별 기준·조치 카드 + "조치 체크리스트 — 현재 단계") · 담당 기관(기관/역할/승인/수행) · 다음 단계 안내(전환 기준·해제 조건·미완료 건수). 서비스에 없는 값(조치 문구·체크리스트·해제 조건)은 같은 자리에 "조치 문구 미확정"/"데이터가 없습니다."/"해제 조건 미정"으로 비워 두고 데이터가 들어오면 그 자리에 채워진다. 저염분은 `AquaResponsePage`가 이 공통 구성에 자기 데이터(염분·수온 기준 5단계, 체크리스트 + 재확인 버튼, 기관 표)만 넣는 얇은 래퍼이고 `/aqua/response` 경로는 그대로다. 하천(`riverStageCriteria`·`riverSopStage` 시나리오 연동·`riverJointAgencies`·`riverClosure.closureConditions`)·연안(`coastStageCriteria`·`coastEventDetail`·`coastAgencyStatuses`·`coastClosure.closureConditions`)은 `EsopPage`에서 어댑터로 넣는다. 승인·발송 버튼은 복제하지 않고 각 서비스 처리 화면 링크로 이동한다. 저염분 진행 단계 부제에 있던 "담당: 최경보" 문구는 공통 부제로 바꾸며 뺐다. 나머지 6개는 "e-SOP 해당 없음(레거시 상황 뷰)". 통합 결재함은 "지금 처리할 결재·지시", e-SOP 대응은 "단계·절차 현황"으로 역할을 구분한다. 레거시 서비스에 e-SOP 단계를 임의로 만들어 넣지 않았다. ⑦ 비어서 틀이 안 보이던 우측 탭에 **임의 샘플** 표시 — 태풍 "해양 관측"(`Buoys`)·폭염 "무더위쉼터"(보드 대시보드 탭 포함). 샘플은 `src/data/placeholderSamples.ts`에 있고, 원본(`mockKhoaBuoy.ts`·`mockHeat.ts`)이 비어 있을 때만 보이며 "* 샘플 데이터 — 실데이터 연동 전 임의 값" 안내(`SampleNote`)와 이름 끝 "(샘플)"이 붙는다. 원본에 값이 하나라도 들어오면 샘플은 자동으로 사라진다. 상세 대시보드(`HeatHomePage`·`TyphoonHomePage`)의 같은 항목은 아직 비어 있다. ⑥ 우측 첫 탭 이름을 9개 서비스 모두 "타임라인"으로 통일(태풍 "기상청 발표"·저염분 "모니터링 이벤트"·연안 "이벤트" → 태풍 항목 첫 줄에 "기상청 발표 ·" 접두어로 출처 유지).


**2026-10-02 하천범람 "실시간 모니터링" 메뉴 추가 + 승인 화면 안내 정정(사용자 요청)**: ① 하천 승인 버튼은 "경보 발송"(경보 승인 — 판단·경보 단계 함께 완료)과 "출동 요청"(출동 승인 — 대응 단계 시작) 두 곳에만 있고 "현장 통제"에는 없는데, 하천 상세 홈의 "e-SOP 단계 승인으로 이동"·e-SOP 대응 화면의 "현장 통제(단계 승인)"가 현장 통제로 안내하던 걸 정정했다(홈 카드는 경보 승인/출동 승인 두 링크, e-SOP 대응 링크는 경보 발송·출동 요청·현장 통제·실시간 모니터링). 현장 통제는 흐름의 별도 단계가 아니라 "대응" 안에서 출동과 병행되는 집행 현황이다. ② `RIVER_NAV`에 "실시간 모니터링"(`/river/monitoring`, `RiverMonitoringPage`)을 현장 통제 뒤·종료 보고 앞에 추가(저염분 실시간 모니터링·연안 현장 모니터링과 같은 자리 — 보드 좌측 탭에도 나옴). 효돈천 AIoT 계측망 실데이터가 아직 없어 관측점 6개소·스마트폴·수위 예측곡선·수위×조위는 실증 3사 샘플 배치(`pilotBatch`)의 임의 값을 그대로 쓰고(블록마다 "(샘플)"·"실증사 연계 전 임의 데이터" 표시) 우량 관측만 기상청 API허브 실연동이다. 실증사 데이터가 오면 `public/data/pilot-batch.json`을 같은 모양으로 두면 이 화면도 같이 바뀐다.


**2026-10-02 저염분 고수온 "영향 대상" 확장 — 양식장 외 마을어장·연안 생태(사용자 요청)**: 저염분·고수온은 양식장 말고도 마을어장 수산생물(소라·전복·홍해삼 — 2016년 서귀포 안덕·대정, 제주시 한경 다량 폐사)과 연안 생태(문섬·범섬 연산호 주저앉음 — 2024, 고수온·저염분 동시 노출 가능성 제시), 해조류 서식처(갯녹음, 장기 수온 상승)에도 피해가 간다(언론 보도 기준 — 수과원·해양수산연구원 원자료는 확인 전, 근거 링크는 영향 대상 화면의 "참고 사례" 카드). 반영: ① "영향 양식장" 메뉴를 **"영향 대상"**(`/aqua/farms`, 경로 유지)으로 바꾸고 화면에 양식장 / 마을어장 / 연안 생태 세 탭(`?target=`)을 둔다 — 양식장 탭은 기존 그대로, 보드 "영향 대상" 탭에도 두 그룹이 붙는다. ② 마을어장·연안 생태 목록은 `src/data/aquaImpactTargets.ts`의 **임의 샘플**(이름 "(샘플)", 화면에 `*` 더미 표식) — 마을어장 위치(어촌계)·연산호 군락 위치 실자료를 받으면 그 배열을 교체. 양식장 집계(`aquaFarmTotals`·`aquaSummary.affectedFarms`)와 일관성 검사에는 섞지 않았다. 생물별 임계값은 협의 전이라 양식 기준 5단계(`classifyMarineRiskLevel`)를 그대로 적용하고 화면에 그렇게 적었다. ③ 과거 사례(2016·2024) 3건을 "참고 사례" 카드로 표시(연산호는 인과 확정이 아니라 "가능성 제시"로 표기). ④ 경보 수신·협력 대상에 **수협·어촌계** 추가 — 담당 기관 표 2행(역할 "협의 전"), 경보 초안의 전파 채널 "수협·어촌계 전파(협의 전)"·수신 대상 요약 "어업인 전파(수협·어촌계)". ⑤ 샘플 배치(종합상황 대응현황)의 저염분 체크리스트에 "마을어장·연안 생물 예찰 강화(수협·어촌계)"를 넣어 5항목으로(`npm run batch:pilot`으로 다시 생성해야 로컬 JSON에 반영). 시나리오가 채우는 `aquaChecklist`는 평시에 비어 있는 그대로다. 보건(비브리오)·해수욕·해파리는 이번 범위가 아니라 연안 안전관리 연계 후보로 남겼다.


**2026-10-02 헤더 메뉴(☰) 항목 축소(사용자 요청)**: 서비스 9 + 운영 9로 항목이 늘어 메뉴가 화면 높이를 넘어 스크롤이 생겨, `.menu li a`·`.menu__action`의 글자를 14px → 13px, 상하 여백을 8px → 5px로 줄였다(메뉴 높이 약 795px → 653px). 아주 낮은 화면에서도 페이지 스크롤이 생기지 않게 `.menu`에 `max-height: calc(100vh - 72px); overflow-y: auto`를 넣어 넘치면 메뉴 안에서만 스크롤되고, 그 스크롤은 공통 스크롤 디자인(`.tree`·`.content`·`.panel__scroll`과 같은 6px 얇은 막대·투명 트랙·연한 썸)을 쓴다. 메뉴 항목을 더 늘릴 땐 이 높이를 다시 확인할 것.

**2026-10-03 앱 폰트를 Noto Sans KR로 통일·포함 배포(사용자 요청, 로컬 확인 전)**: 기존 `--font-sans`는 `-apple-system, BlinkMacSystemFont, "Pretendard", "Malgun Gothic" …`였고 폰트 파일을 앱에 넣지 않아 보는 PC에 Pretendard가 설치돼 있을 때만 쓰였다(Mac은 시스템 폰트가 먼저, Windows 미설치 PC는 맑은 고딕) — PC마다 다르게 보였다. 이제 `@fontsource-variable/noto-sans-kr`(가변 폰트, 한글 조각 124개를 필요한 만큼만 내려받음, 인터넷 CDN 없이 앱과 함께 배포 → 내부망에서도 같음)을 `main.tsx`에서 import하고 `--font-sans`를 `"Noto Sans KR Variable", "Noto Sans KR", "Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif`로 바꿨다. 숫자 폭은 기본이 이미 고정 폭이라 `tabular-nums`는 넣지 않았다. 빌드 산출물에 woff2 124개(약 5.6MB, 처음엔 쓰는 조각만 로드)가 포함된다. Figma 시안의 글자 스타일도 Noto Sans KR로 맞췄다.

---

**2026-10-07 외부 연계 명세서 검토·초단기실황 부착(사용자 요청, 커밋·배포 전)**: `AX실증_외부연계대상명세서_v1.0.0_261006.pdf`(28건)를 앱 실연동과 비교해 `docs/external-api-attach-review-2026-10-07.md`에 판정했다. Vercel 프록시 환경변수는 `KMA_APIHUB_KEY`·`KMA_SERVICE_KEY` 두 개뿐이라 키가 없는 SAFETY·SAFEMAP·JEJUITS는 붙이지 못한다. 이번에 EXT-KMA-001(초단기실황)을 `vercel-proxy/kma-weather-proxy/api/ultra-ncst.ts`·`lib/ultraNcst.ts`로 추가하고, 종합상황 '제주도 · 현재 날씨'(기존에 "관측값 없음")를 `src/data/useLiveWeather.ts`로 채웠다(실패하면 기존 표시로 복귀, 시나리오 시계용 `currentWeather.observedAt`은 그대로). 실제 기상청 응답은 프록시 배포 후에야 확인되며, 로컬 화면 확인은 가짜 프록시 응답으로만 했다. 명세서 KHOA-002의 URL은 KHOA-001과 같게 적힌 오기로 보인다.

**2026-10-07 생활안전지도(safemap) 하천범람지도·침수흔적도를 GIS 지도 레이어로 연결(커밋·배포 전)**: 사용자가 키를 등록한 뒤 같은 키(`97Y1UYC7-…`)로 `openapi2/IF_0100_WMS`(하천범람지도 지방하천)·`IF_0092_WMS`(침수흔적도) 모두 PNG가 온다(이전엔 코드 30). 두 레이어 모두 EPSG:3857·4326을 지원하고 제주 일대에 실제 데이터가 있다(하천범람은 하천변에 드문드문, 침수흔적은 해안·중산간에 넓게). 키를 브라우저에 보이지 않으려고 프록시 `api/safemap-wms.ts`(환경변수 `SAFEMAP_KEY`, 요청 범위·크기 검증은 `lib/safemap.ts`)가 타일을 대신 받고 하루 캐시한다. 앱은 `JejuTileMap`의 '재난위험도' 모드에서 라디오 '하천위험지도'→하천범람지도, '침수이력'→침수흔적도를 `WMSTileLayer`로 올린다. 로컬에서 같은 `lib`와 실키로 만든 대리 프록시로 두 레이어 타일 9장씩 로드를 확인했다. **프록시를 배포하고 Vercel에 `SAFEMAP_KEY`를 넣기 전에는 배포본에서 레이어가 나오지 않는다**('프록시 주소가 없어'가 아니라 502). 이 키도 신청서에 IP가 있을 수 있어 Vercel에서 통할지는 배포 후 확인해야 한다.

**2026-10-07 무더위쉼터(행정안전부 DSSP-IF-10942) 반영(커밋·배포 전)**: 사용자가 safetydata 서비스키를 줬다. 이 키는 무더위쉼터 하나에만 승인돼 있고(다른 DSSP API는 코드 20 서비스 접근거부 — API마다 신청 필요), 신청서에 호출 IP(221.143.73.254)가 적혀 있어 Vercel 프록시(IP 불특정)에서는 막힐 수 있다. 그래서 앱이 호출하지 않고 `scripts/fetch-heat-shelters.mjs`(환경변수 `SAFETYDATA_KEY`)로 전국 61,863건 중 제주 786곳(제주시 535·서귀포시 251, 정원 없는 151곳은 `capacity: null`)을 `public/data/heat-shelters.json`에 받아 두고, `src/data/heatSheltersLive.ts`가 시작할 때 읽어 비어 있던 `heatShelters`를 채운다(폭염 대시보드·보드의 '무더위쉼터' 탭·폭염 브리핑 KPI). 시설 유형은 이름 기준(경로당·마을회관·복지관·기타). 화면에는 앞 60곳(보드 40곳)만 그리고 검색·지역으로 좁힌다. 같은 날 받은 '생활안전정보' 키(`97Y1UYC7-…`)는 safemap openapi2 WMS(IF_0100·IF_0092, 레이어 A2SM_FLOODFOVRRISK2)에서 코드 30(서비스키 미등록)이라 침수·범람 지도 레이어는 못 붙였다. AI Hub 키는 `제주AX프로젝트/데이터/aihubshell`로 데이터셋 목록 조회만 했고(내려받기는 하지 않음) 앱 연동 대상이 아니다.

**2026-10-07 해양조사원(KHOA) 조위·부이 실연동 코드(커밋·배포 전, 실응답 미확인)**: 사용자가 data.go.kr에서 KHOA 5개 서비스(실측 파랑·부이 최신·조위 수온·조위 기온·조위 최신)를 활용신청했지만 같은 키로 호출하면 서비스키 미등록(코드 30)이 왔는데, **키·승인 문제가 아니라 호출 주소 오류였다**(오픈API 활용가이드 확인, 2026-10-07): 가이드의 호출 주소는 `…/dtRecent/GetDTRecentApiService`까지이고 뒤에 오퍼레이션명(`/getDTRecentApi`)을 붙이면 키가 맞아도 코드 30이 온다(없는 서비스명은 코드 12). 부이도 `twRecent/GetTWRecentApiService`로 정상 응답을 확인했다. 응답은 `response`로 감싸지 않고 `header`·`body`로 바로 오고, 경도 필드는 `lot`(명세서 `iot`는 오기), 부이 염분은 `slnty`(조위관측소는 `slntQty`)다. 그동안 `vercel-proxy/kma-weather-proxy/api/khoa.ts`·`lib/khoa.ts`(모슬포 DT_0023 조위 + 중문 TW_0075·제주해협 KG_0028·제주남부 KG_0021 부이, 하루치 1시간 간격에서 최신값)와 앱 `src/data/khoaLive.ts`·`khoaMapping.ts`를 만들었다. 2026-09-29에 비워 둔 `khoaBuoyMarineConditions`·`khoaLiveObservations`·`khoaMoseulpoTide`를 시작할 때 채우고(값이 없는 관측점은 뺌), 카드 표식을 스냅샷→실시간으로 바꾸고, 이 배열을 읽는 화면(연안·저염분·하천 분석·태풍·서비스 보드)이 도착하면 다시 그려진다. 가짜 프록시 응답으로 화면을 확인했고, 4개 관측소 실응답으로 필드명과 화면 배열 변환을 확인했다(프록시 재배포 필요). 이안류·실측 파랑·조위 실측 수온/기온은 붙이지 않았다.

**2026-10-07 시나리오 기능 전체 제거(사용자 요청 — 로컬·스테이징·프로토타입 모두)**: "시나리오가 아닌데 시나리오라고 나오는 것"이 헷갈린다는 요청으로 시작해, 사용자가 "전체적으로 시나리오 아예 빼줘"로 범위를 정했다. 앞으로는 시나리오 대신 임의의 데이터를 넣어 확인하는 방식으로 가고, 그 확인 방식은 아직 정하지 않았다(지금은 `/dummy-data` 수집상태 엑셀 업로드만 남아 있다). 제거한 것: ① 시나리오 선택·초기화(`scenarios.ts`, 데모 데이터 팝업의 '시나리오' 구역) ② 하천 시나리오 실행(`RiverScenarioPage`·`/river/scenario` 경로·사이드바 '시나리오 설정' 구분, `riverRunState`·`riverRunHooks`·`riverScenarioObservations`·`riverTimelineWorkbook`·`riverFlowRatioAnalysis`·`riverMockImpact`·`mockRiverResources`, `types/riverRun.ts`, 엑셀 템플릿 `하천_시나리오_시간별입력_템플릿.xlsx`, 테스트 2건과 픽스처, 경보·출동 '담당자 승인' 카드, 대시보드의 Q% 추이·가상 관측지점·가상 자원·모의 시설) ③ 스테이징 '모의 재난대응' 모드(`appEnv.ts`의 `IS_SIMULATION_MODE`·`scopedKey`, 헤더 배지, '모의(스테이징)' 표식 `SIMULATED`) — 이제 스테이징도 특보·강우·해양·태풍을 프로토타입처럼 실호출한다. `build:staging`은 Vercel 배포 경로(`base: /`, `dist-staging`)를 위해 그대로 두며 `VITE_DATA_MODE`는 더 이상 읽지 않는다. `scenarioClock.ts`는 시나리오가 아니라 남은 더미 데이터의 시각을 현재로 옮기는 장치라 `dummyClock.ts`(`dummyTime`·`DUMMY_NOW`)로 이름만 바꿨다. 화면 문구의 '시나리오 더미(데이터)'는 '더미(데이터)'로 바꿨다. 회의 자료에서 온 '함덕·협재 해수욕장 시나리오'(대응 시나리오)는 앱 기능이 아니라 사업 내용이라 그대로 뒀다. 하천 mock(`mockRiver.ts`)은 평시 빈 상태 그대로다(경보·출동·종료 화면은 비어 있다). `demo10.css`의 `.demo-scn`·`.demo-reset` 규칙은 쓰는 곳이 없어졌지만 다른 작업자의 CCTV 수정이 같은 파일에 있어 건드리지 않았다.

**2026-10-07 종합상황 좌·우 사이드패널을 Figma 디자인대로 로컬 반영(사용자 요청, 커밋·배포 전)**: Figma `5uPHoWfOjXVz3hyGz1Uw3B` "1단계 · 종합상황 좌·우 사이드패널"(L1~L4·R1~R8·R00)을 `/dashboard` 종합상황에 구현했다. 패널은 `src/components/sidepanel/*`(스타일 `src/styles/sidepanel.css`, 접두어 `sp-`)에 새로 만들고 `DashboardPage.tsx`는 탭 정의·좌측 제목·우측 패널 교체만 바꿨다. 좌측 4탭(타임라인·발효중 특보·동네예보·실시간 특보)은 GIS 우측 패널과 같은 컴포넌트를 쓴다. 우측은 가로 탭 10개(상황전파·센서정보·센서 추이·대응현황·담당자·보고서·자산현황·AI 분석·방재메신저·안전뉴스)이고 방재메신저·안전뉴스는 2단계 예정 안내다. 데이터는 실제로 받을 수 있는 것(기상청 특보·태풍·동네예보·초단기실황, 담당자 목록, 보고체계)은 실데이터, 없는 것은 임의 데이터(샘플)로 채우고 화면에 "샘플" 표식을 붙인다. **샘플은 `src/data/sidePanelSamples.ts` 한 파일에만 둔다** — 위치별 표는 `docs/sidepanel-data-map-2026-10-07.md`. 좌측 사건 목록은 `useSidePanelEvents`가 모으며 실데이터가 하나라도 있으면 샘플을 쓰지 않는다(섞지 않음). 입력 패널은 아직 만들지 않았고 설계 여부를 사용자와 논의할 차례다. 같은 작업 트리에서 다른 작업자가 CCTV 화면 파일을 수정 중이라(`cctvLive.ts`·`mockCctv.ts`·`demo10.css`·`types/domain.ts`, `DashboardPage.tsx`의 CCTV 부분) 커밋할 때 섞이지 않게 별도 worktree로 만든다.

**2026-10-07 사이드패널 표시 규칙·입력 패널(센서·대응 단계, 브라우저 저장) 추가(사용자 요청, 로컬·커밋 전)**: ① 우측 패널 제목 위치를 좌측과 같게(제목 줄 → 탭 줄, 모든 탭 제목 = 탭 이름, 방재메신저·안전뉴스만 "예정 기능"). ② 표시 규칙: **데이터가 있으면(0건·빈 값이어도) 그 값 그대로, 데이터가 없을 때만 샘플 + "샘플" 표식 필수.** 그래서 좌측 L1·L2·L4는 기상청 특보·태풍을 하나라도 받았으면 샘플을 쓰지 않는다(받았는데 0건이면 "0건/없음", 둘 다 못 받았을 때만 샘플; L4는 특보 수신 실패 시 오류 카드). ③ 입력 패널 `/panel-input`(헤더 메뉴 "패널 입력", `src/pages/PanelInputPage.tsx`): 센서정보·센서 추이·대응현황의 값을 직접 넣으며 **이 브라우저 localStorage(`jeju-ax-panel-input`)에만 저장**(즉시 저장, 다른 PC에는 안 보임). 영역(센서 수집 상태·서비스별 센서·확인 필요 센서·추이 지표·서비스별 대응 단계·조치 목록·기관/대응팀)마다 따로 "직접 입력 시작(샘플 값으로 채움)"/"샘플로 되돌리기"가 있고, 입력한 영역은 입력값 그대로(빈 칸은 '—'/정보 없음)+"입력값" 표식, 안 한 영역은 샘플+"샘플" 표식. 저장소는 `src/data/panelInput.ts`, 타입·순수 계산은 `src/data/panelInputLogic.ts`(테스트 `tests/panelInput.test.mjs`). 서비스가 늘면 `SERVICES`에 한 줄만 더하면 입력 화면과 타일이 같이 늘어난다. 자산현황(R7)·AI 분석(R8)·상황전파 수단(R1)은 아직 입력 패널이 없다(샘플). 위치별 표는 `docs/sidepanel-data-map-2026-10-07.md`.

**2026-10-07 행정안전부 API 8종 검토·반영 + 환경별 표시(사용자 요청)**: 재난안전데이터공유플랫폼 8종을 모두 호출해 봤다(이 PC에서는 전부 정상). **반영 3건**: ① 긴급재난문자(DSSP-IF-00247) → 종합상황 L1·L2 재난문자 — 처음엔 Vercel 프록시(`/api/disaster-msg`)로 만들었으나 **Vercel IP에서 키가 "32 등록되지 않은 IP"로 거부돼** 사용자가 2번(받아 둔 파일)을 골랐다. 지금은 `scripts/fetch-disaster-msgs.mjs`(환경변수 `SAFETYDATA_KEY_00247`, 마지막 두 쪽만 받아 제주만 추림)가 `public/data/disaster-msgs-jeju.json`을 만들고 `src/data/disasterMsgApi.ts`가 읽는다. **문자는 새로 오므로 스크립트를 다시 실행해 파일을 갱신·배포해야 최신이 된다**(화면에 스냅샷 기준일 표시). 프록시 쪽 코드는 삭제했고 Vercel에 넣은 `SAFETYDATA_MSG_KEY`는 쓰이지 않는다. ② 민방위 대피소(00195)·지진 옥외대피장소(10943)·수용(구호) 시설(00008) → R7 자산현황 '대피·수용 시설' — `scripts/fetch-shelters.mjs`(서비스 번호별 `SAFETYDATA_KEY_<번호>`)로 받아 둔 `public/data/shelters-jeju.json`(제주 492·187·204곳)을 `src/data/sheltersJeju.ts`가 읽는다. 지진해일 긴급대피장소(10944)·지진 대피장소(00706)는 **제주 자료 0건**(부산·울산·경북·강원 등만 수록)이라 "자료 없음". **미반영**: 해양사고 발생이력(00147 — 2023년까지의 과거 이력), 소방출동지령(10212 — 시각·플래그뿐, 위치·종류 없음). 수용 인원은 겹쳐서 합계를 내지 않는다. **환경별 표시**: 스테이징(`vite --mode staging`, `useSidePanelEvents.ts`의 `IS_STAGING`)은 좌측 L1·L2·L4가 **항상 샘플**(레이아웃 확인용), 프로토타입·로컬은 **현재 데이터가 있으면 그 값**(0건이면 0건)이다. 키는 저장소·문서에 쓰지 않았다. 상세 표는 `docs/sidepanel-data-map-2026-10-07.md`.

**2026-10-07 제주시 감시 CCTV 3종 연동(사용자가 data.go.kr 서비스·인증키 전달, 커밋·배포 전)**: 월파 19·하천 62·적설 10대(`6510000/waveoverCctvInfoService·riverCctvService·snowfallCctvService`, 오퍼레이션 `getWaveoverCctvList·getRiverCctvList·getSnowfallCctvList`)를 `vercel-proxy/kma-weather-proxy/api/cctv.ts`(키 `DATA_GO_KR_KEY`, 없으면 `KMA_SERVICE_KEY`)로 합쳐 받아 `src/data/cctvLive.ts`가 `cctvCameras`에 채운다(기존엔 빈 목록). `CctvCamera`에 `domain: "snow"`, `operator: "제주시"`, `streamUrl?`를 추가했고, 제주시 카메라는 `useYn`만 있어 "연결/오프라인" 대신 "사용/미사용"으로 표시한다(`cctvStatusLabel`). 영상(HLS)은 `http://IP:1935` 주소라 HTTPS 화면에서 직접 재생할 수 없어, 사용자가 A안(프록시 중계)을 골라 `api/cctv-stream.ts`(허용 서버·경로를 `lib/hlsProxy.ts`에 고정, 재생목록 주소를 프록시 주소로 다시 써 줌)로 중계하고 `src/components/ui/CctvPlayerHost.tsx`가 재생 창을 띄운다(Safari는 직접, 그 밖에는 `hls.js`를 재생할 때만 내려받는 별도 청크 — 의존성 `hls.js` 추가). 재생 버튼은 CCTV 탭 카드·지도 팝업·서비스 보드 '관련 CCTV'에 있다. 프록시는 2026-10-07 사용자 승인으로 Vercel 프로젝트 `kma-weather-proxy`에 배포했고(`/api/ultra-ncst`·`/api/cctv`·`/api/cctv-stream` 실응답 확인 — CCTV 91대, 영상 조각 약 0.4MB/15초), 앱(스테이징·프로토타입)은 아직 배포하지 않았다. 열린 중계 위험은 허용 서버 고정으로 줄였지만 인증은 없다. 사용자가 채팅에 준 인증키는 저장소에 넣지 않았다. data.go.kr 키는 기상청에는 승인돼 있고 해양조사원(KHOA)은 활용신청 전이며 safetydata에는 통하지 않는다(실호출 확인).

## 1. 프로젝트 성격 — 반드시 지킬 것

이 프로젝트는 **1차년도 진행을 위한 프로토타입**입니다. 실사용자 요구사항이 아직 확정되지 않은
상태에서, 기획자가 화면을 눈으로 보면서 "무엇이 필요한지"를 미리 점검하기 위한 용도입니다.

- 모든 데이터는 **더미데이터**입니다. `src/data/mock*.ts` 안의 값은 실제 관측값이 아닙니다.
- 실제 백엔드 API·인증 서버·GIS 서버 연동이 없습니다. 인증은 `localStorage` 기반 목업입니다(`src/data/mockAuth.ts` — **아무 값이나(비워도) 로그인됨** — `guest`만 권한 없음 체험 계정, 그 밖의 값은 팀장(`jeju-ax`) 계정. 비밀번호·OTP는 검증하지 않음. 안내 문구는 `DEMO_ACCOUNTS`에서 만들어 실제 동작과 어긋나지 않게 함).
- **정확도 경쟁이나 실시간 연동이 목표가 아니라 "업무 흐름 검증"이 목표**입니다. 화면에 예쁜 숫자를
  넣는 것보다, 담당자가 위험 근거를 이해하고 판단할 수 있는 구조가 더 중요합니다.
- 새 기능을 추가할 때 **과설계하지 마세요.** 지금 필요한 화면 범위를 넘어서는 인증 체계, 실제 API
  연동, 대규모 상태관리 라이브러리 등을 미리 깔지 않습니다.

### 화면 표기 — "*" = 실제로 가져올 수 없는 완전 가상 더미데이터 (2026-09-28, 사용자 요청)

> 2026-10-07 사용자 요청: 시나리오 기능이 아닌 값에 '시나리오'가 붙어 헷갈려, 화면 문구('*' 툴팁·데모 데이터 안내·상단 메뉴)의 '시나리오 더미(데이터)'를 '더미(데이터)'로 바꿨다. '시나리오'는 하천 시나리오 실행처럼 실제 시나리오 기능에만 쓴다.

화면의 모든 카드/섹션 제목 앞에 붙는 `*`는 **"실제로 연동해서 가져올 수 없는, 완전히 지어낸 시나리오
더미데이터"**라는 뜻입니다. 아래 3곳의 공용 컴포넌트에 `dummy?: boolean` prop으로 구현돼 있고, 마우스
오버 시 같은 문구가 툴팁으로 뜹니다.

- `Card`(`src/components/ui/Card.tsx`) — `<Card dummy title="...">`
- `Group`(`src/components/board/PanelParts.tsx`, `/dashboard`·도메인 워크플로 페이지의 `domainConfigs.tsx`에서 사용) — `<Group dummy title="...">`
- `DockTab`(`src/components/board/BoardParts.tsx`, `SideTabsDock`/`HorizontalTabsDock`) — 탭 객체에 `dummy: true`

**`*` 표시 여부 판단 기준** (전체 앱에 이미 일괄 적용 완료 — 새 카드/탭을 추가할 때 이 기준을 그대로 따르세요):
- **`*` 표시 안 함(실제 값)**: 기상청 단기예보·특보·해양관측·태풍정보 등 **매 조회마다 실제 API를
  호출하는 패널**(`VilageForecastPanel`/`WarningsPanel`/`MarineObservationPanel`/`TyphoonNowPanel`/
  `TyphoonNameListPanel`/`RainfallObservationPanel`), **KHOA 실측 정적 스냅샷**(`khoaLiveObservations`/
  `khoaBuoyMarineConditions`/`khoaMoseulpoTide` — 실제 값이지만 자동 갱신은 안 됨), **공식 문서 기준
  임계값/기준표**(TP-P22_002 위험단계 상태 구간 등 — 수치 자체가 실제 정책 기준), **실제 면담·발표자료
  근거의 연계 현황 보고**(`legacySystems`, `/pilot-status`의 서비스별 구현현황 — 새 수치를 지어내지 않고
  근거 문서를 그대로 반영한 것), 스타일가이드(`/styleguide`, 데이터가 아니라 컴포넌트 쇼케이스).
- **`*` 표시함(더미)**: 그 외 전부 — 센서 현재값·경보 발송 이력·AI 신뢰도/판단 근거·사건 타임라인·
  e-SOP 진행상태·시설 목록(무더위쉼터 등)·API 응답속도/장애 시뮬레이션(`apiLinks`,
  `MonitoringPage`·`DataSystemPage`의 "외부 API 연계 현황"은 API 자체는 실재해도 응답속도·상태 배지가
  가짜라 더미) 등. `PlanItemsCard`(계획/로드맵 항목 나열, 이미 "계획"이라는 맥락이 명확함)는 이 표기
  대상에서 제외했습니다.

새 카드나 탭을 추가할 때 위 기준으로 판단해 `dummy` prop을 붙이세요 — 애매하면 "실시간으로 다시
불러왔을 때 지금과 다른 값이 나올 수 있는가"로 판단하면 됩니다(그렇다면 `*` 표시 안 함, 코드를 다시
실행해도 그 자리에서 늘 같은 지어낸 값이면 `*` 표시).

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
  `제주AX프로젝트/화면설계/TP-P22_002_플랫폼 데이터 리스트.xlsx` 저염분수·고수온 시트 "상태 구간 설정" — 2026-09-22 사용자 확정.
  3개 서비스 모두 이 파일의 상태값을 따른다. 실증사 발표자료의 4단계 체계는 채택하지 않음):
  - 5단계: 정상/관심/주의/경보(→앱 라벨 '경계')/심각(→앱 라벨도 동일하게 '심각')
  - 염분: 정상 ≥30.0psu · 관심 28.0~30.0 · 주의 26.0~28.0 · 경계 24.0~26.0 · **심각 <24.0psu**
    (원본 복합 조건 컬럼은 정상을 31.0으로 적고 있어 불일치 — 구간 컬럼 30.0 적용)
  - 수온: 정상 ≤25.0℃ · 관심 25.1~27.9℃ · 주의(28.0℃ 도달) · 경계(28.0℃↑ 1~2일 지속) ·
    **심각(28.0℃↑ 3일 이상 지속)**
  - 복합 규칙: 수온≥28.0℃ AND 염분≤26.0psu → 무조건 심각 / 수온≥28.0℃ AND 염분≤28.0psu →
    최소 경계(경보) / 수온 26.0~28.0℃ AND 염분≤28.0psu → 최소 주의로 승격
  - 새 양식장 더미데이터를 추가/수정할 때는 반드시 `classifyMarineRiskLevel()` 함수로 등급을 계산해서
    넣으세요. 손으로 등급을 지어내면 위 임계값과 어긋납니다. 온도만 있고 지속일수 정보가 없는 경우
    함수 기본값(0일=방금 도달)이 적용되므로, 장기 지속을 표현하려면 `classifyTemperature(temp, days)`를
    직접 호출해 확인 후 등급을 정하세요.
  - **2026-09-08 정합성 점검**: `AquaFarm`에 `tempSustainedDays?: number` 필드를 추가했습니다. 온도
    단독 관측 양식장(예: 대정 일과 넙치 — 온도 30.5℃)의 등급을 "심각"으로 두려면 실제로
    `classifyTemperature(30.5, 3)`처럼 지속일수 3일 이상이 필요한데, 이 값이 코드 주석에만 있고
    화면 어디에도 없어서 담당자가 왜 심각인지 확인할 수 없던 문제를 고쳤습니다 — 이제
    `tempSustainedDays`를 데이터에 채우고 목록/상세 화면에 "(지속 N일째)"로 노출합니다. 같은 점검에서
    `aquaSummary.temperatureLevels`(수온 단독 임계값 표, 염분의 `salinityLevels`와 대칭)도 새로 추가해
    `/aqua` 홈에 노출했습니다 — 이전엔 염분 임계값만 보이고 수온 임계값은 어디에도 없었습니다.
  - **GIS 지도 마커 3개 vs "영향 양식장" 24개소가 다른 이유** (2026-09-08, 사용자 질문으로 확인):
    `riskMarkers`(GIS 지도, `mockDashboard.ts`)의 아쿠아 마커는 위 확정 관측지점 **3곳**(한경 금등·한경
    용수·대정 일과)만 표시합니다 — 센서가 실제로 설치된 위치이기 때문입니다. 반면 `aquaFarmTotals.total`
    (24개소)은 그 3곳에서 감지된 저염분수·고수온이 확산돼 영향을 받는 한경·대정 지역 내 **개별
    양식장 수**로, 서로 다른 개념이라 지도 핀 개수와 다른 게 정상입니다. 다만 실제 개별 데이터
    (`aquaFarms`)는 24개소 중 **7개소만** 존재하고 나머지 17개소는 이름 없이 집계에만 있어서, `/aqua/farms`
    목록이 총계보다 적게 보이는 진짜 불일치가 있었습니다 — 사용자가 "대표 사례로 명시"를 선택해 목록
    제목·GIS 자산현황 패널에 "대표 N개소 (전체 24개소 중)"로 표기하도록 고쳤습니다. 나머지 17개소를
    실제로 채워 넣거나 총계를 7로 낮추는 방안은 선택하지 않았으니, 필요해지면 사용자와 다시 상의하세요.

> **2026-09-15 착수보고회 회의록 반영 (사용자 확정)**: ① 저염분수 데이터 소스를 회의 기준(GOCI-II·SMAP 위성, ROMS·NEMO 수치모델(회의록 RAMS 표기는 발표자료 기준 ROMS로 정정), 관측부이)으로 정정하고 저염분수 화면에 섞여 있던 하천·연안 소스(AI CCTV, 수위센서, 강우레이더, 침수 격자, 현장 수동 관측)는 삭제. ③ 하천 인프라·선행시간 표기 수정. 연안 협재는 회의에서 시나리오가 거론되지 않았을 뿐 확정 대상이라 유지.

> **실증서비스 구현 현황 화면 추가 (2026-09-22)**: `/pilot-status`(헤더 ☰ 메뉴). 3대 실증서비스 기능별로 `구현(시연)/1차년도 가능/조건부/2차년도 이후` 상태와 데이터 출처(실연동 API·레거시 연계·신규 인프라·실증사 보유·시연용 더미), 서비스별 레거시 활용, 운영 전 확정 필요 사항을 표시. 데이터는 `src/data/mockPilotStatus.ts` — 근거는 착수보고회 회의록·실증 3사 발표자료·현업 면담·데이터 리스트 점검 문서이며 새 수치를 만들지 않음. 저염분수·고수온은 도 레거시 시스템 중 직접 연계 대상이 없고(공공 API 중심), 연안은 레거시 학습 데이터가 없어(모의 데이터로 검증) 그대로 "해당 없음/없음"으로 표기함 — 연계된 것처럼 바꾸지 말 것. `/river/analysis`의 "AI 범람 예측 출력 항목" 카드 값은 소다시스템 발표자료의 NGSI-LD **예시값**(ETA 30분, 신뢰도 88.5% 등)이며 효돈천 현재 값이 아님.

> **실증 3사 착수보고 발표자료 판독 결과 (2026-09-22)**: PDF 슬라이드를 PyMuPDF로 렌더링해 읽고 `/pilot-status`(`src/data/mockPilotStatus.ts`)에 KPI·기능·레거시를 반영함. 아래는 발표자료와 이 문서가 달랐던 부분이다. **2026-09-22 사용자 최종 결정: 위험단계는 3개 서비스 모두 TP-P22_002 데이터 리스트 5단계, 하천 계측망은 발표자료(6개소), 연안 1차년도 실증지는 함덕·협재(발표자료의 삼양 대신)** — §2 본문에 반영됨.
> - 하천: 발표자료 위험단계는 4단계(안전·경계·대피·중대피, 수위 0~80·80~150·150~300·300cm 초과) ↔ 앱 3단계(주의·경계·심각). 계측망은 발표자료 6개소(1차년도 상류 3개소) ↔ 회의록 7개소+스마트폴 3개소.
> - 저염분수: 발표자료 위험단계 4단계(정상·주의·경계·심각) ↔ 국립수산과학원 기준 5단계. 1차년도 공간해상도는 8km 재현장이고 1km 이하는 2차년도 목표. 신규 수온·염분 센서 2지점×3층(해상풍력 구조물)은 "추가제안".
> - 연안: 1차년도 실증지는 함덕·삼양 2개소, 협재는 2차년도 후보 ↔ 이 문서 §2 ② "함덕·삼양·협재 3개 관리구역 확정".
> - 레거시 활용으로 새로 확인된 것: 서귀포시 자동 우량 경보시스템(약 20년 운영, FEP 어댑터 실시간 연계), ETRI 효돈천 수문 데이터 2011~2023, 제주도 해양수산연구원 기존 유입 예측시스템, 함덕·삼양 종합상황실 기존 CCTV·방송 스피커.

### ② 연안 안전관리시스템 (`/coast`)
- 대상지: **1차년도 함덕·협재 해수욕장** (2026-09-22 사용자 확정 — 삼양은 1차 대상 아님. 실증사 올포랜드 발표자료는 함덕·삼양으로 되어 있어 실증사와 재협의 필요. 삼양 CCTV는 `general`로 분류)
- 위험단계: TP-P22_002 연안 시트 5단계(정상·관심·주의·경보→경계·심각) — 유의파고 1.0/1.5/2.5/4.0m, 풍속 6/10/14/20m/s, 조위·위험범위 기준. 데이터 `coastStageCriteria`(`src/data/mockCoast.ts`). 지표 결합 규칙은 원본에 없어 2026-09-22 사용자 요청으로 임의 설정 — `src/data/coastAlertThresholds.ts`의 `classifyCoastRisk()`(파고·풍속 중 높은 단계 기본 · 조위 고조 이상이면 한 단계 가중 · AI 이벤트는 최소 단계 보장 · 하향은 30분 유지 후)
- 목표: 사전 감지율 90%↑, 위험 감지 정확도 85%↑
- 인프라: AIoT 스마트폴 신설(지능형 CCTV + 기상센서 + 경보스피커) — **공유수면 점용허가 등 인허가 필요**
- AI 라벨: `Person_In_Water`, `Danger_Zone_Person`, `Rip_Current`, `Overtopping`

### ③ 하천 범람예측·경보 시스템 (`/river`)
- 대상지: **서귀포 효돈천 (돈내코·쇠소깍)** — 하천은 이 한 곳뿐입니다. 임의로 다른 하천(예: "하천 B")을
  추가하지 마세요.
- 목표: 예측 일치율 85%↑, **1시간 선행 범람 예측**(2026-09-15 착수보고회 회의록 기준으로 표기 수정)
- 인프라: **효돈천 AIoT 5종 복합 계측망 6개소(스마트폴 포함) — 1차년도 상류 3개소, 2차년도 중·하류 3개소**(2026-09-22 사용자 확정 — 실증사 소다시스템 발표자료 기준. 회의록의 "7개소 + 스마트폴 3개소" 표기를 대체), 레거시 침수정보센서 연계(제주시 66개소·서귀포시 69개소)
- AI 라벨: `Water_Level_High`, `Flood_Imminent`, `Debris_Flow`
- 단계 번호 컨벤션: **1단계=주의, 2단계=경계, 3단계=심각** (아래 위험등급 체계와 동일한 순서)
- 위험단계 기준: TP-P22_002 하천 시트 5단계(정상·관심·주의·경보→경계·심각) — 계획홍수량 20% 미만/20~50% 미만/50~70% 미만/70~100% 미만/100% 이상(원본은 관심 20~30% 뒤 주의 50%로 30~50%가 비어 있어, 2026-09-22 사용자 요청으로 관심을 50% 미만까지 연장해 임의 설정), 수위 상태 평시/유의/주의보/경보/계획홍수위. 데이터 `riverStageCriteria`(`src/data/mockRiver.ts`). 실증사 발표자료의 4단계(안전·경계·대피·중대피)는 채택하지 않음(2026-09-22 사용자 확정)

이 세 서비스가 AI 예측 기반 1차년도 실증 대상입니다(2026-09-08 갱신: 이후 사용자가 풍수해 통합·폭염
MVP를 추가 요청해 §2 하단에 반영 — 새 AI 예측을 만드는 서비스가 아니라 레거시 연계/공공정보 안내
성격이라 이 3개와는 구분됨). 통합 대시보드(`/dashboard`)는 이 세 서비스를 한 화면에서
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

**3단계도 완료**(2026-09-07): `/dashboard`에 상단 탭 종합 상황(AI 분석 근거 + 센서 시계열 차트) /
GIS 상황(지도+쉘, 기본 탭) / CCTV를 추가했습니다. 도메인 홈(`/aqua`,
`/coast`, `/river`)에는 이 상단 탭을 아직 안 붙였습니다 — 붙일지는 사용자와 상의.

**CCTV 통합 조회 구현 완료**(2026-09-08, Claude Code — 레거시시스템 현황 조사 면담 결과서_20260907
Q22 근거): `/dashboard`의 CCTV 탭 플레이스홀더를 실제 검색·필터 UI로 교체했습니다. 주소/카메라명
검색, 도메인 필터(전체/하천/연안/양식장/일반), 카드 그리드(연결·오프라인 상태 배지)를 제공하며,
영상 스트림 자체는 실제 백엔드가 없어 "실시간 영상 연동 예정" 플레이스홀더로 유지됩니다. 대표
카메라 10대는 3개 실증 서비스 확정 대상지(한경 금등·한경 용수·대정 일과 / 함덕·삼양·협재 /
돈내코·쇠소깍)와 도심 대표 카메라 2대(불법주정차·자치경찰단 ITS 각 1대)로 구성했고,
`cctvCoverageSummary`(`src/data/mockCctv.ts`)에 실제 규모(도 자체관제 약 1.2만대, 불법주정차 포함
1.8만대, 자치경찰단 ITS는 예산·라이선스 문제로 일부만 연계)를 별도로 표기해 대표 목록과 혼동되지
않게 했습니다 — 양식장 "대표 N개소" 표기 방식과 동일한 원칙입니다. 새 타입은
`src/types/domain.ts`의 `CctvCamera`/`CctvCoverageSummary`, 카드 컴포넌트는
`src/components/ui/CctvCameraCard.tsx`.

**담당자·연락처 안내 패널 구현 완료**(2026-09-08, Claude Code — 레거시시스템 현황 조사 면담 결과서
Q4·Q27 근거): 새 GIS 레일 항목 "담당자"(`contact`)를 `GisIconRail`에 추가하고, `/dashboard`(전체
4명)와 `/aqua`·`/coast`·`/river` 홈(해당 도메인 담당 + 총괄, 2명씩) 모두에 연결했습니다. 공용
컴포넌트 `src/components/ui/DutyContactPanel.tsx`가 `domain` prop으로 필터링하며, 데이터는
`src/data/mockContacts.ts`(`DutyContact[]`, 타입은 `src/types/domain.ts`). 이름·연락처는 면담
인터뷰이가 아닌 **데모용 가상 인물**입니다(기존 로그인 데모 "홍길동"과 동일한 성격) — 실제 담당자
정보를 코드에 넣지 않기 위한 의도적 선택이니, 실제 값으로 바꾸지 마세요. 면담에서 합의된 대로
"인사이동 시 AI추진단이 접수해 현행화" 문구를 패널 하단에 고정 표시합니다.

**하천×조수 연계 시계열 구현 완료**(2026-09-08, Claude Code — 레거시시스템 현황 조사 면담 결과서
Q15 근거: "하천수위를 해양 조수 시간과 연계해서 보여주면 좋겠음"): `/river/analysis`의 "수위 시계열
예측" 플레이스홀더를 recharts 라인차트로 교체하고 조위(조수) 라인을 겹쳐 표시했습니다. **효돈천
쇠소깍(하구, 감조구간)에만 적용**하고 **돈내코(상류 계곡)는 조수 영향이 없어 제외**했습니다 — 실제로
쇠소깍이 바다와 만나는 지점이라는 지리적 특성에 근거한 구분이니 임의로 두 지점 모두에 적용하지
마세요. 데이터는 `riverTideCorrelation`(`src/data/mockRiver.ts`, 타입은 `src/types/river.ts`의
`RiverTidePoint`) — `riverRiskBasis.waterLevel`(관측 수위 "3.82m")과 14:30 시점 값이 정합하도록
맞췄고, 그 이후 시간대는 예측값(`predicted: true`)입니다. 경계 수위(3.5m) 기준선은
`ReferenceLine`으로 표시합니다.

**돌발 강우 AI 조기경고 구현 완료**(2026-09-08, Claude Code — 현업요구사항_정리_자연재난과_20260907.md
5번 항목 근거): "사전 예고된 태풍 등은 오히려 수월하고, 기상청 예측을 벗어나는 돌발 폭우가 가장
대응이 어렵다"는 지적을 반영해 `/river/analysis` 최상단에 카드를 추가했습니다. 기상청 예보(50mm)
대비 실측(87.4mm, `riverRiskBasis.rainfall.value`와 동일 수치) 초과율을 뱃지로 표시하고, **AI는
조기 경고까지만 하고 최종 단계 상향·경보 발령은 반드시 담당자가 확인**한다는 원칙을 카드 하단
콜아웃으로 고정했습니다(면담에서 "오경보 리스크" 이유로 명시적으로 요구된 사항 — 자동 발령으로
바꾸지 마세요). 데이터는 `riverSuddenRainAlert`(`src/data/mockRiver.ts`).

**풍수해 통합 · 폭염 · 상황전파 3종 MVP 추가**(2026-09-08, Claude Code — 사용자가 §2의
3대 실증서비스 범위를 명시적으로 확장 요청. §2는 원래 "이 세 서비스가 1차년도 실증 대상의 전부"였으나
이 요청으로 갱신됨):

1. **풍수해 통합 현황**(`/wind-flood`, `src/pages/windflood/WindFloodHomePage.tsx`) — 3대 실증서비스와
   달리 새 AI 예측을 만드는 게 아니라 **기존 레거시 시스템을 컨트롤타워에 연계하는 진행 상황**을
   보여주는 화면. 레거시시스템 현황 조사 면담의 "[참고] 재난 관련 레거시시스템 목록" 7개를 그대로
   반영했고, 연계 상태는 실제 인터뷰 내용에 맞춰 **"연계 진행중"은 재난 예·경보시스템 1개뿐**이고
   나머지는 "협의 중"/"미연계"로 정직하게 표기했습니다(과장 금지 — 임의로 "연계 완료"로 바꾸지
   마세요). 데이터는 `src/data/mockWindFlood.ts`, 타입은 `src/types/windFlood.ts`. 다른 도메인과
   달리 GIS 쉘(지도+아이콘레일)은 붙이지 않은 단일 카드형 MVP 화면입니다 — 필요해지면 GIS 쉘 확장은
   별도 상의.
2. **폭염 대응**(`/heat`, `src/pages/heat/HeatHomePage.tsx`) — 위기단계(기상청 폭염특보 공식 기준
   인용, 임의 수치 아님), 시원한 길/더운 길 안내, 무더위쉼터 검색(CCTV 통합조회와 동일한 검색+지역필터
   UX 재사용). 무더위쉼터는 기존 `mockIncidents.ts`의 `shelters`(재난 대피소)와 **의도적으로 별도
   데이터**입니다 — 재난 대피소와 무더위쉼터(경로당·마을회관 등)는 실제로 다른 시설 카테고리이니
   섞지 마세요. 데이터는 `src/data/mockHeat.ts`, 타입은 `src/types/heat.ts`.
3. **상황 전파 · 보고체계** — `/dashboard` "종합 상황" 탭에 카드로 추가했습니다(조직·프로세스
   성격이라 특정 도메인에 속하지 않음). 도청→시 상황실→읍면동 순차 전파의 단계별 지연을 표시하고,
   "동시 전파" 목표는 **2차년도 이후 협의 필요**로 명시(자동 구현된 것처럼 보이지 않게 주의).

세 가지 모두 Sidebar에 메뉴 추가(`풍수해 통합`, `폭염 대응`), `App.tsx`에 라우트 추가.

**2026-09-08 추가 반영**(사용자 요청):

1. **통합 대시보드 서비스 카드에 반영**: `mockDashboard.ts`의 `serviceStatusCards`에 "풍수해 통합"(`/wind-flood`)·
   "폭염 대응"(`/heat`) 2개 카드를 추가했습니다(총 5개). counts는 각각 `mockWindFlood.ts`의
   `weatherStations` 레벨 집계, `mockHeat.ts`의 `heatLevelInfo`(제주 전역 폭염주의보 1건)에서 가져온
   값이니 원본 데이터가 바뀌면 이 카드도 같이 맞춰야 합니다(다른 카드들과 동일한 정합성 원칙).
   `DashboardPage.tsx`의 그리드를 `xl:grid-cols-5`로 조정했습니다.
2. **풍수해 AI 조기경보 — 체크 결과: 가능함**. 풍수해 통합 자체는 레거시 연계(규칙 기반)이지만,
   우량계 실측 추이를 기상청 예보와 비교하는 부분은 `/river/analysis`의 `riverSuddenRainAlert`와
   **동일한 원리를 그대로 일반화**할 수 있어 구현했습니다. `windFloodAiForecast`
   (`src/data/mockWindFlood.ts`)가 제주시·서귀포 우량계 실측값을 예보와 비교해 "AI 조기경고" 배지를
   띄우고, 최종 자동침수경보 발령은 반드시 담당자 확인이 필요하다는 동일 원칙을 유지합니다. 적설·
   풍속풍향·태풍 데이터는 AI로 새로 뽑아낼 근거가 없어(태풍은 기상청 자료 전량 수신, 적설은 우선순위
   낮음) 대상에서 제외했습니다.
3. **상황전파·보고체계를 독립 시스템으로 승격**: 기존에는 `/dashboard` 카드 안에 전부 들어있어
   눈에 띄지 않는다는 피드백을 받아, 전체 내용(순차 전파 총 소요시간, 보고체계, 채널, **전파
   이력 테이블** 신규 추가)을 `/propagation`(`src/pages/propagation/PropagationHomePage.tsx`) 페이지로
   옮기고 Sidebar 메뉴(`상황전파·보고체계`)를 추가했습니다. `/dashboard` 카드는 순차 전파 요약 +
   "전체 보기 →" 링크만 남겨 요약/상세 두 층위로 분리했습니다. 이력 데이터는
   `propagationHistory`(`src/data/mockPropagation.ts`).

**2026-09-08 "풍수해 통합"을 "호우"·"태풍" 2개 시스템으로 분리**(사용자 요청). 위 1~2번에서 설명한
"풍수해 통합"(`/wind-flood`)은 더 이상 존재하지 않습니다 — 아래로 대체됨:

- **호우**(`/heavy-rain`, `src/pages/heavyrain/HeavyRainHomePage.tsx`): 기존 풍수해 통합의 내용을
  그대로 이어받음 — 침수센서·우량계·적설계·풍속풍향계 등 **자체 관측망이 있는 쪽**. AI 조기경보는
  `heavyRainAiForecast`(`src/data/mockHeavyRain.ts`, 이전 `windFloodAiForecast`에서 개명), 레거시
  연계 목록도 그대로. 타입은 `src/types/heavyRain.ts`(이전 `windFlood.ts`에서 개명).
- **태풍**(`/typhoon`, `src/pages/typhoon/TyphoonHomePage.tsx`, 신규): 면담의 "태풍 관련 정보는
  자체 실측 장비는 없음: 전량 기상청 정보 수신"을 근거로 완전히 새로 분리 — **관측망 현황이 없고**,
  기상청이 발표하는 태풍 정보(이름·상태·위치·이동속도·기압·최대풍속)를 그대로 표출하는 구조입니다.
  표시 형식은 AGENTS.md §2-④ 실제 벤더 데모(demo-10.muhanit.kr)에서 확인한 태풍 정보 카드 형식을
  따랐습니다. 데이터는 `src/data/mockTyphoon.ts`(`typhoonReports`), 타입은 `src/types/typhoon.ts`.
  **태풍 이름("크로반", "사우엘" 등)은 실제 WMO 태풍 명명 순환표의 공식 명칭이며, 벤더 데모 화면에서도
  같은 이름이 쓰였던 것을 참고한 것**이니 임의로 지어낸 이름이 아닙니다 — 다만 날짜·경로·수치는
  이 프로토타입의 더미데이터입니다.
- `mockDashboard.ts`의 `serviceStatusCards`도 "풍수해 통합" 1개 카드 → "호우"·"태풍" 2개 카드로
  분리(총 6개), `DashboardPage.tsx` 그리드를 `2xl:grid-cols-6`으로 조정. Sidebar도 "풍수해 통합" →
  "호우"·"태풍" 2개 메뉴로 교체.

**2026-09-08 호우·태풍·폭염 3개 서비스 워크플로 고도화**(사용자 요청 — "다른 서비스처럼 고도화").
기존에 단일 홈 화면(MVP)뿐이던 3개 서비스에, 아쿠아/연안/하천과 같은 `DomainSubNav` + 다단계 워크플로
패턴을 적용했습니다. 각 도메인 4페이지 구조(대시보드/상세분석/경보발송(또는 대비발령·안내발송)/
종료보고(또는 해제보고))로 River의 Analysis/Alert/Closure 패턴을 그대로 재사용했고, 홈 화면에도
`DomainSubNav`를 추가했습니다. River의 Control/Dispatch(현장 통제·출동 요청)는 넣지 않았습니다 —
호우/태풍/폭염은 하천처럼 수문·차단기 같은 물리적 현장 통제 인프라가 없는 서비스라 억지로 만들지
않았습니다(과설계 방지).

- **호우**: `HeavyRainAnalysisPage`(강우 시간당·누적 추이 차트), `HeavyRainAlertPage`(제주시 한천
  침수경보 발송 현황 — 3개 채널), `HeavyRainClosurePage`(서귀포 우량계 사례 종료 보고). 새 데이터:
  `heavyRainTrend`, `heavyRainAlertDispatch`, `heavyRainClosure`(`src/data/mockHeavyRain.ts`).
- **태풍**: `TyphoonAnalysisPage`(기상청 예보 기준 제주 접근 예상 경로 — **자체 산출 아님을 명시**),
  `TyphoonAlertPage`(전 도민 대비 안내 문자 발송 현황), `TyphoonClosurePage`(제18호 사우엘 특보 해제
  사례). 새 데이터: `typhoonForecastTrack`, `typhoonAlertDispatch`, `typhoonClosure`
  (`src/data/mockTyphoon.ts`).
- **폭염**: `HeatAnalysisPage`(최근 5일 최고기온·체감온도 추이 차트), `HeatAlertPage`(폭염주의보
  안내 문자 발송 현황), `HeatClosurePage`(8월말 사례 해제 보고). 새 데이터: `heatTrend`,
  `heatAlertDispatch`, `heatClosure`(`src/data/mockHeat.ts`).
- 3개 도메인 모두 서브내비 파일 신규(`heavyRainNav.ts`/`typhoonNav.ts`/`heatNav.ts`), `App.tsx`에
  라우트 9개 추가(`/heavy-rain/analysis`·`/alert`·`/closure` 등 패턴 동일).
- 발송 채널 수치(문자/앱푸시 발송·성공·실패 건수)는 river의 `riverAlertDispatch` 규모감을 참고해
  새로 만든 더미데이터입니다 — 실제 발송 이력이 아닙니다.

**2026-09-08 호우·태풍·폭염을 GIS 지도·AI 분석 근거에도 반영**(사용자 요청). `RiskMarker["domain"]`
유니온에 `"heavyRain" | "typhoon" | "heat"`를 추가했습니다(`src/types/domain.ts`) — `JejuRiskMap.tsx`의
`DOMAIN_LABEL` Record도 함께 채워야 컴파일됩니다(AGENTS.md 3장 경고 그대로 실제로 발생·수정함).

- **GIS 마커** 3개 추가(`riskMarkers`, `mockDashboard.ts`): 한천 침수경보(`heavyRain`, alert —
  `weatherStations` ws-1과 동일 등급), 제24호 크로반(`typhoon`, alert — `typhoonReports` 최신
  발표와 동일 등급), 신제주 로터리·더운 길(`heat`, warning — `heatLevelInfo`와 동일 등급). **태풍
  마커는 실제 위경도가 아닙니다** — `JejuRiskMap`이 제주 섬만 그리는 데모용 축척 지도라, 화면
  우측 하단 해상에 접근 방향을 상징적으로만 표시한 것입니다. `MAP_DOMAIN_FILTERS`(`DashboardPage.tsx`)에
  호우·태풍·폭염 필터 버튼도 추가.
- **AI 분석 근거**(`aiInsights`, `mockDashboard.ts`): 돌발 강우 조기경보, 태풍 경로 안내(자체 관측
  없음 명시), 폭염 특보·열섬 안내 3건 추가 — `/dashboard` 종합 상황 탭에 표시됨.
- 센서 시계열 차트(`timeSeries`/`sixHourSeries`)에는 반영하지 않았습니다(사용자가 GIS 마커·AI
  분석 근거만 선택) — 필요해지면 별도 요청 시 진행.

**2026-09-08 실제 벤더 데모(demo-10.muhanit.kr) 재확인 — 신규 반영 사항**(사용자 요청으로 로그인 후
구조·데이터 직접 확인). 확인된 것: 하단 서비스 카드가 정확히 호우·태풍·폭염·**산불**·하천범람·
저염분 고수온·연안 안전관리 7종 + "기타" 예비슬롯 8개이고(우리 플랫폼엔 산불이 아직 없음 — 아래
참고), 태풍 카드는 "제24호 크로반, 일본 오키나와 OO쪽 약 NNNkm 부근 해상, 속도/기압/풍속"
형식이 실제로 이렇게 발표 시각별로 여러 건 쌓이는 이력 구조임을 확인(우리 `typhoonReports`
형식과 정확히 일치 — 임의 형식이 아니었음이 검증됨), 호우 페이지에 "당일 누적 강수량 TOP50",
"예측 강수량 TOP30" 랭킹 UI가 있음을 확인.

- **당일 누적 강수량 TOP5 랭킹 추가**(`/heavy-rain/analysis`): 실제 사이트의 TOP50 패턴을 MVP는
  TOP5로 축약. 데이터는 `heavyRainTopStations`(`src/data/mockHeavyRain.ts`, 타입은
  `RainfallRankEntry`).
- **태풍 관측 이력 테이블 추가**(`/typhoon/analysis`): 기존 `typhoonReports`(이미 있던 3건 발표
  이력)를 예상 경로 표 아래에 별도 "관측 이력" 표로도 노출 — 새 데이터 추가 없이 기존 데이터
  재사용. 세력 약화 추이(기압 상승·풍속 감소) 패턴이 실제 사이트와 일치함을 확인.
- **동네예보(단기예보 표)는 반영하지 않음** — `docs/superpowers/specs/2026-09-08-platform-redesign-design.md`에
  다른 세션(동시 작업 중)이 이미 1단계 작업 대상으로 명시해 둔 항목이라 중복 작업 방지 차원에서
  건드리지 않았습니다.
- **산불(8번째 서비스 카드)은 아직 반영하지 않음** — 호우/태풍/폭염과 동급의 새 도메인 신설이라
  사용자 확인 후 진행 필요(3장의 "새 도메인 추가 전 상의" 원칙과 동일). 지진(규모/진도 정보)은
  실제 사이트에서도 전용 서비스 카드가 없고 타임라인에만 노출되는 걸 확인해 별도 대응 없음.

**2026-09-09 SVG 지도 → 실제 Leaflet/OSM 타일 지도로 전환**(Claude Code): 그동안 `/dashboard`와
도메인 홈 화면들이 쓰던 커스텀 SVG 지도(`JejuRiskMap.tsx`, x/y 좌표 기반)를 실제 지리좌표 기반
`JejuTileMap.tsx`(react-leaflet + leaflet, OpenStreetMap 무료 타일 — API 키 불필요)로 교체했습니다.
`riskMarkers`(`mockDashboard.ts`)에 실제 위경도(lat/lng)를 추가했고, lat/lng이 없는 마커는 지도에
표시되지 않습니다. **`JejuRiskMap.tsx`는 이제 어느 화면에서도 import되지 않는 미사용 컴포넌트**입니다
(삭제는 안 했음 — §5 미해결 이슈 참고).

- 적용 화면: `/dashboard`, `/aqua`, `/coast`, `/river`, `/heavy-rain`, `/heat`, `/typhoon` 홈(총 7곳).
  `/typhoon`은 자체 관측망이 없다는 §2 원칙에 따라 지도만 붙이고 아이콘레일(자산현황 등)은 붙이지
  않았습니다 — `/heavy-rain`·`/heat`는 실제 데이터가 있는 항목(센서/대응/전파 발송, 자산/무더위쉼터)만
  골라 레일을 붙였습니다.
- **지도 종류 툴바** 6종(일반지도/기상재난/기상모델/재난위험도/CCTV·센서/항공지도) 추가. 이 중
  **일반지도·항공지도·CCTV/센서만 실제로 다른 내용**을 보여줍니다(일반=OSM 스트리트 타일, 항공=Esri
  World Imagery 위성 타일, CCTV/센서=마커셋을 CCTV 카메라 위치로 전환). **기상/재난·기상모델은 아직
  별도 데이터 소스가 없어 재난위험도와 동일한 화면**을 보여줍니다 — 구분되는 데이터가 생기기 전까지는
  이 상태가 정상이니 "버그"로 오인하지 마세요.
- **지역 선택**(전체/제주시/서귀포시) 추가 — 선택 시 해당 지역으로 지도가 `flyTo` 이동.
- CCTV 마커는 기존 대표 카메라 10대(`mockCctv.ts`)에 위경도를 추가해 재사용 — 새 카메라를 늘린 게
  아닙니다.
- `GisTimelinePanel`에 `filters` 슬롯이 추가돼, `/dashboard`의 타임라인/발효중 특보 탭에 실제 필터링
  (유형 드롭다운, 검색, 날짜 범위, 발령/해제 체크박스)이 연결됐습니다.
- `riskMarkers`에 "정상(safe)" 등급 마커 2개(신규 강우레이더, 협재 스마트폴 — 기존 `dashboardSensors`
  재사용)를 추가해 GIS 범례의 "정상" 항목이 실제로 가리키는 마커가 생기도록 했습니다.
- 배포: GitHub Actions로 GitHub Pages 자동 배포 워크플로(`.github/workflows/deploy-pages.yml`)
  추가 — `master` 푸시 시 빌드 후 배포. 프로덕션 빌드에서만 `vite.config.ts`의 `base`와
  `main.tsx`의 `BrowserRouter basename`이 `/jeju-disaster-platform/`로 설정됩니다(로컬 `npm run dev`는
  영향 없음, 클라이언트 라우팅용 `404.html` 폴백 포함).

**2026-09-09 기상청 단기예보(getVilageFcst) 실시간 연동 추가**(Claude Code, 사용자 요청 —
"기상청 단기예보 조회서비스 API를 받았어. 플랫폼에 붙이고싶은데"). §1의 "실제 백엔드 API 연동
없음" 원칙에 대한 **첫 예외**입니다 — KHOA 부이 데이터(위 §2-①, 정적 스냅샷 방식)와 달리
이건 매 조회마다 라이브로 기상청 API를 호출합니다. 사용자가 실시간 연동을 명시적으로 원해서
진행했고, 이 앱이 서버 없는 정적 SPA(GitHub Pages)라 브라우저가 서비스키를 들고 직접
공공데이터포털을 호출하면 (1) 키가 배포 번들에 노출되고 (2) 대부분 CORS로 막히는 문제가 있어
Cloudflare Workers 프록시를 새로 뒀습니다.

- **`workers/kma-weather-proxy/`**(Cloudflare Workers 버전, 이 저장소와 별도 배포 단위): 서비스키를
  Cloudflare Workers Secret으로 보관하고 `apis.data.go.kr/.../VilageFcstInfoService_2.0/getVilageFcst`를
  대신 호출, CORS 허용 + 10분 캐시. `region=jeju|seogwipo` 2개만 지원(제주시·서귀포시 시청
  좌표를 기상청 공식 LCC 격자변환 공식으로 직접 계산한 nx/ny — `README.md`에 근거 기록).
  **2026-09-09 시도했으나 배포 못 함** — 사용자가 Cloudflare 계정 가입 단계에서 에러 코드 1111
  (어뷰징 방지 레이트리밋, 네트워크/IP 문제)에 막혀 `wrangler login`을 완료하지 못했습니다.
  코드는 그대로 남겨뒀고(나중에 다른 네트워크에서 가입되면 재시도 가능), 대신 아래 Vercel
  버전으로 갈아탔습니다.
- **`vercel-proxy/kma-weather-proxy/`**(Vercel 버전, 위와 로직 동일 — 현재 이쪽이 진행 경로):
  GitHub 계정으로 바로 로그인 가입되는 Vercel Serverless Function으로 옮겼습니다(Cloudflare
  가입 문제 회피). **아직 실제 배포 안 됨** — 사용자가 `vercel login` → `vercel link` →
  `vercel env add KMA_SERVICE_KEY production` → `vercel deploy --prod` 직접 실행해야 함
  (서비스키는 Claude Code가 대신 입력/보관할 수 없음). 자세한 단계는 그 폴더의 `README.md`.
- 프론트엔드: `src/data/weatherApi.ts`(실제 API 호출 — 다른 `mock*.ts`와 달리 더미데이터
  아님, 파일 상단 주석으로 구분 명시), `src/types/weather.ts`,
  `src/components/ui/VilageForecastPanel.tsx`. `/dashboard` GIS 상황 탭의 `GisTimelinePanel`에
  "동네예보" 3번째 탭으로 연결(`DashboardPage.tsx`). 프론트엔드 코드는 프록시가 Cloudflare든
  Vercel이든 `/api/vilage-fcst?region=...` 경로만 같으면 동일하게 동작 — 어느 쪽을 배포하든
  `.env`의 URL만 바꾸면 됨.
- 배포 시 `.env`의 `VITE_WEATHER_PROXY_URL`에 (Cloudflare든 Vercel이든) 배포 후 나오는 실제
  URL을 채워야 동작함 (`.env.example` 참고 — 서비스키가 아니라 공개 URL이라 커밋해도 안전).
  값이 없으면 패널이 "설정되지 않았습니다" 에러를 명확히 표시(지어낸 값으로 넘어가지 않음).
- **검증 시 발견한 별개 이슈**: `/dashboard`에서 `GisTimelinePanel`(타임라인/발효중 특보/동네예보)과
  `GisSidePanel`/`GisIconRail`이 DOM에는 정상 렌더링(z-index:10, visible)되지만 지도(`JejuTileMap`,
  Leaflet) 뒤에 가려져 화면에 전혀 안 보이는 문제를 발견했습니다 — 2026-09-09 SVG→Leaflet 전환
  이후 생긴 회귀로 추정되며, 이번 작업(동네예보 탭 추가) 이전부터 있던 기존 버그입니다(원인 미조사,
  범위 밖이라 손 안 댐). §5에도 기록.

`/dashboard`의 자산현황 레일 항목은 대피소 데이터가 맥락과 안 맞아 **우선 주석처리**돼 있습니다
(`DashboardPage.tsx`의 `DASHBOARD_RAIL_ITEMS`, `railContent.asset`, `shelters` import — 전부
주석으로 남아있고 삭제 안 됨. `GisIconRail`에 `items` prop이 생겨서 화면별로 레일 항목을 뺄 수
있음). 도메인 홈 3곳의 자산현황(양식장 목록/연안 스마트폴/하천 통제지점)은 그대로 살아있습니다 —
헷갈리지 말 것.

**아직 안 한 것**: 경보 승인·e-SOP 대응·종료 보고서 같은 세부 워크플로 페이지(양식장 9개/연안 6개/
하천 6개 중 홈 제외 나머지)는 참고 사이트 구조로 옮기지 않고 지금처럼 별도 라우트로 유지하기로
사용자와 합의했습니다(플로팅 패널에 다단계 승인 절차를 욱여넣지 않기 위함). 이 부분을 더 진행할지는
사용자와 먼저 상의하세요.

**2026-09-09~10 기상청 API허브(apihub.kma.go.kr) 실시간 연동 확장** (Claude Code, 사용자 요청 —
"apihub.kma.go.kr에서 사용할 수 있을만한 api 체크해줘" → 1~3순위 승인 후 "진행해줘"). 위 단기예보
연동과 별도의 인증 체계입니다 — data.go.kr `serviceKey`(`KMA_SERVICE_KEY`)와 달리 apihub.kma.go.kr은
`authKey`(`KMA_APIHUB_KEY`) 계정을 따로 만들고, **API 하위 항목별로 개별 "API 활용신청"**이 필요합니다
(카테고리 단위 승인이 아님 — 예: 태풍정보 안에서도 1.1/1.2/1.3 각각 따로 신청해야 함). 같은
`vercel-proxy/kma-weather-proxy/` 프로젝트에 엔드포인트를 추가하는 방식으로 배포했습니다(`KMA_SERVICE_KEY`와
`KMA_APIHUB_KEY` 둘 다 같은 Vercel 프로젝트 env에 등록됨).

- **`api/typhoon.ts`** → `src/data/typhoonApi.ts` — 태풍 이름 목록(`typ_lst.php`, `?mode=list`)과
  실시간 위치·기압·풍속(`typ_now.php`, 기본/`?mode=now`). `/typhoon` 홈에 `TyphoonNameListPanel`,
  `TyphoonNowPanel`로 연결(진행 중인 태풍이 없으면 빈 상태가 정상).
- **`api/warnings.ts`** → `src/data/warningsApi.ts` — 기상특보(`wrn_met_data.php`), 제주시·서귀포시
  REG_ID(`L10913`/`L10914`)로 필터링해 최근 24시간 발표 이력 반환. `WarningsPanel`이 `wrnCodes` prop으로
  특보 종류를 필터링(예: `["H","K"]`=폭염·열대야, `["R","W"]`=호우·강풍, `["V","O","N"]`=풍랑·폭풍해일·지진해일,
  `["T"]`=태풍주의보·경보). `/heat`, `/heavy-rain`, `/coast`, `/typhoon` 홈과 `/dashboard`(필터 없이 전체)에
  연결.
- **`api/marine.ts`** → `src/data/marineApi.ts` — 해양관측(`sea_obs.php`) 파고·풍속·수온 등. 이 엔드포인트만
  `disp=1`일 때 **JSON을 직접 반환**함(다른 `typ01` 계열은 EUC-KR 콤마구분 텍스트) — 혼동 주의. 결측치는
  `-99`/`-99.9`로 오므로 `<= -90`이면 `null` 처리. `/coast` 홈에 파고 카드로 연결.
- **`api/rainfall.ts`** → `src/data/rainfallApi.ts` — 방재기상관측 AWS 매분자료(`nph-aws2_min`). 별도
  활용신청 없이 바로 접근 가능했음. 효돈천(돈내코·쇠소깍)과 정확히 같은 지점이 없어 가장 가까운 저지대
  실측 지점(189=서귀포, 780=제주남원)을 참고용으로 표시. `/river` 홈에 연결. `tm2`를 생략하면 빈 배열이
  올 때가 있고, 가장 최근 1분은 결측(`-99.9`)이 흔해 현재 시각 -2분으로 조회.
- **검토했지만 안 한 것**: 저염분수(아쿠아 양식장) — KMA 해양관측 API에 염분 필드가 없어 KHOA가 이미
  더 잘 다루는 부분과 겹침, 추가 연동 안 함(`/aqua`는 기존 KHOA 실연동 + 단기예보만 유지). 레이더
  강수량(HSR, 하천범람 후보) — 그리드 래스터 데이터라 격자 클리핑·dBZ→강수량 변환이 필요한 더 큰
  작업이라 지금은 보류(지어낸 값 아님, 범위상 스코프 아웃).
- **2026-09-10 남은 격차 점검**: `/typhoon` 홈에 특보(warnings) 연동이 빠져 있던 걸 발견해
  `WarningsPanel wrnCodes={["T"]}` 카드를 추가했고, `/dashboard`도 실시간 단기예보만 있고 실시간
  특보가 없어 `GisTimelinePanel`에 "실시간 특보 — API허브" 탭(필터 없음, 제주 전체)을 새로 추가했습니다.
  나머지 도메인 홈은 재확인 결과 이미 다 연결돼 있었음(river=단기예보+우량, heat=단기예보+특보,
  heavy-rain=단기예보+특보, coast=단기예보+파고+특보).

**2026-09-28 GIS 지도 마커 누락 점검 + "1차년도 사용 가능 레거시 데이터 현황" 문서 반영** (Claude
Code, 사용자 요청):

- **지도 마커 누락 수정**: `/heavy-rain` 지도(`riskMarkers`, `mockDashboard.ts`)에 `weatherStations`
  6종 중 우량계 2종(제주시 #3·서귀포 #2)·적설계·풍속풍향계가 좌표 없이 빠져 있어 사이드 패널
  목록엔 있는데 지도엔 안 보이던 문제를 고쳤습니다. 같은 유형의 누락을 전 도메인 점검해 2건 더
  발견: `/coast`의 함덕 AIoT 스마트폴(협재 쪽만 마커가 있었음), `/heat`의 무더위쉼터 5개소(지도
  부제·자산현황 레일엔 노출을 전제하면서 마커가 하나도 없었음) — 전부 마커 추가. 무더위쉼터 좌표는
  주소가 동/읍/면 단위까지만 있어 행정동 중심 근사값을 썼습니다(정확한 실주소 좌표 아님).
- **레거시 데이터 문서 반영**: 사용자가 제공한 "1차년도(2026년) 사용 가능 레거시 데이터 현황 및
  연계 분석" 문서(제주TP 작성)를 기존 면담 결과서·`mockPilotStatus.ts`와 대조해 확인. 기존
  `legacySystems`(`mockHeavyRain.ts`)의 뭉뚱그린 "ls-1 재난 예·경보시스템(자동침수경보·하천모니터링·
  자동우량정보 등)"·"ls-4 조기경보시스템" 2건을 문서 기준 7건(조기경보 통합 상황관리 연계시스템,
  풍수해 상황 관리시스템, 강우량 연동 자동 경보 발령 시스템, 자동 침수 경보 시스템, 하천
  모니터링시스템, 하천 유속 측정계, 서귀포시 자동 우량 경보)으로 세분화했습니다. 신규 확인된
  미연계 2건(하천 유속 측정계·서귀포시 자동 우량 경보)은 `mockPilotStatus.ts`의 r12·rl2/r6에 이미
  "도청 미연계, 신규 협의 필요"로 반영돼 있던 사실과 정확히 일치해 새로운 판단 없이 그대로
  옮겼습니다 — 두 자료가 서로 다른 결론을 낸 게 아닙니다. `DataSystemPage.tsx`의 `LEGACY_TARGETS`도
  새 id에 맞춰 갱신. 나머지 레거시(ls-2·3·5·6·7)는 이번 문서 범위 밖이라 그대로 유지.
- **CCTV 30일 순환삭제 제약 신규 반영**: 위 문서에서 "원본 영상 30일 순환 저장 후 자동 삭제,
  실시간 스트리밍 링크로만 표출 가능, 과거 영상 없어 비전 AI 학습용 데이터셋 확보 불가"를 처음
  확인해 `CctvCoverageSummary.retentionNote`(`src/types/domain.ts`, `mockCctv.ts`)로 추가하고
  `/dashboard` CCTV 탭에 노출했습니다.
- **적용하지 않은 항목(이미 반영돼 있었음)**: 기상청 수신 데이터(강우량·적설량·풍속풍향·AWS·태풍)는
  이미 `weatherApi.ts`/`rainfallApi.ts`/`warningsApi.ts`/`typhoonApi.ts` 실연동으로 커버 중. 연안
  해양 데이터 부재(이안류·해수면 과거 데이터 없음)는 이미 `mockPilotStatus.ts`의 `cl1`("보유 자료
  없음 — 모의 데이터로 학습·검증")에 반영돼 있어 추가 변경 없음. SOP(HWP) 디지털화·담당자 연락처는
  기존 e-SOP 워크플로·`DutyContactPanel`/`mockContacts.ts`로 이미 개념상 커버.

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

**2026-09-08에 실제로 발견·수정한 사례** (같은 실수를 반복하지 않도록 기록):
`/aqua` e-SOP 단계 번호가 화면마다 달랐던 문제 — `aquaStages`(관심1·주의2·경계3·심각4·해제5)의
번호체계상 "심각"은 4단계인데, `aquaResponseState.grade`와 `aquaAlertDraft.currentGrade`가 둘 다
"5단계"로 잘못 표기돼 있었고, 같은 페이지의 `StageTracker`(2단계·주의 진행 중)와 상단 요약 카드
(4단계·심각)가 서로 다른 진행 단계를 가리키고 있었습니다. 또한 `/aqua` 홈의 "영향 양식장" 수치(17개소)와
`/aqua/farms`의 실제 집계(24개소)가 서로 달랐습니다. 화면 하나만 보고 고치지 말고, **같은 값을 참조하는
모든 화면을 grep으로 찾아 함께 맞추세요.**

같은 날 `/coast`·`/river`도 동일 기준으로 점검해 아래를 고쳤습니다: `coastSummary`의 활성 위험
이벤트(7→5건)·미확인 이벤트(4→2건) 수치가 `coastEvents` 실제 목록과 달랐던 것, 사건 ID/케이스 ID의
연도가 같은 레코드의 다른 날짜 필드와 어긋났던 것(`coastEventDetail.id`, `coastClosure.caseId`),
`coastDispatch`의 사건 위치가 협재로 적혀 있었는데 판단근거·탐지시각은 전부 삼양 사건(`coastEventDetail`)
것이었던 것, `riverClosure.confirmedBy` 시각이 같은 레코드의 종료 승인 시각과 17분 어긋났던 것,
`/dashboard` GIS 지도에서 삼양·협재 마커가 실제로는 danger 등급 이벤트가 진행 중인데도 각각
warning/caution으로 낮게 표시돼 있었던 것(`mockDashboard.ts`의 `riskMarkers`), 하천 서비스 카드
집계(`serviceStatusCards`)의 alert 건수가 실제 `riverStatuses`보다 1건 많았던 것.

**추가로 2026-09-08에 판단해서 정리한 사례** — 처음엔 확신이 없어 미해결로 남겼다가, "더미데이터니
알아서 맞춰라"는 지시에 따라 하나의 시나리오로 확정: 하천 쇠소깍이 `riverStatuses`/`riverControlRows`/
`riskMarkers`에서는 "2단계·경계"였는데 `riverDispatchRequest`/`riverAlertDispatch`는 "3단계·심각"으로
서로 달랐던 건 — **14:32에 심각 3단계로 상향된 것**으로 확정했습니다(가장 늦은 타임스탬프인
`riverAlertDispatch.sentAt`=14:32:07 기준). `riverControlTimeline`에 그 상향 사실을 담은 ct7 항목을
추가했고, 그보다 이른 시각(14:01~14:05)의 `riverDispatchRequest`는 그 시점 실제 단계였던 "경계 2단계"
요청으로 되돌렸습니다. 하천 도메인에서 새 시나리오를 만들 때도 이렇게 **타임스탬프가 가장 늦은 레코드를
현재 상태의 기준으로 삼고, 그보다 이른 레코드는 그 시점 단계로 맞추는 원칙**을 따르세요.

**추가로 2026-09-08에 나머지 화면(대시보드·시스템 모니터링·이력·보고서·로그인)을 점검해 고친 사례**:
`이력·보고서`(`/reports`)의 상세 페이지가 **어느 사건을 클릭해도 항상 같은 하드코딩된 상세 데이터**(효돈천
쇠소깍 사건 내용)를 보여주고 있었습니다 — `incidentDetailSummary`/`incidentTimeline`/
`incidentSopApprovals`/`incidentAgencyActions`/`incidentAttachments`가 `incidentId`로 필터링되지 않는
전역 상수였기 때문입니다. `IncidentRecord`에 `detail`/`timeline`/`sopApprovals`/`agencyActions`/
`attachments`를 직접 담아 사건별로 분리했습니다. 같은 파일에서 `incidentRecords`의 `level` 필드가
`levelLabel` 텍스트와도 어긋나 있었습니다("경계"라고 써놓고 `level: "warning"`(주의 색상), "주의"라고
써놓고 `level: "caution"`(관심 색상)인 식) — 2026-09-07에 `alert` 단계가 새로 생기면서 이 파일만
갱신이 안 된 것으로 보이며, `levelLabel` 텍스트에 맞게 `level` 값을 한 단계씩 올려 정정했습니다. 그 외:
`/403`(권한 없음) 페이지의 "통합 대시보드로" 버튼이 `RequireAuth`에 의해 다시 `/403`으로 튕겨나오는
무한 루프였음 — 버튼 제거. `/dashboard` GIS 지도 부제의 "갱신 09:47"이 하드코딩값이라 실제
`currentWeather.observedAt`(16:50)과 어긋났음 — 실제 값을 쓰도록 정정.

- 같은 사건(예: 효돈천 쇠소깍)을 여러 화면(GIS 마커, 하천 상세, 통합 모니터링)에서 참조할 때
  **`level` 필드와 표시 텍스트("2단계 · 경계" 등)가 항상 일치**해야 합니다.
- 양식장 염분·수온처럼 정량 임계값이 있는 데이터는 `marineAlertThresholds.ts`의 분류 함수로 등급을
  계산하세요. 손으로 등급을 지어내면 나중에 재검증할 때 다시 틀립니다.
- 하나의 도메인 안에서 단계 번호("1단계", "2단계"...)를 쓸 때는 위 3번 표의 순서(주의=1, 경계=2,
  심각=3)를 따르세요.

**2026-09-22 — 더미데이터 전면 리셋 + 저염분 고수온 "관심 단계" 케이스 신설.** 사용자 요청("실제
서비스되는 데이터는 제외하고 더미데이터는 리셋시켜줘. 각 파트별로 케이스를 만들어서... 확인·대응·조치·처리
프로세스를 체크하고 싶어")에 따라 3개 실증서비스의 더미 "진행 중 사건"을 모두 초기화하고, 첫 사례로
`/aqua`(저염분 고수온)에 **관심(1단계) 케이스**를 만들었습니다.

- **리셋 대상에서 제외한 실제 데이터**(값을 임의로 바꾸지 말 것 — 각 파일 상단에 주석으로도 표시됨):
  `khoaLiveObservations`(mockAqua.ts), `khoaBuoyMarineConditions`(mockKhoaBuoy.ts),
  `khoaMoseulpoTide`(mockRiver.ts), KMA API를 렌더 시점에 직접 호출하는 패널들
  (`VilageForecastPanel`/`WarningsPanel`/`RainfallObservationPanel`/`MarineObservationPanel`/
  `TyphoonNowPanel`/`TyphoonNameListPanel`).
- **아쿠아(저염분 고수온) 관심 케이스** — 한경 용수 인근 29.4psu(관심 구간, `classifySalinity` 기준)
  감지를 중심 시나리오로 `mockAqua.ts` 전체 재작성. 대외 경보는 미발령(TP-P22_002 관심 단계 조치가
  "장비 점검·예찰 강화"뿐 내부 대응이라서) — `aquaAlertDraft`가 "작성" 단계에서 멈춰 있고 발송 대상이
  전부 0인 게 버그가 아니라 의도된 상태입니다. `aquaFarms`는 7개소→3개소(전부 caution)로 줄였고
  `aquaFarmTotals`와 반드시 같은 수치를 씁니다.
- **하천·연안은 정상(0단계) 평시로 리셋만 하고 케이스는 아직 안 만듦** — `riverStatuses`/`coastSummary`
  등이 전부 safe/0건이며, `riverClosure`/`coastClosure`는 "종료 보고서 양식이 어떤 모습인지" 보여주는
  과거 사례(지난 날짜, 제목에 "(지난 사례)" 명시)로 남겨뒀습니다. 하천·연안에 단계별 케이스를 만들 때는
  이번 아쿠아 케이스를 템플릿으로 삼으세요: (1) 대상 지표를 하나 골라 임계값 구간에 걸치게 하고,
  (2) 확인→대응→조치→처리 각 페이지의 문구를 그 단계의 실제 SOP 조치 내용(3번 섹션의 표)에 맞춰 다시
  쓰고, (3) `riskLevel`류 필드를 추가해 배지 색이 하드코딩되지 않고 그 단계를 따라가게 하고, (4) 관련
  없는 상태(예: 관심 단계인데 승인 대기 건수)는 0/해당없음으로 명시적으로 끄세요.
- **이번에 새로 찾은 "배지 색 하드코딩" 버그 7건 이상을 고쳤습니다** — `RiskBadge`/`Risk`의 `level`
  props가 실제 데이터 대신 `"danger"` 등으로 박혀 있어서, 데이터가 안전해져도 배지는 계속 빨갛게 뜨는
  문제였습니다. 고친 파일: `AquaAlertPage`/`AquaResponsePage`/`AquaClosurePage`/`AquaPredictionPage`/
  `RiverAlertPage`/`RiverDispatchPage`/`RiverHomePage`(e-SOP 배지)/`CoastDispatchPage`,
  `domainConfigs.tsx`(aquaConfig 3곳 + coastConfig 1곳). 이런 버그를 막으려면 **데이터 객체 쪽에
  `level`/`riskLevel` 필드를 두고 페이지는 그 필드를 참조**하는 패턴을 쓰세요 — 라벨 텍스트만 있고
  `RiskLevel` 타입 필드가 없는 상태(status) 객체를 새로 만들면 나중에 또 이 실수가 반복됩니다.
- 목록이 `[]`로 비었을 때 이전엔 테이블/카드 안에 **하드코딩된 예시 행**이 남아 있어서 데이터를 비워도
  화면엔 옛날 사건이 계속 보이는 경우가 있었습니다(`RiverAlertPage`의 "수신 실패" 표,
  `RiverDispatchPage`의 "기관별 출동 요청" 표, `RiverControlPage`의 "실패 항목" 카드). 빈 배열일 때는
  "이력 없음" 같은 명시적 안내 문구로 대체하세요 — 그냥 `.map()`만 믿고 방치하면 이런 하드코딩이
  숨어 있는지 확인이 안 됩니다.

**2026-09-28 — `/aqua` 도메인 보드(`DomainBoardPage`) 좌측 탭을 호우·태풍·하천범람과 같은 6탭
구조로 재구성.** 기존 8탭(홈/데이터 수집/AI 예측/영향 양식장/경보 승인/e-SOP 대응/실시간 모니터링/
종료 보고)을 `domainConfigs.tsx`의 `aquaConfig()`에서 6탭(대시보드/상황 분석/영향 양식장/경보
발송/e-SOP 대응/종료 보고)으로 합쳤습니다. "데이터 수집"+"AI 예측" → "상황 분석", "e-SOP 대응"+
"실시간 모니터링" → "e-SOP 대응"으로 병합했고, 각 병합 탭 안에는 원래 두 화면의 내용을 순서대로
배치한 뒤 `DetailLink`로 두 번째 상세 화면(예: `/aqua/data`, `/aqua/monitoring`)에 갈 수 있는 링크를
본문 중간에 남겨뒀습니다 — 탭당 상세 링크(`to`)는 하나뿐이라 병합 시 이렇게 하지 않으면 한쪽 상세
화면 접근 경로가 사라집니다. **`/aqua/data`·`/aqua/prediction`·`/aqua/monitoring` 독립 라우트와
페이지 파일은 그대로 남아 있습니다** — 지운 건 `DomainBoardPage`의 좌측 탭 개수뿐입니다. 다른
도메인에서 비슷하게 탭을 합칠 때도 이 패턴(콘텐츠는 순서대로 이어붙이고, 부족한 상세 링크는
`DetailLink`로 본문 안에 보충)을 따르세요.

**2026-09-28 — 6개 서비스 전체의 `DomainBoardPage` 탭 구성을 `docs/data-sources-by-service.md`
분류를 기준으로 점검.** 사용자가 "AI 예측 부분을 고려하고, 구분해둔 데이터를 토대로 진행"하라고
요청해서, 서비스마다 실제로 AI/예측 성격 데이터가 있는지부터 그 문서로 확인한 뒤 구조를 맞췄습니다.

- **점검 결과 — 이미 일관돼 있던 부분**: 호우(대시보드/상세분석/경보발송/종료보고, `heavyRainAiForecast`
  "AI 조기경고"가 대시보드에 이미 표시됨) · 태풍(대시보드/경로분석/대비발령/종료보고, 자체 AI 없음을
  `typhoonSource.note`로 이미 고지 중) · 폭염(대시보드/특보현황/안내발송/해제보고, AI 자체가 없어 표시할
  것도 없음) · 하천(대시보드/상황분석/경보발송/현장통제/출동요청/종료보고, 돌발강우 AI 감지가 이미 홈에
  있음) — 이 4개는 손대지 않았습니다. 3대 실증서비스(하천·아쿠아·연안)만 벤더의 실제 AI 모델(ROMS·NEMO,
  AI CCTV 등)이 있고 호우·태풍·폭염은 "요청 가능한 데이터"조차 없는 레거시 연계 성격이라는 게 문서의
  핵심 구분이라, **태풍·폭염에 AI 탭을 새로 지어내지 않았습니다** — 문서 ③"요청 가능"·④"현재 없는
  데이터" 항목을 마치 구현된 것처럼 보이게 하는 건 이 프로젝트의 "실제 데이터와 완전 가상 시나리오를
  구분해서 표시" 원칙(바로 위 "*" 표기 규칙)에 어긋납니다.
- **고친 부분**: `연안(coast)`만 첫 탭이 "연안 관제"(다른 5개는 전부 "대시보드")였고 경보 탭도
  "경보 승인"(다른 곳은 "경보 발송")이라 명칭이 달랐던 것을 "대시보드"·"경보 발송"으로 맞췄습니다.
  연안은 이미 탭 개수(6개)와 위험이벤트/현장공조/현장모니터링/종료보고 구성 자체가 하천과 1:1로
  대응돼 있어서 라벨 두 곳만 고치면 됐습니다. 연안의 AI 판단 근거(`coastAiInsights`, "AI 판단" 그룹)는
  이미 홈 탭에 있어 그대로 뒀습니다.
- 다른 도메인의 서비스 구성을 검토할 때는 항상 `docs/data-sources-by-service.md`부터 열어서
  "① 현재 사용 가능"에 있는 것만 이미 구현된 것처럼 보이게 하고, ②·③·④는 화면에 없거나(또는
  `dummy` 표기로 구분해) 반영하세요.

**2026-09-28 — "1차년도(2026년) 사용 가능 레거시 데이터 현황 및 연계 분석" 문서를 근거로 서비스별
AI 예측 가능 여부를 재점검, 하천에 "수위 추이 조기경보" 추가.** 사용자가 이 원본 문서(제주AX프로젝트
폴더의 md 파일, `docs/data-sources-by-service.md`의 근거 자료 중 하나)를 다시 참고해서 AI 예측
가능성을 체크하라고 요청 — 문서 2.1절의 DB 누적형 레거시 시스템 7개를 하나씩 서비스에 대입해본
결과:

- **하천 — 새로 추가**: "자동 침수 경보 시스템"(제주시, 수위 측정 데이터·침수 경보 이력)과 "하천
  모니터링시스템"(하천 수위 데이터)이 시스템 오픈 시점부터 DB에 누적 중이라고 문서에 명시돼 있어,
  기존 `riverSuddenRainAlert`(돌발 강우 감지, 강우 신호원)와 같은 원칙으로 수위 이력 신호원의
  조기경보를 추가할 근거가 있었습니다. `mockRiver.ts`에 `riverWaterLevelAiForecast` 추가 —
  `RiverHomePage.tsx`(카드)와 `domainConfigs.tsx`의 `riverConfig().home`(Group) 양쪽에 노출.
  값은 `mockDashboard.ts`의 `sixHourSeries`·`timeSeries` 돈내코수위(1.02→1.05m, 2026-09-22
  리셋값)와 반드시 같은 수치를 씁니다.
- **호우 — 이미 충분**: 문서의 "강우량 연동 자동 경보 발령 시스템"(강우량·경보 이력 DB)이 이미
  `heavyRainAiForecast`("AI 조기경고")로 구현·노출돼 있어 추가 작업 없음.
- **태풍 — 불가**: 문서 2.2절이 "태풍 및 기상 예측/실측 정보는 전량 기상청 자료를 수신"이라고
  명시 — 자체 AI 자체가 성립하지 않는 구조. 기존 `typhoonSource.note` 고지 유지.
- **폭염·연안·아쿠아 — 이 문서 기준으로는 추가 근거 없음**: 폭염 전용 레거시 시스템 자체가
  문서에 없고, 연안·아쿠아는 문서 3.1절이 "해양/연안 데이터... 실측 레거시 데이터가 전무함"이라고
  명시 — 이 두 서비스의 AI는 (아쿠아는 지오시스템리서치, 연안은 올포랜드) **별도 실증사 벤더
  데이터**가 근거이지 이 레거시 문서와는 무관합니다. 혼동하지 않도록 구분해서 기록.
- **하천유속측정계·서귀포 자동우량경보는 왜 제외했는가**: 문서가 "도청 미연계, 신규 연계 필요"라고
  명시한 항목이라 아직 도 차원에서도 못 쓰는 데이터입니다 — `자동침수경보`/`하천모니터링`처럼
  "이미 DB에 누적 중"인 것과는 상태가 다르므로 AI 근거로 쓰지 않았습니다.
- 이 판단 원칙(문서에 실제로 "DB 누적 중"이라고 명시된 항목만 AI 조기경보 근거로 쓰고, "미연계"·
  "전무" 항목은 쓰지 않는다)은 앞으로 이 문서를 근거로 더 추가할 때도 그대로 적용하세요.

**2026-09-28 — KHOA 실측 데이터로 아쿠아·연안 AI를 더 보강할 수 있는지 점검, 실증사 요청
가이드 작성.** 상세 내용·거리 계산·판단 근거는 `docs/khoa-ai-prediction-requests.md` 참고.
요약: 아쿠아는 수온·염분 실측(4개소)이 모델 편향보정 입력으로 바로 쓸 수 있어 "부분 가능"
(`aquaKhoaEnhancementReview`, `/aqua/prediction`에 노출), 연안은 조위 실측(모슬포)이 협재·
함덕과 20~53km 떨어져 있어 결합 규칙엔 못 넣고 참고 표시만 하는 "제한적" 결론
(`coastKhoaEnhancementReview`, `/coast/monitoring`에 노출). **핵심 원칙: 관측점이 실제
사건 발생지와 멀리 떨어져 있으면, 거리를 무시하고 그 값을 위험판정 로직에 억지로 대입하지
말 것** — 새 임의 임계값을 지어내는 것과 같은 문제이므로, 참고 표시로만 남기고 실증사에게
현지 관측 지점 신설을 요청하는 쪽으로 정리하세요.

**2026-09-28 — 도메인 메뉴의 단일 기준: `src/pages/<도메인>/<도메인>Nav.ts`.** 한 서비스의 메뉴가
두 곳(GIS 보드 좌측 탭 = `domainConfigs.tsx`, 상세 대시보드 창 사이드바 = `DomainSidebar.tsx`)에
따로 적혀 있어서 여러 세션이 각자 고치다 라벨·개수가 어긋났습니다(예: 보드 "경보 발송" vs 사이드바
"경보 승인", 아쿠아 보드 6탭 vs 사이드바 8개). 이제 **두 메뉴 모두 `xxxNav.ts` 목록 하나에서
만들어집니다** — 보드는 `navTabs()`가 [대시보드 + nav[1..]]로, 사이드바는 [상세 대시보드 +
nav[1..]]로 구성. 메뉴 라벨·순서를 바꿀 땐 **`xxxNav.ts`만 고치고**, 보드 탭 내용은
`domainConfigs.tsx`에서 경로(`to`)별로 넘기세요. 별도 메뉴 없이 다른 항목 아래로 묶는 하위 화면은
`also`로 지정합니다 — 사이드바 강조·경로 표시에 사용. 현재 예: 아쿠아 "e-SOP 대응" 메뉴를 뺀 뒤
(사용자 요청) `/aqua/response`·`/aqua/monitoring`은 "경보 발송"의 `also`로 묶여 있습니다.
공통 골격은 대시보드 → 데이터 수집 → 분석/예측 → (서비스 고유 메뉴) → 경보 → (현장 대응) →
종료 보고이고, 서비스 고유 메뉴(영향 양식장·현장 통제·출동 요청·현장 공조 등)는 서비스마다 달라도
됩니다(사용자 확인).

같은 날 이어서 **메뉴 기능도 맞춤**(사용자 선택: 연결 동작 + 내용 통일, 버튼 동작은 상세 화면에만).
① 보드의 모든 "상세 화면 →"(`PanelParts`의 `DetailLink`)은 이름 붙은 창 `DETAIL_WINDOW`
(`jeju-ax-detail`)에서 열려 보드 창은 그대로 남고 상세 창 하나만 재사용됩니다 — 창 재사용이 깨지므로
여기에 `rel="noopener"`를 붙이지 마세요. 상세 창의 사이드바는 그 창 안에서만 이동합니다(새 창 없음).
② 보드 탭 요약은 **해당 상세 화면의 구역 구성을 그대로 따라야** 합니다 — 상세 화면에 구역을 추가하면
`domainConfigs.tsx`의 같은 경로 탭에도 같은 데이터로 요약을 넣으세요. 두 화면이 같은 목록을 보여줄
땐 변수 하나로 만들어 여러 탭에서 재사용합니다(`stationList`·`sensorList`·`reportHistory`·
`khoaReview`·`coastKhoaReview`).

**2026-09-28 — 시나리오 시계(`src/data/scenarioClock.ts`): 모든 서비스를 실시간 기준으로.** 서비스마다
더미 시나리오를 쓴 날짜가 달라(9/7·9/8·9/22) 화면마다 기준 시각이 제각각이었습니다. 사용자 결정: 데이터
값(위험 단계·수치)은 그대로 두고 시각만 실시간으로 맞추며, 서비스 상황은 추후 사용자 시나리오로 바꾼다.
- 모듈마다 "작성 당시의 지금"(`MODULES`의 `anchor`)을 두고, 앱 시작 시 그 모듈의 모든 시나리오 시각을
  (실제 현재 − anchor)만큼 평행이동합니다. anchor 시각은 지금이 되고 사건 간 간격(23분 전 감지, D+3 도달
  예상, 7일 전 지난 사례)은 유지됩니다. **시나리오 데이터를 새로 쓰면 해당 모듈의 anchor만 그 시나리오의
  "지금"으로 바꾸세요.**
- **표기 규칙(중요)**: 시나리오 시각은 하이픈(`2026-09-22 09:15`, `09:15`, ISO)으로 쓰면 이동 대상.
  실제로 일어난 사실의 날짜(회의일, API 확인일, 등록일)는 **점(`2026.09.09`)**으로 써야 이동하지 않습니다.
  실측 스냅샷 객체(KHOA)는 `skip`으로 통째로 제외. mockMeetingItems·mockPilotStatus·mockContacts·
  mockDataSourceCategories·mockKhoaBuoy는 실제 사실이라 대상 모듈에 넣지 않았습니다.
- 문자열로 export된 시각은 제자리에서 못 바꾸므로 `scenarioTime(모듈명, 값)`으로 옮기고, 고정 "오늘"이
  필요하던 곳은 `SCENARIO_NOW`를 씁니다. 페이지 코드에 시각을 하드코딩하지 말고 데이터에서 가져오세요.
- `main.tsx`에서 `./data/scenarioClock`을 **App보다 먼저** import해야 합니다.

플랫폼 이름은 **"제주 재난 대응 플랫폼"**으로 통일(헤더·로그인·권한 없음 화면·브라우저 탭). 헤더가 길어져
1280px 미만에선 시계의 날짜를 숨기고 간격을 줄이는 축소 규칙을 `demo10.css`에 두었습니다.

**2026-09-28 — 동작 없는 버튼·접근성·모바일.**
- 보드에 **누르면 아무 일도 없는 버튼을 두지 마세요.** 종합 상황의 합계/지역 타일은 관련 패널을 엽니다
  (근무→담당자, 위험자산→GIS 상황, 피해접수→타임라인(지역 카드는 그 지역으로 검색), 상황전파→상황전파).
  동작이 없는 라벨은 버튼 대신 `<span className="tabs__static">`. 로그인의 OTP 발신·비밀번호 초기화는
  데모 안내 문구(`role="status"`)를 띄웁니다.
- 세로 탭 레일(`SideTabsDock`)은 세로쓰기 글자를 보조기기가 못 읽을 수 있어 버튼에 `aria-label`과
  `aria-controls`(패널 id)를 둡니다. 탭을 새로 만들 때도 이 컴포넌트를 쓰세요.
- **모바일(767px 이하)**: `demo10.css` 맨 끝의 레이어 없는 `@media (max-width: 767px)` 블록이 전담합니다.
  지도 → 좌측 패널 → 우측 패널 → 하단 카드 순으로 세로로 쌓고, 탭 레일·상세 화면 사이드바 메뉴·하단 카드는
  가로 스크롤 줄, 넓은 표는 감싼 카드 안에서 가로 스크롤. 1024px 이상 데스크톱 규칙은 건드리지 않았습니다.
  새 화면을 만들면 375px에서 `document.documentElement.scrollWidth`가 375인지 확인하세요.

**2026-09-29 — 서비스 대시보드 = "팀장 브리핑" (재난안전과 팀장 사용자 시나리오 기준).**
6개 서비스(호우·태풍·폭염·하천범람·저염분 고수온·연안 안전관리)의 보드 "대시보드" 탭과 상세 대시보드(홈) 맨 위 카드가
같은 순서로 답합니다: ① 지금 상황 → ② 팀장 결재·지시 → ③ 판단 근거 → ④ 앞으로의 전개 → ⑤ 대응 현황.
- 데이터는 `src/pages/domain/leaderBriefs.ts` **한 곳**(서비스별 `xxxBrief()`), 렌더러는 `LeaderBrief.tsx`
  (`LeaderBoardBrief` 보드용 / `LeaderDetailBrief` 상세용). 서비스별 참고 자료(관측소·쉼터·CCTV 등)는 보드에서
  `LeaderBoardBrief`의 children으로 그 아래에 붙습니다.
- 값은 전부 각 서비스 mock에서 **계산**합니다(수치·문구를 브리핑에 새로 지어 넣지 말 것). 그래서 서비스 상황을
  사용자 시나리오로 바꾸면 브리핑도 따라 바뀝니다 — 결재·지시 항목은 조건이 맞을 때만 생기고(예: 발령된 경보가
  있을 때 "승인", 조치 실패가 있을 때 "지시"), 없으면 `idle` 문구("결재·지시 대기 없음")가 나옵니다.
- 결재·지시 항목의 링크는 동작을 하는 상세 화면(경보 발송·현장 통제·출동 요청·종료 보고 등)으로 갑니다. 보드에서는
  `DETAIL_WINDOW`로 열립니다.
- 폭염의 33℃(주의보)·35℃(경보)는 `heatLevelInfo.criteria` 문구의 기상청 기준을 `leaderBriefs.ts` 상수로 옮긴 것입니다.
- **통합 결재함(`/approvals`, `pages/approvals/ApprovalsPage.tsx`, 상단 메뉴 "통합 결재함")**: 6개 브리핑의 결재·지시 항목을
  한 표로 합쳐 급한 순(상태 등급 → 승인·지시 우선)으로 보여줍니다. 새 데이터 없이 `xxxBrief()`만 씁니다 — 새 서비스를
  추가하면 `SERVICES` 배열에 브리핑 함수를 넣으세요.
- 시나리오 문서가 짚은 미구현 갭 중 대행 결재자, 방재메신저 지시 하달은 아직 없습니다.

**2026-09-29 — 1차년도 실증용 보완(시나리오 선택·데이터 구분·업무 흐름·접근성).**
- **로그인**: 프로토타입이라 사원번호·비밀번호·OTP에 아무 값이나(비워도) 넣으면 로그인된다(`guest`만 권한 없음 체험) — 실제 인증은
  1차년도 범위 밖. 로그인 화면 안내가 이 동작 그대로를 말한다(안내와 동작을 어긋나게 바꾸지 말 것).
- **시나리오 선택·초기화(`src/data/scenarios.ts`)**: 헤더 "데모 데이터" 메뉴(`DemoDataMenu`)에서 고르면 localStorage에 저장하고
  새로고침한다. 앱 시작 때 mock 값을 **한 번 덮어써서**(`main.tsx`에서 scenarioClock보다 먼저 import) 화면 코드는 시나리오를 몰라도 된다.
  **2026-09-29 현재 등록된 시나리오는 "기본(빈 상태)" 하나뿐이다** — 아래 "전체 초기화"로 기존 시나리오(하천 효돈천 주의·연안 협재 이안류)를 지웠다.
  새 시나리오는 `SCENARIOS`에 항목을 넣고 `applyXxx()`를 써서 `replaceAll`/`patch`/`patchById`(scenarios.ts가 export)로 덮어쓴다(파일 머리 주석에 절차).
  **함께 맞춰야 하는 곳**: 서비스 카드 집계·지도 마커·`dashboardSensors`·`timeSeries`·`sixHourSeries`·`recentActions`(mockDashboard)와 각 서비스의
  `xxxFlowProgress` — 빠뜨리면 아래 일치 검사가 알려 준다. 시각은 "지금=09:15" 기준으로 쓴다.
- **전체 초기화(2026-09-29, 사용자 요청: 실시간 API를 제외한 스냅샷·더미 전부 초기화, 시나리오는 새로 만들 예정)**: `mockAqua`·`mockRiver`·`mockCoast`·
  `mockHeavyRain`·`mockTyphoon`·`mockHeat`·`mockDashboard`·`mockIncidents`·`mockReports`·`mockMonitoring`·`mockPropagation`·`mockCctv`(대표 카메라)·
  KHOA 스냅샷(`khoaBuoyMarineConditions`·`khoaLiveObservations`·`khoaMoseulpoTide.series`)을 비웠다. 남긴 것: 위험단계 기준표·임계값·확정 대상지·레거시 조사
  결과(`legacySystems`)·데이터 소스 분류(`mockDataSourceCategories`)·착수보고회 항목·구현 현황(`mockPilotStatus`)·담당자·KHOA AI 보강 검토 문구·서비스 카드/지도의
  확정 대상지 마커(등급 safe)·**실시간 API 패널**. 빈 상태의 표현: 목록은 `[]`, 단일 객체는 `"-"`/0/`safe`(예: `heatLevelInfo.feelsLikeC`는 `null`=관측값 없음,
  `typhoonReports`가 비면 "발표 중인 태풍 없음"). 화면·브리핑·일치 검사는 빈 값에서도 동작하게 고쳤다 — **새 화면을 만들 때 `[0]`·`reduce`(초기값 없이)·
  `Math.max(...[])`처럼 빈 배열에서 터지는 코드를 쓰지 말 것.** 이전 더미 값은 git 이력(커밋 `5b1223f` 이전)에 남아 있다. 모든 서비스가 평시라
  `/approvals`도 "대기 없음"으로 나온다. (코덱스의 엑셀 더미 적용 `applyStoredDummyWorkbook()`은 이 빈 기준선 위에 일부 배열을 채운다.)
- **업무 흐름(`src/types/flow.ts`)**: 3대 실증서비스(하천·저염분·연안)는 mock에 `xxxFlowProgress`(감지→확인→판단→경보→대응→종료)를
  들고 있고(값: 완료 시각 / "진행 중"·"승인 대기" / "보류"), 팀장 브리핑과 상세 대시보드에 진행 띠(`.flow`)로 나온다. 평시면 비어 있다.
  **팀장 승인이 남았는지는 이 값에서 읽는다**(하천: 판단이 시각이면 승인 끝 → "다음 단계 상향 여부"만 확인).
- **데이터 구분 표식**: 제목 앞 `*` = 시나리오 더미(기존 규칙), 제목 옆 태그 = `실시간`(API 매 조회) / `스냅샷 · 기준 시각`(실측이지만 자동 갱신
  없음 — KHOA). `Card`·`Group`의 `source` prop + `SourceTag`, 기준 시각은 `components/ui/dataSource.ts`가 데이터에서 가져온다(스냅샷은 시나리오 시계로
  옮기지 않는다). 새 API 패널·KHOA 스냅샷을 화면에 넣을 땐 `source`를 붙이세요. 시나리오의 수치(예: 협재 파고 1.9m)는 더미이고 KHOA 부이 실측과 다르다 —
  그래서 두 종류를 태그로 구분한다.
- **일치 검사(`src/data/consistency.ts`)**: 개발 서버 콘솔 또는 `window.__jejuConsistency()`. 서비스 카드 집계↔원본, 지도 마커↔원본, 하천 수위(시계열·센서·
  근거·조위 차트), 연안 건수, 양식장 집계, 브리핑 링크·승인 항목을 검사한다. **mock 값이나 시나리오를 고친 뒤 3개 시나리오 모두에서 "어긋남 없음"인지 확인.**
- **방재메신저·안전뉴스**는 2단계 구현 예정이라 동작하지 않는다. 빈 "준비 중" 문구 대신 `ComingSoonPanel`이 예정 기능과 **지금 쓰는 대체 수단**(담당자 연락처)을
  보여주고, 도메인 보드의 메신저 버튼은 `MessengerNotice`를 연다(예전엔 관련 없는 탭이 열렸음). 헤더의 `href="#"` 빈 링크도 없앴다.
- **접근성**: 탭 목록 키보드 조작(`tabKeys.ts` — ←/→·↑/↓·Home/End), 탭↔패널 `aria-controls`/`role=tabpanel`, 본문 `<main id="main-content">`와
  "본문으로 건너뛰기" 링크(`.skip-link`). 가로 탭 바는 `DragScrollTabs`(훅을 안에 가둬 `react/refs` 경고 제거) — 새 탭 바에도 쓰세요.
- **lint 정리**: `only-export-components` 경고는 컴포넌트 파일에서 상수·함수를 밖으로 뺐다(`gisRailItems.ts`, `panelStatus.ts`, `domainSidebarUtils.ts`,
  `domainParts.tsx`). `src/` 기준 경고 0건. `npm run lint`에 남는 경고는 전부 사용자 폴더 `Improve Jeju Disaster Platform UI_UX/`(추적 안 되는 참고 자료)에서 나온다.
- 기본 데이터의 교차 불일치도 바로잡았다: 호우 전광판 문구가 "효돈천 하천범람 심각"이라 했으나 하천은 평시였음, 하천 센서값·조위 차트가 대시보드 수위와 달랐음,
  호우 관측소 이름의 "효돈천" 표기(하천 서비스와 충돌) → "서귀포 하천변 침수센서".

## 5. 알려진 미해결 이슈 (다음에 손댈 후보)

- **`coastEventDetail.sensorCrossCheck`(`src/data/mockCoast.ts`, "조류 센서 CS-04"·"수온 부이 BU-11")는
  GIS 지도에 마커가 없음** — 2026-09-28 전 도메인 마커 점검에서 발견. 데이터에 주소·좌표 필드 자체가
  없어(이름·상태값만 존재) 좌표를 임의로 지어내지 않고 그대로 뒀습니다. **2026-09-28 사용자 확인:
  위치 확인 불필요, 그대로 둘 것** — 실제 설치 위치가 나중에 확인되기 전까지는 마커 추가하지 마세요.
- **`/dashboard`의 `GisTimelinePanel`/`GisSidePanel`/`GisIconRail`이 `JejuTileMap`(Leaflet) 뒤에
  가려져 화면에 안 보임**(2026-09-09, 동네예보 탭 추가 작업 중 발견 — SVG→Leaflet 전환 이후
  회귀로 추정, 전환 자체와는 별개 이슈이니 원인 조사 필요). DOM에는 정상 렌더링되고 있어
  z-index/stacking context 문제로 보입니다(Leaflet 패널이 자체 z-index를 쓰는 것과 충돌 가능성).
  기능은 정상 동작하니(클릭 등 JS로는 도달 가능) 급하지 않지만, 실제 사용자는 이 패널들을 전혀
  볼 수 없는 상태라 시각적으로는 완전히 깨져 있습니다.
- **`aquaStages`**(`src/data/mockAqua.ts`)와 `이력·보고서`(`src/data/mockReports.ts`)의
  `incidentRecords`는 `관심/주의/경계/심각/해제`라는 **e-SOP 대응 진행상태**(마지막에 "해제"로 끝남) 어휘를
  씁니다. 2026-09-07에 앱 전역 `danger` 라벨을 "심각"으로 맞추면서 앞 4단계 이름은 이제 우연히 일치하지만,
  `정상` 단계가 없고 마지막이 "해제"라는 점에서 위험등급(RiskLevel)과는 여전히 별개 개념입니다. 두 체계를
  아예 하나로 합칠지는 아직 결정 안 됐으니, 손대기 전에 사용자와 먼저 상의하세요.
- **`src/components/ui/WeatherTimeline.tsx`는 어느 화면에서도 쓰이지 않는 미사용 컴포넌트**입니다
  (전용 데이터 `weatherTimeline`/`weatherTimelineNow`도 `mockDashboard.ts`에 있지만 마찬가지로 미사용).
  `KpiCard`처럼 향후 재사용 대기 상태인지, 아니면 지울 대상인지 사용자에게 먼저 확인하세요.
- **`src/components/ui/JejuRiskMap.tsx`(구 SVG 지도)도 2026-09-09 `JejuTileMap`(Leaflet) 전환 이후
  어느 화면에서도 쓰이지 않는 미사용 컴포넌트**가 됐습니다. `src/types/domain.ts`의 `RiskMarker` 타입
  주석에만 이름이 남아있습니다. 지우지 않고 남겨둔 상태이니, 완전히 삭제할지는 사용자에게 먼저
  확인하세요(위 `WeatherTimeline`과 동일한 판단 필요).
- MVP 기획 가이드(Manus AI 작성, 2026-09-07) 대조 결과 아직 구현 안 된 항목들 — 급하지 않지만 서비스가
  15개로 늘어나기 전에 검토 예정:
  - 시나리오 **재생**(시간 흐름에 따라 단계가 자동 진행) — 선택·초기화는 2026-09-29 구현(`scenarios.ts`), 자동 재생은 아직 없음
  - (2026-09-29 헤더 "데모 데이터" 칩+메뉴로 반영 — 아래는 그 이전 기록) 화면 상단 `시뮬레이션 데이터` 배지 + 전역 최종갱신시각 표시 — **미착수 확인(2026-09-08)**: 이
    문서에는 한때 "2026-09-07 부분 적용"이라고 적혀 있었지만, 실제 코드에는 해당 배지가 어디에도
    없습니다(`mockIncidents.ts`의 `disasterDatasetMeta`/`disasterDashboardSummary`가 이 용도로
    만들어졌지만 어느 화면에서도 import되지 않는 미사용 상태). 문서만 앞서 있었던 것으로 보이니, 실제로
    배지를 붙일 때 이 두 export를 재사용하세요.
  - 경보 상태머신 (`초안→검토중→승인→모의전파완료→조치중→종료` + 보류/반려) — 지금은 승인 버튼만
    있고 반려/보류는 UI만 있고 실제로 연결 안 된 곳이 많음
  - 역할별 화면/권한 분리 (관제자/승인권자/현장담당자/관리자) — 지금은 데모 로그인 1종류뿐
  - 전역 메뉴를 재난종류별(현재)이 아니라 업무단위별(통합상황판/서비스관제/경보대응/지도자산/
    데이터품질/시나리오/관리)로 재편하는 안 — Figma 승인된 구조를 갈아엎는 큰 결정이라 신중히

## 6. 기술 스택 & 개발 명령어

- React 19 + TypeScript + Vite 8 + Tailwind CSS v4 (CSS-first `@theme` 토큰, `src/index.css`)
- react-router-dom v7 (클라이언트 라우팅), recharts (시계열 차트)
- react-leaflet v5 + leaflet (`JejuTileMap.tsx`, 2026-09-09 추가) — OpenStreetMap/Esri 무료 타일,
  API 키 불필요
- 인증은 `localStorage` 기반 목업 (`src/data/mockAuth.ts`, `src/routes/RequireAuth.tsx`) — 상세 화면을 새 창으로 열어도 로그인이 이어지게 하려는 것
- 배포: GitHub Pages (`.github/workflows/deploy-pages.yml`, `master` 푸시 시 자동 빌드+배포). 프로덕션
  빌드만 `base`/`basename`이 `/jeju-disaster-platform/`로 바뀌므로 로컬 개발엔 영향 없음.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # tsc -b && vite build — 커밋 전 항상 실행해서 타입 에러 확인
npm run lint     # oxlint — src/ 경고 0건 유지
npm run build:local && npm run preview:local   # 배포용과 달리 루트(/) 기준 — 로컬에서 빌드 결과 확인(http://localhost:4173)
```

## 6-1. UI/UX 디자인 가이드라인 (2026-09-28)

사용자가 전달한 범용 UI/UX 가이드라인을 이 프로젝트의 실제 디자인 시스템(demo-10.muhanit.kr 클론,
`src/styles/demo10.css`)에 맞게 옮긴 것. **색상·프레임워크 항목은 클론 원본 값이 우선이며, 아래처럼
프로젝트 고유 토큰으로 치환해서 적용한다** — 범용 가이드의 색상 코드(`#0F172A`, `#3B82F6` 등)나
shadcn/ui를 그대로 들여오지 않는다.

### 디자인 시스템 (이 프로젝트의 실제 값)
- **프레임워크**: React + Tailwind CSS v4 + 커스텀 CSS(`demo10.css`/`subpage.css`). shadcn/ui는 쓰지 않음 —
  클론 원본의 손으로 짠 컴포넌트 어휘(`.panel`, `.pbox`, `.pgroup`, `.region-card`, `.risk`, `.chip` 등)를
  그대로 따른다.
- **테마**: 다크 모드 전용(라이트 모드 없음). 배경 `--background #1d1d1d`, 헤더/패널 음영
  `--background-darker #111`, 카드·인풋 `--background-lighter #303233`, 정보 블록
  `--background-colored #435668`.
- **강조색**: `--primary #8ec21f`(연두, hover `#769e20`), 대비용 블루 `--quaternary #0054a3`. 범용
  가이드의 "Interstellar Blue(#3B82F6)"는 쓰지 않는다 — 이미 확립된 `--primary`가 그 역할.
- **위험등급 색**: `--risk-danger/alert/warning/caution/safe/info/offline` (§3 참고) — 신규 UI에서 상태
  표시가 필요하면 항상 이 팔레트를 쓰고 임의 색을 새로 만들지 않는다.
- **타이포그래피**: `--font-sans` = Noto Sans KR 가변 폰트(`@fontsource-variable/noto-sans-kr`, `main.tsx`에서 import해
  앱과 함께 배포 — 필요한 글자 조각만 내려받음), 폴백은 맑은 고딕·Apple SD Gothic Neo. Inter는 별도로 로드하지 않는다.
  Figma 시안(`jeju-disaster-platform` 디자인 파일)의 글자 스타일도 같은 Noto Sans KR이다.

### 코드 품질 규칙 (그대로 채택)
1. **AI Slop 방지**: 무채색 평면 레이아웃 금지. 테두리(`border-color: var(--foreground-faint)`), 미묘한
   그림자(`--shadow-panel`), 의도적인 여백 위계를 유지한다. 새 화면을 만들 때 기존 `.panel`/`.pbox`/`Card`
   중 어울리는 것을 재사용하고, 새 카드 스타일을 즉흥적으로 만들지 않는다.
2. **접근성(WCAG 2.1 AA)**: 모든 상호작용 요소에 포커스 상태와 `aria-label`(아이콘 전용 버튼)이 있어야
   한다. `outline: none`으로 지우기만 하고 대체 표시가 약하면 안 됨 — `.select`/`.input`/`.page-content`
   폼 요소는 `:focus-visible`에서 `border-color` 변경 + `box-shadow` 링을 함께 준다(2026-09-28에
   `demo10.css`/`subpage.css`에 추가). 아이콘만 있는 버튼(지도 줌, 알림 종, 햄버거 메뉴 등)은 반드시
   `aria-label`을 채운다.
3. **반응형**: 이 앱은 원래 관제 데스크 대시보드로 설계돼 데스크톱 우선이다. 모바일 대응이 필요한
   화면은 Tailwind 브레이크포인트(`sm:`/`md:`/`lg:`)로 점진 확장하되, `.panel`/`.overlay`처럼 고정폭
   그리드에 의존하는 종합·GIS 상황판은 데스크톱 전용으로 남겨도 된다(레이아웃 성격상 모바일 축소가
   의미 없음) — 무리하게 모든 화면을 모바일 대응시키려 하지 말 것.
4. **마이크로 인터랙션**: hover 전환(`transition: background-color .2s` 등)은 이미 대부분의 인터랙티브
   요소에 적용돼 있다(`demo10.css` 전역 검색: `transition`). 새 인터랙티브 요소를 추가할 때도 최소
   hover/active 전환을 넣는다. 로딩 스켈레톤은 아직 없음 — 실시간 API 연동 패널(기상청 단기예보 등)에
   로딩 상태를 새로 만들 때 고려.

## 7. 디렉터리 구조

```
src/
  components/
    layout/     # AppShell, TopBar, Sidebar
    ui/         # Card, KpiCard(현재 미사용, 재사용 대기), RiskBadge, riskStyles, Pill,
                # JejuTileMap(실제 Leaflet 타일 지도, 2026-09-09 — 현재 사용 중), JejuRiskMap(구 SVG
                # 지도, 2026-09-09 이후 미사용 — §5 참고), WeatherTimeline(미사용), MapToolbox,
                # GisIconRail/GisSidePanel/GisTimelinePanel/ServiceStatusCard/CctvCameraCard/
                # DutyContactPanel
    aqua/       # AquaSubNav, StageTracker, ChecklistRow (양식장 전용)
    shared/     # DomainSubNav (연안·하천 공용 서브 내비게이션)
  data/         # mockAuth, mockDashboard, mockMonitoring, mockAqua, mockCoast, mockRiver,
                # mockReports, marineAlertThresholds (염분·수온 등급 분류 로직),
                # mockIncidents (통합 대시보드의 범재난 현황 보조 섹션, 3대 서비스와 무관)
  pages/
    aqua/       # 양식장 대응 9개 화면
    coast/      # 연안 안전 6개 화면
    river/      # 하천 범람 6개 화면
    heavyrain/  # 호우 4개 화면(홈/분석/경보발송/종료보고, 2026-09-08 추가)
    typhoon/    # 태풍 4개 화면(2026-09-08 추가, 자체 관측망 없음 — §2 참고)
    heat/       # 폭염 4개 화면(2026-09-08 추가)
    propagation/# 상황전파·보고체계 1개 화면(2026-09-08 독립 페이지로 승격)
    reports/    # 이력·보고서 2개 화면
    (root)/     # LoginPage, ForbiddenPage, DashboardPage, MonitoringPage, StyleguidePage(/styleguide)
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
