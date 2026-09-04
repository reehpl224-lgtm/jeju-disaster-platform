import { useState } from "react"
import { Card } from "../../components/ui/Card"
import { RiskBadge } from "../../components/ui/RiskBadge"
import { AquaSubNav } from "../../components/aqua/AquaSubNav"
import { aquaAlertDraft } from "../../data/mockAqua"

export function AquaAlertPage() {
  const [result, setResult] = useState<"idle" | "success" | "failure">("idle")

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">경보 생성 · 검토</h1>
        <p className="mt-1 text-sm text-white/50">저염분수·고수온 경보 초안 검토 및 승인 전송</p>
      </div>

      <AquaSubNav />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card title="경보 기본 정보" className="xl:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="경보 대상 지역" value={aquaAlertDraft.region} />
            <Field label="위험 유형" value={aquaAlertDraft.riskType} />
            <Field label="e-SOP 경보 등급" value={aquaAlertDraft.grade} />
            <Field label="발령 범위" value={aquaAlertDraft.scope} />
            <Field label="경보 발효 시각" value={aquaAlertDraft.effectiveAt} />
            <Field label="경보 유효 기간" value={aquaAlertDraft.validFor} />
          </div>

          <div className="mt-4">
            <p className="mb-1 text-xs font-medium text-white/40">전파 채널 선택</p>
            <div className="flex flex-wrap gap-2">
              {aquaAlertDraft.channels.map((channel) => (
                <span key={channel} className="rounded-full border border-accent/40 bg-accent-soft px-3 py-1 text-xs text-accent">
                  ✓ {channel}
                </span>
              ))}
            </div>
          </div>
        </Card>

        <Card title="근거 데이터 요약">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="예측 모델 신뢰도" value={`${aquaAlertDraft.confidence}%`} />
            <Row label="위성 관측 일치" value={aquaAlertDraft.satelliteMatch} />
            <Row label="현장 실측 비교" value={aquaAlertDraft.fieldDelta} />
          </dl>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="위험 등급 및 영향 범위">
          <RiskBadge level="warning" label={aquaAlertDraft.currentGrade} solid />
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <Row label="영향 예상 양식장" value={`${aquaAlertDraft.affectedFarms}개소`} />
            <Row label="영향 인구" value={aquaAlertDraft.affectedPopulation} />
            <Row label="예상 도달 시각" value={aquaAlertDraft.eta} />
            <Row label="영향 해역" value={aquaAlertDraft.affectedArea} />
          </dl>
        </Card>

        <Card title="수신 대상 요약">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="문자 수신 예상" value={`${aquaAlertDraft.smsTarget.toLocaleString()}명`} />
            <Row label="앱 푸시 대상" value={`${aquaAlertDraft.appTarget.toLocaleString()}명`} />
            <Row label="현장 단말" value={`${aquaAlertDraft.fieldDevices}대`} />
            <Row label="상황판 연동" value={aquaAlertDraft.boards} />
          </dl>
        </Card>
      </div>

      <Card title="작성 · 검토 · 승인 상태">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {aquaAlertDraft.approvalSteps.map((step) => (
            <div key={step.id} className="rounded-lg border border-border-subtle p-3 text-center">
              <p className="text-xs font-medium text-white/40">{step.stage}</p>
              <p className="mt-1 text-sm font-semibold text-white/85">{step.owner}</p>
              <p className="text-xs text-white/35">{step.time}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="감사 이력">
        <ul className="flex flex-col divide-y divide-border-subtle">
          {aquaAlertDraft.audit.map((entry) => (
            <li key={entry.id} className="flex gap-3 py-2 text-sm">
              <span className="w-12 shrink-0 text-xs text-white/35">{entry.time}</span>
              <p className="text-white/70">{entry.title}</p>
            </li>
          ))}
        </ul>
      </Card>

      {result === "success" && (
        <div className="rounded-lg border border-risk-safe/40 bg-risk-safe-bg p-3 text-sm text-risk-safe">
          ✓ 경보 전송이 완료되었습니다. 수신 대상 {aquaAlertDraft.smsTarget.toLocaleString()}명에게 전파되었습니다.
        </div>
      )}
      {result === "failure" && (
        <div className="rounded-lg border border-risk-danger/40 bg-risk-danger-bg p-3 text-sm text-risk-danger">
          ✕ 경보 전송에 실패했습니다. 일부 채널(현장 단말 2대)에서 응답이 없습니다. 재시도해 주세요.
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setResult("success")}
          className="rounded-full bg-accent px-4 py-2.5 text-sm font-bold text-black transition hover:bg-accent-hover"
        >
          경보 전송 요청
        </button>
        <button
          type="button"
          onClick={() => setResult("failure")}
          className="rounded-full border border-border-subtle px-4 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-inset"
        >
          전송 실패 시뮬레이션
        </button>
        <button
          type="button"
          onClick={() => setResult("idle")}
          className="rounded-full border border-risk-danger/40 px-4 py-2.5 text-sm font-semibold text-risk-danger transition hover:bg-risk-danger-bg"
        >
          경보 취소 (철회)
        </button>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-subtle bg-inset px-3 py-2">
      <p className="text-[11px] text-white/35">{label}</p>
      <p className="text-sm font-medium text-white/85">{value}</p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle/60 pb-2">
      <dt className="text-white/40">{label}</dt>
      <dd className="font-medium text-white/80">{value}</dd>
    </div>
  )
}
