export interface ToolboxCheckItem {
  id: string
  label: string
  defaultChecked: boolean
}

export interface ToolboxChipItem {
  id: string
  label: string
  defaultChecked: boolean
  activeColor: "blue" | "green"
}

export interface ToolboxSection {
  id: string
  heading: string
  headingChecked?: boolean
  kind: "checkbox" | "chip" | "radio"
  items: (ToolboxCheckItem | ToolboxChipItem)[]
}

export interface ToolboxPanel {
  id: string
  icon: string
  buttonLabel: string
  panelTitle: string
  sections: ToolboxSection[]
}

export const TOOLBOX_PANELS: ToolboxPanel[] = [
  {
    id: "weather",
    icon: "🌪️",
    buttonLabel: "기상/재난",
    panelTitle: "기상/재난",
    sections: [
      {
        id: "warning",
        heading: "기상특보",
        headingChecked: true,
        kind: "chip",
        items: [
          { id: "typhoon", label: "태풍", defaultChecked: false, activeColor: "blue" },
          { id: "heavy-rain", label: "호우", defaultChecked: true, activeColor: "blue" },
          { id: "strong-wind", label: "강풍", defaultChecked: true, activeColor: "green" },
          { id: "dry", label: "건조", defaultChecked: false, activeColor: "blue" },
          { id: "heavy-snow", label: "대설", defaultChecked: false, activeColor: "blue" },
          { id: "heat-wave", label: "폭염", defaultChecked: false, activeColor: "blue" },
          { id: "yellow-dust", label: "황사", defaultChecked: false, activeColor: "blue" },
          { id: "cold-wave", label: "한파", defaultChecked: false, activeColor: "blue" },
          { id: "tsunami", label: "해일", defaultChecked: false, activeColor: "blue" },
        ],
      },
      {
        id: "disaster-info",
        heading: "재난정보",
        headingChecked: false,
        kind: "checkbox",
        items: [
          { id: "flood", label: "홍수", defaultChecked: false },
          { id: "earthquake", label: "지진", defaultChecked: false },
          { id: "wildfire", label: "산불", defaultChecked: false },
          { id: "landslide", label: "산사태", defaultChecked: false },
        ],
      },
      {
        id: "watch-zone",
        heading: "감시구역",
        headingChecked: false,
        kind: "checkbox",
        items: [{ id: "typhoon-zone", label: "태풍 비상·경계·감시구역 경계", defaultChecked: false }],
      },
    ],
  },
  {
    id: "model",
    icon: "🌐",
    buttonLabel: "기상모델",
    panelTitle: "기상모델",
    sections: [
      {
        id: "kma",
        heading: "기상청",
        kind: "checkbox",
        items: [{ id: "kma-rain", label: "강수", defaultChecked: true }],
      },
      {
        id: "de-model",
        heading: "독일모델",
        kind: "checkbox",
        items: [
          { id: "de-rain", label: "강수", defaultChecked: false },
          { id: "de-wind", label: "바람", defaultChecked: false },
          { id: "de-temp", label: "기온", defaultChecked: false },
          { id: "de-cloud", label: "구름", defaultChecked: false },
        ],
      },
      {
        id: "us-model",
        heading: "미국모델",
        kind: "checkbox",
        items: [
          { id: "us-rain", label: "강수", defaultChecked: false },
          { id: "us-wind", label: "바람", defaultChecked: false },
          { id: "us-temp", label: "기온", defaultChecked: false },
          { id: "us-cloud", label: "구름", defaultChecked: false },
        ],
      },
    ],
  },
  {
    // GIS 상황_재난위험도 구성예시(화면 ID 43) — 라디오 단일 선택
    id: "flood-risk",
    icon: "🌊",
    buttonLabel: "재난위험도",
    panelTitle: "재난위험도",
    sections: [
      {
        id: "flood-hazard",
        heading: "침수위험도",
        kind: "radio",
        items: [
          { id: "river-hazard-map", label: "하천위험지도(홍수통제소)", defaultChecked: true },
          { id: "city-flood-map", label: "도시침수위험지도(홍수통제소)", defaultChecked: false },
        ],
      },
      {
        id: "flood-safety",
        heading: "범람, 안전위험도",
        kind: "radio",
        items: [
          { id: "river-flood-risk", label: "하천 범람 위험도", defaultChecked: false },
          { id: "coast-safety-risk", label: "연안 안전 위험도", defaultChecked: false },
          { id: "low-salinity-risk", label: "저염분수 위험도", defaultChecked: false },
          { id: "high-temp-risk", label: "고수온 위험도", defaultChecked: false },
        ],
      },
      {
        id: "ai-risk",
        heading: "AI 예측 위험도",
        kind: "radio",
        items: [
          { id: "ai-river-flood", label: "하천범람 예측 위험도 (선행 1시간)", defaultChecked: false },
          { id: "ai-coast-safety", label: "연안안전 예측 위험도 (선행 24~48시간)", defaultChecked: false },
          { id: "ai-aqua", label: "저염분수·고수온 예측 위험도 (선행 48~120시간)", defaultChecked: false },
        ],
      },
      {
        id: "flood-trace",
        heading: "침수흔적도",
        kind: "radio",
        items: [{ id: "flood-history", label: "침수이력", defaultChecked: false }],
      },
    ],
  },
  {
    // GIS 상황_CCTV/센서 구성예시(화면 ID 44) — 라디오 단일 선택
    id: "cctv",
    icon: "📹",
    buttonLabel: "CCTV/센서",
    panelTitle: "CCTV/센서",
    sections: [
      {
        id: "cctv-source",
        heading: "CCTV",
        kind: "radio",
        items: [
          { id: "public-cctv", label: "공공CCTV", defaultChecked: true },
          { id: "disaster-cctv", label: "재난관측", defaultChecked: false },
          { id: "coast-smart-cctv", label: "연안 지능형 CCTV", defaultChecked: false },
        ],
      },
      {
        id: "sensor",
        heading: "센서",
        kind: "radio",
        items: [
          { id: "coast-weather-sensor", label: "연안 기상센서", defaultChecked: false },
          { id: "river-level-gauge", label: "하천 수위계", defaultChecked: false },
          { id: "river-rain-radar", label: "하천 강우레이더", defaultChecked: false },
          { id: "river-flood-sensor-center", label: "하천 침수정보센터", defaultChecked: false },
        ],
      },
      {
        id: "alarm",
        heading: "경보장치",
        kind: "radio",
        items: [{ id: "coast-alarm-speaker", label: "연안 경보스피커", defaultChecked: false }],
      },
      {
        id: "traffic",
        heading: "도로교통",
        kind: "radio",
        items: [{ id: "traffic-control", label: "교통 통제 정보", defaultChecked: false }],
      },
    ],
  },
  {
    // GIS 상황_유관기관 구성예시(화면 ID 45) — 체크박스 다중 선택, 기본값 전체 체크
    id: "agency",
    icon: "🏥",
    buttonLabel: "유관기관",
    panelTitle: "유관기관",
    sections: [
      {
        id: "agency-emergency",
        heading: "긴급대응",
        kind: "checkbox",
        items: [
          { id: "fire-station", label: "소방서", defaultChecked: true },
          { id: "police-station", label: "경찰서", defaultChecked: true },
          { id: "coast-guard", label: "해양경찰서", defaultChecked: true },
          { id: "evac-shelter", label: "대피소", defaultChecked: true },
          { id: "victim-housing", label: "이재민 거주시설", defaultChecked: true },
          { id: "hospital", label: "병원", defaultChecked: true },
        ],
      },
      {
        id: "agency-marine",
        heading: "수산·해양",
        kind: "checkbox",
        items: [
          { id: "marine-research", label: "해양수산연구", defaultChecked: true },
          { id: "flood-control-office", label: "홍수통제소", defaultChecked: true },
        ],
      },
    ],
  },
]
