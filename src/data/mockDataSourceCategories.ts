/**
 * 서비스별 데이터 출처 4단계 분류 — docs/data-sources-by-service.md(2026-09-28)를 화면에 노출하기
 * 위해 구조화한 것. 새 수치를 만들지 않고 그 문서 내용을 그대로 옮긴 것이라, 이 문서가 갱신되면
 * 여기도 같이 갱신해야 한다.
 *
 * ① available(현재 사용 가능) — 화면에 실제로 연동돼 있는 데이터(실시간 API, 실측 스냅샷 등)
 * ② legacy(제주 레거시, 미적용) — 도·행정시가 이미 보유했지만 아직 화면에 연동 안 된 데이터
 * ③ requestable(요청 가능) — 3대 실증서비스 실증사 컨소시엄으로부터 받을 수 있는 데이터
 * ④ missing(현재 없는 데이터) — 필요하지만 현재는 구할 방법이 없는 데이터
 */

export type DataSourceCategory = "available" | "legacy" | "requestable" | "missing"

export interface DataSourceItem {
  id: string
  label: string
  note?: string
}

export interface ServiceDataSources {
  serviceId: "heavyRain" | "typhoon" | "heat" | "river" | "aqua" | "coast"
  available: DataSourceItem[]
  legacy: DataSourceItem[]
  requestable: DataSourceItem[]
  missing: DataSourceItem[]
}

export const dataSourcesByService: Record<ServiceDataSources["serviceId"], ServiceDataSources> = {
  river: {
    serviceId: "river",
    available: [
      { id: "r-a1", label: "KHOA 모슬포 조위관측소", note: "정적 스냅샷" },
      { id: "r-a2", label: "기상청 AWS 우량·기온·습도·풍속·풍향", note: "서귀포·제주남원 참고지점, 10분 평균, 실시간" },
      { id: "r-a3", label: "기상청 단기예보·호우특보", note: "실시간" },
    ],
    legacy: [
      { id: "r-l1", label: "재난 예·경보시스템(자동침수경보·하천모니터링·자동우량정보)", note: "연계 진행중 — 화면 값은 아직 더미" },
      { id: "r-l2", label: "레거시 침수정보센서 135개소", note: "제주시 66·서귀포시 69" },
      { id: "r-l3", label: "조기경보시스템", note: "협의 중" },
      { id: "r-l4", label: "제주시 하천 유속측정계", note: "도청 미연계, 2차년도 검토" },
    ],
    requestable: [
      { id: "r-r1", label: "10·30·60분 다중 선행예측 + 단계전환 ETA" },
      { id: "r-r2", label: "1시간 선행 범람예측", note: "정확도 85%↑" },
      { id: "r-r3", label: "서귀포 자동우량경보 FEP 연계" },
      { id: "r-r4", label: "효돈천 AIoT 5종 계측망", note: "수위·유속·기상·강우·CCTV, 1차년도 상류 3개소" },
      { id: "r-r5", label: "NGSI-LD 표준 융합데이터 3종" },
      { id: "r-r6", label: "ETRI 효돈천 수문데이터", note: "2011~2023, 실증사 이미 보유" },
    ],
    missing: [
      { id: "r-m1", label: "실시간 하천수위 실측값", note: "현재 더미" },
      { id: "r-m2", label: "5초 직결 현장경보", note: "스마트폴 인허가 등 조건부" },
      { id: "r-m3", label: "컨트롤타워 전용 위젯·sLLM 연동", note: "2027년 예정" },
    ],
  },
  aqua: {
    serviceId: "aqua",
    available: [{ id: "a-a1", label: "KHOA 해양관측부이·조위관측소", note: "공공API, 확인 시점 스냅샷" }],
    legacy: [
      { id: "a-l1", label: "도 자체 관측 레거시 시스템", note: "없음 — 공공API·실증사 데이터 중심" },
      { id: "a-l2", label: "제주도 재난관리시스템", note: "협의 중, 경보 발령 시 상황등록 연계용" },
    ],
    requestable: [
      { id: "a-r1", label: "ROMS·NEMO + AI 하이브리드 예측", note: "정합도 85%↑" },
      { id: "a-r2", label: "GOCI-II·SMAP 위성 수괴탐지" },
      { id: "a-r3", label: "양쯔강 유출량·GFS/CMEMS 기상 재분석" },
      { id: "a-r4", label: "대응가이드 + 취수구 도달 ETA + XAI 근거" },
      { id: "a-r5", label: "제주도 해양수산연구원 기존 예측시스템", note: "수요처 협조 필요" },
      { id: "a-r6", label: "1996년 이후 저염분수 피해이력", note: "이미 확보" },
      { id: "a-r7", label: "신규 수온·염분 센서 2지점", note: "조건부·추가제안" },
    ],
    missing: [
      { id: "a-m1", label: "1km 이하 초해상화 예측", note: "1차는 8km, 2차년도 목표" },
      { id: "a-m2", label: "어가 다채널 자동경보", note: "승인권자 미확정, 조건부" },
      { id: "a-m3", label: "경보 대상 확대", note: "제주 연안 생물 등, 2차년도" },
    ],
  },
  coast: {
    serviceId: "coast",
    available: [
      { id: "c-a1", label: "기상청 해양관측(sea_obs)", note: "함덕(김녕 인근)·협재 지점만 필터링, 실시간" },
      { id: "c-a2", label: "KHOA 부이 스냅샷" },
      { id: "c-a3", label: "기상청 단기예보·풍랑/해일특보", note: "실시간" },
    ],
    legacy: [
      { id: "c-l1", label: "함덕 종합상황실 기존 CCTV·방송스피커", note: "협의 완료, 협재는 확인 필요" },
      { id: "c-l2", label: "도 자체관제 CCTV 약 1.2만대", note: "연계 검토 — 30일 순환저장·반출 불가" },
      { id: "c-l3", label: "소방안전본부 시스템", note: "미연계" },
      { id: "c-l4", label: "민방위경보시스템", note: "미연계" },
    ],
    requestable: [
      { id: "c-r1", label: "AI CCTV 위험탐지", note: "YOLO·ESOD·MobileSeg" },
      { id: "c-r2", label: "4대 위험요인 4단계 판단" },
      { id: "c-r3", label: "해양·기상 관측 5개소 연계 + LDAPS/RWW3 예측" },
      { id: "c-r4", label: "VLM(Gemma3) 상황해석·해경 자동알림" },
      { id: "c-r5", label: "현장경보 스마트폴", note: "공유수면 점용허가 필요, 조건부" },
    ],
    missing: [
      { id: "c-m1", label: "연안 사고 영상 등 과거 학습데이터", note: "전무 — 모의 데이터로 대체" },
      { id: "c-m2", label: "다중채널 5초 자동전파", note: "기관 협의 필요, 조건부" },
    ],
  },
  heavyRain: {
    serviceId: "heavyRain",
    available: [
      { id: "hr-a1", label: "기상청 단기예보·호우/강풍특보", note: "실시간" },
      { id: "hr-a2", label: "AWS 우량 참고관측", note: "실시간" },
    ],
    legacy: [
      { id: "hr-l1", label: "강우량 연동 자동 경보 발령시스템·자동 침수 경보시스템·하천 모니터링시스템", note: "연계 진행중이나 화면 우량계·침수센서 값은 여전히 더미" },
      { id: "hr-l2", label: "조기경보 통합 상황관리 연계시스템·풍수해 상황 관리시스템", note: "협의 중" },
      { id: "hr-l3", label: "제주시 하천 유속측정계·서귀포시 자동 우량 경보", note: "도청 미연계" },
    ],
    requestable: [
      { id: "hr-r1", label: "전담 실증사 없음", note: "다만 하천 실증사(소다시스템)의 효돈천 AIoT 우량 데이터를 참고 공유받을 여지는 있음" },
    ],
    missing: [
      { id: "hr-m1", label: "우량계 외 적설계·풍속풍향계 실시간 원본값", note: "성산 등 — 지점 조회가 네트워크 정책으로 보류" },
      { id: "hr-m2", label: "적설(SD) 실측", note: "방재기상관측 AWS API 자체에 필드 없어 연동 불가 확인" },
      { id: "hr-m3", label: "적설·풍속풍향 자체의 AI 위험판정 로직", note: "우선순위 낮아 미검토" },
    ],
  },
  typhoon: {
    serviceId: "typhoon",
    available: [
      { id: "ty-a1", label: "기상청 API허브 태풍 이름목록·실시간 위치", note: "typ_lst·typ_now, 실시간" },
      { id: "ty-a2", label: "태풍특보", note: "실시간" },
      { id: "ty-a3", label: "기상청 단기예보" },
      { id: "ty-a4", label: "KHOA/기상청 해양관측", note: "보조 참고" },
    ],
    legacy: [{ id: "ty-l1", label: "해당 없음", note: "태풍 관련 도·행정시 레거시 시스템 자체가 없음" }],
    requestable: [{ id: "ty-r1", label: "해당 없음", note: "전담 실증사 없음" }],
    missing: [{ id: "ty-m1", label: "자체 관측 실측 데이터", note: "구조적으로 존재하지 않음 — 기상청 발표를 전량 수신하는 설계" }],
  },
  heat: {
    serviceId: "heat",
    available: [
      { id: "ht-a1", label: "기상청 단기예보", note: "실시간" },
      { id: "ht-a2", label: "폭염·열대야 특보", note: "실시간" },
      { id: "ht-a3", label: "기상청 공식 폭염특보 임계값 기준", note: "체감 33℃/35℃" },
    ],
    legacy: [{ id: "ht-l1", label: "해당 없음", note: "면담 결과서의 레거시 목록에 폭염 전용 시스템이 없음" }],
    requestable: [{ id: "ht-r1", label: "해당 없음", note: "전담 실증사 없음" }],
    missing: [
      { id: "ht-m1", label: "무더위쉼터 실제 위치·정원 공식 리스트", note: "현재는 예시 구성 5개소" },
      { id: "ht-m2", label: "열섬지도 정밀 데이터", note: "현재는 대표 구간 수준" },
    ],
  },
}
