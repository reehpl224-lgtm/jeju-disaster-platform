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
