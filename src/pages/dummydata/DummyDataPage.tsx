import { useRef, useState } from "react"
import { Link } from "react-router-dom"
import { Card } from "../../components/ui/Card"
import {
  clearDummyWorkbook,
  loadDummyWorkbook,
  parseDummyWorkbook,
  saveDummyWorkbook,
  SERVICE_LABELS,
  type DummyWorkbookData,
} from "../../data/dummyWorkbook"

/** '수집데이터' 시트의 필수·서비스별 열 안내 — 엑셀 템플릿의 헤더 색·코멘트와 같은 내용을 화면에도 보여준다(2026-09-29) */
const REQUIRED_COLUMNS = ["서비스코드", "항목ID", "항목명", "수집상태", "관측시각"]
const OPTIONAL_COLUMNS = ["항목유형(호우만 필수)", "위치(하천만 선택)", "측정값", "단위", "수집주기(저염분만)", "품질점수(저염분만)", "세부설명"]

export function DummyDataPage() {
  const ref = useRef<HTMLInputElement>(null)
  const [data, setData] = useState<DummyWorkbookData | null>(() => loadDummyWorkbook())
  const [pending, setPending] = useState<DummyWorkbookData | null>(null)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const shown = pending ?? data

  async function load(file?: File) {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      setPending(await parseDummyWorkbook(file))
    } catch (e) {
      setError(e instanceof Error ? e.message : "파일을 읽지 못했습니다.")
    } finally {
      setBusy(false)
      if (ref.current) ref.current.value = ""
    }
  }
  function apply() {
    if (pending) {
      saveDummyWorkbook(pending)
      location.reload()
    }
  }
  function reset() {
    clearDummyWorkbook()
    setData(null)
    setPending(null)
    location.reload()
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">비실측 수집데이터 관리</h1>
        <p className="mt-1 text-sm text-white/50">서비스의 데이터 수집 화면에서 *로 표시되는 비실측 항목만 엑셀로 입력합니다.</p>
      </div>

      <Card title="① 어디에 무엇을 적어야 하나요" subtitle="템플릿을 열면 '입력안내' 시트가 먼저 보입니다 — 거기 순서를 그대로 따라가세요" dummy>
        <ol className="flex flex-col gap-2 text-sm text-white/70">
          <li>1. 템플릿의 <b className="text-white">'수집데이터'</b> 시트로 이동합니다.</li>
          <li>
            2. <span className="rounded bg-[#C0392B]/30 px-1.5 py-0.5 font-semibold text-white">빨간 헤더</span>는 모든 서비스에서 반드시 채워야
            합니다: <span className="text-white/90">{REQUIRED_COLUMNS.join(" · ")}</span>
          </li>
          <li>
            3. <span className="rounded bg-[#435668]/60 px-1.5 py-0.5 font-semibold text-white">회색 헤더</span>는 서비스마다 필요·선택이 다릅니다:{" "}
            {OPTIONAL_COLUMNS.join(" · ")}
          </li>
          <li>
            4. <span className="rounded bg-[#FFF2CC]/90 px-1.5 py-0.5 font-semibold text-black">노란 2~9행</span>은 예시입니다. 값을 바꾸거나
            지우고 10행부터 새로 입력하세요.
          </li>
          <li>5. 서비스코드·수집상태 칸은 클릭하면 드롭다운이 나옵니다. 관측시각은 <code>YYYY-MM-DD HH:mm</code> 텍스트로 입력하세요.</li>
          <li>6. 각 헤더 셀에 마우스를 올리면(엑셀 코멘트) 그 열에 무엇을 적을지 다시 안내가 나옵니다.</li>
        </ol>
      </Card>

      <Card title="② 엑셀 업로드" subtitle="실시간 API·KHOA 실측값은 변경하지 않습니다.">
        <div className="flex flex-wrap gap-2">
          <a
            className="rounded border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold"
            href={`${import.meta.env.BASE_URL}제주_재난대응_더미데이터_템플릿.xlsx`}
            download
          >
            엑셀 템플릿 다운로드
          </a>
          <input ref={ref} className="hidden" type="file" accept=".xlsx" onChange={(e) => load(e.target.files?.[0])} />
          <button className="rounded bg-accent px-4 py-2 text-sm font-bold text-black" onClick={() => ref.current?.click()}>
            {busy ? "검증 중..." : "작성한 엑셀 업로드"}
          </button>
          {shown && (
            <button className="rounded border border-white/20 px-4 py-2 text-sm" onClick={reset}>
              초기화
            </button>
          )}
        </div>
        <p className="mt-3 text-xs text-white/45">
          대상: 호우 자체 관측망, 효돈천 수위센서, 양식장 수집소스 상태, 연안 스마트폴. 태풍·폭염은 자체 비실측 관측망이 없어 제외합니다.
        </p>
        {error && (
          <p role="alert" className="mt-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </Card>

      {pending && (
        <Card title="검증 완료 — 적용 전 미리보기" subtitle={`${pending.rows.length}개 항목`}>
          <button className="rounded bg-accent px-4 py-2 text-sm font-bold text-black" onClick={apply}>
            데이터 수집 화면에 적용
          </button>
        </Card>
      )}

      {!shown ? (
        <Card dummy title="업로드된 비실측 수집데이터 없음">
          <p className="py-8 text-center text-sm text-white/45">템플릿을 업로드하면 서비스별 수집 항목이 표시됩니다.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Object.entries(SERVICE_LABELS).map(([code, label]) => {
            const rows = shown.rows.filter((r) => r.serviceCode === code)
            return (
              <Card
                dummy
                key={code}
                title={`${label} · ${rows.length}개`}
                action={
                  <Link className="text-xs text-accent" to={`/${code}/data`}>
                    데이터 수집 화면 →
                  </Link>
                }
              >
                <ul className="divide-y divide-white/10">
                  {rows.map((r) => (
                    <li key={r.itemId} className="py-3 text-sm">
                      <div className="flex justify-between">
                        <b>{r.itemName}</b>
                        <span>{r.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-white/50">
                        {r.location} · {r.value} {r.unit} · {r.observedAt}
                      </p>
                      <p className="text-xs text-white/35">
                        {r.itemType} · {r.detail}
                      </p>
                    </li>
                  ))}
                  {!rows.length && <li className="py-4 text-xs text-white/35">입력 항목 없음</li>}
                </ul>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
