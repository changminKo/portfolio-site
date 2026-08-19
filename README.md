# 고창민 포트폴리오

"측정으로 증명하는 성능 엔지니어"를 6개 케이스스터디와 3개 원리 재현 데모로 보여 주는 한국어 포트폴리오입니다.

## 로컬 실행

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
```

Node.js 22와 pnpm 10.15.0을 사용합니다.

## 검증

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm check:chunks
pnpm test:e2e
pnpm exec cross-env PLAYWRIGHT_PRODUCTION=1 playwright test tests/e2e/performance-budget.spec.ts
pnpm perf:lhci
```

`perf:lhci`의 LCP < 1.5s 기준은 로컬 `next start` 실측(약 4.5s)이 로컬 스로틀링 영향을 크게 받아
CI에서는 참고용 리포트로만 남기고 job을 막지 않는다. Vercel 프로덕션 배포 후 실측으로 판정한다.

## 공개 경로

- `/`
- `/work/webview-freeze`
- `/work/traffic-spike`
- `/work/vue-next-migration`
- `/work/epub-comic-viewer`
- `/work/ai-workflow`
- `/work/isr-redis-cachehandler-poc`

콘텐츠는 저장소의 `content/work/*.mdx`에서 관리하며 CMS와 방문자 추적 도구를 사용하지 않습니다.
