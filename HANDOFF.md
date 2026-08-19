# 포트폴리오 사이트 — 브레인스토밍 핸드오프 (접근안 A 확정)

> 2026-08-19 세션 정리. superpowers:brainstorming **architectural 경로** 진행 중.
> 현재 위치: 접근안 A 선택됨 → 다음은 섹션별 디자인 합의 → 스펙 문서 → writing-plans.

## 사용자 프로필 (이력서 + 커밋 히스토리 기반)

- **고창민, 7년 11개월차 프론트엔드** — 밀리의서재 재직(2023.06~), 前 디케이테크인(kakao, 2018.10~2023.06)
- 이력서: `/Users/doyle/Library/Mobile Documents/com~apple~CloudDocs/고창민_이력서.pdf`
- 회사 레포(참고용): `/Users/doyle/WebstormProjects/` — millie-nextjs 커밋 2,419개, millie-spa 2,250개
- 스택: TypeScript, React, Next.js, Vue, Nuxt, Docker, Redis

### 시그니처 스토리 (케이스스터디 재료)

1. **안드로이드 웹뷰 10초+ freeze 진단** — getConfig()가 매 렌더마다 document.cookie 재파싱(호출부 697곳) 특정. 쿠키 캐싱 + 첫 렌더 동기 시드. 메인스레드 9.2s→2.6s(−71%), Long Task 4개→0개
2. **Next.js 트래픽 스파이크 성능** — standalone 재구성·번들 축소·lazy loading. 처리량 2.7배, P95 15,000ms→450ms(−97%), Web Vitals 68→88, 이미지 6.69GB→1.87GB
3. **무중단 Vue→Next.js 전환** — LB 경로 라우팅 병행, 6개 도메인, 중단 0건, dev-proxy 구축
4. **EPUB/Comic 뷰어** — DRM 복호화 Web Worker 분리, 브릿지 표준화
5. **AI 워크플로우** — 밀리 바이브 배포 파이프라인, 팀 AI 표준(Swagger→코드 생성, AI TDD, 멀티에이전트 영향분석)
6. **ISR+Redis CacheHandler PoC 후 보류** — "도입하지 않는 판단" 어필용

## 확정된 사항

| 항목 | 결정 |
|------|------|
| 무엇을 | 포트폴리오 사이트 자체 제작 |
| 목적 | 이직/채용 어필 — 3분 안에 실력 파악 |
| 콘텐츠 | 회사 업무 위주(코드 공개 불가) → 케이스스터디 글 + **사이트 자체가 실력 증명** |
| 포지셔닝 | **"측정으로 증명하는 성능 엔지니어"** |
| 디자인 방향 | 인터랙션 쇼케이스 |
| 스택 | Next.js + React |
| 접근안 | **A. 라이브 케이스스터디** (아래 상세) |
| 저장소 | `/Users/doyle/orca/projects/some-project` (빈 레포) |
| git 계정 | repo-local `changminKo / rhckdals123@gmail.com` 설정 완료. remote 는 `git@github.com:changminKo/...` 로 |

## 접근안 A — 라이브 케이스스터디

구조: 멀티페이지 (홈 + 케이스스터디 개별 페이지).

핵심 차별점: 케이스스터디 중 대표 2개에 **인터랙티브 재현 데모** 삽입 —
성능 수치를 읽는 게 아니라 방문자가 직접 겪게 함. 회사 코드 없이 원리만 재현하므로 공개 문제 없음.

- **데모 1 (freeze 사례)**: "쿠키 재파싱 on/off" 토글 → 메인스레드 블로킹 직접 체험, Long Task 시각화
- **데모 2 (스파이크 사례)**: 부하/최적화 before-after 시뮬레이션 (형태는 디자인 단계에서 구체화)
- 나머지 케이스스터디(전환·뷰어·AI·PoC 보류)는 글 + 다이어그램 중심

기각한 대안: B(에디토리얼+시그니처 히어로 — 인터랙션 어필 약함), C(스크롤리텔링 원페이지 — 8년차에 필요한 깊이 못 실음).

## 남은 질문 (다음에 여기서부터)

1. 모션 라이브러리 (GSAP vs Framer Motion vs CSS 중심)
2. 케이스스터디 개수·선정 — 위 6개 중 몇 개, 공개 수위
3. 다크/라이트 테마, 한/영 여부
4. 배포 타깃(Vercel 등) + 도메인 보유 여부
5. 홈 히어로 컨셉 (디자인 섹션에서)

## 다음 단계

1. 남은 질문 마저 (하나씩)
2. 섹션별 디자인 제시·합의 (아키텍처, 페이지 구조, 데모 설계, 데이터 흐름, 테스트)
3. 스펙 저장: `docs/superpowers/specs/2026-08-XX-portfolio-site-design.md` + 커밋
4. writing-plans 스킬로 구현 계획
5. 구현 시작 전 사용자 승인 (HARD GATE)

## 제약/규칙 리마인더

- anti-template 정책: 제네릭 템플릿 룩 금지 (`~/.claude/rules/web/design-quality.md`)
- 성능 예산: 랜딩 JS < 150kb gzipped, LCP < 2.5s — 성능 포지셔닝이라 사이트 자체 성능이 곧 신뢰도. Lighthouse 100 목표로
- 컴포지터 친화 속성만 애니메이션, reduced-motion 대응 필수
- 데모는 dynamic import 로 분리 — 데모 무게가 페이지 성능 해치면 본말전도
