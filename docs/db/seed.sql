-- 공통 코드 초기값 (schema.sql 실행 후). 역할 × 권한 기본값은 src/data/rolesLogic.ts의 defaultPolicy()와 같게 넣는다.
INSERT INTO service (id, title, code, hidden) VALUES
  ('heavy-rain', '호우', 'RAIN', FALSE),
  ('typhoon', '태풍', 'TYP', FALSE),
  ('heat', '폭염 대응', 'HEAT', TRUE),
  ('wildfire', '산불', 'FIRE', TRUE),
  ('tsunami', '지진해일', 'TSU', FALSE),
  ('snow', '대설', 'SNOW', FALSE),
  ('river', '하천범람', 'RIV', FALSE),
  ('aqua', '저염분 고수온', 'AQUA', FALSE),
  ('coast', '연안 안전관리', 'COAST', FALSE);

INSERT INTO risk_level (code, label, rank_no) VALUES
  ('normal', '정상', 0), ('warning', '주의', 1), ('alert', '경계', 2), ('danger', '심각', 3);

INSERT INTO app_role (id, label) VALUES
  ('control', '상황실'), ('vendor', '실증사'), ('field', '현장'), ('admin', '관리자');
