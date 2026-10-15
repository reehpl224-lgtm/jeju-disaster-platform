# DB 인계 자료 (2026-10-15)

지금 사이트는 서버·DB 없이 **브라우저(localStorage)** 에만 저장합니다. 개발팀이 DB를 붙일 때 바로 쓸 수 있게, 저장 값의 모양과 붙일 자리를 미리 정리했습니다. 실제 DB 서버·서버 함수·인증은 아직 없습니다.

| 파일 | 내용 |
|---|---|
| [schema.sql](./schema.sql) | 표준 SQL 테이블 19개(PostgreSQL 기준). 빈 DB에서 한 번에 실행되는지 확인함 |
| [seed.sql](./seed.sql) | 서비스 9종·위험 단계 4단계·역할 4종 초기값 |
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
- 외부 연계 값(도청·서귀포 CCTV·실증사·AX Hub)이 오면 `common_event`로 받을지, 별도 수집 테이블을 둘지 — 10월 중순 자료 수령 후 확정
