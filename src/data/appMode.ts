/**
 * 배포 환경 구분 — 종합상황 사이드패널의 표시 규칙(2026-10-07 사용자 결정)에 쓴다. 레이아웃은 세 환경이 같고 값만 다르다.
 *  - 프로토타입·로컬: 데이터 정보가 있으면 그 값 그대로(0이면 0, 없으면 없는 대로)
 *  - 스테이징(`vite --mode staging` = npm run build:staging): 데이터 정보가 있어도 임의의 값(샘플)을 보여준다
 *  - 어느 환경이든 데이터 정보 자체가 없으면(null) 샘플 + "샘플 · 데이터 없음" 표시
 */
export const IS_STAGING = import.meta.env.MODE === "staging"
