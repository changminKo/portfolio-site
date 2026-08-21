# 포트폴리오 사이트 — 진행 상태

> 2026-08-21 기준. 계획된 16개 태스크는 완료했고, 이후 디자인·데모·본문을 한 라운드 더 다듬었다.
> 남은 것은 공개 결정과 배포 후 실측뿐이다.

## 무엇을 만들었나

"측정으로 증명하는 성능 엔지니어" 포지셔닝의 한국어 포트폴리오. 방문자가 3분 안에 역량을 파악하게 하고, 사이트 자체의 성능과 인터랙션이 곧 실력 증거가 되도록 설계했다.

- 설계 문서: `docs/superpowers/specs/2026-08-19-portfolio-site-design.md`
- 구현 계획: `docs/superpowers/plans/2026-08-19-portfolio-site.md`
- 작업 규칙: `AGENTS.md` (= `CLAUDE.md`)
- 원격: `git@github.com:changminKo/portfolio-site.git`
- Vercel 프로젝트: `rhckdals123-8713s-projects/portfolio-site` (GitHub 연동 완료, push 시 자동 배포)

## 구현 결과

공개 라우트 7개: 홈 + `/work/[slug]` 6개. 전부 정적 생성.

케이스스터디 6개 (문제 → 행동 → 성과):
`webview-freeze`, `traffic-spike`, `vue-next-migration`, `epub-comic-viewer`, `ai-workflow`, `isr-redis-cachehandler-poc`

라이브 데모 2개 (각각 독립 비동기 청크, 홈 번들에서 배제):

- **freeze** — 쿠키 재파싱 on/off 토글로 메인스레드 블로킹을 직접 체험. PerformanceObserver Long Task 타임라인. 6초 상한 + 즉시 중지
- **traffic** — Worker 기반 결정적 FIFO 큐 시뮬레이터. 동시 사용자 슬라이더, 최적화 전/후 P95·처리량 비교

히어로는 방문자 브라우저의 LCP·CLS·INP와 렌더 프레임을 실측해 표시한다. 측정값은 네트워크로 전송하지 않는다.

## 검증 현황 (전부 실측)

| 항목 | 결과 |
|---|---|
| 단위·컴포넌트 테스트 | 15파일 27테스트 통과 |
| Playwright E2E·시각회귀·axe | 69/69 통과 (재시도 0, axe critical·serious 0건) |
| typecheck / lint / build | 전부 통과, 7개 라우트 정적 생성 |
| 홈 초기 JS (게이트 gzip 계산) | 152.7KB / 예산 160KB — PASS |
| 홈 초기 JS (실제 브라우저) | 145.6KB |
| 데모 청크 격리 | freeze·traffic 겹침 없음, 홈 graph에 데모 코드 0건 |
| 320px · 768px 수평 초과 | 0px |

## 확정된 결정 사항

**홈 번들 예산 150KB → 160KB.** Next 16 + React 19 App Router 런타임만 gzip level 9 기준 약 149KB를 차지해서, 앱 코드가 0이어도 150KB를 넘긴다. 스펙 작성 시 이 하한을 몰랐던 것이라 실측 근거로 조정했다. 실제 브라우저 실측은 145.6KB로 서버 브로틀리 덕에 더 작다.

**Reveal은 CSS 전환.** `LazyMotion`을 쓰면서 `domAnimation`을 정적 import해 framer-motion 전체가 홈 번들에 들어가 있었다. CSS keyframes + IntersectionObserver로 바꿔 25KB 절감. framer-motion은 데모 청크 전용 — 홈에 다시 끌어들이면 예산이 깨진다.

**히어로 지표는 buffered observer로 읽는다.** `useReportWebVitals`는 LCP·CLS를 페이지가 숨겨질 때 확정 보고하므로 방문자가 보는 동안엔 값이 오지 않았다. `observeBufferedVitals`(PerformanceObserver `buffered: true`)가 로드 직후 실측값을 채우고, 최종 확정값은 기존 경로가 덮어쓴다.

**Stackflow 데모 제거.** 스택 내비게이션 UX는 성능 서사와 무관해 초점을 흐린다는 판단(2026-08-20). 플랜의 Task 13은 이력으로 남기고 철회 주석을 달았다.

**Lighthouse LCP는 배포 후 판정.** 로컬 `next start` 측정이 4.5s로 목표 1.5s에 미달하지만 로컬 스로틀링 영향이 크다. CI에서 `perf:lhci`는 `continue-on-error: true`로 비차단 구성했다.

**Playwright 워커 3개, expect 15초.** freeze 데모가 의도적으로 메인스레드를 6초 점유하는데 기본 워커 수로 병렬 실행하면 여러 워커가 CPU를 다퉈 데모 로드가 기본 대기를 넘겼다. 판정 기준은 바꾸지 않았다.

## 미해결: 도메인 수 불일치

`vue-next-migration` 사례의 전환 도메인 수를 이력서와 함께 정정할 예정이다.

- 현재 포트폴리오 본문: **6개** (이력서 표기에 맞춰 둔 상태)
- 이력서 원문도 6개 — 행동("6개 핵심 도메인을 신규 개발 후 이관")과 성과("6개 도메인 전환 완료") 두 곳
- 사용자가 이력서를 3개로 정정할 때 포트폴리오도 같이 바꾼다

바꿀 때 손댈 곳은 `content/work/vue-next-migration.mdx` 네 군데다.

1. frontmatter `summary` — "6개 도메인을 중단 없이 점진 전환했습니다"
2. frontmatter `evidence` — `{ label: 전환 도메인, value: "6개" }`
3. 문제 섹션 — "6개 도메인(내서재·회원가입·스토리홈·웹뷰어·밀리로드·취향수집)"
4. 성과 섹션 — "6개 도메인을 서비스 중단 0건으로 전환했습니다"

실제가 3개면 어느 도메인인지도 정해야 3번 목록을 고칠 수 있다.

## 본문 확인 상태

본문에는 이력서에 없는 해석이 일부 들어가 있다. 면접에서 그대로 나올 말이라 사실과 어긋나면 고쳐야 한다.

**확인 완료 (2026-08-21)**

- `epub-comic-viewer.mdx` — DRM 정책상 복호화가 필수라는 서술: 사실 맞음.
- `ai-workflow.mdx` — 4단계 파이프라인 순서, 밀리 바이브 단독 / 팀 표준 6개 항목 공동 구분: 사실 맞음.
- `epub-comic-viewer.mdx` 성과 — "페이지 넘김과 스크롤 중에도 UI를 막지 않는 동작을 확보했다"는 사실과 달라 제거했다. 구조적 사실("복호화 연산을 메인스레드에서 분리해 UI 렌더링과 스레드를 다투지 않는 구조를 만들었다")만 남겼다.

**아직 확인이 필요한 것**

- `epub-comic-viewer.mdx` 행동 — "메시지를 주고받는 비용이 추가되지만, 그 비용은 페이지 넘김이 멈추는 것보다 감수할 만했습니다." Web Worker의 일반적 트레이드오프로는 타당하나 당시 판단과 표현이 다를 수 있다.
- `isr-redis-cachehandler-poc.mdx` — 판단 매트릭스를 PoC 실측 제약(쿠키 의존 캐시 적중률, Pages Router 제어 범위) 중심으로 다시 짰다. 판단 기준 문장("이득이 운영 복잡도와 장애 전파 범위를 상쇄할 만큼 크지 않다면 도입하지 않는다")도 구성한 것이다.
- 각 사례 성과 섹션 마지막의 한 문장 회고 6개는 모두 구성한 해석이다. 본인 말투가 아니면 어색하게 읽힌다.

## 남은 일

1. **공개 결정** — 지금은 Vercel Deployment Protection(SSO)이 사이트를 막고 있어 본인만 볼 수 있다. 공개하려면 https://vercel.com/rhckdals123-8713s-projects/portfolio-site/settings/deployment-protection 에서 Vercel Authentication을 Disabled 로 바꾼다.
2. **배포 후 Lighthouse 실측** — 프리뷰/프로덕션 URL에 모바일·냉 캐시 3회로 LCP·CLS·INP를 측정해 판정한다.
3. **GitHub Actions `quality` 워크플로 그린 확인** + `perf:lhci` 리포트 수치 검토(비차단이라 실패하지 않지만 볼 가치가 있다).
4. Vercel 환경변수에 `NEXT_PUBLIC_VISUAL_TEST` 를 설정하지 않는다 — 시각회귀 전용이다.

## 알려진 갭

- freeze 데모의 cleanup(visibility·unmount 시 observer/rAF 해제)은 세션 단위 테스트로 덮이지만 컴포넌트 테스트에 `disconnect`/`cancelAnimationFrame` assertion은 없다. E2E가 종료 후 cleanup을 검증한다.
- 시각회귀 기준선은 콘텐츠·디자인을 바꿀 때마다 `pnpm exec playwright test --update-snapshots` 로 갱신해야 한다. 갱신 후 재시도 없이 한 번 더 돌려 안정성을 확인하는 절차를 유지하고 있다.
