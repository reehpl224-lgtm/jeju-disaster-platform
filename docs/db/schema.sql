-- 제주 재난 대응 플랫폼 — DB 스키마 초안 (표준 SQL, PostgreSQL 기준으로 검증하기 쉬운 문법만 사용)
-- 지금 프로토타입이 브라우저(localStorage)에 저장하는 값을 그대로 옮긴 구조다. 키 이름은 주석에 적었다.
-- 시각은 TIMESTAMP WITH TIME ZONE(앱은 ISO 문자열), 자유 형식 묶음은 JSON 컬럼을 쓴다(DB가 JSON을 지원하지 않으면 TEXT).
-- 열 이름은 예약어와 겹치지 않게 지었다(by→actor, at→logged_at 등). 앱 필드와의 대응은 README 참고.
-- 인증은 아직 목업이라 사용자 테이블은 최소만 둔다. 실제 인증 체계가 정해지면 app_user를 그쪽에 맞춰 바꾼다.

-- ───────────────────────────── 공통 코드 ─────────────────────────────
-- 서비스 9종: heavy-rain, typhoon, heat, wildfire, tsunami, snow, river, aqua, coast (heat·wildfire는 1차년도 범위 밖이라 화면에서만 숨김)
CREATE TABLE service (
  id    VARCHAR(20)  PRIMARY KEY,
  title VARCHAR(40)  NOT NULL,
  code  VARCHAR(8)   NOT NULL UNIQUE,   -- 사건 ID에 쓰는 약어: RIV, COAST, AQUA ...
  hidden BOOLEAN     NOT NULL DEFAULT FALSE
);

-- 위험 단계는 전 서비스 4단계: 정상 · 주의 · 경계 · 심각 (코드 normal / warning / alert / danger)
CREATE TABLE risk_level (
  code  VARCHAR(10) PRIMARY KEY,
  label VARCHAR(10) NOT NULL,
  rank_no  SMALLINT    NOT NULL UNIQUE
);

-- ───────────────────────────── 사용자·역할·권한 ─────────────────────────────
-- 키 jeju-ax-role-policy (RolePolicy: perms, services)
CREATE TABLE app_role (
  id    VARCHAR(20) PRIMARY KEY,        -- control(상황실) / vendor(실증사) / field(현장) / admin(관리자)
  label VARCHAR(40) NOT NULL
);
CREATE TABLE app_user (
  id      VARCHAR(40)  PRIMARY KEY,
  name    VARCHAR(60)  NOT NULL,
  org_id  VARCHAR(40),
  role_id VARCHAR(20)  REFERENCES app_role (id)   -- NULL이면 restricted(권한 없음)
);
-- 역할 × 권한 키(dashboard, approvals, esop, esopEdit, orderIssue, orderApprove, orderResult, propagation, reports,
--                 system, input, roles, audit, integration, scenario) → 허용 여부
CREATE TABLE role_permission (
  role_id  VARCHAR(20) NOT NULL REFERENCES app_role (id),
  perm_key VARCHAR(30) NOT NULL,
  allowed  BOOLEAN     NOT NULL,
  PRIMARY KEY (role_id, perm_key)
);
-- 역할이 볼 수 있는 서비스(데이터) 범위
CREATE TABLE role_service (
  role_id    VARCHAR(20) NOT NULL REFERENCES app_role (id),
  service_id VARCHAR(20) NOT NULL REFERENCES service (id),
  PRIMARY KEY (role_id, service_id)
);

-- ───────────────────────────── e-SOP 정의 ─────────────────────────────
-- 키 jeju-ax-esop-defs (고친 (서비스:단계)만 저장, 없으면 앱의 초기값). 단계: warning / alert / danger
CREATE TABLE esop_step (
  id         VARCHAR(40)  PRIMARY KEY,
  service_id VARCHAR(20)  NOT NULL REFERENCES service (id),
  risk_code      VARCHAR(10)  NOT NULL CHECK (risk_code IN ('warning', 'alert', 'danger')),
  seq        SMALLINT     NOT NULL,       -- 단계 안에서의 순서
  target     VARCHAR(200) NOT NULL,       -- 상황 전파 대상
  dept       VARCHAR(100) NOT NULL,       -- 대응 부서
  action     VARCHAR(500) NOT NULL,       -- 현장 조치 사항
  UNIQUE (service_id, risk_code, seq)
);

-- ───────────────────────────── 대응 지시·조치 이력 ─────────────────────────────
-- 키 jeju-ax-response-log (incidents, orders, logs)
-- 사건 ID 형식: INC-YYYYMMDD-<서비스 약어>-NN  (같은 서비스는 종료 전까지 한 사건)
CREATE TABLE incident (
  id         VARCHAR(40) PRIMARY KEY,
  service_id VARCHAR(20) NOT NULL REFERENCES service (id),
  opened_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  closed_at  TIMESTAMP WITH TIME ZONE
);
CREATE INDEX ix_incident_service_open ON incident (service_id, closed_at);

-- 지시 상태 흐름: 지시 → 전달 → 수행 중 → 완료 / 실패(실패 → 수행 중 재시도 가능). 건너뛰기 불가는 앱(responseLogic.NEXT_STATUS)과 같은 규칙을 서버에서도 검사할 것
CREATE TABLE response_order (
  id           VARCHAR(40)  PRIMARY KEY,
  incident_id  VARCHAR(40)  NOT NULL REFERENCES incident (id),
  title        VARCHAR(300) NOT NULL,
  assignee     VARCHAR(100) NOT NULL,
  dept         VARCHAR(100),
  status       VARCHAR(10)  NOT NULL CHECK (status IN ('지시', '전달', '수행 중', '완료', '실패')),
  created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
  result_text       VARCHAR(500),
  -- 승인 기반 실행: 실제 조치(경보·발령·대피·출동·통제·차단·제어·발송·명령)는 승인 전 '전달' 불가. 승인이 필요 없는 지시는 NULL
  approval_status VARCHAR(4) CHECK (approval_status IN ('대기', '승인', '반려')),
  approval_by     VARCHAR(100),
  approval_at     TIMESTAMP WITH TIME ZONE,
  approval_note   VARCHAR(300)
);
CREATE INDEX ix_order_incident ON response_order (incident_id);
CREATE INDEX ix_order_pending ON response_order (approval_status);

-- 상태가 바뀔 때마다 한 줄(누가·언제·어떤 상태로·메모)
CREATE TABLE response_order_event (
  id        BIGINT      PRIMARY KEY,   -- 자동 증가 열(GENERATED ... AS IDENTITY 등)로 바꿔 쓴다
  order_id  VARCHAR(40) NOT NULL REFERENCES response_order (id),
  changed_at        TIMESTAMP WITH TIME ZONE NOT NULL,
  status    VARCHAR(10) NOT NULL,
  actor        VARCHAR(100) NOT NULL,
  note      VARCHAR(300)
);
CREATE INDEX ix_order_event_order ON response_order_event (order_id, changed_at);

-- 조치 기록(타임라인). kind: 감지·판단·조치·지시·결과·전파·메모·종료
CREATE TABLE response_log (
  id          VARCHAR(40) PRIMARY KEY,
  incident_id VARCHAR(40) NOT NULL REFERENCES incident (id),
  logged_at          TIMESTAMP WITH TIME ZONE NOT NULL,
  kind        VARCHAR(10) NOT NULL CHECK (kind IN ('감지', '판단', '조치', '지시', '결과', '전파', '메모', '종료')),
  body        VARCHAR(1000) NOT NULL,
  actor          VARCHAR(100) NOT NULL,
  ref         VARCHAR(100)             -- 연결된 지시 ID 등
);
CREATE INDEX ix_response_log_incident ON response_log (incident_id, logged_at);

-- ───────────────────────────── 이용 이력 ─────────────────────────────
-- 키 jeju-ax-audit-log (앱은 최근 1000건만 보관하고, 같은 사람이 같은 일을 1분 안에 되풀이하면 한 줄로 묶어 count를 올린다)
CREATE TABLE audit_log (
  id       VARCHAR(40)  PRIMARY KEY,
  logged_at       TIMESTAMP WITH TIME ZONE NOT NULL,
  actor       VARCHAR(100) NOT NULL,       -- "이름(기관ID)"
  category VARCHAR(10)  NOT NULL CHECK (category IN ('접속', '데이터 처리', '시스템 변경')),
  action   VARCHAR(200) NOT NULL,
  target   VARCHAR(200),
  repeat_count    INTEGER      NOT NULL DEFAULT 1
);
CREATE INDEX ix_audit_at ON audit_log (logged_at);
CREATE INDEX ix_audit_category ON audit_log (category, logged_at);

-- ───────────────────────────── 연계 오류 ─────────────────────────────
-- 키 jeju-ax-integration-issues. 흐름: 접수 → 수정 중 → 재검증 → 완료(완료는 같은 점검을 다시 돌려 정상일 때만)
CREATE TABLE integration_issue (
  id         VARCHAR(40)  PRIMARY KEY,
  check_id   VARCHAR(100),               -- 자동 점검에서 접수했으면 그 점검 ID
  system     VARCHAR(100) NOT NULL,
  issue_type       VARCHAR(20)  NOT NULL CHECK (issue_type IN ('수신 실패', '일부 수신 실패', '값 불일치', '누락·중복', '형식 오류')),
  detail     VARCHAR(500) NOT NULL,
  status     VARCHAR(10)  NOT NULL CHECK (status IN ('접수', '수정 중', '재검증', '완료')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_check_at TIMESTAMP WITH TIME ZONE,
  last_check_ok BOOLEAN,
  last_check_text VARCHAR(300)
);
CREATE INDEX ix_issue_status ON integration_issue (status);
CREATE TABLE integration_issue_event (
  id       BIGINT      PRIMARY KEY,
  issue_id VARCHAR(40) NOT NULL REFERENCES integration_issue (id),
  changed_at       TIMESTAMP WITH TIME ZONE NOT NULL,
  status   VARCHAR(10) NOT NULL,
  actor       VARCHAR(100) NOT NULL,
  note     VARCHAR(300)
);

-- ───────────────────────────── 상황판단 시나리오 ─────────────────────────────
-- 키 jeju-ax-scenarios (scenarios, runs, notes). 시험 기록은 실제 사건 기록(incident·response_*)과 섞이지 않게 따로 둔다
CREATE TABLE scenario (
  id         VARCHAR(40)  PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  service_id VARCHAR(20)  NOT NULL REFERENCES service (id),
  subject    VARCHAR(100) NOT NULL,      -- 발생 지점·구역 이름
  metric_id  VARCHAR(40)  NOT NULL       -- 지표 ID(기상청 특보 서비스는 'kma')
);
CREATE TABLE scenario_phase (
  id          VARCHAR(40) PRIMARY KEY,
  scenario_id VARCHAR(40) NOT NULL REFERENCES scenario (id),
  seq         SMALLINT    NOT NULL,
  observed_value       DOUBLE PRECISION NOT NULL, -- 관측값(기상청 특보는 1 예비특보 · 2 주의보 · 3 경보 · 4 심각)
  minutes     INTEGER     NOT NULL,      -- 앞 단계로부터 지난 분
  expect      VARCHAR(10) NOT NULL CHECK (expect IN ('normal', 'warning', 'alert', 'danger')),
  UNIQUE (scenario_id, seq)
);
-- 실행 기록은 당시 시나리오를 그대로 보관(수정해도 기록이 변하지 않게). phases·snapshot은 앱의 JSON 구조 그대로
CREATE TABLE scenario_run (
  id            VARCHAR(40)  PRIMARY KEY,
  scenario_id   VARCHAR(40)  NOT NULL,   -- 시나리오가 지워져도 기록은 남으므로 FK를 걸지 않는다
  scenario_name VARCHAR(100) NOT NULL,
  service_id    VARCHAR(20)  NOT NULL REFERENCES service (id),
  started_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  phases        JSON NOT NULL,
  snapshot      JSON NOT NULL
);
CREATE INDEX ix_run_started ON scenario_run (started_at);
CREATE TABLE scenario_note (
  id          VARCHAR(40)  PRIMARY KEY,
  created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
  body        VARCHAR(1000) NOT NULL,
  scenario_id VARCHAR(40),
  done        BOOLEAN NOT NULL DEFAULT FALSE
);

-- ───────────────────────────── 공통 이벤트 ─────────────────────────────
-- 스키마 jeju-ax.common-event/1 (public/mock-api/v1/schema/common-event.schema.json). 실증사·기상청·행안부 데이터를 같은 모양으로 받는다
CREATE TABLE common_event (
  id           VARCHAR(100) PRIMARY KEY,
  service_id   VARCHAR(20)  NOT NULL,     -- 서비스 ID 또는 'common'
  title        VARCHAR(300) NOT NULL,
  occurred_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  subject_name VARCHAR(100) NOT NULL,
  subject_kind VARCHAR(10)  NOT NULL CHECK (subject_kind IN ('지점', '구역', '지역', '취수구', '태풍')),
  lat          DOUBLE PRECISION,
  lng          DOUBLE PRECISION,
  risk_level   VARCHAR(10)  NOT NULL CHECK (risk_level IN ('normal', 'caution', 'warning', 'alert', 'danger')),
  risk_basis   VARCHAR(300),
  observation  JSON NOT NULL,             -- Measure[] (name, value, unit, at, threshold)
  prediction   JSON,                      -- { horizon, values, model }
  alert_status VARCHAR(4) CHECK (alert_status IN ('발령', '해제')),
  alert_title  VARCHAR(300),
  alert_issued_at TIMESTAMP WITH TIME ZONE,
  alert_channel   VARCHAR(100),
  source_system VARCHAR(100) NOT NULL,
  source_origin VARCHAR(10)  NOT NULL CHECK (source_origin IN ('기상청', '행정안전부', '실증사', '샘플')),
  is_sample     BOOLEAN      NOT NULL     -- 샘플 값은 운영에서 걸러 내거나 '샘플' 표시를 유지한다
);
CREATE INDEX ix_event_service_time ON common_event (service_id, occurred_at);
CREATE INDEX ix_event_risk ON common_event (risk_level, occurred_at);

-- ═════════════════════════════ 2부: 기준정보·관측값·위험 단계 조건·상황 전파 ═════════════════════════════
-- 1부는 지금 브라우저에 저장되는 값이고, 2부는 지금 코드·JSON에 들어 있거나 외부에서 받아 오는 값이다.
-- 외부 연계 자료는 10월 중순에 받으므로 열은 확정이 아니라 현재 화면이 쓰는 필드 기준의 초안이다.

-- ───────────────────────────── 관측 지점·관측값 ─────────────────────────────
-- 하천 지점(public/data/pilot-batch.json river.points), 취수구(aqua.intakes), 해수욕장(coast.sites), 스마트폴(river.smartPoles),
-- 우량계·침수센서·적설계·풍속풍향계(수집 데이터 엑셀) 등 값을 받는 모든 지점을 한 표에 둔다.
CREATE TABLE monitoring_point (
  id         VARCHAR(60)  PRIMARY KEY,   -- 예: donnaeko, hamdeok, hangyeong, pole-1
  service_id VARCHAR(20)  NOT NULL REFERENCES service (id),
  kind       VARCHAR(30)  NOT NULL,      -- 하천 지점 / 취수구 / 해수욕장 / 스마트폴 / 우량계 / 침수센서 / 적설계 / 풍속풍향계 / 부이 ...
  name       VARCHAR(100) NOT NULL,
  lat        DOUBLE PRECISION,
  lng        DOUBLE PRECISION,
  confirmed  BOOLEAN      NOT NULL DEFAULT FALSE,   -- 위치·기준이 확정됐는지(FALSE면 화면에 '확인 필요')
  attributes JSON,                       -- 지점별 부가 값: 하천 위험 수위 boundaryM, 해수욕장 수용 한도 limit(150) 등
  is_sample  BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_point_service ON monitoring_point (service_id, kind);

-- 관측·예측 시계열. 실증사 배치의 history/forecast, 수집 데이터 엑셀 한 줄, 외부 API 관측값을 같은 모양으로 받는다.
CREATE TABLE observation (
  id             BIGINT       PRIMARY KEY,   -- 자동 증가 열로 바꿔 쓴다
  point_id       VARCHAR(60)  NOT NULL REFERENCES monitoring_point (id),
  metric         VARCHAR(40)  NOT NULL,      -- levelM(수위 m), flowRatioPercent(유량비 %), salinity(psu), tempC, waveM, windMs, crowdCount, rainMm ...
  observed_value DOUBLE PRECISION,           -- 숫자가 아닌 값(상태 문구 등)은 value_text에
  value_text     VARCHAR(100),
  unit           VARCHAR(20),
  observed_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  is_predicted   BOOLEAN      NOT NULL DEFAULT FALSE,   -- 예측값 여부(AI 예측·forecast)
  collect_status VARCHAR(10)  NOT NULL DEFAULT '정상' CHECK (collect_status IN ('정상', '지연', '누락', '오류', '미연계')),
  quality_score  SMALLINT     CHECK (quality_score BETWEEN 0 AND 100),
  collect_cycle  VARCHAR(20),                -- 수집 주기(예: 10분)
  source_system  VARCHAR(100),
  is_sample      BOOLEAN      NOT NULL DEFAULT FALSE
);
CREATE INDEX ix_obs_point_metric_time ON observation (point_id, metric, observed_at);
CREATE INDEX ix_obs_time ON observation (observed_at);

-- 지점 장비 상태(스마트폴의 정상/점검, 배터리 등) — 마지막 상태 스냅샷
CREATE TABLE point_status (
  point_id        VARCHAR(60) PRIMARY KEY REFERENCES monitoring_point (id),
  status          VARCHAR(20) NOT NULL,
  battery_percent SMALLINT,
  updated_at      TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ───────────────────────────── 시설·CCTV·연락처 ─────────────────────────────
-- 대피·수용 시설(민방위 대피소 등 5종)과 무더위쉼터. 행안부 재난안전데이터공유플랫폼에서 받아 둔 스냅샷을 옮긴다.
CREATE TABLE shelter (
  id          VARCHAR(60)  PRIMARY KEY,
  kind_id     VARCHAR(30)  NOT NULL,      -- civil-defense, heat, ...
  kind_label  VARCHAR(60)  NOT NULL,
  name        VARCHAR(200) NOT NULL,
  address     VARCHAR(300),
  region      VARCHAR(10)  CHECK (region IN ('제주시', '서귀포시')),
  capacity    INTEGER,
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  detail      VARCHAR(300),
  is_open     BOOLEAN      NOT NULL DEFAULT TRUE,
  source_api  VARCHAR(40),                -- 예: DSSP-IF-00195, DSSP-IF-10942
  fetched_at  TIMESTAMP WITH TIME ZONE
);
CREATE INDEX ix_shelter_kind_region ON shelter (kind_id, region);

CREATE TABLE cctv_camera (
  id          VARCHAR(60)  PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  address     VARCHAR(300),
  domain      VARCHAR(10)  NOT NULL CHECK (domain IN ('aqua', 'coast', 'river', 'snow', 'general')),
  operator    VARCHAR(40)  NOT NULL,      -- 운영 주체(제주시·서귀포시·도 등 — 앱의 CctvOperator 값)
  lat         DOUBLE PRECISION,
  lng         DOUBLE PRECISION,
  stream_url  VARCHAR(500),               -- HLS 주소. 외부에 노출하지 말고 서버에서 중계할 것
  is_sample   BOOLEAN      NOT NULL DEFAULT FALSE
);
-- 수신 상태 이력(마지막 프레임 시각 포함). 앱의 status online/offline과 lastFrameAt에 해당
CREATE TABLE cctv_status_log (
  id            BIGINT      PRIMARY KEY,
  camera_id     VARCHAR(60) NOT NULL REFERENCES cctv_camera (id),
  checked_at    TIMESTAMP WITH TIME ZONE NOT NULL,
  online        BOOLEAN     NOT NULL,
  last_frame_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX ix_cctv_status ON cctv_status_log (camera_id, checked_at);

-- 당직·담당자 연락처(전화번호 등 개인정보 — 접근 권한과 보관 정책을 별도로 정할 것)
CREATE TABLE contact (
  id         VARCHAR(60)  PRIMARY KEY,
  domain     VARCHAR(20)  NOT NULL,       -- general / aqua / coast ...
  role       VARCHAR(100) NOT NULL,
  name       VARCHAR(60)  NOT NULL,
  org        VARCHAR(100) NOT NULL,
  phone      VARCHAR(30),
  channel    VARCHAR(200),               -- 연락 수단(유선·카카오톡·네이버웍스 등)
  updated_at DATE,
  is_sample  BOOLEAN      NOT NULL DEFAULT FALSE
);

-- 레거시(기존) 시스템 목록과 연계 상태, 시스템별 담당자
CREATE TABLE legacy_system (
  id          VARCHAR(40)  PRIMARY KEY,   -- 예: ls-ews, ls-flood-mgmt
  name        VARCHAR(200) NOT NULL,
  operator    VARCHAR(200),
  link_status VARCHAR(20)  NOT NULL,      -- 협의 중 / 연계 진행중 / 연계 완료 등(앱의 linkStatus 값)
  note        VARCHAR(1000)
);
CREATE TABLE legacy_system_contact (
  system_id      VARCHAR(40)  PRIMARY KEY REFERENCES legacy_system (id),
  agency_dept    VARCHAR(100),
  agency_name    VARCHAR(60),
  agency_phone   VARCHAR(30),
  company_name   VARCHAR(100),
  company_person VARCHAR(60),
  company_phone  VARCHAR(30),
  is_sample      BOOLEAN NOT NULL DEFAULT FALSE
);

-- ───────────────────────────── 위험 단계 조건 ─────────────────────────────
-- 위험 단계 조건 정의표(src/data/riskCriteria.ts METRICS). 값 기준(하천 유량비, 연안 파고·풍속, 저염분 염분)과
-- 특보 기반(호우·태풍·지진해일·대설) 문구 기준을 둘 다 담는다. 현재 화면 판정은 코드의 판정 함수가 하므로,
-- DB 값을 바꿔도 화면 판정이 바뀌려면 판정 함수가 이 테이블을 읽도록 고쳐야 한다(tests/riskCriteria.test.mjs 참고).
CREATE TABLE risk_metric (
  service_id VARCHAR(20)  NOT NULL REFERENCES service (id),
  metric_id  VARCHAR(40)  NOT NULL,       -- flow, wave, wind, salinity ...
  label      VARCHAR(100) NOT NULL,
  unit       VARCHAR(20)  NOT NULL,
  direction  VARCHAR(4)   NOT NULL CHECK (direction IN ('high', 'low')),   -- high: 클수록 위험, low: 작을수록 위험
  note       VARCHAR(1000),
  PRIMARY KEY (service_id, metric_id)
);
CREATE TABLE risk_threshold (
  service_id  VARCHAR(20) NOT NULL,
  metric_id   VARCHAR(40) NOT NULL,
  risk_code   VARCHAR(10) NOT NULL CHECK (risk_code IN ('warning', 'alert', 'danger')),
  threshold   DOUBLE PRECISION NOT NULL,
  is_strict   BOOLEAN     NOT NULL DEFAULT FALSE,   -- TRUE면 경계값 '초과/미만', FALSE면 '이상/이하'
  PRIMARY KEY (service_id, metric_id, risk_code),
  FOREIGN KEY (service_id, metric_id) REFERENCES risk_metric (service_id, metric_id)
);
CREATE TABLE risk_stage_text (
  service_id VARCHAR(20)   NOT NULL REFERENCES service (id),
  risk_code  VARCHAR(10)   NOT NULL CHECK (risk_code IN ('warning', 'alert', 'danger')),
  body       VARCHAR(1000) NOT NULL,       -- 특보 기반 서비스의 단계별 조건 문구
  PRIMARY KEY (service_id, risk_code)
);

-- ───────────────────────────── 상황 전파·메시지 ─────────────────────────────
CREATE TABLE message_kind (
  id      VARCHAR(20)  PRIMARY KEY,       -- bulletin(특보 발효) / advice(사전대피 권고) / order(대피명령 발령) / release(해제)
  label   VARCHAR(40)  NOT NULL,
  channel VARCHAR(10)  NOT NULL CHECK (channel IN ('안전안내', '긴급재난')),
  note    VARCHAR(300)
);
CREATE TABLE message_limit (
  id        VARCHAR(20) PRIMARY KEY,      -- cbs / dmb / broadcast
  label     VARCHAR(60) NOT NULL,
  max_chars INTEGER     NOT NULL
);
-- 서비스·유형별 문안 틀(시각·지역·상황·행동 지시·기관명 자리는 {이름} 형태로 둔다)
CREATE TABLE message_template (
  id         VARCHAR(40)   PRIMARY KEY,
  kind_id    VARCHAR(20)   NOT NULL REFERENCES message_kind (id),
  service_id VARCHAR(20)   REFERENCES service (id),    -- NULL이면 공통
  body       VARCHAR(1000) NOT NULL
);
CREATE TABLE propagation_channel (
  id     VARCHAR(40)  PRIMARY KEY,
  name   VARCHAR(100) NOT NULL,
  detail VARCHAR(500)
);
-- 보고체계(행정시 → 도청 → 행정안전부)
CREATE TABLE reporting_chain_step (
  id    VARCHAR(40)  PRIMARY KEY,
  seq   SMALLINT     NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL,
  role  VARCHAR(60)  NOT NULL
);
-- 실제 발송 기록. 지금 앱은 문안 구성까지만 하고 발송하지 않으므로 비어 있다(발송 연동 후 사용)
CREATE TABLE propagation_dispatch (
  id          VARCHAR(40)   PRIMARY KEY,
  incident_id VARCHAR(40)   REFERENCES incident (id),
  order_id    VARCHAR(40)   REFERENCES response_order (id),
  kind_id     VARCHAR(20)   REFERENCES message_kind (id),
  channel_id  VARCHAR(40)   REFERENCES propagation_channel (id),
  target      VARCHAR(200)  NOT NULL,       -- 전파 대상(e-SOP 단계의 target)
  body        VARCHAR(1000) NOT NULL,
  sent_at     TIMESTAMP WITH TIME ZONE,
  actor       VARCHAR(100),
  result      VARCHAR(10)   CHECK (result IN ('성공', '실패', '대기')),
  result_note VARCHAR(300)
);
CREATE INDEX ix_dispatch_incident ON propagation_dispatch (incident_id, sent_at);
-- 순차 전파로 걸린 시간 기록(도청 → 시 → 읍면동 단계별 도달)
CREATE TABLE propagation_history (
  id          VARCHAR(40)  PRIMARY KEY,
  title       VARCHAR(200) NOT NULL,
  occurred_on DATE         NOT NULL,
  total_delay VARCHAR(40),
  steps       VARCHAR(500)
);

-- ───────────────────────────── 외부 수신 원본 ─────────────────────────────
-- 긴급재난문자(행안부 DSSP-IF-00247). 앱은 공통 이벤트(common_event)로도 변환하지만 원문은 별도로 보관한다
CREATE TABLE disaster_message (
  id          VARCHAR(40)   PRIMARY KEY,   -- 원본 일련번호
  sent_at     TIMESTAMP WITH TIME ZONE NOT NULL,
  region      VARCHAR(500)  NOT NULL,      -- 수신 지역(쉼표로 이어진 원문)
  body        VARCHAR(2000) NOT NULL,
  fetched_at  TIMESTAMP WITH TIME ZONE
);
CREATE INDEX ix_dmsg_sent ON disaster_message (sent_at);

-- ───────────────────────────── 화면 입력값 ─────────────────────────────
-- 사이드패널 입력(/panel-input) — 영역(part)마다 있음/없음이 의미를 가지므로 영역 하나를 한 줄에 둔다.
-- part_key: sensorSummary, serviceSensors, sensorAlerts, trends, stages, actions, responseExtra. 행이 없으면 '입력 없음'(스테이징은 샘플 표시)이다.
-- 연계가 붙으면 이 값들은 관측값(observation)·센서 상태로 대체되므로 임시 테이블로 본다.
CREATE TABLE panel_input (
  part_key   VARCHAR(30) PRIMARY KEY,
  payload    JSON        NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_by VARCHAR(100)
);
