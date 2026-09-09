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

- **`workers/kma-weather-proxy/`**(신규 하위 프로젝트, 이 저장소와 별도 배포 단위): 서비스키를
  Cloudflare Workers Secret으로 보관하고 `apis.data.go.kr/.../VilageFcstInfoService_2.0/getVilageFcst`를
  대신 호출, CORS 허용 + 10분 캐시. `region=jeju|seogwipo` 2개만 지원(제주시·서귀포시 시청
  좌표를 기상청 공식 LCC 격자변환 공식으로 직접 계산한 nx/ny — `README.md`에 근거 기록).
  **아직 실제 배포 안 됨** — 사용자가 `wrangler login` → `wrangler secret put KMA_SERVICE_KEY`
  → `npm run deploy` 직접 실행해야 함(서비스키는 Claude Code가 대신 입력/보관할 수 없음).
- 프론트엔드: `src/data/weatherApi.ts`(실제 API 호출 — 다른 `mock*.ts`와 달리 더미데이터
  아님, 파일 상단 주석으로 구분 명시), `src/types/weather.ts`,
  `src/components/ui/VilageForecastPanel.tsx`. `/dashboard` GIS 상황 탭의 `GisTimelinePanel`에
  "동네예보" 3번째 탭으로 연결(`DashboardPage.tsx`).
- 배포 시 `.env`의 `VITE_WEATHER_PROXY_URL`에 Worker 배포 후 나오는 실제 URL을 채워야 동작함
  (`.env.example` 참고 — 서비스키가 아니라 공개 URL이라 커밋해도 안전). 값이 없으면 패널이
  "설정되지 않았습니다" 에러를 명확히 표시(지어낸 값으로 넘어가지 않음).
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

## 5. 알려진 미해결 이슈 (다음에 손댈 후보)

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
  - 시나리오 선택·재생 UI (지금은 고정 더미데이터만 있음)
  - 화면 상단 `시뮬레이션 데이터` 배지 + 전역 최종갱신시각 표시 — **미착수 확인(2026-09-08)**: 이
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
- 인증은 `sessionStorage` 기반 목업 (`src/data/mockAuth.ts`, `src/routes/RequireAuth.tsx`)
- 배포: GitHub Pages (`.github/workflows/deploy-pages.yml`, `master` 푸시 시 자동 빌드+배포). 프로덕션
  빌드만 `base`/`basename`이 `/jeju-disaster-platform/`로 바뀌므로 로컬 개발엔 영향 없음.

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
