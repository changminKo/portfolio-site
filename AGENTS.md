# AGENTS.md

포트폴리오 사이트. 이 문서는 이 저장소에서 작업하는 에이전트를 위한 규칙이다.

## 프로젝트 정체성

"측정으로 증명하는 성능 엔지니어" 포지셔닝의 한국어 포트폴리오. 방문자가 3분 안에 역량을 파악하게 하고, 사이트 자체의 성능과 인터랙션이 곧 실력 증거가 되도록 만든다.

- 설계 문서: `docs/superpowers/specs/2026-08-19-portfolio-site-design.md` — 무엇을 왜 만드는지의 단일 진실
- 구현 계획: `docs/superpowers/plans/2026-08-19-portfolio-site.md` — 16개 태스크, 체크박스로 진행 추적
- 진행 상태 요약: `HANDOFF.md`

새 작업을 시작하기 전에 위 세 문서 중 관련된 것을 읽는다. 스펙과 코드가 어긋나면 스펙이 기준이다.

## 명령어

```bash
pnpm dev            # 개발 서버
pnpm build          # 프로덕션 빌드 (Turbopack)
pnpm test:run       # Vitest 단위·컴포넌트 테스트
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint
pnpm exec playwright test   # E2E·시각회귀 (Task 14 이후)
```

패키지 매니저는 pnpm 고정. 검증은 `test:run` → `typecheck` → `lint` → `build` 순서로 전부 통과해야 완료로 본다.

## 스택

Next.js 16 App Router (Turbopack), React 19, TypeScript strict, zod, `@next/mdx` + gray-matter, next-themes, Framer Motion(데모 청크 전용 — 홈 번들에 넣지 말 것), Vitest + React Testing Library, Playwright + axe.

백엔드·데이터베이스·CMS·런타임 콘텐츠 API는 없다. 콘텐츠는 `content/work/*.mdx` 7개가 전부이고 빌드 시 정적 생성된다.

## 알려진 함정

`next.config.mjs`의 두 설정은 빌드 필수 조건이다. 제거하거나 형식을 바꾸면 빌드가 깨진다.

- `turbopack.root: process.cwd()` — 없으면 Turbopack이 상위 디렉토리를 workspace root로 잘못 추론한다.
- `remarkPlugins: [["remark-frontmatter", "yaml"]]` — Turbopack은 loader 옵션을 직렬화하므로 플러그인을 함수 참조가 아닌 문자열 이름으로 전달해야 한다.

의존성은 이 프로젝트에서 `pnpm add`로만 설치한다. 다른 프로젝트의 `node_modules`를 심링크로 재사용하면 위 workspace root 추론이 깨진다.

## 아키텍처 제약

- 서버 컴포넌트가 기본. 클라이언트 경계는 `ThemeToggle`, `LiveBrowserMetrics`, motion 경계, `DemoSlot`과 데모 내부로 제한한다.
- 공개 라우트는 `/`와 `/work/[slug]` 7개, 총 8개로 고정. `/about`과 영문판은 만들지 않는다.
- 데모 2개(freeze·traffic)는 각각 별도 비동기 청크다. 홈의 import graph에 데모 코드가 들어가면 안 된다.
- 콘텐츠 slug·순서·MDX loader는 `src/content/work.registry.ts` 한 곳에서만 정의한다. 목록을 다른 파일에 복제하지 않는다.
- 실측 성과 수치와 시뮬레이션 결과는 `EvidenceMetric` / `SimulationMetric`으로 분리해 렌더한다. 데모 출력이 실측값처럼 보이면 안 된다.

## 성능·접근성 예산

- 홈 초기 JavaScript: gzip < 160KB (데모 청크 제외) — Next 16 + React 19 런타임 하한이 약 149KB
- LCP < 1.5s, CLS < 0.05, 일반 상호작용 INP < 200ms (사용자가 시작한 freeze 합성 부하 구간은 제외)
- 애니메이션은 `opacity`와 `transform`만. `prefers-reduced-motion`에서 모션을 제거하되 정보와 조작은 유지한다.
- WCAG 2.2 AA. axe `critical`·`serious` 위반 0건, 예외 allowlist 없음.
- 색만으로 상태를 구분하지 않는다. Canvas·움직임으로만 정보를 전달하지 않고 같은 값을 표·텍스트로 제공한다.

## 콘텐츠 규칙

- 회사 소스 코드, 내부 저장소 코드, 실사용자 데이터, 실제 쿠키, 실제 트래픽은 포함하지 않는다. 데모는 원리 재현이다.
- 검증되지 않은 수치를 만들지 않는다. 실측하지 않은 효과는 구조적 성과로 설명한다.
- 케이스스터디 본문 순서는 문제 → 행동 → 성과를 지킨다.
- 사이트 문구는 한국어. 번역투와 과장 없이 사실을 적는다.

## 작업 방식

- 계획의 태스크 단위로 작업한다. 한 번에 한 태스크만, 범위 밖 선구현은 하지 않는다.
- TDD: 실패 테스트 작성 → 실패 확인 → 최소 구현 → 통과 확인 → 커밋.
- 완료한 스텝은 계획 문서의 체크박스를 `- [x]`로 갱신한다.
- 같은 명령이 3회 실패하면 우회하지 말고 상태와 오류를 정리해 보고한다.

## 커밋

Conventional Commits, 한국어 설명. 예: `feat: 디자인 토큰과 테마 기반 구현`

타입: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`

작성자 명의는 저장소 로컬 설정(`changminKo`)을 쓴다. Co-authored-by 같은 attribution은 넣지 않는다. 원격은 `git@github.com:changminKo/portfolio-site.git`이며 개인 SSH 키가 `core.sshCommand`로 지정되어 있다.
