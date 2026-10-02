import type { RiskLevel } from "../types/domain"
import { classifyMarineRiskLevel } from "./marineAlertThresholds"

/**
 * 저염분 고수온 "영향 대상" — 양식장(mockAqua.aquaFarms) 말고 마을어장 수산생물(소라·전복·홍해삼)·연안 생태(연산호·해조류)도
 * 피해 대상이다(2016·2024 제주 사례). 마을어장 위치(어촌계)와 연산호 군락 위치는 실제 자료를 아직 못 받아 아래 목록은
 * **화면 확인용 임의 샘플**이고 이름에 "(샘플)"이 붙는다. 실제 자료가 오면 이 배열을 교체한다.
 * 양식장 집계(aquaFarmTotals·aquaSummary.affectedFarms)에는 섞지 않는다 — 일관성 검사가 양식장끼리만 맞춘다.
 * 생물별 위험 임계값은 협의 전이라 양식 기준 5단계(classifyMarineRiskLevel)를 그대로 쓴다.
 */
export interface ImpactTarget {
  id: string
  name: string
  region: string
  species: string
  salinity: number
  temperature: number
  tempSustainedDays: number
  level: RiskLevel
  /** 예: "저염분 + 고수온" — 값에서 계산 */
  riskType: string
  note: string
}

const target = (
  t: Omit<ImpactTarget, "level" | "riskType">,
): ImpactTarget => ({
  ...t,
  level: classifyMarineRiskLevel(t.salinity, t.temperature, t.tempSustainedDays),
  riskType: [t.salinity < 30 && "저염분", t.temperature > 25 && "고수온"].filter(Boolean).join(" + ") || "정상 범위",
})

/** 마을어장 — 해녀·어촌계가 채취하는 소라·전복·홍해삼 */
export const villageFisheries: ImpactTarget[] = [
  target({ id: "vf-1", name: "대정읍 마을어장(샘플)", region: "서귀포시 대정읍", species: "소라·전복·홍해삼", salinity: 27.1, temperature: 28.3, tempSustainedDays: 0, note: "수심 10m 이내 채취 구역 — 어촌계 확인 필요" }),
  target({ id: "vf-2", name: "안덕면 마을어장(샘플)", region: "서귀포시 안덕면", species: "소라·전복", salinity: 29.2, temperature: 26.5, tempSustainedDays: 0, note: "예찰 강화 대상" }),
  target({ id: "vf-3", name: "한경면 마을어장(샘플)", region: "제주시 한경면", species: "소라·홍해삼", salinity: 30.8, temperature: 24.8, tempSustainedDays: 0, note: "평시 감시" }),
]

/** 연안 생태 — 연산호 군락·해조류 서식지 */
export const coastalEcology: ImpactTarget[] = [
  target({ id: "ec-1", name: "문섬 연산호 군락(샘플)", region: "서귀포시 문섬 일대", species: "연산호", salinity: 29.6, temperature: 28.6, tempSustainedDays: 1, note: "고수온·저염분 동시 노출 시 주저앉음 우려" }),
  target({ id: "ec-2", name: "범섬 연산호 군락(샘플)", region: "서귀포시 범섬 일대", species: "연산호", salinity: 30.4, temperature: 27.2, tempSustainedDays: 0, note: "수온 상승 감시" }),
  target({ id: "ec-3", name: "한경~대정 연안 해조류 서식지(샘플)", region: "제주 서남부 연안", species: "감태·우뭇가사리·미역", salinity: 31, temperature: 25.5, tempSustainedDays: 0, note: "장기 수온 상승 — 갯녹음 추이 확인" }),
]

/** 과거 피해 사례 — 언론 보도 기준(수과원·해양수산연구원 원자료 확인 전). 사례 수치는 현재 임계값과 비교하는 참고용이다 */
export const impactReferenceCases: { id: string; when: string; condition: string; impact: string; source: string; url: string }[] = [
  {
    id: "rc-2016",
    when: "2016년 8~9월",
    condition: "염분 23~26psu · 수온 30~31℃ 저염분수가 제주 서부 해역에 유입",
    impact: "서귀포 안덕·대정, 제주시 한경에서 소라·전복·홍해삼 다량 폐사",
    source: "서울신문(2016-08-15)",
    url: "https://www.seoul.co.kr/news/society/accident/2016/08/15/20160815500097",
  },
  {
    id: "rc-2024-07",
    when: "2024년 7월",
    condition: "유입 예상 수온 28℃ 이상 · 염분 26psu 이하(평년 여름 염분 30~31psu, 수온 23~25℃) — 마라도 남서쪽 약 30km 해상",
    impact: "마을어장 소라·전복·홍해삼 피해 우려 — 제주도·수과원·수협이 마을어장 예찰 강화",
    source: "아시아경제(2024-07-28)",
    url: "https://www.asiae.co.kr/article/2024072812415659866",
  },
  {
    id: "rc-2024-10",
    when: "2024년 여름~가을",
    condition: "장기간의 높은 수온과 낮은 염분이 동시에 나타남(두 요인이 함께 부담을 줬을 가능성 제시 — 확정 인과 아님)",
    impact: "서귀포 문섬·범섬 일대 연산호가 축 처져 주저앉는 현상 확인",
    source: "해양시민과학센터 파란",
    url: "https://greenparan.org/42/?bmode=view&idx=173435793",
  },
]
