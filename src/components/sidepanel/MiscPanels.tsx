import { Link } from "react-router-dom"
import { dutyContacts } from "../../data/mockContacts"
import { aiInsights } from "../../data/mockDashboard"
import { SAMPLE_AI, SAMPLE_ASSET_SUMMARY, SAMPLE_SHELTER_COUNTS, SAMPLE_INTAKES, SAMPLE_RIVER_FACILITIES, SAMPLE_RIVER_RESOURCES, SAMPLE_VLM_SUMMARY } from "../../data/sidePanelSamples"
import { useShelters } from "../../data/sheltersJeju"
import { IS_STAGING } from "../../data/appMode"
import { SpRisk, SpSample } from "./primitives"

/** "유선 · 카카오톡 단톡방(풍수방)" → ["유선", "카카오톡 풍수방"] */
function channelChips(channel: string): string[] {
  return channel.split(" · ").map((c) => {
    const m = c.match(/^(.*?)(?: 단톡방)?\((.*)\)$/)
    return m ? `${m[1]} ${m[2]}` : c
  })
}

/** R5 · 우측 · 담당자 — 실제 담당자 목록(mockContacts, 면담 기준). 인사이동 시 AI추진단이 현행화. */
export function ContactPanel() {
  return (
    <div className="sp">
      {dutyContacts.map((c) => (
        <div className="sp-contact" key={c.id}>
          <span className="sp-avatar" aria-hidden>
            {c.name.slice(0, 1)}
          </span>
          <div style={{ minWidth: 0, flex: "1 1 0" }}>
            <span className="role">{c.role}</span>
            <span className="name">{c.name}</span>
            <span className="org">{c.org}</span>
            <div className="ph">
              <b>{c.phone}</b>
              {channelChips(c.channel).map((ch) => (
                <span className="sp-chip" key={ch}>
                  {ch}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <p className="sp-note">인사이동 시 AI추진단이 접수해 현행화합니다 · 최종 현행화 {dutyContacts[0]?.updatedAt}</p>
    </div>
  )
}

/** R6 · 우측 · 보고서 — 앱에 목록 데이터가 없어 링크 한 줄 */
export function ReportPanel() {
  return (
    <div className="sp" style={{ gap: 10 }}>
      <p className="sp-sub">종료된 사건의 상세 보고서를 조회합니다.</p>
      <Link className="sp-link" to="/reports">
        이력·보고서 전체 조회 →
      </Link>
    </div>
  )
}

/**
 * R7 · 우측 · 자산현황 — **대피·수용 시설은 행정안전부 자료(받아 둔 스냅샷, 실데이터)**, 하천 인력·장비·시설은 연동 전 고정 카탈로그(샘플).
 * 시설 종류마다 제주 자료가 없는 서비스도 있다(지진해일 긴급대피장소·지진 대피장소는 제주 자료 0건) — 0건 그대로 보여준다.
 */
export function AssetPanel() {
  const a = SAMPLE_ASSET_SUMMARY
  const shelters = useShelters()
  // 대피·수용 시설 표 — 스테이징은 임의의 값, 그 밖의 환경은 받아 둔 실제 파일(제주 자료가 없는 종류는 0건 그대로)
  const kindRows = IS_STAGING
    ? SAMPLE_SHELTER_COUNTS.map((k) => ({ label: k.label, jeju: k.jeju, seogwipo: k.seogwipo, total: k.jeju + k.seogwipo }))
    : shelters.status === "ready"
      ? shelters.file.kinds.map((k) => ({ label: k.label, jeju: k.items.filter((i) => i.region === "제주시").length, seogwipo: k.items.filter((i) => i.region === "서귀포시").length, total: k.items.length }))
      : null
  return (
    <div className="sp">
      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2" style={{ fontSize: 13 }}>
            대피·수용 시설
          </b>
          {IS_STAGING ? (
            <SpSample />
          ) : (
            shelters.status === "ready" && (
              <span className="sp-sample sp-sample--snap" title={`${shelters.file.source} — ${shelters.file.fetchedAt.slice(0, 10)}에 받아 둔 목록`}>
                스냅샷 · {shelters.file.fetchedAt.slice(0, 10).replace(/-/g, ".")} 기준
              </span>
            )
          )}
        </div>
        {!IS_STAGING && shelters.status === "loading" && <p className="sp-note">불러오는 중...</p>}
        {!IS_STAGING && shelters.status === "missing" && (
          <p className="sp-note">
            받아 둔 시설 목록이 없습니다(scripts/fetch-shelters.mjs로 받습니다) <SpSample noData />
          </p>
        )}
        {kindRows && (
          <>
            <div className="sp-ktable">
              <div className="sp-ktr sp-ktr--head">
                <span>종류</span>
                <span>제주시</span>
                <span>서귀포시</span>
                <span>합계</span>
              </div>
              {kindRows.map((k) => (
                <div className="sp-ktr" key={k.label}>
                  <span>{k.label}</span>
                  <span>{k.jeju}</span>
                  <span>{k.seogwipo}</span>
                  <b className={k.total === 0 ? "sp-c--offline" : undefined}>{k.total === 0 ? "자료 없음" : `${k.total}곳`}</b>
                </div>
              ))}
            </div>
            <p className="sp-note">
              {IS_STAGING ? "스테이징 환경 — 임의의 값(샘플)입니다" : `출처 ${shelters.status === "ready" ? shelters.file.source : ""}`} · 종류마다 같은 시설이 겹쳐 들어 있을 수 있어 합산하지 않았습니다 · 수용 인원은 시설별 값이라 합계를 내지 않습니다
            </p>
          </>
        )}
      </div>

      <div className="sp-row">
        <h3 className="sp-h2" style={{ fontSize: 13 }}>
          하천 인력·장비·시설
        </h3>
        <SpSample noData />
      </div>
      <div className="sp-stats">
        <div className="sp-stat">
          <small>인력·장비 가용</small>
          <b className="sp-c--safe">{a.available}</b>
        </div>
        <div className="sp-stat">
          <small>시설 활성</small>
          <b className="sp-c--offline">{a.activeFacilities}</b>
        </div>
        <div className="sp-stat">
          <small>등록 항목</small>
          <b>{a.registered}</b>
        </div>
      </div>

      <div className="sp-card sp-card--open">
        <b className="sp-h2" style={{ fontSize: 13 }}>
          하천 가상 인력·장비
        </b>
        <div className="sp-bars">
          {SAMPLE_RIVER_RESOURCES.map((r) => (
            <div key={r.label}>
              <div className="r">
                <span>{r.label}</span>
                <b>
                  가용 {r.free} / {r.total}
                </b>
              </div>
              <span className="sp-track" style={{ display: "block", marginTop: 6 }}>
                <i className="sp-bg--safe" style={{ width: `${(r.free / r.total) * 100}%` }} />
              </span>
            </div>
          ))}
        </div>
        <p className="sp-note">고정 카탈로그 — 실제 보유량 아님</p>
      </div>

      <div className="sp-card sp-card--open">
        <b className="sp-h2" style={{ fontSize: 13 }}>
          하천 모의 시설
        </b>
        <div className="sp-fac">
          {SAMPLE_RIVER_FACILITIES.map((f) => (
            <div key={f.code}>
              <small>{f.code}</small>
              <span>{f.label}</span>
              <em>비활성</em>
            </div>
          ))}
        </div>
        <p className="sp-note">고정 카탈로그(§11-3) — 실제 시설 아님 · 점선 = 비활성</p>
      </div>
    </div>
  )
}

/** R8 · 우측 · AI 분석 — AI 기능 6종은 앱 목록, 예측 신뢰도·교차검증·VLM 요약·취수구 도달은 연동된 데이터가 없어(null) 샘플 + "샘플 · 데이터 없음" */
export function AiPanel() {
  const conf = SAMPLE_AI.confidence
  const cc = SAMPLE_AI.crossCheck
  return (
    <div className="sp">
      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2 sp-spacer" style={{ fontSize: 13 }}>
            예측 신뢰도
          </b>
          <SpSample noData={!IS_STAGING} />
          <SpRisk level="safe">{conf.level}</SpRisk>
        </div>
        <span className="sp-track">
          <i className="sp-bg--safe" style={{ width: `${conf.percent}%` }} />
        </span>
        <p className="sp-note">
          신뢰도 {conf.percent}% — 임의의 값(샘플) · 연계 후 실값
        </p>
      </div>

      <div className="sp-stats">
        <div className="sp-stat">
          <small>교차검증 정상 <SpSample noData={!IS_STAGING} /></small>
          <b>{cc.normal}</b>
        </div>
        <div className="sp-stat">
          <small>장애</small>
          <b>{cc.fault}</b>
        </div>
        <div className="sp-stat">
          <small>누락</small>
          <b>{cc.missing}</b>
        </div>
      </div>

      <h3 className="sp-h" style={{ margin: 0, fontSize: 15 }}>
        AI 기능 {aiInsights.length}종
      </h3>
      <div className="sp-ai">
        {aiInsights.map((i) => (
          <div key={i.id}>
            <b>{i.title}</b>
            <span>{i.basis}</span>
          </div>
        ))}
      </div>

      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2 sp-spacer" style={{ fontSize: 13 }}>
            연안 VLM 10분 상황요약
          </b>
          <SpSample noData={!IS_STAGING} />
        </div>
        {SAMPLE_VLM_SUMMARY.map((v) => (
          <div className="sp-vlm" key={v.time}>
            <span className="tm">{v.time}</span>
            <SpRisk level={v.level}>{v.badge}</SpRisk>
            <span>{v.text}</span>
          </div>
        ))}
      </div>

      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2 sp-spacer" style={{ fontSize: 13 }}>
            저염수 취수구 도달 예상
          </b>
          <SpSample noData={!IS_STAGING} />
        </div>
        {SAMPLE_INTAKES.map((i) => (
          <div key={i.name}>
            <div className="sp-row" style={{ justifyContent: "space-between", margin: "4px 0 6px" }}>
              <span>{i.name}</span>
              <span className="sp-row" style={{ gap: 8, fontSize: 12 }}>
                약 {i.hours}시간 후
                <SpRisk level={i.level}>{i.badge}</SpRisk>
              </span>
            </div>
            <span className="sp-track">
              <i className={`sp-bg--${i.level}`} style={{ width: `${Math.min(100, (i.hours / 72) * 100)}%` }} />
            </span>
          </div>
        ))}
        <p className="sp-note">염분 30psu 미만 도달 기준 · 막대는 72시간 중 위치</p>
      </div>
      <div className="sp-row">
        <span className="sp-sub sp-spacer">저염수 확산 히트맵 — 이미 시각화됨</span>
        <span className="sp-badge-info">현행 유지</span>
      </div>
    </div>
  )
}

/** R00 · 우측 · 방재메신저·안전뉴스 — 2단계 예정 기능 안내. 지금 쓰는 연락처는 담당자 목록. */
export function FuturePanel({ kind }: { kind: "messenger" | "news" }) {
  const isMsg = kind === "messenger"
  return (
    <div className="sp">
      <div className="sp-key">
        <span>
          <i className="sp-dot sp-bg--safe" />
          1차년도 · 시연 중
        </span>
        <span>
          <i className="sp-dot" style={{ background: "var(--risk-info)" }} />
          2단계 · 예정
        </span>
      </div>
      <div className="sp-card sp-card--open">
        <div className="sp-row">
          <b className="sp-h2 sp-spacer" style={{ fontSize: 15 }}>
            {isMsg ? "방재메신저" : "안전뉴스"}
          </b>
          <span className="sp-badge-info">2단계 예정</span>
        </div>
        <p className="sp-note" style={{ fontSize: 11 }}>
          1차년도 시연 범위에 포함되지 않아 아직 동작하지 않습니다
        </p>
        <hr className="sp-hr" />
        <div className="sp-fut">
          <span className="k">예정 기능</span>
          <p>
            {isMsg
              ? "플랫폼 안에서 담당자에게 지시를 보내고 수신 확인까지 추적하는 통합 채널"
              : "외부 뉴스 API 연동 또는 자체 공지 연계로 대민 보도·대응 참고자료 제공"}
          </p>
          <span className="k">지금은</span>
          {isMsg ? (
            <>
              <p style={{ color: "var(--foreground)" }}>카카오톡 단톡방·유선으로 지시합니다 — 아래 연락처를 이용하세요</p>
              {dutyContacts.map((c) => (
                <div className="ph" key={c.id}>
                  <span>
                    {c.name} {c.role.replace(" 담당", "").replace("자연재난과 ", "")}
                  </span>
                  <span>{c.phone}</span>
                </div>
              ))}
            </>
          ) : (
            <p style={{ color: "var(--foreground)" }}>제공하지 않습니다 — 대응 참고는 기상청 실시간 특보·예보 패널을 이용하세요</p>
          )}
        </div>
      </div>
    </div>
  )
}
