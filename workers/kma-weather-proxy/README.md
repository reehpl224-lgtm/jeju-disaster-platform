# kma-weather-proxy

기상청 단기예보 조회서비스(`getVilageFcst`)를 대신 호출해주는 Cloudflare Worker.
`jeju-disaster-platform`은 서버 없는 정적 SPA(GitHub Pages)라 브라우저가 공공데이터포털
API를 직접 부르면 서비스키가 배포 번들에 노출되고 CORS도 대부분 막힌다 — 이 Worker가
서비스키를 Secret으로 들고 대신 호출하고, 허용된 프론트엔드 origin에만 CORS를 열어준다.

## 최초 배포

```bash
npm install
npx wrangler login          # Cloudflare 계정 로그인(브라우저 창 뜸)
npx wrangler secret put KMA_SERVICE_KEY   # data.go.kr "일반 인증키(Decoding)" 값 입력
npm run deploy
```

배포가 끝나면 `https://jeju-kma-weather-proxy.<계정서브도메인>.workers.dev` 형태의 URL이
출력됩니다. 이 URL을 프론트엔드 쪽 `VITE_WEATHER_PROXY_URL`에 넣어주세요
(`../../.env.example` 참고).

## 로컬 개발

```bash
cp .dev.vars.example .dev.vars   # 그 안에 실제 서비스키 채우기 (.dev.vars는 git에 안 올라감)
npm run dev                       # http://localhost:8787
```

## 엔드포인트

`GET /api/vilage-fcst?region=jeju|seogwipo`

응답 예:

```json
{
  "region": "jeju",
  "label": "제주시",
  "nx": 53,
  "ny": 38,
  "slots": [
    { "date": "20260909", "time": "1500", "values": { "TMP": "27", "POP": "20", "SKY": "1", "PTY": "0", "REH": "65", "WSD": "2.1" } }
  ]
}
```

`region`을 늘리려면 `src/index.ts`의 `REGIONS`에 좌표를 추가하면 됩니다. 좌표는 기상청
공식 격자변환(LCC) 공식으로 위경도에서 직접 계산한 값입니다 — 손으로 지어낸 값이 아닙니다.

## CORS 허용 origin 관리

`wrangler.toml`의 `ALLOWED_ORIGINS`(콤마 구분)에 실제 GitHub Pages 배포 도메인과 로컬
dev 서버 주소가 들어있습니다. 도메인이 바뀌면 이 값을 갱신하고 재배포하세요.
