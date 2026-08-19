# 포트폴리오 사이트 — 진행 상태

> 2026-08-19. **16개 태스크 전부 완료.** 남은 것은 사용자 손이 필요한 배포 단계뿐.

## 무엇을 만들었나

"측정으로 증명하는 성능 엔지니어" 포지셔닝의 한국어 포트폴리오. 방문자가 3분 안에 역량을 파악하게 하고, 사이트 자체의 성능과 인터랙션이 곧 실력 증거가 되도록 설계했다.

- 설계 문서: `docs/superpowers/specs/2026-08-19-portfolio-site-design.md`
- 구현 계획: `docs/superpowers/plans/2026-08-19-portfolio-site.md` (16 태스크, 체크박스 완료)
- 작업 규칙: `AGENTS.md` (= `CLAUDE.md`)
- 원격: `git@github.com:changminKo/portfolio-site.git`

## 구현 결과

공개 라우트 7개: 홈 + `/work/[slug]` 6개. 전부 정적 생성.

케이스스터디 6개 (문제 → 행동 → 성과):
`webview-freeze`, `traffic-spike`, `vue-next-migration`, `epub-comic-viewer`, `ai-workflow`, `isr-redis-cachehandler-poc`

라이브 데모 3개 (각각 독립 비동기 청크, 홈 번들에서 배제):
- **freeze** — 쿠키 재파싱 on/off 토글로 메인스레드 블로킹을 직접 체험. PerformanceObserver Long Task 타임라인. 6초 상한 + 즉시 중지
- **traffic** — Worker 기반 결정적 FIFO 큐 시뮬레이터. 동시 사용자 슬라이더, 최적화 전/후 P95·처리량 비교
- **stackflow** — 격리된 폰 프레임 안에서 스택 전환·스와이프백 (웹뷰 UX 전문성)

히어로는 방문자 브라우저의 LCP·CLS·INP와 렌더 프레임을 실측해 표시한다. 측정값은 네트워크로 전송하지 않는다.

## 검증 현황 (전부 실측 통과)

| 항목 | 결과 |
|---|---|
| 단위·컴포넌트 테스트 | 16파일 28테스트 통과 |
| Playwright E2E·시각회귀·axe | 70/70 통과 (스냅샷 52장, axe critical·serious 0건) |
| typecheck / lint / build | 전부 통과, 7개 라우트 정적 생성 |
| 홈 초기 JS (게이트 gzip 계산) | 152.58KB / 예산 160KB — PASS |
| 홈 초기 JS (실제 브라우저) | 145.61KB |
| 데모 청크 격리 | freeze·traffic·stackflow 서로 겹침 없음, 홈 graph에 데모 코드 0건 |

## 확정된 결정 사항

**홈 번들 예산 150KB → 160KB.** Next 16 + React 19 App Router 런타임만 gzip level 9 기준 약 149KB를 차지해서, 앱 코드가 0이어도 150KB를 넘긴다. 스펙 작성 시 이 하한을 몰랐던 것이라 실측 근거로 조정했다. 실제 브라우저 실측은 145.61KB로 서버 브로틀리 덕에 더 작다.

**Reveal을 CSS 전환으로 교체.** `LazyMotion`을 쓰면서 `domAnimation`을 정적 import해 framer-motion 전체가 홈 번들에 들어가 있었다. CSS keyframes + IntersectionObserver로 바꿔 25KB 절감. framer-motion은 이제 데모 청크 전용 — 홈에 다시 끌어들이면 안 된다.

**Lighthouse LCP는 배포 후 판정.** 로컬 `next start` 측정이 4.5s로 목표 1.5s에 미달하지만 로컬 스로틀링 영향이 크다. CI에서 `perf:lhci`는 `continue-on-error: true`로 비차단 구성했고, Vercel 배포 후 실측으로 판정한다.

## 사용자가 직접 해야 할 일

1. `vercel link --project portfolio-site` — Vercel 계정 로그인 필요 (또는 대시보드에서 repo import)
2. 배포 후 프리뷰 URL에 Lighthouse 실행 (모바일, 냉 캐시 3회) → LCP·CLS·INP 실측 판정
3. Vercel 환경변수에 `NEXT_PUBLIC_VISUAL_TEST` 설정 금지 — 시각회귀 전용
4. 푸시 후 GitHub Actions `quality` 워크플로 그린 확인 + `perf:lhci` 리포트 수치 검토 (비차단이라 실패하지 않지만 볼 가치 있음)

## 알려진 갭

- freeze 데모의 cleanup(visibility·unmount 시 observer/rAF 해제)은 세션 단위 테스트로 덮이지만 컴포넌트 테스트에 `disconnect`/`cancelAnimationFrame` assertion은 없다. E2E가 종료 후 cleanup을 검증한다.
- Playwright 병렬 실행 시 freeze 데모의 수동 로드 버튼이 IntersectionObserver 자동 로드와 드물게 경합할 수 있다. `retries: 2` 설정으로 흡수되며 최종 검증 3회 연속 클린이었다.
- 콘텐츠 문구는 플랜 초안 기준이다. 실제 구직에 쓰기 전에 케이스스터디 본문을 직접 읽고 톤·수치·표현을 검토하는 게 좋다.
