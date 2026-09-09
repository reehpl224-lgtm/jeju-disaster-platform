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
  kind: "checkbox" | "chip"
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
    id: "flood-risk",
    icon: "🌊",
    buttonLabel: "재난위험도",
    panelTitle: "재난위험도",
    sections: [
      {
        id: "flood-map",
        heading: "",
        kind: "checkbox",
        items: [
          { id: "river-flood-map", label: "하천위험지도(홍수통제소)", defaultChecked: false },
          { id: "city-flood-map", label: "도시침수위험지도(홍수통제소)", defaultChecked: false },
        ],
      },
      {
        id: "flood-trace",
        heading: "침수흔적도",
        kind: "checkbox",
        items: [{ id: "flood-history", label: "침수이력", defaultChecked: false }],
      },
    ],
  },
  {
    id: "cctv",
    icon: "📹",
    buttonLabel: "CCTV/센서",
    panelTitle: "CCTV/센서",
    sections: [
      {
        id: "cctv-source",
        heading: "",
        kind: "checkbox",
        items: [
          { id: "construction-cctv", label: "건설현장", defaultChecked: false },
          { id: "disaster-cctv", label: "재난관측", defaultChecked: false },
          { id: "public-cctv", label: "공공CCTV", defaultChecked: false },
        ],
      },
      {
        id: "sensor",
        heading: "센서",
        kind: "checkbox",
        items: [{ id: "retaining-wall-sensor", label: "옹벽 센서", defaultChecked: false }],
      },
      {
        id: "traffic",
        heading: "도로 교통",
        kind: "checkbox",
        items: [{ id: "traffic-control", label: "교통 통제 정보", defaultChecked: false }],
      },
    ],
  },
  {
    id: "agency",
    icon: "🏥",
    buttonLabel: "유관기관",
    panelTitle: "유관기관",
    sections: [
      {
        id: "agency-list",
        heading: "",
        kind: "checkbox",
        items: [
          { id: "fire-station", label: "소방서", defaultChecked: false },
          { id: "police-station", label: "경찰서", defaultChecked: false },
          { id: "hospital", label: "병원", defaultChecked: false },
          { id: "shelter", label: "이재민주거시설", defaultChecked: false },
        ],
      },
    ],
  },
]
