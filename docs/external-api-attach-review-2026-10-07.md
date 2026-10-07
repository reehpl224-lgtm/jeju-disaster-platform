# 외부 연계 대상 명세서 → 데모버전 부착 검토 (2026-10-07, Claude)

대상 문서: `제주AX프로젝트/99.참고자료/AX실증_외부연계대상명세서_v1.0.0_261006.pdf` (메티스정보㈜, 48쪽, 연계 28건).
"데모버전" = 실시간 연동이 켜지는 프로토타입(master/GitHub Pages). 스테이징(`VITE_DATA_MODE=simulation`)은 재난 판정에 쓰이는 특보·강우·해양·태풍 호출을 막고 모의값을 쓴다(`src/data/appEnv.ts`). 동네예보처럼 판정에 쓰이지 않는 참고값은 예외로 호출한다.

## 1. 현재 앱에 이미 붙어 있는 것 (명세서와 비교)

| 앱의 실연동 | 프록시 | 키 | 명세서 |
|---|---|---|---|
| 단기예보 getVilageFcst | `api/vilage-fcst.ts` (data.go.kr) | `KMA_SERVICE_KEY` | EXT-KMA-003과 같은 서비스. 명세서는 apihub 경로, 앱은 data.go.kr 경로 — **앱 경로가 이미 동작하므로 바꿀 필요 없음** |
| 기상특보 wrn_met_data | `api/warnings.ts` | `KMA_APIHUB_KEY` | 명세서에 없음 |
| AWS 매분 우량 | `api/rainfall.ts` | `KMA_APIHUB_KEY` | 명세서에 없음 |
| 해양 종합 sea_obs | `api/marine.ts` | `KMA_APIHUB_KEY` | 명세서에 없음 |
| 태풍 typ_now/typ_lst | `api/typhoon.ts` | `KMA_APIHUB_KEY` | 명세서에 없음 |

Vercel 프록시 프로젝트(`rhkim/kma-weather-proxy`) 환경변수는 **`KMA_APIHUB_KEY`, `KMA_SERVICE_KEY` 두 개뿐**이다(2026-10-07 `vercel env ls` 확인, 값은 숨김).

## 2. 연계 28건 판정

판정 기준: ① 이미 있는 키로 바로 되는가 ② 데모 화면에 놓을 자리가 있는가 ③ 브라우저 직접 호출 가능 여부(CORS·http 혼합콘텐츠).

| ID | 대상 | 판정 | 이유 · 붙일 자리 |
|---|---|---|---|
| KMA-001 초단기실황 | getUltraSrtNcst | **부착 완료(로컬 검증)** | 같은 `KMA_SERVICE_KEY`. 종합상황 '제주도 · 현재 날씨'가 지금 "관측값 없음"이라 효과가 가장 큼 |
| KMA-002 초단기예보 | getUltraSrtFcst | 보류 | 키는 같음. 이미 단기예보(시간별)가 있어 화면에 새로 채울 자리가 약함. 필요하면 동네예보 앞 6시간을 촘촘히 하는 용도 |
| KMA-003 단기예보 | getVilageFcst | 이미 있음 | §1 |
| KHOA-001 조위관측소 최신 | dtRecent/getDTRecentApi | **다음 후보(키 확인 필요)** | 조위·수온·**염분**·기온·풍속. 쇠소깍 수위×조위(TideBlock 샘플), 저염분 수온·염분(지금 샘플)을 실측으로 바꿀 수 있다 |
| KHOA-002 해양관측부이 최신 | (명세서 오기, 아래) | **다음 후보(키 확인 필요)** | 부이 수온·염분·파고. 저염분·연안 |
| KHOA-003 실측 파랑 | noonWave/getNoonWaveApi | 보류 | 하루 단위(정오 기준)라 실시간 화면에 약함 |
| KHOA-004 이안류 지수 | ripCurrent/getRipCurrentApi | 보류 | **6~9월만 제공** — 지금(10월)은 빈 응답. 함덕·협재 obsCode도 명세서에 없음 |
| KMA-004 천리안2A NetCDF | sat_file_down2.php | 제외 | 이진 파일(NetCDF) 내려받기 — 프론트 표시용 아님 |
| NOSC-001 위성 NetCDF | GK2B search.do | 제외 | 같은 이유 + `http` |
| SAFETY-001 긴급재난문자 | DSSP-IF-00247 | 키 필요 | 1분 갱신, 지역명(rgnNm) 필터 가능. 타임라인의 '재난문자' 블록에 놓을 수 있음 |
| SAFETY-002 해양사고 발생이력 | DSSP-IF-00147 | 키 필요 | 연안 타임라인 후보 |
| SAFETY-003 소방출동지령 | DSSP-IF-10212 | 키 필요 · 보류 | 데모 화면에 자리 없음 |
| SAFETY-004 민방위 대피소 | DSSP-IF-00195 | 키 필요 | 자산현황(대피소) — 지금 `shelters`가 비어 있음. 일 1회 갱신이라 캐시 가능. 좌표가 도·분·초라 변환 필요 |
| SAFETY-005~007 지진해일·지진 대피장소 | DSSP-IF-10944 / 00706 / 10943 | 키 필요 | 지진해일(`/tsunami`) 보드의 대피 자산 후보 |
| SAFETY-008 수용 공간 시설 | DSSP-IF-00008 | 키 필요 · 보류 | 자리 불명확 |
| SAFEMAP-001/002 하천범람지도·침수흔적도 WMS | IF_0100 / IF_0092 | 키 필요 | GIS 지도 레이어 후보. 키를 브라우저에 노출하지 않으려면 타일을 프록시로 받아야 함 |
| MOLIT-001 교량·터널 현황 | btiData/getBrdgList | 보류 | 화면에 자리 없음 |
| JEJUITS-001~003 도로 위험·통제·노면기상 | infoRoadEventList 등 | 키 필요 · 보류 | **`http://` API라 HTTPS 페이지에서 직접 호출 불가 → 프록시 필수**. 현재 화면에 도로 항목 없음 |
| AIHUB-001~005 | AI 학습 데이터 | 제외 | 모델 학습용 데이터셋 — 화면 연동 대상 아님 |

## 3. 명세서에서 발견한 오류·모호한 점 (Codex·작성자 확인 요청)

1. **EXT-KHOA-002(해양관측부이)의 서비스·요청 URL이 KHOA-001(조위관측소)과 같은 `dtRecent/GetDTRecentApiService/getDTRecentApi`로 적혀 있다.** 상세 기능명(영문)은 `getTWRecentApi`라서 복사 오류로 보인다. 부이용 경로는 확인이 필요하다(추정: `twRecent/GetTWRecentApiService/getTWRecentApi`, 미확인).
2. 3-5절 제목이 `[EXT-KHOA-001]`로 되어 있으나 본문 연계 ID는 EXT-KHOA-002다.
3. KMA-001/002/003은 `apihub.kma.go.kr` 경로·"공공데이터포털 인증키"로 적혀 있다. 허브 키와 data.go.kr 키 중 어느 쪽인지 문서상 모호하다. 앱은 data.go.kr 경로 + data.go.kr 키로 동작 중이다.
4. 갱신 주기와 수집 주기가 서로 다르다(예: KHOA-001 갱신 "실시간", 수집 "1시간").
5. 요청 파라미터 표의 샘플 칸에 다른 API 표에서 복사한 값이 들어 있다(예: KMA-001의 `base_date` 샘플이 `DT_0018`, `ny` 샘플이 `iot, lat` — 둘 다 KHOA 관측소 표의 값). 표를 그대로 코드화하면 안 되고 데이터 포털 원문과 대조해야 한다. 제주 인근 조위관측소·부이·해수욕장 `obsCode` 목록도 명세서에 없다.
6. SAFETY-004 승인절차가 "확인 필요"로 적혀 있다.
7. 키 종류가 서로 다르다: KMA/KHOA = data.go.kr 키(API마다 활용신청), SAFETY = 재난안전데이터공유플랫폼 키, SAFEMAP = 생활안전지도 키, JEJUITS = 제주교통정보센터 `code` 키. **현재 Vercel에는 앞의 data.go.kr 키 하나뿐**이다.

## 4. 이번에 한 것 — KMA-001 초단기실황 → 종합상황 '현재 날씨'

- 프록시: `vercel-proxy/kma-weather-proxy/api/ultra-ncst.ts`(신규, `?region=jeju|seogwipo`), 기준시각·응답 정리는 `lib/ultraNcst.ts`(순수 함수). 정시 자료가 약 10분 뒤 올라오므로 10분 전이면 직전 정시를 쓴다.
- 앱: `weatherApi.ts`의 `fetchUltraNcst`·`toWeatherObservation`, 훅 `useLiveWeather`(10분 갱신), `DashboardPage`가 실시간 값을 우선 쓰고 못 받으면 기존 "관측값 없음"으로 되돌린다. 알림 해제 계산에 쓰는 `currentWeather.observedAt`(시나리오 시계)은 건드리지 않았다.
- 표시: '● 제주도 · 현재 날씨 (제주시 기준)'. 상단 지도 한 줄(GIS 탭)에도 같은 값이 나온다. 강수량 문구("강수없음" 등)는 0mm로 본다.
- 검증: 단위 테스트 4건(기준시각 경계·자정 넘김·항목 추림), `build`·`build:staging`·lint(기존 경고 1건만)·전체 테스트 17건 통과. 로컬 화면은 **가짜 프록시 응답**으로 확인했다(기온 18.4℃·강수 0·풍속 3.1·습도 62가 표시됨).
- **프록시 배포 후 실응답 확인(2026-10-07)**: `/api/ultra-ncst?region=jeju`가 실제 기상청 값을 돌려준다(제주시 23.3℃·습도 42%·풍속 2.6m/s, 11시 기준). 앱(스테이징·프로토타입) 배포와 커밋은 아직 하지 않았다.

## 5. 다음 단계 제안

1. 프록시 배포(`vercel deploy --prod`, 프로젝트 `kma-weather-proxy`)로 `ultra-ncst` 실응답 확인 — 사용자 승인 필요.
2. KHOA-001(조위 최신)로 실제 `KMA_SERVICE_KEY`가 해양조사원 API에도 통하는지 확인. 통하면 제주 인근 조위관측소·부이 코드를 찾아 저염분·쇠소깍 샘플 값을 실측으로 교체(`PilotBatchBlocks.tsx`의 TideBlock·AquaSeriesBlock이 대상).
3. 키가 필요한 항목(SAFETY·SAFEMAP·JEJUITS)은 사용자가 각 사이트에서 키를 받아 Vercel 환경변수로 넣어야 한다. 우선순위 제안: 긴급재난문자(SAFETY-001) → 민방위 대피소(SAFETY-004) → 침수흔적도(SAFEMAP-002).
4. 스테이징(모의)에서도 초단기실황을 호출하도록 했다(동네예보와 같은 참고값 취급). 스테이징에서 막아야 한다면 `useLiveWeather`에 `IS_SIMULATION_MODE` 가드를 한 줄 넣으면 된다.

## 6. 추가 확인 (2026-10-07 오후) — 사용자가 준 data.go.kr 인증키로 직접 호출해 본 결과

| 호출 | 결과 |
|---|---|
| 기상청 초단기실황 (`1360000/VilageFcstInfoService_2.0/getUltraSrtNcst`, 제주시 격자) | **정상(00)** — 실제 기온·습도·강수 값이 옴. 키가 기상청 서비스에 승인돼 있음 |
| 해양조사원 조위관측소 (`1192136/dtRecent`, DT_0004) | **`SERVICE_KEY_IS_NOT_REGISTERED_ERROR`** — 활용신청이 안 된 상태 |
| 해양조사원 부이 (`1192136/twRecent`, 추정 경로) | 같은 오류 — 경로가 맞는지도 아직 모름 |
| 재난안전데이터공유플랫폼 SAFETY-001·004 | **`SERVICE KEY IS NOT REGISTERED`** — data.go.kr 키로는 안 되고 safetydata 전용 키가 필요 |
| 제주시 감시 CCTV 3종 (`6510000/...`) | **정상** — 서비스명만 주어졌고 오퍼레이션은 호출해서 찾았다 (아래) |

따라서 **KHOA 4종은 키를 새로 받을 필요 없이 data.go.kr에서 활용신청만 하면 된다.** 신청 대상 데이터셋(명세서의 링크): 조위관측소 15155508, 해양관측부이 15155516, 실측 파랑 15155994, 이안류 지수 15156028. SAFETY·SAFEMAP·JEJUITS는 각 사이트 가입·키 발급이 별도로 필요하다.

### 제주시 감시 CCTV 3종 (명세서 밖 — 사용자가 별도로 전달)

| 서비스 | 오퍼레이션(호출로 확인) | 건수 |
|---|---|---|
| 월파 감시 `waveoverCctvInfoService` | `getWaveoverCctvList` | 19 |
| 하천 감시 `riverCctvService` | `getRiverCctvList` | 62 |
| 적설 감시 `snowfallCctvService` | `getSnowfallCctvList` | 10 |

항목은 세 서비스가 같다: `dataCd, laCrdnt(위도), loCrdnt(경도), spotSe, spotNm, cctvUrl, useYn`. 응답은 UTF-8이고 `type=json`을 붙이면 JSON이다. **영상 주소는 `http://211.114.96.121:1935/jejusiN/….stream/playlist.m3u8`(HLS)** — 2026-10-07에 재생 목록이 응답(200, 720p, 약 200kbps)하는 것은 확인했다. 단, `http`와 IP 주소라 HTTPS로 배포된 화면(Vercel·GitHub Pages)에서 브라우저가 직접 재생하지 못한다(혼합 콘텐츠). 주소(좌표·이름)에는 수신 시각이 없고, `useYn`은 "사용 여부"라서 앱에서는 '연결/오프라인'이 아니라 '사용/미사용'으로 표시한다.

앱에 붙인 내용: 프록시 `api/cctv.ts`(세 서비스를 합침, 한 서비스가 실패해도 나머지는 표시) + `lib/cctv.ts`, 앱 `src/data/cctvLive.ts`가 시작할 때 한 번 받아 `cctvCameras`에 채운다. CCTV 탭(분야별 건수: 하천 62·연안 19·대설 10), GIS 지도의 CCTV 레이어, 서비스 보드 지도, 하천·연안·저염분 상세 지도에 같은 목록이 쓰인다. 월파→연안, 하천→하천, 적설→대설(새 분야)로 나눴다.

### CCTV 영상 재생 (사용자가 A안 선택, 같은 날)
- 프록시 `api/cctv-stream.ts` — 허용 서버(`211.114.96.121:1935`, 경로 `/jejusi…`)만 중계. 재생목록(m3u8) 안의 주소를 프록시 주소로 다시 써서 조각(ts)도 프록시를 거친다. 허용되지 않은 주소는 400.
- 앱 `CctvPlayerHost` — 한 번에 하나의 재생 창(Esc·바깥 클릭으로 닫힘). Safari는 직접 재생, 그 밖에는 `hls.js`(별도 청크 약 575KB/gzip 179KB, 재생할 때만 로드).
- 실측: 배포된 프록시로 재생목록→변형 재생목록→조각 모두 200(조각 약 379KB, 15초 분량, 응답 약 2.5초). 로컬 개발 서버에서 '탑동서부두' 영상이 1280×720으로 실제 재생됨(readyState 4, 재생 시간 진행, 일시정지 아님). Esc로 닫힘 확인.
- 남은 위험: 인증이 없는 공개 중계라 누가 호출해도 영상 서버로 요청이 나간다(허용 서버 고정으로 임의 주소 중계는 막음). Vercel 대역폭·호출 한도를 넘는 사용은 지켜봐야 한다.
