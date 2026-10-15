# DB 인계 자료 (2026-10-15)

지금 사이트는 서버·DB 없이 **브라우저(localStorage)** 에만 저장합니다. 개발팀이 DB를 붙일 때 바로 쓸 수 있게, 저장 값의 모양과 붙일 자리를 미리 정리했습니다. 실제 DB 서버·서버 함수·인증은 아직 없습니다.

| 파일 | 내용 |
|---|---|
| [schema.sql](./schema.sql) | 표준 SQL 테이블 40개. 1부(19개)는 지금 브라우저에 저장하는 값, 2부(21개)는 코드·JSON에 있거나 외부에서 받는 값. 빈 DB(SQLite)에서 한 번에 실행되는지 확인함 |
| [seed.sql](./seed.sql) | 서비스 9종·위험 단계 4단계·역할 4종 초기값(손으로 관리) |
| [seed-reference.sql](./seed-reference.sql) | 위험 단계 조건·메시지 유형·글자 수 제한·보고체계·전파 채널(코드에서 생성, `npm run db:seed`) |
| 이 문서 | 저장 키 ↔ 테이블 대응, 붙이는 자리, API 후보, 주의점 |

## 1. 지금 저장되는 것 ↔ 테이블

| localStorage 키 | 앱 코드 | 테이블 |
|---|---|---|
| `jeju-ax-role-policy` | `src/data/roles.ts`, `rolesLogic.ts` | `app_role`, `role_permission`, `role_service` |
| `jeju-ax-esop-defs` | `esopDefs.ts`, `esopLogic.ts` | `esop_step` (고친 것만 저장, 없으면 앱 초기값) |
| `jeju-ax-response-log` | `responseLog.ts`, `responseLogic.ts` | `incident`, `response_order`, `response_order_event`, `response_log` |
| `jeju-ax-audit-log` | `auditLog.ts`, `auditLogic.ts` | `audit_log` |
| `jeju-ax-integration-issues` | `integrationLog.ts`, `integrationLogic.ts` | `integration_issue`, `integration_issue_event` |
| `jeju-ax-scenarios` | `scenarios.ts`, `scenarioLogic.ts` | `scenario`, `scenario_phase`, `scenario_run`, `scenario_note` |
| (저장 없음, 변환만) | `commonEvent.ts`, `public/mock-api/v1/` | `common_event` |

앱 필드명과 열 이름이 다른 곳(예약어 회피): `by`→`actor`, `at`→`logged_at`/`changed_at`/`created_at`, `count`→`repeat_count`, `text`→`body`, `type`→`issue_type`, `result`→`result_text`, `value`→`observed_value`, `level`→`risk_code`(e-SOP).

**이 문서가 다루지 않는 저장** — 그대로 브라우저에 남깁니다.
- 로그인 세션(`jeju-ax-session`, `mockAuth.ts`): 목업 인증입니다. 실제 인증이 정해지면 교체 대상입니다.
- 패널 입력값(`panelInput.ts`)과 더미 워크북(`dummyWorkbook.ts`): 시연용 입력입니다. DB가 필요하면 같은 방식으로 테이블을 추가합니다.

## 2. DB를 붙이는 자리

여섯 저장소(역할·e-SOP·대응 기록·이용 이력·연계 오류·시나리오)는 값을 [`src/data/persistence.ts`](../../src/data/persistence.ts) 한 곳으로만 읽고 씁니다.

```ts
import { setPersistence } from "./data/persistence"

// 앱을 그리기 전(main.tsx)에: 서버에서 값을 미리 받아 두고, 읽기는 그 메모리에서, 쓰기는 메모리를 고친 뒤 서버로 보낸다
const mem = new Map<string, string>(await loadAllFromServer())
setPersistence({
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => { mem.set(k, v); void sendToServer(k, v) },
  removeItem: (k) => { mem.delete(k); void deleteOnServer(k) },
})
```

- 읽기가 **동기**여서 앱을 그리기 전에 값을 받아 와야 합니다.
- 키 하나가 JSON 문서 하나입니다. 이 방식은 가장 빨리 붙지만 **동시에 여러 사람이 쓰면 마지막 저장이 앞사람 것을 덮습니다.** 운영에서는 아래 3번처럼 동작 단위 API로 가는 것을 권장합니다.
- 다른 탭 변경은 지금 `storage` 이벤트로 따라갑니다. 서버 연동 후에는 폴링·웹소켓으로 바꾸고 각 store의 `subscribe`를 고치면 됩니다.

## 2-1. 기준정보·관측값 (schema.sql 2부)

브라우저 저장이 아니라 **코드·JSON에 들어 있거나 외부에서 받는 값**입니다. 그대로 두어도 앱은 동작하고, DB로 옮기면 화면에서 고치거나 이력을 쌓을 수 있습니다.

| 값 | 지금 위치 | 테이블 | 시드·이관 |
|---|---|---|---|
| 하천 지점·취수구·해수욕장·스마트폴 등 관측 지점 | `public/data/pilot-batch.json`, 수집 엑셀 | `monitoring_point`, `point_status` | 이관 필요 |
| 수위·유량비·염분·수온·파고·혼잡도 등 시계열(관측·예측) | `pilot-batch.json`의 history·forecast·series, `dummyWorkbook.ts` | `observation` | 연계 자료 수령(10월 중순) 후 |
| 대피소·무더위쉼터 | `public/data/shelters-jeju.json`, `heat-shelters.json` | `shelter` | `scripts/fetch-*.mjs` 결과를 적재 |
| CCTV 목록과 수신 상태 | `mockCctv.ts`, `sample*Cctv.ts` | `cctv_camera`, `cctv_status_log` | 연계 후 |
| 당직 연락처 | `mockContacts.ts` | `contact` | 이름·번호는 가상 값. 실제 값은 개인정보로 취급 |
| 레거시 시스템과 담당자 | `mockHeavyRain.ts`(`legacySystems`), `legacyContacts.ts` | `legacy_system`, `legacy_system_contact` | 이관 필요 |
| 위험 단계 조건 | `riskCriteria.ts` | `risk_metric`, `risk_threshold`, `risk_stage_text` | **생성됨**(`seed-reference.sql`) |
| 메시지 유형·글자 수 제한 | `messageTemplates.ts` | `message_kind`, `message_limit` | **생성됨**. 문안 틀 `message_template`은 코드에 있는 문안을 옮겨야 함 |
| 보고체계·전파 채널 | `mockPropagation.ts` | `reporting_chain_step`, `propagation_channel` | **생성됨** |
| 전파 발송 기록·순차 전파 이력 | 없음(앱은 문안만 구성) | `propagation_dispatch`, `propagation_history` | 발송 연동 후 |
| 긴급재난문자 원문 | `public/data/disaster-msgs-jeju.json` | `disaster_message` | `scripts/fetch-disaster-msgs.mjs` 결과를 적재 |
| 사이드패널 입력값 | 브라우저 `jeju-ax-panel-input` | `panel_input` (영역별 JSON) | 연계가 붙으면 `observation`으로 대체되는 임시 테이블 |

**위험 단계 조건 주의**: 화면 판정은 코드의 판정 함수(`classifyRiverRisk` 등)가 합니다. DB의 `risk_threshold`를 고쳐도 판정 함수가 이 표를 읽도록 바꾸기 전에는 화면이 바뀌지 않습니다. 둘이 어긋나지 않는지는 `tests/riskCriteria.test.mjs`가 확인합니다. 코드의 기준값을 바꾸면 `npm run db:seed`로 `seed-reference.sql`을 다시 만드세요.

**테이블이 없는 것**: 보고서·사건 기록 화면(`mockReports.ts`)은 `incident`·`response_*`를 조회한 결과이고, 공통 이벤트 변환·위험 단계 판정·지도 좌표 변환은 계산 값이라 저장하지 않습니다. 실증 현황(`mockPilotStatus.ts`)·데이터 사용 명세(`dataUsage.ts`)·영향 대상 목록(`aquaImpactTargets.ts`)은 화면용 안내 자료라 아직 테이블로 설계하지 않았습니다(필요하면 추가).

## 3. 동작 단위 API 후보 (운영용)

각 store 함수가 이미 "한 가지 일"을 하나씩 합니다. 이 함수 하나가 API 하나에 대응합니다.

| 함수(`responseLog.ts`) | API 후보 | 서버가 검사할 것 |
|---|---|---|
| `recordLog` | `POST /incidents/{service}/logs` | 서비스의 열린 사건에 붙이고, 없으면 사건을 새로 연다(ID `INC-YYYYMMDD-약어-NN`) |
| `recordOrder` | `POST /incidents/{service}/orders` | 제목에 경보·발령·대피·출동·통제·차단·제어·발송·명령이 있으면 승인 대기로 생성 |
| `moveOrder` | `PATCH /orders/{id}/status` | 상태 순서(지시→전달→수행 중→완료/실패, 실패→수행 중). 승인 전에는 `전달` 불가 |
| `decide` | `POST /orders/{id}/approval` | 승인 권한(`orderApprove`), 한 번만 결정 |
| `endIncident` | `POST /incidents/{service}/close` | 열린 사건만 |

그 밖의 저장소도 같은 방식으로 `PUT /roles`, `PUT /esop/{service}/{level}`, `POST /integration/issues`·`PATCH .../status`, `POST /scenarios`·`/scenarios/{id}/runs`, `GET /audit?category=` 로 나뉩니다. 상태 전이 규칙은 `src/data/responseLogic.ts`(`NEXT_STATUS`)와 `integrationLogic.ts`에 있고, 테스트는 `tests/responseLog.test.mjs`, `tests/integration.test.mjs`에 있으니 서버 쪽에서도 같은 규칙을 쓰도록 참고하세요.

**권한은 서버가 다시 검사해야 합니다.** 지금 권한 검사는 화면(브라우저)에서만 합니다(`rolesLogic.ts`의 `PERMS`, `canAccess`). 로그인이 목업이라 API를 직접 부르면 누구나 통과합니다. 실제 인증과 서버 측 권한 검사가 먼저 있어야 합니다.

## 4. 앱의 표시 규칙(DB 이후에도 유지)

- 실제 데이터가 있으면 항상 실제 값을 먼저 보여 줍니다.
- 스테이징은 값이 없을 때 "샘플" 표시를 붙인 임의 값을, 프로토타입(GitHub Pages)은 "연계 전·값 없음"을 보여 줍니다. 공통 이벤트의 `is_sample`이 그 구분입니다. 운영에서는 샘플 행을 넣지 않거나 걸러 내세요.
- 위험 단계는 서비스 공통 4단계(정상·주의·경계·심각)입니다. `common_event.risk_level`의 `caution`(관심)은 외부 입력용으로만 남겨 두었고 화면에서는 정상으로 묶어 표시합니다.

## 5. 아직 정해지지 않은 것

- 사용자·기관·인증 체계(`app_user`는 최소 틀)
- 이용 이력 보관 기간(앱은 최근 1000건만 보관). 서버는 무제한 보관인지, 기간 정책이 있는지
- 외부 연계 값(도청·서귀포 CCTV·실증사·AX Hub)의 실제 필드. 2부의 `observation` 등은 지금 화면이 쓰는 필드 기준 초안이라, 10월 중순 자료를 받으면 열을 맞춰 다시 확정합니다
- `observation`의 보관 기간·집계(시계열이 크게 쌓이므로 파티셔닝이나 요약 테이블이 필요한지)
- 연락처(`contact`, `legacy_system_contact`)의 개인정보 보관·접근 정책
