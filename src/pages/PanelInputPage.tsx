import { useState, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { Card } from "../components/ui/Card"
import {
  INPUT_LEVELS,
  SERVICES,
  newId,
  resetAll,
  setPart,
  startFromSample,
  usePanelInput,
  type ActionInput,
  type InputLevel,
  type PanelInput,
  type PartKey,
  type ResponseExtraInput,
  type SensorAlertInput,
  type SensorSummaryInput,
  type ServiceSensorInput,
  type StageInput,
  type TrendInput,
} from "../data/panelInput"

/**
 * 패널 입력 — 종합상황 우측 패널의 센서정보·센서 추이·대응현황에 쓸 값을 직접 넣는다.
 * 값은 이 브라우저(localStorage)에만 저장된다. 영역마다 "직접 입력"을 켜면 입력값을 그대로 보여주고(빈 칸은 빈 값),
 * 끄면(샘플로 되돌리기) 샘플을 "샘플" 표식과 함께 보여준다.
 */
export function PanelInputPage() {
  const [tab, setTab] = useState<"sensor" | "response">("sensor")
  const inp = usePanelInput()
  const anyInput = Object.keys(inp).length > 0
  return (
    <div className="spi">
      <div>
        <h1 className="text-xl font-bold text-white">패널 입력</h1>
        <p className="mt-1 text-sm text-white/50">
          종합상황 우측 패널(센서정보·센서 추이·대응현황)에 보일 값을 직접 넣습니다. <b>이 브라우저에만 저장</b>되고 다른 PC·브라우저에는 보이지 않습니다.
          입력하지 않은 영역은 <span className="sp-sample">샘플</span> 표식과 함께 샘플 값이 보입니다.
        </p>
      </div>

      <div className="spi-bar">
        <div className="sp-pills">
          <button type="button" className="sp-pill" aria-pressed={tab === "sensor"} onClick={() => setTab("sensor")}>
            센서 (센서정보 · 센서 추이)
          </button>
          <button type="button" className="sp-pill" aria-pressed={tab === "response"} onClick={() => setTab("response")}>
            대응 단계 (대응현황)
          </button>
        </div>
        <span className="sp-spacer" />
        <Link to="/dashboard" className="sp-link">
          종합상황에서 보기 →
        </Link>
        <button
          type="button"
          className="spi-btn spi-btn--danger"
          disabled={!anyInput}
          onClick={() => window.confirm("입력한 값을 모두 지우고 샘플로 되돌릴까요?") && resetAll()}
        >
          모두 샘플로 되돌리기
        </button>
      </div>
      <p className="sp-note">입력하면 바로 저장됩니다(저장 버튼 없음) · 종합상황 화면은 새로고침 없이 같이 바뀝니다.</p>

      {tab === "sensor" ? (
        <>
          <PartCard partKey="sensorSummary" title="센서 수집 상태" desc="센서정보 맨 위 — 정상·지연·오류·미연계 개수. 전체는 합으로 계산합니다.">
            {(v, set) => <SummaryEditor v={v} set={set} />}
          </PartCard>
          <PartCard partKey="serviceSensors" title="서비스별 센서 수와 최고 위험등급" desc="센서정보의 서비스 타일 — 서비스에서 가장 높은 위험등급과 센서 수. 비워 두면 그 서비스는 '정보 없음'으로 보입니다.">
            {(v, set) => <ServiceSensorsEditor v={v} set={set} />}
          </PartCard>
          <PartCard partKey="sensorAlerts" title="확인 필요 센서" desc="센서정보 아래쪽 목록 — 값 이상·수집 이상 센서. 항목을 모두 지우면 '확인이 필요한 센서가 없습니다'로 보입니다.">
            {(v, set) => <AlertsEditor v={v} set={set} />}
          </PartCard>
          <PartCard partKey="trends" title="센서 추이 지표" desc="센서 추이의 '위험 임박 순위'와 '서비스별 대표 추이'가 여기서 계산됩니다. 값은 오래된 것부터 쉼표로 적고, 마지막 값이 현재값입니다.">
            {(v, set) => <TrendsEditor v={v} set={set} />}
          </PartCard>
        </>
      ) : (
        <>
          <PartCard partKey="stages" title="서비스별 대응 단계와 조치 건수" desc="대응현황의 서비스 타일 — 단계, 단계 옆 숫자(선택), 조치 완료·진행·대기 건수. 합계와 '조치 진행' 막대는 여기서 계산합니다.">
            {(v, set) => <StagesEditor v={v} set={set} />}
          </PartCard>
          <PartCard partKey="actions" title="지금 해야 할 조치" desc="대응현황의 '지금 해야 할 조치' 목록.">
            {(v, set) => <ActionsEditor v={v} set={set} />}
          </PartCard>
          <PartCard partKey="responseExtra" title="기관 연결 · 현장 대응팀" desc="대응현황 맨 아래 두 칸. 실제 기관·대응팀 목록 데이터가 생기면 그 값이 우선합니다.">
            {(v, set) => <ExtraEditor v={v} set={set} />}
          </PartCard>
        </>
      )}
    </div>
  )
}

// ------------------------------------------------------------------ 영역 카드

function PartCard<K extends PartKey>({
  partKey,
  title,
  desc,
  children,
}: {
  partKey: K
  title: string
  desc: string
  children: (value: NonNullable<PanelInput[K]>, set: (v: NonNullable<PanelInput[K]>) => void) => ReactNode
}) {
  const inp = usePanelInput()
  const value = inp[partKey] as NonNullable<PanelInput[K]> | undefined
  const isInput = value !== undefined
  return (
    <Card
      title={title}
      subtitle={desc}
      action={
        <div className="spi-actions">
          <span className={isInput ? "sp-sample sp-sample--input" : "sp-sample"}>{isInput ? "직접 입력 중" : "샘플 사용 중"}</span>
          {isInput ? (
            <button type="button" className="spi-btn" onClick={() => window.confirm(`'${title}'의 입력값을 지우고 샘플로 되돌릴까요?`) && setPart(partKey, undefined)}>
              샘플로 되돌리기
            </button>
          ) : (
            <button type="button" className="spi-btn spi-btn--primary" onClick={() => setPart(partKey, startFromSample[partKey]() as PanelInput[K])}>
              직접 입력 시작 (샘플 값으로 채움)
            </button>
          )}
        </div>
      }
    >
      {isInput ? children(value, (v) => setPart(partKey, v)) : <p className="sp-note">지금은 샘플이 보입니다. "직접 입력 시작"을 누르면 샘플 값이 입력칸에 채워지고, 고친 값이 패널에 그대로 보입니다.</p>}
    </Card>
  )
}

// ------------------------------------------------------------------ 입력 부품

const levelOptions = INPUT_LEVELS.map((l) => (
  <option key={l.value} value={l.value}>
    {l.label}
  </option>
))
const serviceOptions = SERVICES.map((s) => (
  <option key={s.id} value={s.id}>
    {s.title}
  </option>
))

function NumIn({ value, onChange, placeholder, min = 0 }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string; min?: number }) {
  return (
    <input
      className="spi-in"
      type="number"
      inputMode="decimal"
      min={min}
      value={value ?? ""}
      placeholder={placeholder ?? "—"}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
    />
  )
}

/** 쉼표로 구분한 숫자 목록 — 입력 중에는 글자 그대로 두고, 숫자로 읽히면 바로 반영한다 */
function NumList({ value, onChange, placeholder }: { value: number[]; onChange: (v: number[]) => void; placeholder?: string }) {
  const [text, setText] = useState(value.join(", "))
  return (
    <input
      className="spi-in"
      value={text}
      placeholder={placeholder}
      onChange={(e) => {
        setText(e.target.value)
        const parts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
        const nums = parts.map(Number)
        if (nums.every(Number.isFinite)) onChange(nums)
      }}
      onBlur={() => setText(value.join(", "))}
    />
  )
}

function Label({ children }: { children: ReactNode }) {
  return <span className="spi-lab">{children}</span>
}

// ------------------------------------------------------------------ 센서

function SummaryEditor({ v, set }: { v: SensorSummaryInput; set: (v: SensorSummaryInput) => void }) {
  const f = (k: keyof SensorSummaryInput, label: string) => (
    <label className="spi-field">
      <Label>{label}</Label>
      <NumIn value={v[k]} onChange={(n) => set({ ...v, [k]: n ?? 0 })} />
    </label>
  )
  return (
    <div className="spi-grid spi-grid--4">
      {f("normal", "정상")}
      {f("delayed", "지연")}
      {f("error", "오류")}
      {f("unlinked", "미연계")}
      <p className="sp-note" style={{ gridColumn: "1 / -1" }}>
        전체 {v.normal + v.delayed + v.error + v.unlinked}개 (자동 계산) · 패널의 '지연·오류'는 지연+오류의 합입니다.
      </p>
    </div>
  )
}

function ServiceSensorsEditor({ v, set }: { v: ServiceSensorInput[]; set: (v: ServiceSensorInput[]) => void }) {
  const upd = (id: string, patch: Partial<ServiceSensorInput>) => {
    const rest = v.filter((x) => x.id !== id)
    const cur = v.find((x) => x.id === id) ?? { id, count: null, level: null }
    set([...rest, { ...cur, ...patch }])
  }
  return (
    <div className="spi-table">
      <div className="spi-tr spi-tr--head" style={{ gridTemplateColumns: "1.4fr 1fr 1.2fr" }}>
        <span>서비스</span>
        <span>센서 수</span>
        <span>최고 위험등급</span>
      </div>
      {SERVICES.map((s) => {
        const x = v.find((y) => y.id === s.id)
        return (
          <div className="spi-tr" key={s.id} style={{ gridTemplateColumns: "1.4fr 1fr 1.2fr" }}>
            <b>{s.title}</b>
            <NumIn value={x?.count ?? null} onChange={(n) => upd(s.id, { count: n })} />
            <select className="spi-in" value={x?.level ?? ""} onChange={(e) => upd(s.id, { level: (e.target.value || null) as InputLevel | null })}>
              <option value="">미입력(정보 없음)</option>
              {levelOptions}
            </select>
          </div>
        )
      })}
    </div>
  )
}

function AlertsEditor({ v, set }: { v: SensorAlertInput[]; set: (v: SensorAlertInput[]) => void }) {
  const upd = (id: string, patch: Partial<SensorAlertInput>) => set(v.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  return (
    <div className="spi-list">
      {v.map((a) => (
        <div className="spi-item" key={a.id}>
          <div className="spi-grid spi-grid--3">
            <label className="spi-field"><Label>센서 이름</Label><input className="spi-in" value={a.name} onChange={(e) => upd(a.id, { name: e.target.value })} /></label>
            <label className="spi-field"><Label>서비스</Label><select className="spi-in" value={a.service} onChange={(e) => upd(a.id, { service: e.target.value })}>{serviceOptions}</select></label>
            <label className="spi-field"><Label>사유</Label><select className="spi-in" value={a.reason} onChange={(e) => upd(a.id, { reason: e.target.value as SensorAlertInput["reason"] })}><option>값 이상</option><option>수집 이상</option></select></label>
            <label className="spi-field"><Label>표시할 값</Label><input className="spi-in" value={a.value} placeholder="예: Q 61%" onChange={(e) => upd(a.id, { value: e.target.value })} /></label>
            <label className="spi-field"><Label>등급</Label><select className="spi-in" value={a.level} onChange={(e) => upd(a.id, { level: e.target.value as InputLevel })}>{levelOptions}</select></label>
            <label className="spi-field"><Label>배지 문구</Label><input className="spi-in" value={a.badge} placeholder="예: 주의" onChange={(e) => upd(a.id, { badge: e.target.value })} /></label>
          </div>
          <button type="button" className="spi-btn spi-btn--danger" onClick={() => set(v.filter((x) => x.id !== a.id))}>삭제</button>
        </div>
      ))}
      <button type="button" className="spi-btn" onClick={() => set([...v, { id: newId("al"), name: "", service: "river", reason: "값 이상", value: "", level: "warning", badge: "주의" }])}>
        + 센서 추가
      </button>
      {v.length === 0 && <p className="sp-note">항목이 없습니다 — 패널에는 '확인이 필요한 센서가 없습니다'로 보입니다.</p>}
    </div>
  )
}

function TrendsEditor({ v, set }: { v: TrendInput[]; set: (v: TrendInput[]) => void }) {
  const upd = (id: string, patch: Partial<TrendInput>) => set(v.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  return (
    <div className="spi-list">
      {v.map((t) => (
        <div className="spi-item" key={t.id}>
          <div className="spi-grid spi-grid--3">
            <label className="spi-field"><Label>서비스</Label><select className="spi-in" value={t.service} onChange={(e) => upd(t.id, { service: e.target.value })}>{serviceOptions}</select></label>
            <label className="spi-field"><Label>지표 이름</Label><input className="spi-in" value={t.name} placeholder="예: 쇠소깍 Q%" onChange={(e) => upd(t.id, { name: e.target.value })} /></label>
            <label className="spi-field"><Label>단위</Label><input className="spi-in" value={t.unit} placeholder="예: %, m, psu" onChange={(e) => upd(t.id, { unit: e.target.value })} /></label>
            <label className="spi-field" style={{ gridColumn: "span 2" }}><Label>관측값 (오래된 것 → 최신, 쉼표)</Label><NumList value={t.observed} onChange={(o) => upd(t.id, { observed: o })} placeholder="예: 18, 26, 37, 46, 56, 61" /></label>
            <label className="spi-field"><Label>예측값 (선택, 쉼표)</Label><NumList value={t.forecast} onChange={(o) => upd(t.id, { forecast: o })} placeholder="예: 63, 65" /></label>
            <label className="spi-field"><Label>기준값</Label><NumIn value={t.threshold} onChange={(n) => upd(t.id, { threshold: n })} /></label>
            <label className="spi-field"><Label>기준 이름</Label><input className="spi-in" value={t.thresholdLabel} placeholder="예: 경계 기준" onChange={(e) => upd(t.id, { thresholdLabel: e.target.value })} /></label>
            <label className="spi-field"><Label>위험 방향</Label><select className="spi-in" value={t.worse} onChange={(e) => upd(t.id, { worse: e.target.value as TrendInput["worse"] })}><option value="above">기준값 이상이면 위험</option><option value="below">기준값 이하이면 위험</option></select></label>
            <label className="spi-field"><Label>현재 등급</Label><select className="spi-in" value={t.level} onChange={(e) => upd(t.id, { level: e.target.value as InputLevel })}>{levelOptions}</select></label>
          </div>
          <button type="button" className="spi-btn spi-btn--danger" onClick={() => set(v.filter((x) => x.id !== t.id))}>삭제</button>
        </div>
      ))}
      <button type="button" className="spi-btn" onClick={() => set([...v, { id: newId("tr"), service: "river", name: "", unit: "", observed: [], forecast: [], threshold: null, thresholdLabel: "기준", worse: "above", level: "safe" }])}>
        + 지표 추가
      </button>
      {v.length === 0 && <p className="sp-note">지표가 없습니다 — 패널에는 '입력된 추이 지표가 없습니다'로 보입니다.</p>}
    </div>
  )
}

// ------------------------------------------------------------------ 대응 단계

function StagesEditor({ v, set }: { v: StageInput[]; set: (v: StageInput[]) => void }) {
  const upd = (id: string, patch: Partial<StageInput>) => {
    const rest = v.filter((x) => x.id !== id)
    const cur = v.find((x) => x.id === id) ?? { id, level: null, count: null, done: 0, doing: 0, waiting: 0 }
    set([...rest, { ...cur, ...patch }])
  }
  const cols = "1.3fr 1.3fr .8fr .7fr .7fr .7fr"
  return (
    <div className="spi-table">
      <div className="spi-tr spi-tr--head" style={{ gridTemplateColumns: cols }}>
        <span>서비스</span>
        <span>대응 단계</span>
        <span>단계 옆 숫자</span>
        <span>조치 완료</span>
        <span>진행</span>
        <span>대기</span>
      </div>
      {SERVICES.map((s) => {
        const x = v.find((y) => y.id === s.id)
        return (
          <div className="spi-tr" key={s.id} style={{ gridTemplateColumns: cols }}>
            <b>{s.title}</b>
            <select className="spi-in" value={x?.level ?? ""} onChange={(e) => upd(s.id, { level: (e.target.value || null) as InputLevel | null })}>
              <option value="">미입력(정보 없음)</option>
              {levelOptions}
            </select>
            <NumIn value={x?.count ?? null} onChange={(n) => upd(s.id, { count: n })} placeholder="선택" />
            <NumIn value={x?.done ?? 0} onChange={(n) => upd(s.id, { done: n ?? 0 })} />
            <NumIn value={x?.doing ?? 0} onChange={(n) => upd(s.id, { doing: n ?? 0 })} />
            <NumIn value={x?.waiting ?? 0} onChange={(n) => upd(s.id, { waiting: n ?? 0 })} />
          </div>
        )
      })}
      <p className="sp-note">'단계 옆 숫자'는 비워 두면 표시하지 않습니다 · 타일의 '조치 x/y'는 완료/(완료+진행+대기)입니다.</p>
    </div>
  )
}

function ActionsEditor({ v, set }: { v: ActionInput[]; set: (v: ActionInput[]) => void }) {
  const upd = (id: string, patch: Partial<ActionInput>) => set(v.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  return (
    <div className="spi-list">
      {v.map((a) => (
        <div className="spi-item" key={a.id}>
          <div className="spi-grid spi-grid--3">
            <label className="spi-field"><Label>서비스</Label><select className="spi-in" value={a.service} onChange={(e) => upd(a.id, { service: e.target.value })}>{serviceOptions}</select></label>
            <label className="spi-field"><Label>조치 내용</Label><input className="spi-in" value={a.text} onChange={(e) => upd(a.id, { text: e.target.value })} /></label>
            <label className="spi-field"><Label>상태</Label><select className="spi-in" value={a.state} onChange={(e) => upd(a.id, { state: e.target.value as ActionInput["state"] })}><option>진행</option><option>대기</option></select></label>
          </div>
          <button type="button" className="spi-btn spi-btn--danger" onClick={() => set(v.filter((x) => x.id !== a.id))}>삭제</button>
        </div>
      ))}
      <button type="button" className="spi-btn" onClick={() => set([...v, { id: newId("ac"), service: "river", text: "", state: "진행" }])}>
        + 조치 추가
      </button>
      {v.length === 0 && <p className="sp-note">항목이 없습니다 — 패널에는 '지금 해야 할 조치가 없습니다'로 보입니다.</p>}
    </div>
  )
}

function ExtraEditor({ v, set }: { v: ResponseExtraInput; set: (v: ResponseExtraInput) => void }) {
  return (
    <div className="spi-grid spi-grid--3">
      <label className="spi-field"><Label>연결된 기관 수</Label><NumIn value={v.agenciesConnected} onChange={(n) => set({ ...v, agenciesConnected: n ?? 0 })} /></label>
      <label className="spi-field"><Label>전체 기관 수</Label><NumIn value={v.agenciesTotal} onChange={(n) => set({ ...v, agenciesTotal: n ?? 0 })} /></label>
      <label className="spi-field"><Label>문제 기관 문구</Label><input className="spi-in" value={v.agencyIssue} placeholder="예: 장애 1 · 도로교통" onChange={(e) => set({ ...v, agencyIssue: e.target.value })} /></label>
      <label className="spi-field"><Label>현장 대응팀 수</Label><NumIn value={v.teams} onChange={(n) => set({ ...v, teams: n ?? 0 })} /></label>
      <label className="spi-field"><Label>대응팀 상태 문구</Label><input className="spi-in" value={v.teamState} placeholder="예: 출동 중" onChange={(e) => set({ ...v, teamState: e.target.value })} /></label>
    </div>
  )
}
