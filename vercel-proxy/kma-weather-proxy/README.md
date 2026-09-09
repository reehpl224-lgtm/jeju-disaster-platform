# kma-weather-proxy (Vercel 버전)

기상청 단기예보 조회서비스(`getVilageFcst`)를 대신 호출해주는 Vercel Serverless Function.
`workers/kma-weather-proxy`(Cloudflare Workers 버전)와 로직은 동일합니다 — Cloudflare 계정
가입이 어뷰징 방지 레이트리밋(에러 코드 1111)으로 막혀서, GitHub 계정으로 바로 가입되는
Vercel로 옮겼습니다(2026-09-09).

## 최초 배포

```bash
npm install -g vercel   # 전역 설치가 편함 (또는 npx vercel 매번 사용)
cd vercel-proxy/kma-weather-proxy
vercel login            # GitHub 계정으로 로그인 — 새 가입 절차 없음
vercel link              # 새 프로젝트로 연결(질문에 기본값 Enter로 진행하면 됨)
vercel env add KMA_SERVICE_KEY production
# data.go.kr "일반 인증키(Decoding)" 값 붙여넣기 — 프롬프트에 직접 입력하세요
vercel deploy --prod
```

배포가 끝나면 `https://<프로젝트명>.vercel.app` 형태의 URL이 출력됩니다. 이 URL을
프론트엔드 쪽 `.env`의 `VITE_WEATHER_PROXY_URL`에 넣어주세요 (`../../.env.example` 참고).

## 로컬 개발

```bash
vercel env pull .env.local   # 방금 등록한 환경변수를 로컬로 가져옴
vercel dev                    # http://localhost:3000
```

## 엔드포인트

`GET /api/vilage-fcst?region=jeju|seogwipo` — 응답 형식은 Cloudflare 버전과 동일합니다.
자세한 응답 예시·격자좌표 근거는 `../../workers/kma-weather-proxy/README.md` 참고.

## CORS 허용 origin 관리

`api/vilage-fcst.ts` 상단의 `ALLOWED_ORIGINS` 배열(비밀값 아니라서 코드에 직접 둠)에
실제 GitHub Pages 배포 도메인과 로컬 dev 서버 주소가 들어있습니다. 도메인이 바뀌면 이
배열을 갱신하고 재배포하세요.
