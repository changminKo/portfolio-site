# 포트폴리오 사이트 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** “측정으로 증명하는 성능 엔지니어”라는 포지셔닝을 6개 MDX 케이스스터디, 브라우저 실측 히어로, 3개 격리 데모로 증명하는 한국어 포트폴리오를 Vercel 배포 가능한 상태로 만든다.

**Architecture:** Next.js App Router의 정적 서버 컴포넌트를 기본으로 하고, 테마·실측 지표·모션·데모만 작은 클라이언트 아일랜드로 분리한다. 6개 MDX의 frontmatter는 단일 레지스트리와 Zod 스키마로 검증하고, freeze·traffic·Stackflow 데모는 `next/dynamic`의 서로 다른 비동기 청크로 로드한다. 순수 엔진과 브라우저 어댑터를 분리하여 Vitest로 로직을 결정적으로 검증하고 Playwright·axe·Lighthouse CI로 제품 수준 회귀를 막는다.

**Tech Stack:** Node.js 20.9+, pnpm, Next.js App Router, React, TypeScript strict, `@next/mdx`, Zod, `next-themes`, Framer Motion, Vitest, React Testing Library, Playwright, `@axe-core/playwright`, Lighthouse CI, Stackflow, Vercel

**Spec:** `docs/superpowers/specs/2026-08-19-portfolio-site-design.md`

## Global Constraints

- 모든 명령은 `/Users/doyle/orca/projects/some-project`에서 실행한다.
- 공개 라우트는 `/`와 `/work/[slug]` 6개, 총 7개로 고정한다. `/about`과 영문판은 만들지 않는다.
- 사이트 콘텐츠는 한국어 단일이며 CMS, 데이터베이스, 런타임 콘텐츠 API, 문의 폼, 인증, 댓글, 블로그를 추가하지 않는다.
- 회사 소스 코드, 내부 저장소 코드, 실사용자 데이터, 실제 쿠키, 실제 트래픽을 포함하지 않는다.
- 홈 초기 JavaScript는 shared + `/` 초기 청크 합계가 gzip 기준 `< 150KB`여야 하며 세 데모 청크는 이 합계에서 제외한다.
- Vercel 프로덕션 모바일 Lighthouse 냉 캐시 3회 중앙값에서 LCP `< 1.5s`, CLS `< 0.05`, 일반 상호작용 INP `< 200ms`를 지향한다. freeze 합성 부하 실행 구간만 INP 기준에서 제외한다.
- Lighthouse Performance 100과 Accessibility 100을 목표로 하고 자동 회귀 검사의 실패 기준으로 사용한다.
- `freeze`, `traffic`, `stackflow`는 리터럴 `import()`를 사용하는 서로 다른 비동기 청크여야 한다. 홈과 데모 없는 페이지의 초기 import graph에 데모 코드, Stackflow, traffic Worker가 들어가면 안 된다.
- Stackflow는 `/work/epub-comic-viewer`의 폰 프레임 내부에서만 사용한다. 헤더, 홈 앵커, `/work/[slug]`, 브라우저 URL은 Next.js App Router가 소유한다.
- 라이트 토큰은 `--bg: #F5F4EF`, `--surface: #FFFFFF`, `--text: #111318`, `--muted: #59616C`, `--line: #D3D5D1`, `--accent: #2457E6`, `--positive: #087553`, `--warning: #B54708`로 고정한다.
- 다크 토큰은 `--bg: #0B0D10`, `--surface: #12161C`, `--text: #F4F5F0`, `--muted: #AAB2BD`, `--line: #303641`, `--accent: #86A6FF`, `--positive: #5BD3A5`, `--warning: #FFB36B`로 고정한다.
- spacing은 `4, 8, 12, 16, 24, 32, 48, 64, 96, 128px`, 카드 radius는 8px, 폰 프레임 radius는 28px만 사용한다.
- 일반 모션은 Framer Motion `LazyMotion` + `domAnimation`으로 구현하고 `opacity`·`transform`만 애니메이션한다. `prefers-reduced-motion`에서는 정보 손실 없이 즉시 최종 상태를 표시한다.
- WCAG 2.2 AA, 44×44px 최소 pointer target, 2px focus indicator, skip link, 올바른 landmark·heading 순서, 320px/200% 확대 무수평 overflow를 지킨다.
- bento는 1,024px 이상 12열, 768px 2열, 320px 1열이다. 데모 카드 3개만 `large`이고 홈에서 데모를 실행하지 않는다.
- Git 로컬 명의는 `user.name=changminKo`, `user.email=rhckdals123@gmail.com`을 유지한다. 원격 저장소 주소는 `git@github.com:changminKo/portfolio-site.git`로 사용한다.
- 커밋 메시지는 `type: 한국어 설명` 형식으로 작성한다. 허용 type은 `chore`, `test`, `feat`, `fix`, `refactor`, `docs`이며 attribution·`Co-authored-by` 문구를 넣지 않는다.
- 각 태스크를 시작하기 전 `git status --short`로 사용자 변경을 확인하고, 해당 태스크의 파일만 stage한다.
- 코드 로직 태스크는 실패 테스트 작성 → 지정 테스트의 실패 확인 → 최소 구현 → 지정 테스트 통과 → 관련 전체 검사 → 커밋 순서를 바꾸지 않는다.

---

## File Structure

```text
.
├── .github/workflows/ci.yml                 # 전체 검증과 Vercel 선행 품질 게이트
├── content/work/*.mdx                       # 문제→행동→성과 케이스스터디 6개
├── scripts/
│   ├── check-demo-chunks.mjs                # 세 데모 청크 물리 분리 검사
├── src/
│   ├── app/
│   │   ├── layout.tsx                       # 폰트·테마·chrome·landmark
│   │   ├── page.tsx                         # 홈 섹션 조합
│   │   ├── not-found.tsx                    # 허용되지 않은 slug
│   │   └── work/[slug]/page.tsx             # 6개 정적 MDX 상세 페이지
│   ├── components/
│   │   ├── chrome/                          # Header, ThemeToggle, Footer
│   │   ├── home/                            # Hero, WorkBento, CareerTimeline, Contact, metrics
│   │   ├── mdx/                             # MDX 매핑과 DemoSlot
│   │   ├── motion/Reveal.tsx                # LazyMotion 경계
│   │   └── work/                            # CaseStudyLayout와 실제/가상 지표
│   ├── content/
│   │   ├── work.schema.ts                   # WorkMeta Zod 스키마와 컬렉션 검증
│   │   ├── work.registry.ts                 # frontmatter와 lazy loader의 공개 진입점
│   │   └── work.loaders.ts                  # 홈 graph와 분리된 정적 MDX import map
│   ├── features/demos/
│   │   ├── freeze/                          # 파서, 세션, Long Task, UI
│   │   ├── traffic/                         # 결정적 큐 엔진, Worker, Canvas, UI
│   │   └── stackflow/                       # 격리 폰 프레임과 세 Activity
│   ├── lib/performance/                     # Web Vitals formatter와 frame meter
│   ├── providers/ThemeProvider.tsx
│   └── styles/                              # 역할 기반 토큰과 전역 스타일
├── tests/
│   ├── components/                          # 클라이언트 아일랜드 테스트
│   ├── e2e/                                 # 기능·42개 시각 상태·axe·예산
│   └── unit/                                # 스키마와 두 데모 엔진 테스트
├── lighthouserc.cjs
├── mdx-components.tsx
├── next.config.mjs
├── playwright.config.ts
├── vercel.json
└── vitest.config.ts
```

### Task 1: Next.js App Router와 테스트 하네스 구축

**Spec coverage:** 5절 기술 선택·디렉토리 구조, 8절 테스트 기반, 운영 전제

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/components/home-page.test.tsx`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Generated: `next-env.d.ts`
- Create: `.gitignore`

**Interfaces:**
- Consumes: 없음. 저장소에는 스펙과 계획 문서만 있다고 가정한다.
- Produces: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:run`, `pnpm test:e2e` 스크립트; `@/* -> ./src/*` 경로 alias; jsdom 기반 Vitest 환경; Chromium 기반 Playwright 환경.

- [x] **Step 1: 런타임과 Git 명의를 검증한다**

Run:

```bash
node --version
git config --local user.name
git config --local user.email
```

Expected: Node.js는 `v20.9.0` 이상, 이름은 `changminKo`, 이메일은 `rhckdals123@gmail.com`이다.

- [x] **Step 2: 앱과 테스트 의존성을 설치한다**

Run:

```bash
corepack enable
corepack prepare pnpm@10.15.0 --activate
pnpm init
pnpm add next@latest react@latest react-dom@latest
pnpm add -D typescript@latest @types/node@latest @types/react@latest @types/react-dom@latest eslint@latest eslint-config-next@latest vitest@latest jsdom@latest @vitejs/plugin-react@latest vite-tsconfig-paths@latest @testing-library/react@latest @testing-library/jest-dom@latest @playwright/test@latest
pnpm exec playwright install chromium
pnpm pkg set type=module engines.node=">=20.9.0"
pnpm pkg set private=true --json
pnpm pkg set scripts.dev="next dev" scripts.build="next build" scripts.start="next start" scripts.lint="eslint ." scripts.typecheck="tsc --noEmit" scripts.test="vitest" scripts.test:run="vitest run" scripts.test:e2e="playwright test"
```

Expected: `package.json`과 `pnpm-lock.yaml`이 생성되고 Chromium 설치가 종료 코드 0으로 끝난다.

- [x] **Step 3: TypeScript·Next·Vitest·Playwright 설정을 작성한다**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Create `next.config.mjs`:

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

Create `eslint.config.mjs`:

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "coverage/**", "playwright-report/**", "test-results/**"]),
]);
```

Create `vitest.config.ts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    coverage: { reporter: ["text", "html"] },
  },
});
```

Create `tests/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";

if (typeof requestAnimationFrame === "undefined") {
  Object.defineProperty(globalThis, "requestAnimationFrame", { configurable: true, value: () => 1 });
  Object.defineProperty(globalThis, "cancelAnimationFrame", { configurable: true, value: () => undefined });
}
```

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [x] **Step 4: 첫 페이지의 실패 테스트를 작성한다**

Create `tests/components/home-page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

it("핵심 포지셔닝을 하나의 H1으로 렌더한다", () => {
  render(<HomePage />);

  expect(
    screen.getByRole("heading", { level: 1, name: "느낌 대신, 측정으로 증명합니다." }),
  ).toBeInTheDocument();
});
```

- [x] **Step 5: 테스트가 페이지 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/components/home-page.test.tsx`

Expected: FAIL with an import resolution error for `@/app/page`.

- [x] **Step 6: 최소 App Router 페이지를 구현한다**

Create `src/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main>
      <h1>느낌 대신, 측정으로 증명합니다.</h1>
    </main>
  );
}
```

Create `.gitignore`:

```gitignore
node_modules/
.next/
coverage/
playwright-report/
test-results/
.env*
!.env.example
```

- [x] **Step 7: 기반 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/components/home-page.test.tsx
pnpm lint
pnpm typecheck
pnpm build
```

Expected: 1 test passes, lint/typecheck/build exit 0, build output lists `/` as a static route, and `next-env.d.ts` is generated.

- [x] **Step 8: 프로젝트 기반을 커밋한다**

```bash
git add package.json pnpm-lock.yaml tsconfig.json next.config.mjs eslint.config.mjs vitest.config.ts playwright.config.ts tests/setup.ts tests/components/home-page.test.tsx src/app/layout.tsx src/app/page.tsx next-env.d.ts .gitignore
git commit -m "chore: Next.js와 테스트 기반 구성"
```

### Task 2: 디자인 토큰·테마·공통 chrome 구현

**Spec coverage:** 2절 공통 내비게이션, 5절 테마·모션 경계, 6절 디자인 시스템 전체, 7절 접근성 기준

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/globals.css`
- Create: `src/providers/ThemeProvider.tsx`
- Create: `src/components/chrome/ThemeToggle.tsx`
- Create: `src/components/chrome/Header.tsx`
- Create: `src/components/chrome/Footer.tsx`
- Create: `src/components/motion/Reveal.tsx`
- Create: `tests/components/theme-toggle.test.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: Task 1의 `RootLayout({ children }: { children: ReactNode }): JSX.Element`, Vitest jsdom 설정.
- Produces: `ThemeProvider({ children }: PropsWithChildren): JSX.Element`; `ThemeToggle(): JSX.Element`; `Header(): JSX.Element`; `Footer(): JSX.Element`; `Reveal({ children, delay? }: { children: ReactNode; delay?: number }): JSX.Element`; 전역 CSS 변수 `--bg|surface|text|muted|line|accent|positive|warning`, `--space-1|2|3|4|6|8|12|16|24|32`.

- [x] **Step 1: 테마 토글의 실패 테스트를 작성한다**

Create `tests/components/theme-toggle.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ThemeToggle } from "@/components/chrome/ThemeToggle";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "system", setTheme }),
}));

beforeEach(() => setTheme.mockClear());

it("시스템·라이트·다크 선택을 제공하고 다크 선택을 저장한다", () => {
  render(<ThemeToggle />);

  expect(screen.getByRole("group", { name: "색상 테마" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "다크" }));
  expect(setTheme).toHaveBeenCalledWith("dark");
});
```

- [x] **Step 2: 테마 테스트가 컴포넌트 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/components/theme-toggle.test.tsx`

Expected: FAIL with an import resolution error for `ThemeToggle`.

- [x] **Step 3: 고정 컬러·spacing 토큰과 전역 스타일을 작성한다**

Create `src/styles/tokens.css`:

```css
:root {
  color-scheme: light;
  --bg: #f5f4ef;
  --surface: #ffffff;
  --text: #111318;
  --muted: #59616c;
  --line: #d3d5d1;
  --accent: #2457e6;
  --positive: #087553;
  --warning: #b54708;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  --space-24: 96px;
  --space-32: 128px;
  --page-width: 75rem;
  --reading-width: 45rem;
  --card-radius: 8px;
  --phone-radius: 28px;
}

.dark {
  color-scheme: dark;
  --bg: #0b0d10;
  --surface: #12161c;
  --text: #f4f5f0;
  --muted: #aab2bd;
  --line: #303641;
  --accent: #86a6ff;
  --positive: #5bd3a5;
  --warning: #ffb36b;
}
```

Create `src/styles/globals.css`:

```css
@import "./tokens.css";

* { box-sizing: border-box; }
html { background: var(--bg); }
body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font-sans), sans-serif; }
a { color: inherit; text-underline-offset: 0.2em; }
button, input { font: inherit; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.skip-link { position: fixed; inset: 8px auto auto 8px; z-index: 100; transform: translateY(-150%); background: var(--text); color: var(--bg); padding: 12px 16px; }
.skip-link:focus { transform: translateY(0); }
.page-shell { width: min(var(--page-width), calc(100% - 40px)); margin-inline: auto; }
.site-main { min-height: 70dvh; }
@media (min-width: 768px) { .page-shell { width: min(var(--page-width), calc(100% - 64px)); } }
@media (min-width: 1440px) { .page-shell { width: min(var(--page-width), calc(100% - 96px)); } }
```

- [x] **Step 4: ThemeProvider·ThemeToggle·chrome를 구현한다**

Create `src/providers/ThemeProvider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { PropsWithChildren } from "react";

export function ThemeProvider({ children }: PropsWithChildren) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
```

Create `src/components/chrome/ThemeToggle.tsx`:

```tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const themes = [
  ["system", "시스템"],
  ["light", "라이트"],
  ["dark", "다크"],
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div role="group" aria-label="색상 테마" data-mounted={mounted}>
      {themes.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={mounted && theme === value}
          onClick={() => setTheme(value)}
          style={{ minWidth: 44, minHeight: 44 }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
```

Create `src/components/chrome/Header.tsx` and `src/components/chrome/Footer.tsx`:

```tsx
// src/components/chrome/Header.tsx
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="page-shell">
      <nav aria-label="주요 탐색">
        <Link href="/">고창민</Link>
        <Link href="/#work">작업</Link>
        <Link href="/#career">경력</Link>
        <Link href="/#contact">연락</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}

// src/components/chrome/Footer.tsx
export function Footer() {
  return (
    <footer className="page-shell">
      <p>© 2026 고창민. 측정한 결과만 말합니다.</p>
    </footer>
  );
}
```

- [x] **Step 5: reduced-motion을 지키는 Reveal 경계를 구현한다**

Create `src/components/motion/Reveal.tsx`:

```tsx
"use client";

import { domAnimation, LazyMotion, m, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <m.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: reduceMotion ? 0 : 0.24, delay }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
```

- [x] **Step 6: 폰트·테마·landmark를 RootLayout에 연결한다**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { IBM_Plex_Mono, Noto_Sans_KR } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "@/components/chrome/Footer";
import { Header } from "@/components/chrome/Header";
import { ThemeProvider } from "@/providers/ThemeProvider";
import "@/styles/globals.css";

const sans = Noto_Sans_KR({ weight: ["400", "600", "700"], variable: "--font-sans" });
const mono = IBM_Plex_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "고창민 · 성능 엔지니어", template: "%s · 고창민" },
  description: "측정으로 웹과 웹뷰의 병목을 찾아 결과로 바꾸는 프론트엔드 엔지니어 고창민입니다.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <body>
        <ThemeProvider>
          <a className="skip-link" href="#main-content">본문으로 건너뛰기</a>
          <Header />
          <main id="main-content" className="site-main" tabIndex={-1}>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [x] **Step 7: 테마와 기반 검사를 통과시킨다**

Run:

```bash
pnpm add next-themes@latest framer-motion@latest
pnpm test:run tests/components/theme-toggle.test.tsx tests/components/home-page.test.tsx
pnpm lint
pnpm typecheck
```

Expected: 2 tests pass and lint/typecheck exit 0.

- [x] **Step 8: 디자인 기반을 커밋한다**

```bash
git add package.json pnpm-lock.yaml src/styles src/providers src/components/chrome src/components/motion src/app/layout.tsx tests/components/theme-toggle.test.tsx
git commit -m "feat: 디자인 토큰과 테마 기반 구현"
```

### Task 3: 콘텐츠 스키마와 컬렉션 규칙 TDD

**Spec coverage:** 3절 6개 사례 식별자, 5절 콘텐츠 모델·오류 처리, 8절 콘텐츠 스키마 단위 테스트

**Files:**
- Create: `src/content/work.schema.ts`
- Create: `tests/unit/work-schema.test.ts`

**Interfaces:**
- Consumes: Zod.
- Produces: `WORK_SLUGS: readonly WorkSlug[]`; `WorkSlug`; `DemoKind = "freeze" | "traffic" | "stackflow" | "none"`; `Evidence`; `WorkMeta`; `WorkMetaSchema`; `isWorkSlug(value: string): value is WorkSlug`; `validateWorkCollection(records: readonly unknown[]): readonly WorkMeta[]` sorted by `order`.

- [x] **Step 1: Zod와 스키마 실패 테스트를 추가한다**

Run: `pnpm add zod@latest`

Create `tests/unit/work-schema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateWorkCollection, type WorkMeta } from "@/content/work.schema";

const base: WorkMeta[] = [
  ["webview-freeze", 1, "freeze", "large"],
  ["traffic-spike", 2, "traffic", "large"],
  ["vue-next-migration", 3, "none", "standard"],
  ["epub-comic-viewer", 4, "stackflow", "large"],
  ["ai-workflow", 5, "none", "standard"],
  ["isr-redis-cachehandler-poc", 6, "none", "standard"],
].map(([slug, order, demo, cardSize]) => ({
  slug,
  order,
  demo,
  cardSize,
  title: String(slug),
  summary: "문제와 결과를 요약한 문장",
  role: "프론트엔드 엔지니어",
  period: "밀리의서재 · 2023–현재",
  stack: ["TypeScript"],
  evidence: [{ label: "결과", value: "검증됨" }],
})) as WorkMeta[];

describe("validateWorkCollection", () => {
  it("정확한 6개 사례를 order 순으로 반환한다", () => {
    expect(validateWorkCollection([...base].reverse()).map((item) => item.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("데모 카드가 standard이면 거부한다", () => {
    const invalid = base.map((item) => item.slug === "webview-freeze" ? { ...item, cardSize: "standard" } : item);
    expect(() => validateWorkCollection(invalid)).toThrow("데모 사례의 cardSize는 large여야 합니다");
  });

  it("중복 order를 거부한다", () => {
    const invalid = base.map((item) => item.slug === "traffic-spike" ? { ...item, order: 1 } : item);
    expect(() => validateWorkCollection(invalid)).toThrow("order는 1부터 6까지 중복 없이 존재해야 합니다");
  });
});
```

- [x] **Step 2: 스키마 모듈 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/unit/work-schema.test.ts`

Expected: FAIL with an import resolution error for `@/content/work.schema`.

- [x] **Step 3: 타입과 단일 레코드 검증을 구현한다**

Create `src/content/work.schema.ts`:

```ts
import { z } from "zod";

export const WORK_SLUGS = [
  "webview-freeze",
  "traffic-spike",
  "vue-next-migration",
  "epub-comic-viewer",
  "ai-workflow",
  "isr-redis-cachehandler-poc",
] as const;

export type WorkSlug = (typeof WORK_SLUGS)[number];
export type DemoKind = "freeze" | "traffic" | "stackflow" | "none";

const EvidenceSchema = z.object({
  label: z.string().min(1),
  before: z.string().min(1).optional(),
  after: z.string().min(1).optional(),
  value: z.string().min(1).optional(),
  unit: z.string().min(1).optional(),
}).superRefine((evidence, context) => {
  const hasPair = evidence.before !== undefined && evidence.after !== undefined;
  const hasValue = evidence.value !== undefined;
  if (hasPair === hasValue) {
    context.addIssue({ code: "custom", message: "evidence는 before/after 쌍 또는 value 하나를 가져야 합니다" });
  }
});

export const WorkMetaSchema = z.object({
  slug: z.enum(WORK_SLUGS),
  order: z.number().int().min(1).max(6),
  title: z.string().min(1),
  summary: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  evidence: z.array(EvidenceSchema).min(1),
  demo: z.enum(["freeze", "traffic", "stackflow", "none"]),
  cardSize: z.enum(["large", "standard"]),
}).superRefine((work, context) => {
  const expected = work.demo === "none" ? "standard" : "large";
  if (work.cardSize !== expected) {
    context.addIssue({ code: "custom", path: ["cardSize"], message: work.demo === "none"
      ? "데모 없는 사례의 cardSize는 standard여야 합니다"
      : "데모 사례의 cardSize는 large여야 합니다" });
  }
});

export type Evidence = z.infer<typeof EvidenceSchema>;
export type WorkMeta = z.infer<typeof WorkMetaSchema>;

export function isWorkSlug(value: string): value is WorkSlug {
  return (WORK_SLUGS as readonly string[]).includes(value);
}

export function validateWorkCollection(records: readonly unknown[]): readonly WorkMeta[] {
  const parsed = records.map((record) => WorkMetaSchema.parse(record));
  if (parsed.length !== WORK_SLUGS.length || new Set(parsed.map(({ slug }) => slug)).size !== WORK_SLUGS.length) {
    throw new Error("6개 허용 slug가 각각 한 번씩 존재해야 합니다");
  }
  const orders = [...parsed].map(({ order }) => order).sort((a, b) => a - b);
  if (orders.join(",") !== "1,2,3,4,5,6") {
    throw new Error("order는 1부터 6까지 중복 없이 존재해야 합니다");
  }
  return [...parsed].sort((a, b) => a.order - b.order);
}
```

- [x] **Step 4: 스키마 테스트와 타입 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/unit/work-schema.test.ts
pnpm typecheck
```

Expected: 3 tests pass and typecheck exits 0.

- [x] **Step 5: 콘텐츠 계약을 커밋한다**

```bash
git add package.json pnpm-lock.yaml src/content/work.schema.ts tests/unit/work-schema.test.ts
git commit -m "feat: 케이스스터디 콘텐츠 스키마 추가"
```

### Task 4: MDX 6개와 정적 레지스트리 구축

**Spec coverage:** 2절 6개 경로, 3절 사례 콘텐츠 전체, 5절 MDX 모델·정적 loader·빌드 검증, 9절 한국어 단일·CMS 없음

**Files:**
- Create: `content/work/webview-freeze.mdx`
- Create: `content/work/traffic-spike.mdx`
- Create: `content/work/vue-next-migration.mdx`
- Create: `content/work/epub-comic-viewer.mdx`
- Create: `content/work/ai-workflow.mdx`
- Create: `content/work/isr-redis-cachehandler-poc.mdx`
- Create: `src/content/work.registry.ts`
- Create: `src/content/work.loaders.ts`
- Create: `src/types/mdx.d.ts`
- Create: `tests/unit/work-registry.test.ts`
- Modify: `next.config.mjs`
- Modify: `vitest.config.ts`

**Interfaces:**
- Consumes: Task 3의 `WorkMeta`, `WorkSlug`, `WORK_SLUGS`, `isWorkSlug`, `validateWorkCollection`.
- Produces: `workItems: readonly WorkMeta[]`; `getWork(slug: WorkSlug): WorkMeta`; `getAdjacentWorks(slug: WorkSlug): { previous: WorkMeta | null; next: WorkMeta | null }`; `loadWork(slug: WorkSlug): Promise<{ default: ComponentType }>`; `loadWorkModule(slug: WorkSlug): Promise<{ default: ComponentType }>`; YAML frontmatter를 가진 MDX 6개.

- [x] **Step 1: 레지스트리 통합 실패 테스트를 작성한다**

Create `tests/unit/work-registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getAdjacentWorks, getWork, workItems } from "@/content/work.registry";

describe("work registry", () => {
  it("6개 MDX 메타데이터를 순서대로 노출한다", () => {
    expect(workItems).toHaveLength(6);
    expect(workItems.map(({ slug }) => slug)).toEqual([
      "webview-freeze", "traffic-spike", "vue-next-migration",
      "epub-comic-viewer", "ai-workflow", "isr-redis-cachehandler-poc",
    ]);
  });

  it("경계 사례의 이전·다음 링크를 계산한다", () => {
    expect(getAdjacentWorks("webview-freeze")).toMatchObject({ previous: null, next: { slug: "traffic-spike" } });
    expect(getAdjacentWorks("isr-redis-cachehandler-poc")).toMatchObject({ previous: { slug: "ai-workflow" }, next: null });
    expect(getWork("traffic-spike").evidence[0]).toMatchObject({ label: "P95", before: "15000", after: "450", unit: "ms" });
  });
});
```

- [x] **Step 2: 레지스트리 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/unit/work-registry.test.ts`

Expected: FAIL with an import resolution error for `@/content/work.registry`.

- [x] **Step 3: MDX 도구와 Next 설정을 추가한다**

Run:

```bash
pnpm add @next/mdx@latest gray-matter@latest remark-frontmatter@latest
pnpm add -D @mdx-js/rollup@latest
```

Replace `next.config.mjs`:

```js
import createMDX from "@next/mdx";
import remarkFrontmatter from "remark-frontmatter";

const withMDX = createMDX({ options: { remarkPlugins: [remarkFrontmatter] } });

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
};

export default withMDX(nextConfig);
```

Replace `vitest.config.ts` so Vitest can resolve the same local MDX modules:

```ts
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import remarkFrontmatter from "remark-frontmatter";

export default defineConfig({
  plugins: [mdx({ remarkPlugins: [remarkFrontmatter] }), react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    restoreMocks: true,
    coverage: { reporter: ["text", "html"] },
  },
});
```

Create `src/types/mdx.d.ts`:

```ts
declare module "*.mdx" {
  import type { ComponentType } from "react";
  const MDXComponent: ComponentType;
  export default MDXComponent;
}
```

- [x] **Step 4: freeze·traffic MDX를 실제 내용으로 작성한다**

Create `content/work/webview-freeze.mdx`:

```mdx
---
slug: webview-freeze
order: 1
title: 안드로이드 웹뷰 10초+ freeze 진단
summary: 697개 호출 경로의 쿠키 재파싱을 찾아 메인스레드 점유를 71% 줄였습니다.
role: 성능 진단·캐시 설계·검증
period: 밀리의서재 · 2023–현재
stack: [TypeScript, React, Android WebView, Performance API]
evidence:
  - { label: 메인스레드, before: "9.2", after: "2.6", unit: s }
  - { label: Long Task, before: "4", after: "0", unit: 개 }
demo: freeze
cardSize: large
---

## 문제

안드로이드 웹뷰 첫 진입에서 화면이 10초 이상 멈췄습니다. 프로파일링 결과 `getConfig()`가 697개 호출부에서 매 렌더마다 `document.cookie`를 다시 파싱하며 메인스레드를 점유했습니다.

## 행동

호출 빈도와 Long Task 타임라인을 연결해 원인을 좁혔습니다. 쿠키 파싱 결과를 캐시하고 첫 렌더에는 동기 시드 값을 제공해 비동기 준비를 기다리지 않도록 경계를 바꿨습니다.

<div data-wide role="img" aria-label="697개 호출부에서 getConfig와 document.cookie 재파싱을 거쳐 Long Task가 발생하고, 캐시와 동기 시드로 경로를 줄이는 흐름"><code>697 호출부 → getConfig() → document.cookie 재파싱 → Long Task<br />697 호출부 → 캐시 읽기 + 첫 렌더 동기 시드 → 즉시 반환</code></div>

## 성과

메인스레드 점유는 9.2초에서 2.6초로 71% 감소했고 Long Task는 4개에서 0개가 됐습니다. 공개 데모는 실제 쿠키가 아니라 64KB 합성 문자열로 같은 원리만 재현합니다.
```

Create `content/work/traffic-spike.mdx`:

```mdx
---
slug: traffic-spike
order: 2
title: Next.js 트래픽 스파이크 대응
summary: 배포·번들·이미지 경로를 함께 바꿔 P95를 97% 줄이고 처리량을 2.7배 높였습니다.
role: 성능 분석·배포 구조·프론트엔드 최적화
period: 밀리의서재 · 2023–현재
stack: [TypeScript, Next.js, Docker, Web Vitals]
evidence:
  - { label: P95, before: "15000", after: "450", unit: ms }
  - { label: 처리량, value: "2.7배" }
  - { label: 이미지, before: "6.69", after: "1.87", unit: GB }
demo: traffic
cardSize: large
---

## 문제

트래픽 급증 구간에서 서버 응답 지연과 정적 자산 비용이 함께 증가해 P95가 15초까지 치솟고 처리량이 제한됐습니다.

## 행동

Next.js standalone 배포를 재구성하고 서버 번들을 축소했습니다. 초기 경로의 비핵심 기능을 lazy loading으로 분리하고 이미지 전송량과 Web Vitals를 같은 변경 묶음에서 추적했습니다.

<div data-wide role="img" aria-label="요청 큐가 축소된 standalone 서버 번들과 지연 로딩 정적 자산으로 분기되는 최적화 구조"><code>요청 큐 → standalone 서버 → 축소된 server bundle<br />브라우저 → 핵심 route chunk + 필요 시 lazy chunk → 최적화 이미지</code></div>

## 성과

처리량은 2.7배, P95는 15,000ms에서 450ms로 개선됐습니다. Web Vitals 점수는 68에서 88, 이미지 용량은 6.69GB에서 1.87GB로 줄었습니다. 데모의 값은 실측 재생이 아니라 결정적 가상 큐의 출력입니다.
```

- [x] **Step 5: migration·viewer MDX를 실제 내용으로 작성한다**

Create `content/work/vue-next-migration.mdx`:

```mdx
---
slug: vue-next-migration
order: 3
title: 무중단 Vue→Next.js 전환
summary: LB 경로 라우팅과 dev-proxy로 6개 도메인을 중단 없이 점진 전환했습니다.
role: 전환 아키텍처·라우팅·개발 환경
period: 밀리의서재 · 2023–현재
stack: [Vue, Nuxt, React, Next.js, Load Balancer]
evidence:
  - { label: 전환 도메인, value: "6개" }
  - { label: 서비스 중단, value: "0건" }
demo: none
cardSize: standard
---

## 문제

운영 중인 Vue 서비스 6개 도메인을 한 번에 교체하면 배포 위험과 회귀 범위가 커지고, 두 프레임워크가 공존하는 동안 개발 환경과 운영 요청 경로가 달라질 수 있었습니다.

## 행동

로드 밸런서에서 경로별로 Vue와 Next.js를 나눠 라우팅했습니다. 로컬에도 같은 경로 규칙을 재현하는 dev-proxy를 만들어 기능 단위 이관과 즉시 롤백이 가능하게 했습니다.

<div data-wide role="img" aria-label="로드 밸런서가 유지 경로는 Vue로, 이관 경로는 Next.js로 보내며 dev-proxy가 같은 규칙을 재현하는 병행 라우팅"><code>Request → Load Balancer → 유지 경로: Vue<br />Request → Load Balancer → 이관 경로: Next.js<br />Local Request → dev-proxy → 같은 경로 규칙</code></div>

## 성과

6개 도메인을 서비스 중단 0건으로 전환했습니다. 빅뱅 교체 대신 병행 운영을 선택해 변경 범위와 롤백 경계를 작게 유지했습니다.
```

Create `content/work/epub-comic-viewer.mdx`:

```mdx
---
slug: epub-comic-viewer
order: 4
title: EPUB/Comic 뷰어와 웹뷰 경계 설계
summary: DRM 복호화를 Worker로 분리하고 네이티브 브릿지 계약을 표준화했습니다.
role: 뷰어 아키텍처·Worker·웹뷰 브릿지
period: 밀리의서재 · 2023–현재
stack: [TypeScript, Web Worker, EPUB, Android WebView, iOS WebView]
evidence:
  - { label: 구조적 성과, value: "DRM 작업 분리 · 브릿지 표준화" }
demo: stackflow
cardSize: large
---

## 문제

EPUB/Comic 렌더링, DRM 복호화, 네이티브 통신이 한 실행 경로에 얽히면 무거운 연산이 UI 반응성을 떨어뜨리고 플랫폼별 브릿지 차이가 누적됐습니다.

## 행동

DRM 복호화를 Web Worker로 옮겨 계산 경계를 분리했습니다. 네이티브 호출과 응답을 공통 브릿지 계약으로 표준화해 웹·Worker·컨테이너의 실패 책임을 명확히 했습니다.

<div data-wide role="img" aria-label="메인스레드가 DRM Worker와 메시지를 주고받고 공통 브릿지가 Android와 iOS 네이티브 컨테이너를 연결하는 구조"><code>Main Thread ↔ DRM Web Worker<br />Main Thread ↔ 공통 Bridge ↔ Android / iOS Container</code></div>

## 성과

복호화 연산과 인터랙션 경로가 분리되고 웹·네이티브 통신의 단일 계약이 생겼습니다. 확인되지 않은 효과는 숫자로 만들지 않고 구조와 책임 경계를 증거로 제시합니다.
```

- [x] **Step 6: AI·ISR MDX를 실제 내용으로 작성한다**

Create `content/work/ai-workflow.mdx`:

```mdx
---
slug: ai-workflow
order: 5
title: 팀 AI 워크플로우 표준화
summary: 생성→테스트→영향분석→배포를 개인 프롬프트가 아닌 팀 표준으로 만들었습니다.
role: 개발 워크플로우·검증 게이트·배포 자동화
period: 밀리의서재 · 2023–현재
stack: [TypeScript, Swagger, AI TDD, Multi-agent, CI/CD]
evidence:
  - { label: 표준 흐름, value: "생성→테스트→영향분석→배포" }
demo: none
cardSize: standard
---

## 문제

API 연동, 테스트, 변경 영향 확인, 배포가 개인별 프롬프트와 수작업에 의존하면 결과의 재현성과 리뷰 기준이 흔들렸습니다.

## 행동

Swagger 명세 기반 클라이언트 생성, AI TDD, 멀티에이전트 영향분석을 한 작업 순서로 연결했습니다. 밀리 바이브 배포 파이프라인에 각 단계의 입력·출력·사람 승인 지점을 명시했습니다.

<ol data-wide aria-label="팀 AI 개발 파이프라인"><li>Swagger 명세 → 타입 안전 클라이언트 생성</li><li>실패 테스트 → AI 최소 구현 → 테스트 통과</li><li>멀티에이전트 영향분석 → 사람의 리뷰 승인</li><li>밀리 바이브 배포 파이프라인 → 배포 승인</li></ol>

## 성과

AI 사용을 단발성 코드 생성이 아닌 반복 가능한 팀 표준과 배포 흐름으로 전환했습니다. 검증되지 않은 생산성 비율 대신 표준 산출물과 승인 게이트를 성과로 설명합니다.
```

Create `content/work/isr-redis-cachehandler-poc.mdx`:

```mdx
---
slug: isr-redis-cachehandler-poc
order: 6
title: ISR + Redis CacheHandler PoC와 도입 보류
summary: 구현 가능성보다 운영 복잡도와 장애 범위를 먼저 평가해 도입을 보류했습니다.
role: PoC·캐시 설계·기술 의사결정
period: 밀리의서재 · 2023–현재
stack: [Next.js, ISR, Redis, CacheHandler]
evidence:
  - { label: 결정, value: "PoC 후 도입 보류" }
demo: none
cardSize: standard
---

## 문제

ISR 캐시를 Redis CacheHandler로 공유하는 방안이 실제 운영 이득을 주는지, 추가 인프라와 장애 범위를 감수할 가치가 있는지 검증해야 했습니다.

## 행동

PoC로 캐시 읽기·쓰기 경로를 구성하고 기대 이득, 운영 복잡도, 장애 전파 범위, 관측 가능성, 롤백 비용을 같은 의사결정 매트릭스에서 평가했습니다.

| 판단 축 | 검증 방법 | 채택 조건 |
|---|---|---|
| 실측 이득 | 기존 ISR과 Redis 공유 캐시의 응답·hit ratio 비교 | 운영 비용을 상쇄하는 개선 |
| 운영 복잡도 | Redis·CacheHandler 배포와 관측 절차 실행 | 팀이 지속 운영 가능한 절차 |
| 장애 범위 | Redis 지연·중단 시나리오 주입 | 인스턴스 간 장애 전파 격리 |
| 롤백 | 기존 ISR 경로 복귀 rehearsal | 데이터 손실 없는 즉시 복귀 |

## 성과

구현 가능하다는 이유만으로 도입하지 않고 채택을 보류했습니다. 확인되지 않은 성능 수치를 만들지 않고 문제 적합성과 운영 비용을 우선한 판단 과정을 성과로 제시합니다.
```

- [x] **Step 7: frontmatter 레지스트리와 정적 loader를 구현한다**

Create `src/content/work.registry.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { WORK_SLUGS, validateWorkCollection, type WorkMeta, type WorkSlug } from "./work.schema";

const contentRoot = join(process.cwd(), "content", "work");
export const workItems = validateWorkCollection(WORK_SLUGS.map((slug) => {
  const source = readFileSync(join(contentRoot, `${slug}.mdx`), "utf8");
  return matter(source).data;
}));

export function getWork(slug: WorkSlug): WorkMeta {
  const work = workItems.find((item) => item.slug === slug);
  if (!work) throw new Error(`등록되지 않은 work slug: ${slug}`);
  return work;
}

export function getAdjacentWorks(slug: WorkSlug): { previous: WorkMeta | null; next: WorkMeta | null } {
  const index = workItems.findIndex((item) => item.slug === slug);
  return { previous: workItems[index - 1] ?? null, next: workItems[index + 1] ?? null };
}

export async function loadWork(slug: WorkSlug) {
  const { loadWorkModule } = await import("./work.loaders");
  return loadWorkModule(slug);
}
```

Create `src/content/work.loaders.ts` so the home metadata import never evaluates MDX loaders:

```ts
import type { ComponentType } from "react";
import type { WorkSlug } from "./work.schema";

type WorkModule = { default: ComponentType };
const loaders: Record<WorkSlug, () => Promise<WorkModule>> = {
  "webview-freeze": () => import("../../content/work/webview-freeze.mdx"),
  "traffic-spike": () => import("../../content/work/traffic-spike.mdx"),
  "vue-next-migration": () => import("../../content/work/vue-next-migration.mdx"),
  "epub-comic-viewer": () => import("../../content/work/epub-comic-viewer.mdx"),
  "ai-workflow": () => import("../../content/work/ai-workflow.mdx"),
  "isr-redis-cachehandler-poc": () => import("../../content/work/isr-redis-cachehandler-poc.mdx"),
};

export function loadWorkModule(slug: WorkSlug): Promise<WorkModule> {
  return loaders[slug]();
}
```

- [x] **Step 8: 레지스트리와 콘텐츠 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/unit/work-schema.test.ts tests/unit/work-registry.test.ts
pnpm lint
pnpm typecheck
```

Expected: 5 tests pass and lint/typecheck exit 0.

- [x] **Step 9: MDX 콘텐츠 기반을 커밋한다**

```bash
git add package.json pnpm-lock.yaml next.config.mjs vitest.config.ts content/work src/content/work.registry.ts src/content/work.loaders.ts src/types/mdx.d.ts tests/unit/work-registry.test.ts
git commit -m "feat: 여섯 개 케이스스터디 콘텐츠 추가"
```

### Task 5: 홈 정적 섹션과 bento 레이아웃 구현

**Spec coverage:** 1절 포지셔닝, 2절 홈 순서·bento·경력·연락처, 3절 카드 요약, 6절 anti-template·레이아웃, 7절 landmark·pointer target

**Files:**
- Create: `src/components/home/Hero.tsx`
- Create: `src/components/home/WorkBento.tsx`
- Create: `src/components/home/CareerTimeline.tsx`
- Create: `src/components/home/Contact.tsx`
- Create: `src/components/home/home.module.css`
- Create: `src/components/chrome/chrome.module.css`
- Create: `tests/components/home-sections.test.tsx`
- Modify: `src/components/chrome/Header.tsx`
- Modify: `src/components/chrome/Footer.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Task 2의 `Reveal`, 전역 토큰; Task 3의 `WorkMeta`; Task 4의 `workItems: readonly WorkMeta[]`.
- Produces: `Hero({ metrics? }: { metrics?: ReactNode }): JSX.Element`; `WorkBento({ items }: { items: readonly WorkMeta[] }): JSX.Element`; `CareerTimeline(): JSX.Element`; `Contact(): JSX.Element`; 홈의 고정 section id `work`, `career`, `contact`.

- [x] **Step 1: 홈 구조의 실패 테스트를 작성한다**

Create `tests/components/home-sections.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";

it("히어로 다음에 작업·경력·연락처를 렌더한다", () => {
  const { container } = render(<HomePage />);
  expect(screen.getByText("측정으로 증명하는 성능 엔지니어 — 웹과 웹뷰의 병목을 숫자로 찾고 결과로 바꿉니다.")).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /케이스스터디 보기/ })).toHaveLength(6);
  expect([...container.querySelectorAll("section")].map((section) => section.id)).toEqual(["", "work", "career", "contact"]);
});
```

- [x] **Step 2: 여섯 카드가 없어 실패하는지 확인한다**

Run: `pnpm test:run tests/components/home-sections.test.tsx`

Expected: FAIL because the six case-study links are absent.

- [x] **Step 3: Hero와 WorkBento를 구현한다**

Create `src/components/home/Hero.tsx`:

```tsx
import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";
import styles from "./home.module.css";

export function Hero({ metrics }: { metrics?: ReactNode }) {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <Reveal>
        <p className={styles.eyebrow}>KO CHANGMIN · FRONTEND ENGINEER</p>
        <h1 id="hero-title">느낌 대신, 측정으로 증명합니다.</h1>
        <p className={styles.positioning}>측정으로 증명하는 성능 엔지니어 — 웹과 웹뷰의 병목을 숫자로 찾고 결과로 바꿉니다.</p>
        <p>TypeScript·React·Next.js·Vue/Nuxt로 제품을 만들고 Docker·Redis까지 병목의 경계를 따라갑니다.</p>
        <a className={styles.primaryLink} href="#work">6개 케이스스터디 보기</a>
      </Reveal>
      {metrics}
    </section>
  );
}
```

Create `src/components/home/WorkBento.tsx`:

```tsx
import Link from "next/link";
import type { WorkMeta } from "@/content/work.schema";
import styles from "./home.module.css";

function evidenceText(work: WorkMeta): string {
  const item = work.evidence[0];
  return item.value ?? `${item.before}${item.unit ?? ""} → ${item.after}${item.unit ?? ""}`;
}

export function WorkBento({ items }: { items: readonly WorkMeta[] }) {
  return (
    <section id="work" className={styles.section} aria-labelledby="work-title">
      <p className={styles.eyebrow}>SELECTED WORK</p>
      <h2 id="work-title">문제를 결과로 바꾼 여섯 장면</h2>
      <div className={styles.bento}>
        {items.map((work) => (
          <Link
            key={work.slug}
            href={`/work/${work.slug}`}
            className={styles.card}
            data-size={work.cardSize}
            data-slug={work.slug}
            aria-label={`${work.title} 케이스스터디 보기`}
          >
            <span className={styles.cardOrder}>{String(work.order).padStart(2, "0")}</span>
            {work.demo !== "none" && <span className={styles.demoBadge}>직접 체험</span>}
            <h3>{work.title}</h3>
            <p>{work.summary}</p>
            <strong>{evidenceText(work)}</strong>
            <span>{work.stack.join(" · ")}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [x] **Step 4: 경력과 연락처 섹션을 구현한다**

Create `src/components/home/CareerTimeline.tsx`:

```tsx
import Link from "next/link";
import styles from "./home.module.css";

const careers = [
  {
    company: "밀리의서재",
    period: "2023.06–현재",
    summary: "웹·웹뷰 성능과 Next.js 전환, 콘텐츠 뷰어, 팀 AI 워크플로우를 설계하고 구현했습니다.",
    href: "/work/webview-freeze",
  },
  {
    company: "디케이테크인(kakao 프로젝트)",
    period: "2018.10–2023.06",
    summary: "Vue/Nuxt 기반 제품과 운영 프론트엔드의 구조를 만들고 안정적으로 확장했습니다.",
    href: "/work/vue-next-migration",
  },
] as const;

export function CareerTimeline() {
  return (
    <section id="career" className={styles.section} aria-labelledby="career-title">
      <p className={styles.eyebrow}>CAREER</p>
      <h2 id="career-title">7년 11개월, 경계를 따라간 기록</h2>
      <ol className={styles.timeline}>
        {careers.map((career) => (
          <li key={career.company}>
            <time>{career.period}</time>
            <h3>{career.company} · 프론트엔드 엔지니어</h3>
            <p>{career.summary}</p>
            <Link href={career.href}>연결된 사례 보기</Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

Create `src/components/home/Contact.tsx`:

```tsx
import styles from "./home.module.css";

export function Contact() {
  return (
    <section id="contact" className={`${styles.section} ${styles.contact}`} aria-labelledby="contact-title">
      <p className={styles.eyebrow}>CONTACT</p>
      <h2 id="contact-title">성능과 구조를 함께 해결할 프론트엔드 엔지니어를 찾고 있다면 이야기해 주세요.</h2>
      <div>
        <a href="mailto:rhckdals123@gmail.com">메일 보내기</a>
        <a href="https://github.com/changminKo" rel="noreferrer">GitHub 보기</a>
      </div>
    </section>
  );
}
```

- [x] **Step 5: 12열 bento와 반응형 홈 스타일을 구현한다**

Create `src/components/home/home.module.css`:

```css
.hero, .section { width: min(var(--page-width), calc(100% - 40px)); margin-inline: auto; }
.hero { min-height: 82dvh; display: grid; align-items: center; gap: var(--space-12); padding-block: var(--space-24); }
.hero h1 { max-width: 11ch; margin: var(--space-3) 0; font-size: clamp(3rem, 8vw, 7rem); line-height: 0.98; letter-spacing: -0.045em; }
.eyebrow, .cardOrder, .demoBadge { font-family: var(--font-mono), monospace; letter-spacing: 0.08em; }
.positioning { max-width: 45rem; font-size: clamp(1.1rem, 2vw, 1.5rem); }
.primaryLink { display: inline-flex; min-height: 44px; align-items: center; color: var(--accent); font-weight: 700; }
.section { padding-block: var(--space-16); }
.section h2 { max-width: 14ch; font-size: clamp(2rem, 4.5vw, 4.5rem); line-height: 1.05; }
.bento { display: grid; grid-template-columns: 1fr; gap: var(--space-4); }
.card { position: relative; display: flex; min-height: 18rem; flex-direction: column; gap: var(--space-4); padding: var(--space-6); border: 1px solid var(--line); border-radius: var(--card-radius); background: var(--surface); text-decoration: none; }
.card[data-size="large"] { min-height: 26rem; }
.card:hover, .card:focus-visible { border-color: var(--accent); transform: translateY(-4px); }
.card h3 { margin-top: auto; font-size: clamp(1.5rem, 3vw, 2.5rem); }
.card strong { color: var(--positive); font-family: var(--font-mono), monospace; font-size: 1.25rem; }
.demoBadge { align-self: flex-start; color: var(--warning); }
.timeline { display: grid; gap: var(--space-8); padding: 0; list-style: none; }
.timeline li { border-left: 1px solid var(--line); padding-left: var(--space-6); }
.timeline time { color: var(--muted); font-family: var(--font-mono), monospace; }
.timeline a { display: inline-flex; min-height: 44px; align-items: center; }
.contact { padding-bottom: var(--space-32); }
.contact div { display: flex; flex-wrap: wrap; gap: var(--space-6); }
.contact a { display: inline-flex; min-height: 44px; align-items: center; color: var(--accent); }
@media (min-width: 768px) {
  .hero, .section { width: min(var(--page-width), calc(100% - 64px)); }
  .bento { grid-template-columns: repeat(2, 1fr); }
  .card[data-size="large"] { grid-column: 1 / -1; }
  .section { padding-block: var(--space-24); }
}
@media (min-width: 1024px) {
  .bento { grid-template-columns: repeat(12, 1fr); }
  .card[data-slug="webview-freeze"] { grid-column: 1 / 7; grid-row: 1; }
  .card[data-slug="traffic-spike"] { grid-column: 7 / 13; grid-row: 1; }
  .card[data-slug="vue-next-migration"] { grid-column: 1 / 5; grid-row: 2; }
  .card[data-slug="epub-comic-viewer"] { grid-column: 5 / 13; grid-row: 2; }
  .card[data-slug="ai-workflow"] { grid-column: 1 / 7; grid-row: 3; }
  .card[data-slug="isr-redis-cachehandler-poc"] { grid-column: 7 / 13; grid-row: 3; }
}
@media (min-width: 1440px) { .hero, .section { width: min(var(--page-width), calc(100% - 96px)); } }
@media (prefers-reduced-motion: no-preference) { .card { transition: transform 180ms ease; } }
```

- [x] **Step 6: chrome 스타일과 홈 조합을 연결한다**

Create `src/components/chrome/chrome.module.css`:

```css
.header, .footer { padding-block: var(--space-4); }
.nav { display: flex; min-height: 44px; align-items: center; gap: var(--space-4); }
.brand { display: inline-flex; min-height: 44px; align-items: center; margin-right: auto; font-weight: 700; text-decoration: none; }
.nav > a:not(.brand) { display: none; }
.footer { border-top: 1px solid var(--line); color: var(--muted); }
@media (min-width: 768px) { .nav > a:not(.brand) { display: inline-flex; min-height: 44px; align-items: center; } }
```

Replace `src/components/chrome/Header.tsx`:

```tsx
import Link from "next/link";
import styles from "./chrome.module.css";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className={`page-shell ${styles.header}`}>
      <nav className={styles.nav} aria-label="주요 탐색">
        <Link className={styles.brand} href="/">고창민</Link>
        <Link href="/#work">작업</Link><Link href="/#career">경력</Link><Link href="/#contact">연락</Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}
```

Replace `src/components/chrome/Footer.tsx`:

```tsx
import styles from "./chrome.module.css";

export function Footer() {
  return <footer className={`page-shell ${styles.footer}`}><p>© 2026 고창민. 측정한 결과만 말합니다.</p></footer>;
}
```

Replace `src/app/page.tsx`:

```tsx
import { CareerTimeline } from "@/components/home/CareerTimeline";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { WorkBento } from "@/components/home/WorkBento";
import { workItems } from "@/content/work.registry";

export default function HomePage() {
  return <><Hero /><WorkBento items={workItems} /><CareerTimeline /><Contact /></>;
}
```

- [x] **Step 7: 홈 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/components/home-page.test.tsx tests/components/home-sections.test.tsx
pnpm lint
pnpm typecheck
pnpm build
```

Expected: 2 home tests pass, build exits 0, and `/` remains static.

- [x] **Step 8: 홈 정적 UI를 커밋한다**

```bash
git add src/components/home src/components/chrome src/app/page.tsx tests/components/home-sections.test.tsx
git commit -m "feat: 포지셔닝 홈과 bento 작업 목록 구현"
```

### Task 6: 정적 케이스스터디 페이지와 MDX 컴포넌트 구현

**Spec coverage:** 2절 `/work/[slug]` 공통 명세, 3절 본문 표시, 5절 정적 렌더링·metadata·404, 7절 읽기 폭·heading

**Files:**
- Create: `src/components/work/EvidenceMetric.tsx`
- Create: `src/components/work/SimulationMetric.tsx`
- Create: `src/components/work/CaseStudyLayout.tsx`
- Create: `src/components/work/work.module.css`
- Create: `mdx-components.tsx`
- Create: `src/app/work/[slug]/page.tsx`
- Create: `src/app/not-found.tsx`
- Create: `tests/components/case-study-layout.test.tsx`

**Interfaces:**
- Consumes: Task 3의 `WorkMeta`, `WorkSlug`, `isWorkSlug`; Task 4의 `workItems`, `getWork`, `getAdjacentWorks`, `loadWork`.
- Produces: `EvidenceMetric({ evidence }: { evidence: Evidence }): JSX.Element`; `SimulationMetric({ label, value, unit }: { label: string; value: number; unit: string }): JSX.Element`; `CaseStudyLayout(props: { work: WorkMeta; previous: WorkMeta | null; next: WorkMeta | null; children: ReactNode }): JSX.Element`; `generateStaticParams(): { slug: WorkSlug }[]`; 6개 정적 상세 페이지.

- [x] **Step 1: 사례 레이아웃의 실패 테스트를 작성한다**

Create `tests/components/case-study-layout.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { CaseStudyLayout } from "@/components/work/CaseStudyLayout";
import { getAdjacentWorks, getWork } from "@/content/work.registry";

it("실측 지표와 문제→행동→성과 본문, 이전·다음 링크를 표시한다", () => {
  const work = getWork("traffic-spike");
  const adjacent = getAdjacentWorks(work.slug);
  render(
    <CaseStudyLayout work={work} {...adjacent}>
      <h2>문제</h2><h2>행동</h2><h2>성과</h2>
    </CaseStudyLayout>,
  );
  expect(screen.getByRole("article")).toBeInTheDocument();
  expect(screen.getByText("15000ms → 450ms")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /다음.*무중단 Vue/ })).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { level: 2 }).map((node) => node.textContent)).toEqual(["문제", "행동", "성과"]);
});
```

- [x] **Step 2: 사례 레이아웃 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/components/case-study-layout.test.tsx`

Expected: FAIL with an import resolution error for `CaseStudyLayout`.

- [x] **Step 3: 실제·시뮬레이션 지표 컴포넌트를 구현한다**

Create `src/components/work/EvidenceMetric.tsx` and `src/components/work/SimulationMetric.tsx`:

```tsx
// src/components/work/EvidenceMetric.tsx
import type { Evidence } from "@/content/work.schema";
import styles from "./work.module.css";

export function EvidenceMetric({ evidence }: { evidence: Evidence }) {
  const result = evidence.value ?? `${evidence.before}${evidence.unit ?? ""} → ${evidence.after}${evidence.unit ?? ""}`;
  return <li className={styles.evidence}><span>실제 사례 결과 · {evidence.label}</span><strong>{result}</strong></li>;
}

// src/components/work/SimulationMetric.tsx
import styles from "./work.module.css";

export function SimulationMetric({ label, value, unit }: { label: string; value: number; unit: string }) {
  return <div className={styles.simulation}><span>원리 설명용 가상 모델 · {label}</span><strong>{value.toLocaleString("ko-KR")}{unit}</strong></div>;
}
```

- [x] **Step 4: 공통 사례 레이아웃과 스타일을 구현한다**

Create `src/components/work/CaseStudyLayout.tsx`:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";
import type { WorkMeta } from "@/content/work.schema";
import { EvidenceMetric } from "./EvidenceMetric";
import styles from "./work.module.css";

type Props = { work: WorkMeta; previous: WorkMeta | null; next: WorkMeta | null; children: ReactNode };

export function CaseStudyLayout({ work, previous, next, children }: Props) {
  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <Link href="/#work">← 모든 작업</Link>
        <p>{work.role} · {work.period}</p>
        <h1>{work.title}</h1>
        <p>{work.summary}</p>
        <p>{work.stack.join(" · ")}</p>
        <ul className={styles.evidenceList}>{work.evidence.map((evidence) => <EvidenceMetric key={evidence.label} evidence={evidence} />)}</ul>
      </header>
      <div className={styles.prose}>{children}</div>
      <nav className={styles.adjacent} aria-label="케이스스터디 이동">
        {previous ? <Link href={`/work/${previous.slug}`}>이전 · {previous.title}</Link> : <span />}
        {next ? <Link href={`/work/${next.slug}`}>다음 · {next.title}</Link> : <span />}
        <Link href="/#work">6개 작업 모두 보기</Link>
      </nav>
    </article>
  );
}
```

Create `src/components/work/work.module.css`:

```css
.article { padding-block: var(--space-16) var(--space-32); }
.header, .prose, .adjacent { width: min(var(--reading-width), calc(100% - 40px)); margin-inline: auto; }
.header h1 { font-size: clamp(2.5rem, 7vw, 6rem); line-height: 1; letter-spacing: -0.04em; }
.header > a { display: inline-flex; min-height: 44px; align-items: center; }
.evidenceList { display: grid; gap: var(--space-3); padding: 0; list-style: none; }
.evidence, .simulation { display: flex; justify-content: space-between; gap: var(--space-4); padding: var(--space-4); border: 1px solid var(--line); border-radius: var(--card-radius); }
.evidence strong { color: var(--positive); font-family: var(--font-mono), monospace; }
.simulation { background: color-mix(in srgb, var(--warning) 8%, var(--surface)); }
.simulation strong { color: var(--warning); font-family: var(--font-mono), monospace; }
.prose { font-size: clamp(1rem, 0.25vw + 0.95rem, 1.125rem); line-height: 1.75; }
.prose h2 { margin-top: var(--space-24); font-size: clamp(2rem, 4.5vw, 4.5rem); line-height: 1.05; }
.prose :global([data-wide]) { width: min(var(--page-width), calc(100vw - 40px)); margin-left: 50%; transform: translateX(-50%); }
.prose :global([role="img"]), .prose :global(ol[data-wide]) { padding: var(--space-6); border: 1px solid var(--line); border-radius: var(--card-radius); background: var(--surface); }
.prose :global(table) { width: 100%; border-collapse: collapse; }
.prose :global(th), .prose :global(td) { padding: var(--space-3); border: 1px solid var(--line); text-align: left; }
.adjacent { display: grid; gap: var(--space-4); margin-top: var(--space-24); padding-top: var(--space-8); border-top: 1px solid var(--line); }
.adjacent a { display: flex; min-height: 44px; align-items: center; }
@media (min-width: 768px) { .header, .prose, .adjacent { width: min(var(--reading-width), calc(100% - 64px)); } }
```

- [x] **Step 5: MDX 전역 매핑을 작성한다**

Run: `pnpm add -D @types/mdx@latest`

Create `mdx-components.tsx`:

```tsx
import type { MDXComponents } from "mdx/types";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
    ...components,
  };
}
```

- [x] **Step 6: 정적 상세 route와 404를 구현한다**

Create `src/app/work/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyLayout } from "@/components/work/CaseStudyLayout";
import { getAdjacentWorks, getWork, loadWork, workItems } from "@/content/work.registry";
import { isWorkSlug } from "@/content/work.schema";

type PageProps = { params: Promise<{ slug: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return workItems.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isWorkSlug(slug)) return {};
  const work = getWork(slug);
  return { title: work.title, description: work.summary, openGraph: { title: work.title, description: work.summary, locale: "ko_KR" } };
}

export default async function WorkPage({ params }: PageProps) {
  const { slug } = await params;
  if (!isWorkSlug(slug)) notFound();
  const work = getWork(slug);
  const adjacent = getAdjacentWorks(slug);
  const { default: Content } = await loadWork(slug);
  return <CaseStudyLayout work={work} {...adjacent}><Content /></CaseStudyLayout>;
}
```

Create `src/app/not-found.tsx`:

```tsx
import Link from "next/link";

export default function NotFound() {
  return <section className="page-shell"><p>404</p><h1>요청한 작업을 찾을 수 없습니다.</h1><Link href="/#work">6개 작업 보기</Link></section>;
}
```

- [x] **Step 7: 6개 정적 사례와 레이아웃을 검증한다**

Run:

```bash
pnpm test:run tests/components/case-study-layout.test.tsx tests/unit/work-registry.test.ts
pnpm lint
pnpm typecheck
pnpm build
```

Expected: tests pass, build exits 0, and build output contains the six `/work/...` paths plus `/`.

- [x] **Step 8: 케이스스터디 페이지를 커밋한다**

```bash
git add package.json pnpm-lock.yaml mdx-components.tsx src/components/work src/app/work src/app/not-found.tsx tests/components/case-study-layout.test.tsx
git commit -m "feat: 정적 MDX 케이스스터디 페이지 구현"
```

### Task 7: LiveBrowserMetrics와 렌더 프레임 측정 구현

**Spec coverage:** 1절 “이 사이트가 곧 증거”, 2절 히어로 라이브 지표 상태, 5절 클라이언트 경계·미지원 복구, 7절 aria-live·성능

**Files:**
- Create: `src/lib/performance/frame-meter.ts`
- Create: `src/lib/performance/vitals.ts`
- Create: `src/components/home/LiveBrowserMetrics.tsx`
- Create: `src/components/home/live-metrics.module.css`
- Create: `tests/unit/frame-meter.test.ts`
- Create: `tests/components/live-browser-metrics.test.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: Task 5의 `Hero({ metrics?: ReactNode })`.
- Produces: `VitalName = "LCP" | "CLS" | "INP"`; `VitalSupport = Record<VitalName, boolean>`; `detectVitalSupport(): VitalSupport`; `formatVital(name: VitalName, value: number): string`; `FrameSnapshot { medianMs: number; fps: number }`; `summarizeFrameGaps(gaps: readonly number[]): FrameSnapshot`; `FrameMeter { start(onSample: (sample: FrameSnapshot) => void): () => void }`; `createFrameMeter(): FrameMeter`; `LiveBrowserMetrics(props: { frameMeter?: FrameMeter; support?: VitalSupport }): JSX.Element`.

- [x] **Step 1: 프레임 통계의 실패 테스트를 작성한다**

Create `tests/unit/frame-meter.test.ts`:

```ts
import { expect, it } from "vitest";
import { summarizeFrameGaps } from "@/lib/performance/frame-meter";

it("최근 프레임 간격의 중앙값과 FPS를 계산한다", () => {
  expect(summarizeFrameGaps([16, 18, 17, 40])).toEqual({ medianMs: 17.5, fps: 57 });
});
```

- [x] **Step 2: 프레임 모듈 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/unit/frame-meter.test.ts`

Expected: FAIL with an import resolution error for `frame-meter`.

- [x] **Step 3: FrameMeter를 최소 구현한다**

Create `src/lib/performance/frame-meter.ts`:

```ts
export type FrameSnapshot = { medianMs: number; fps: number };
export type FrameMeter = { start(onSample: (sample: FrameSnapshot) => void): () => void };

export function summarizeFrameGaps(gaps: readonly number[]): FrameSnapshot {
  const sorted = [...gaps].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const medianMs = sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
  return { medianMs: Number(medianMs.toFixed(1)), fps: Math.round(1000 / medianMs) };
}

export function createFrameMeter(): FrameMeter {
  return {
    start(onSample) {
      let frameId = 0;
      let lastFrame = performance.now();
      let lastEmit = lastFrame;
      const gaps: number[] = [];
      const tick = (now: number) => {
        gaps.push(now - lastFrame);
        if (gaps.length > 120) gaps.shift();
        lastFrame = now;
        if (now - lastEmit >= 250 && gaps.length > 0) {
          onSample(summarizeFrameGaps(gaps));
          lastEmit = now;
        }
        frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frameId);
    },
  };
}
```

- [x] **Step 4: 프레임 단위 테스트를 통과시킨다**

Run: `pnpm test:run tests/unit/frame-meter.test.ts`

Expected: 1 test passes.

- [x] **Step 5: Web Vitals 상태의 실패 컴포넌트 테스트를 작성한다**

Create `tests/components/live-browser-metrics.test.tsx`:

```tsx
import { act, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { LiveBrowserMetrics } from "@/components/home/LiveBrowserMetrics";
import type { FrameMeter } from "@/lib/performance/frame-meter";

let report: (metric: { name: string; value: number }) => void = () => undefined;
vi.mock("next/web-vitals", () => ({ useReportWebVitals: (callback: typeof report) => { report = callback; } }));

it("측정 전 상태에서 실제 지표와 프레임 값으로 전환한다", () => {
  const frameMeter: FrameMeter = { start: (onSample) => { onSample({ medianMs: 16.7, fps: 60 }); return () => undefined; } };
  render(<LiveBrowserMetrics frameMeter={frameMeter} support={{ LCP: true, CLS: true, INP: true }} />);
  expect(screen.getByText("입력 전")).toBeInTheDocument();
  act(() => report({ name: "LCP", value: 1234.4 }));
  act(() => report({ name: "CLS", value: 0.0123 }));
  act(() => report({ name: "INP", value: 88.4 }));
  expect(screen.getByText("1,234ms")).toBeInTheDocument();
  expect(screen.getByText("0.012")).toBeInTheDocument();
  expect(screen.getByText("88ms")).toBeInTheDocument();
  expect(screen.getByText("16.7ms · 60 FPS")).toBeInTheDocument();
});
```

- [x] **Step 6: LiveBrowserMetrics 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/components/live-browser-metrics.test.tsx`

Expected: FAIL with an import resolution error for `LiveBrowserMetrics`.

- [x] **Step 7: Vital 지원·format 함수와 클라이언트 패널을 구현한다**

Create `src/lib/performance/vitals.ts`:

```ts
export type VitalName = "LCP" | "CLS" | "INP";
export type VitalSupport = Record<VitalName, boolean>;

export function detectVitalSupport(): VitalSupport {
  const entries = typeof PerformanceObserver === "undefined" ? [] : PerformanceObserver.supportedEntryTypes;
  return {
    LCP: entries.includes("largest-contentful-paint"),
    CLS: entries.includes("layout-shift"),
    INP: typeof PerformanceEventTiming !== "undefined" && entries.includes("event"),
  };
}

export function formatVital(name: VitalName, value: number): string {
  return name === "CLS" ? value.toFixed(3) : `${Math.round(value).toLocaleString("ko-KR")}ms`;
}
```

Create `src/components/home/LiveBrowserMetrics.tsx`:

```tsx
"use client";

import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createFrameMeter, type FrameMeter, type FrameSnapshot } from "@/lib/performance/frame-meter";
import { detectVitalSupport, formatVital, type VitalName, type VitalSupport } from "@/lib/performance/vitals";
import styles from "./live-metrics.module.css";

type Values = Partial<Record<VitalName, number>>;

export function LiveBrowserMetrics({ frameMeter, support }: { frameMeter?: FrameMeter; support?: VitalSupport }) {
  const meter = useMemo(() => frameMeter ?? createFrameMeter(), [frameMeter]);
  const supported = useMemo(() => support ?? detectVitalSupport(), [support]);
  const [values, setValues] = useState<Values>({});
  const [frame, setFrame] = useState<FrameSnapshot | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const onVital = useCallback((metric: { name: string; value: number }) => {
    if (metric.name !== "LCP" && metric.name !== "CLS" && metric.name !== "INP") return;
    setValues((current) => ({ ...current, [metric.name]: metric.value }));
    setAnnouncement(`${metric.name} 측정 완료`);
  }, []);
  useReportWebVitals(onVital);

  useEffect(() => {
    if (document.hidden) return;
    let stop = meter.start(setFrame);
    const onVisibility = () => { stop(); if (!document.hidden) stop = meter.start(setFrame); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [meter]);

  const text = (name: VitalName) => !supported[name]
    ? "이 브라우저에서 미지원"
    : values[name] === undefined
      ? name === "INP" ? "입력 전" : "측정 중"
      : formatVital(name, values[name]);

  return (
    <section className={styles.panel} aria-label="현재 브라우저 실측 성능">
      {(["LCP", "CLS", "INP"] as const).map((name) => <div key={name}><span>{name}</span><strong>{text(name)}</strong></div>)}
      <div><span>렌더 프레임</span><strong>{frame ? `${frame.medianMs}ms · ${frame.fps} FPS` : "측정 중"}</strong></div>
      <span className={styles.srOnly} aria-live="polite">{announcement}</span>
    </section>
  );
}
```

Create `src/components/home/live-metrics.module.css`:

```css
.panel { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); border: 1px solid var(--line); border-radius: var(--card-radius); background: var(--surface); }
.panel > div { display: grid; min-height: 112px; align-content: space-between; gap: var(--space-3); padding: var(--space-4); border: 0 solid var(--line); }
.panel > div:nth-child(odd) { border-right-width: 1px; }
.panel > div:nth-child(-n+2) { border-bottom-width: 1px; }
.panel span { color: var(--muted); font-family: var(--font-mono), monospace; }
.panel strong { min-height: 1.5em; font-family: var(--font-mono), monospace; font-variant-numeric: tabular-nums; }
.srOnly { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
```

- [x] **Step 8: 히어로에 라이브 패널을 연결한다**

Replace `src/app/page.tsx`:

```tsx
import { CareerTimeline } from "@/components/home/CareerTimeline";
import { Contact } from "@/components/home/Contact";
import { Hero } from "@/components/home/Hero";
import { LiveBrowserMetrics } from "@/components/home/LiveBrowserMetrics";
import { WorkBento } from "@/components/home/WorkBento";
import { workItems } from "@/content/work.registry";

export default function HomePage() {
  return <><Hero metrics={<LiveBrowserMetrics />} /><WorkBento items={workItems} /><CareerTimeline /><Contact /></>;
}
```

- [x] **Step 9: 라이브 지표 관련 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/unit/frame-meter.test.ts tests/components/live-browser-metrics.test.tsx tests/components/home-sections.test.tsx
pnpm lint
pnpm typecheck
```

Expected: frame test and both component tests pass; lint/typecheck exit 0.

- [x] **Step 10: 실측 히어로를 커밋한다**

```bash
git add src/lib/performance src/components/home/LiveBrowserMetrics.tsx src/components/home/live-metrics.module.css src/app/page.tsx tests/unit/frame-meter.test.ts tests/components/live-browser-metrics.test.tsx
git commit -m "feat: 브라우저 실측 성능 히어로 구현"
```

### Task 8: DemoSlot 지연 로딩과 세 비동기 청크 경계 구현

**Spec coverage:** 2절 MDX 데모 위치·고지, 4절 공통 로딩 규칙·오류 격리, 5절 클라이언트 경계, 7절 홈 import 제한

**Files:**
- Create: `src/components/mdx/DemoSlot.tsx`
- Create: `src/components/mdx/DemoErrorBoundary.tsx`
- Create: `src/components/mdx/demo-slot.module.css`
- Create: `src/features/demos/freeze/FreezeDemo.tsx`
- Create: `src/features/demos/traffic/TrafficSpikeDemo.tsx`
- Create: `src/features/demos/stackflow/StackflowDemo.tsx`
- Create: `tests/components/demo-slot.test.tsx`
- Modify: `mdx-components.tsx`
- Modify: `content/work/webview-freeze.mdx`
- Modify: `content/work/traffic-spike.mdx`
- Modify: `content/work/epub-comic-viewer.mdx`

**Interfaces:**
- Consumes: Task 3의 `DemoKind` 중 `Exclude<DemoKind, "none">`; Task 6의 MDX mapping.
- Produces: `DemoKind = "freeze" | "traffic" | "stackflow"`; `DemoObserver = (node: Element, onEnter: () => void) => () => void`; `DemoComponents = Record<DemoKind, ComponentType>`; `createDemoObserver(): DemoObserver`; `DemoSlot({ kind, observe?, components? }): JSX.Element`; literal dynamic loaders for three default exports; 격리된 오류와 재시도 UI.

- [x] **Step 1: 명시적 클릭 전 import 금지의 실패 테스트를 작성한다**

Create `tests/components/demo-slot.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { DemoSlot, type DemoComponents, type DemoObserver } from "@/components/mdx/DemoSlot";

const neverEnter: DemoObserver = () => () => undefined;
const components: DemoComponents = {
  freeze: () => <div data-testid="freeze-demo">freeze</div>,
  traffic: () => <div data-testid="traffic-demo">traffic</div>,
  stackflow: () => <div data-testid="stackflow-demo">stackflow</div>,
};

it("초기 셸을 렌더하고 버튼 입력 뒤 해당 데모만 표시한다", async () => {
  render(<DemoSlot kind="freeze" observe={neverEnter} components={components} />);
  expect(screen.queryByTestId("freeze-demo")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "freeze 데모 불러오기" }));
  expect(await screen.findByTestId("freeze-demo")).toBeInTheDocument();
  expect(screen.queryByTestId("traffic-demo")).not.toBeInTheDocument();
  expect(screen.getByText("이 데모는 실제 회사 코드나 트래픽이 아닌 원리 재현용 시뮬레이션입니다.")).toBeInTheDocument();
});

it("뷰포트 200px observer 진입으로도 데모를 표시한다", async () => {
  let enter = () => undefined;
  const observe: DemoObserver = (_node, onEnter) => { enter = onEnter; return () => undefined; };
  render(<DemoSlot kind="traffic" observe={observe} components={components} />);
  act(() => enter());
  expect(await screen.findByTestId("traffic-demo")).toBeInTheDocument();
});

it("데모 오류를 본문에서 격리하고 재시도 control을 제공한다", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const broken: DemoComponents = { ...components, freeze: () => { throw new Error("load failed"); } };
  render(<DemoSlot kind="freeze" observe={neverEnter} components={broken} />);
  fireEvent.click(screen.getByRole("button", { name: "freeze 데모 불러오기" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("데모를 불러오지 못했습니다.");
  expect(screen.getByRole("button", { name: "다시 불러오기" })).toBeInTheDocument();
});
```

- [x] **Step 2: DemoSlot 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/components/demo-slot.test.tsx`

Expected: FAIL with an import resolution error for `DemoSlot`.

- [x] **Step 3: 세 동적 대상의 독립 marker 컴포넌트를 만든다**

Create the initial default exports:

```tsx
// src/features/demos/freeze/FreezeDemo.tsx
export default function FreezeDemo() {
  return <div data-testid="freeze-demo" data-demo-chunk="demo-chunk:freeze">freeze 데모 준비 완료</div>;
}

// src/features/demos/traffic/TrafficSpikeDemo.tsx
export default function TrafficSpikeDemo() {
  return <div data-testid="traffic-demo" data-demo-chunk="demo-chunk:traffic">traffic 데모 준비 완료</div>;
}

// src/features/demos/stackflow/StackflowDemo.tsx
export default function StackflowDemo() {
  return <div data-testid="stackflow-demo" data-demo-chunk="demo-chunk:stackflow">Stackflow 데모 준비 완료</div>;
}
```

- [x] **Step 4: 데모 오류 경계를 구현한다**

Create `src/components/mdx/DemoErrorBoundary.tsx`:

```tsx
"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export class DemoErrorBoundary extends Component<
  { children: ReactNode; onRetry: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    if (process.env.NODE_ENV === "development") console.error(error, info.componentStack);
  }
  retry = () => { this.setState({ failed: false }); this.props.onRetry(); };
  render() {
    return this.state.failed
      ? <div role="alert"><p>데모를 불러오지 못했습니다.</p><button type="button" onClick={this.retry}>다시 불러오기</button></div>
      : this.props.children;
  }
}
```

- [x] **Step 5: observer와 `next/dynamic` DemoSlot을 구현한다**

Create `src/components/mdx/DemoSlot.tsx`:

```tsx
"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ComponentType } from "react";
import type { DemoKind as WorkDemoKind } from "@/content/work.schema";
import { DemoErrorBoundary } from "./DemoErrorBoundary";
import styles from "./demo-slot.module.css";

export type DemoKind = Exclude<WorkDemoKind, "none">;
export type DemoObserver = (node: Element, onEnter: () => void) => () => void;
export type DemoComponents = Record<DemoKind, ComponentType>;

const dynamicDemos: DemoComponents = {
  freeze: dynamic(() => import("@/features/demos/freeze/FreezeDemo"), { ssr: false, loading: () => <p>freeze 데모 로딩 중</p> }),
  traffic: dynamic(() => import("@/features/demos/traffic/TrafficSpikeDemo"), { ssr: false, loading: () => <p>traffic 데모 로딩 중</p> }),
  stackflow: dynamic(() => import("@/features/demos/stackflow/StackflowDemo"), { ssr: false, loading: () => <p>Stackflow 데모 로딩 중</p> }),
} as const;

export function createDemoObserver(): DemoObserver {
  return (node, onEnter) => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { onEnter(); observer.disconnect(); }
    }, { rootMargin: "200px" });
    observer.observe(node);
    return () => observer.disconnect();
  };
}

const defaultObserver = createDemoObserver();

export function DemoSlot({
  kind,
  observe = defaultObserver,
  components = dynamicDemos,
}: {
  kind: DemoKind;
  observe?: DemoObserver;
  components?: DemoComponents;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const [requested, setRequested] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const Demo = components[kind];
  useEffect(() => rootRef.current ? observe(rootRef.current, () => setRequested(true)) : undefined, [observe]);
  return (
    <section ref={rootRef} className={styles.slot} data-wide aria-labelledby={`${kind}-demo-title`}>
      <h3 id={`${kind}-demo-title`}>{kind} 원리 재현 데모</h3>
      {!requested && <button type="button" onClick={() => setRequested(true)}>{kind} 데모 불러오기</button>}
      {requested && <DemoErrorBoundary key={retryKey} onRetry={() => setRetryKey((key) => key + 1)}><Demo /></DemoErrorBoundary>}
      <p>이 데모는 실제 회사 코드나 트래픽이 아닌 원리 재현용 시뮬레이션입니다.</p>
    </section>
  );
}
```

Create `src/components/mdx/demo-slot.module.css`:

```css
.slot { margin-block: var(--space-16); padding: var(--space-6); border: 1px solid var(--line); border-radius: var(--card-radius); background: var(--surface); }
.slot button { min-width: 44px; min-height: 44px; color: var(--bg); border: 0; border-radius: var(--card-radius); background: var(--text); padding-inline: var(--space-4); }
```

- [x] **Step 6: DemoSlot을 MDX mapping과 세 본문에 연결한다**

Replace `mdx-components.tsx`:

```tsx
import type { MDXComponents } from "mdx/types";
import { DemoSlot } from "@/components/mdx/DemoSlot";

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
    p: ({ children, ...props }) => <p {...props}>{children}</p>,
    a: ({ children, ...props }) => <a {...props}>{children}</a>,
    DemoSlot,
    ...components,
  };
}
```

Insert the exact line immediately before `## 성과` in `content/work/webview-freeze.mdx`:

```mdx
<DemoSlot kind="freeze" />
```

Insert the exact line immediately before `## 성과` in `content/work/traffic-spike.mdx`:

```mdx
<DemoSlot kind="traffic" />
```

Insert the exact line immediately before `## 성과` in `content/work/epub-comic-viewer.mdx`:

```mdx
<DemoSlot kind="stackflow" />
```

- [x] **Step 7: 지연 로딩 테스트와 정적 빌드를 통과시킨다**

Run:

```bash
pnpm test:run tests/components/demo-slot.test.tsx
pnpm lint
pnpm typecheck
pnpm build
```

Expected: DemoSlot test passes, build exits 0, and three dynamic component chunks are emitted.

- [x] **Step 8: 동적 데모 경계를 커밋한다**

```bash
git add src/components/mdx src/features/demos mdx-components.tsx content/work/webview-freeze.mdx content/work/traffic-spike.mdx content/work/epub-comic-viewer.mdx tests/components/demo-slot.test.tsx
git commit -m "feat: 세 데모의 지연 로딩 경계 구현"
```

### Task 9: freeze 합성 쿠키 파서와 Long Task 요약 TDD

**Spec coverage:** 4.1절 `SyntheticCookieSource`·캐시·최대 100개 타임라인, 7절 실제 쿠키 금지, 8절 freeze 파서 단위 테스트

**Files:**
- Create: `src/features/demos/freeze/freeze-engine.ts`
- Create: `tests/unit/freeze-engine.test.ts`

**Interfaces:**
- Consumes: 없음. 브라우저 전역에 의존하지 않는 순수 TypeScript다.
- Produces: `createSyntheticCookieSource(targetBytes?: number): string`; `parseCookieString(source: string): Readonly<Record<string, string>>`; `createCachedCookieParser(source: string, parser?: typeof parseCookieString): () => Readonly<Record<string, string>>`; `LongTaskRecord { startTime: number; duration: number }`; `LongTaskSummary { entries: readonly LongTaskRecord[]; count: number; totalBlockingMs: number }`; `summarizeLongTasks(entries, limit?): LongTaskSummary`.

- [x] **Step 1: 파서·캐시·요약의 실패 테스트를 작성한다**

Create `tests/unit/freeze-engine.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import {
  createCachedCookieParser,
  createSyntheticCookieSource,
  parseCookieString,
  summarizeLongTasks,
} from "@/features/demos/freeze/freeze-engine";

describe("freeze engine", () => {
  it("64KB 이상의 합성 cookie 문자열을 만들고 실제 document.cookie를 읽지 않는다", () => {
    const getter = vi.spyOn(document, "cookie", "get").mockImplementation(() => { throw new Error("실제 쿠키 접근 금지"); });
    const source = createSyntheticCookieSource(64 * 1024);
    expect(new TextEncoder().encode(source).byteLength).toBeGreaterThanOrEqual(64 * 1024);
    expect(Object.keys(parseCookieString(source)).length).toBeGreaterThan(100);
    expect(getter).not.toHaveBeenCalled();
  });

  it("캐시 parser는 같은 문자열을 한 번만 파싱한다", () => {
    const parser = vi.fn(parseCookieString);
    const read = createCachedCookieParser("theme=dark; locale=ko", parser);
    expect(read()).toEqual({ theme: "dark", locale: "ko" });
    expect(read()).toEqual({ theme: "dark", locale: "ko" });
    expect(parser).toHaveBeenCalledTimes(1);
  });

  it("Long Task를 100개로 제한하고 총 지속 시간을 계산한다", () => {
    const tasks = Array.from({ length: 105 }, (_, index) => ({ startTime: index * 100, duration: 60 }));
    expect(summarizeLongTasks(tasks)).toMatchObject({ count: 100, totalBlockingMs: 6000 });
  });
});
```

- [x] **Step 2: freeze engine 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/unit/freeze-engine.test.ts`

Expected: FAIL with an import resolution error for `freeze-engine`.

- [x] **Step 3: 합성 source와 파서·캐시를 구현한다**

Create `src/features/demos/freeze/freeze-engine.ts`:

```ts
export type LongTaskRecord = { startTime: number; duration: number };
export type LongTaskSummary = { entries: readonly LongTaskRecord[]; count: number; totalBlockingMs: number };

export function createSyntheticCookieSource(targetBytes = 64 * 1024): string {
  const parts: string[] = [];
  const encoder = new TextEncoder();
  let index = 0;
  while (encoder.encode(parts.join("; ")).byteLength < targetBytes) {
    parts.push(`config_${index}=value_${index.toString(36).padStart(6, "0")}`);
    index += 1;
  }
  return parts.join("; ");
}

export function parseCookieString(source: string): Readonly<Record<string, string>> {
  return Object.fromEntries(source.split(";").map((part) => {
    const [rawKey, ...rawValue] = part.trim().split("=");
    return [rawKey, rawValue.join("=")];
  }));
}

export function createCachedCookieParser(
  source: string,
  parser: typeof parseCookieString = parseCookieString,
): () => Readonly<Record<string, string>> {
  let cache: Readonly<Record<string, string>> | undefined;
  return () => {
    cache ??= parser(source);
    return cache;
  };
}

export function summarizeLongTasks(entries: readonly LongTaskRecord[], limit = 100): LongTaskSummary {
  const limited = entries.slice(0, limit);
  return {
    entries: limited,
    count: limited.length,
    totalBlockingMs: limited.reduce((sum, task) => sum + task.duration, 0),
  };
}
```

- [x] **Step 4: freeze 순수 로직 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/unit/freeze-engine.test.ts
pnpm typecheck
```

Expected: 3 tests pass and typecheck exits 0.

- [x] **Step 5: freeze 엔진을 커밋한다**

```bash
git add src/features/demos/freeze/freeze-engine.ts tests/unit/freeze-engine.test.ts
git commit -m "feat: freeze 합성 쿠키 엔진 구현"
```

### Task 10: freeze 6초 세션·관찰·UI 구현

**Spec coverage:** 4.1절 UI·80ms/250ms 합성 부하·6초 상한·Long Task fallback·cleanup, 7절 접근성, 8절 세션·컴포넌트 테스트

**Files:**
- Create: `src/features/demos/freeze/freeze-session.ts`
- Create: `src/features/demos/freeze/LongTaskTimeline.tsx`
- Create: `src/features/demos/freeze/freeze-demo.module.css`
- Create: `tests/unit/freeze-session.test.ts`
- Create: `tests/components/freeze-demo.test.tsx`
- Modify: `src/features/demos/freeze/FreezeDemo.tsx`

**Interfaces:**
- Consumes: Task 9의 `createSyntheticCookieSource`, `parseCookieString`, `createCachedCookieParser`, `summarizeLongTasks`, `LongTaskRecord`.
- Produces: `FreezeMode = "reparse" | "cached"`; `FreezeClock { now; setInterval; clearInterval; setTimeout; clearTimeout }`; `FreezeSession { start(): void; stop(): void; dispose(): void }`; `runReparseBurst(source: string, targetMs: number, now?: () => number, parser?: typeof parseCookieString): void`; `createFreezeSession(options: { source: string; mode: FreezeMode; onTick: (elapsedMs: number) => void; onComplete: () => void; clock?: FreezeClock }): FreezeSession`; default `FreezeDemo(): JSX.Element` with marker `demo-chunk:freeze`.

- [ ] **Step 1: 세션 상한과 모드 차이의 실패 테스트를 작성한다**

Create `tests/unit/freeze-session.test.ts`:

```ts
import { expect, it, vi } from "vitest";
import { createFreezeSession, runReparseBurst } from "@/features/demos/freeze/freeze-session";

it("재파싱 burst를 목표 80ms까지만 실행한다", () => {
  let time = 0;
  const parser = vi.fn(() => ({}));
  runReparseBurst("a=1", 80, () => { time += 10; return time; }, parser);
  expect(parser).toHaveBeenCalledTimes(7);
});

it("세션은 250ms 주기로 실행되고 6초에 한 번 완료된다", () => {
  vi.useFakeTimers();
  const onComplete = vi.fn();
  const onTick = vi.fn();
  const session = createFreezeSession({ source: "a=1", mode: "cached", onTick, onComplete });
  session.start();
  vi.advanceTimersByTime(6000);
  expect(onTick).toHaveBeenCalled();
  expect(onComplete).toHaveBeenCalledTimes(1);
  vi.useRealTimers();
});
```

- [ ] **Step 2: 세션 모듈 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/unit/freeze-session.test.ts`

Expected: FAIL with an import resolution error for `freeze-session`.

- [ ] **Step 3: 80ms burst와 취소 가능한 세션을 구현한다**

Create `src/features/demos/freeze/freeze-session.ts`:

```ts
import { createCachedCookieParser, parseCookieString } from "./freeze-engine";

export type FreezeMode = "reparse" | "cached";
export type FreezeClock = {
  now: () => number;
  setInterval: typeof window.setInterval;
  clearInterval: typeof window.clearInterval;
  setTimeout: typeof window.setTimeout;
  clearTimeout: typeof window.clearTimeout;
};
export type FreezeSession = { start(): void; stop(): void; dispose(): void };

const browserClock: FreezeClock = {
  now: () => performance.now(),
  setInterval: window.setInterval.bind(window),
  clearInterval: window.clearInterval.bind(window),
  setTimeout: window.setTimeout.bind(window),
  clearTimeout: window.clearTimeout.bind(window),
};

export function runReparseBurst(
  source: string,
  targetMs: number,
  now: () => number = () => performance.now(),
  parser: typeof parseCookieString = parseCookieString,
): void {
  const startedAt = now();
  while (now() - startedAt < targetMs) parser(source);
}

export function createFreezeSession({
  source,
  mode,
  onTick,
  onComplete,
  clock = browserClock,
}: {
  source: string;
  mode: FreezeMode;
  onTick: (elapsedMs: number) => void;
  onComplete: () => void;
  clock?: FreezeClock;
}): FreezeSession {
  let intervalId: number | undefined;
  let timeoutId: number | undefined;
  let startedAt = 0;
  let completed = false;
  const readCache = createCachedCookieParser(source);
  const finish = (notify: boolean) => {
    if (intervalId !== undefined) clock.clearInterval(intervalId);
    if (timeoutId !== undefined) clock.clearTimeout(timeoutId);
    intervalId = undefined;
    timeoutId = undefined;
    if (notify && !completed) { completed = true; onComplete(); }
  };
  return {
    start() {
      completed = false;
      startedAt = clock.now();
      intervalId = clock.setInterval(() => {
        if (mode === "reparse") runReparseBurst(source, 80, clock.now);
        else readCache();
        onTick(Math.min(6000, clock.now() - startedAt));
      }, 250);
      timeoutId = clock.setTimeout(() => finish(true), 6000);
    },
    stop() { finish(true); },
    dispose() { finish(false); },
  };
}
```

- [ ] **Step 4: 세션 단위 테스트를 통과시킨다**

Run: `pnpm test:run tests/unit/freeze-session.test.ts`

Expected: 2 tests pass.

- [ ] **Step 5: freeze 조작의 실패 컴포넌트 테스트를 작성한다**

Create `tests/components/freeze-demo.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import FreezeDemo from "@/features/demos/freeze/FreezeDemo";

vi.mock("@/features/demos/freeze/freeze-session", async (loadOriginal) => {
  const original = await loadOriginal<typeof import("@/features/demos/freeze/freeze-session")>();
  return { ...original, createFreezeSession: ({ onComplete }: { onComplete: () => void }) => ({ start: onComplete, stop: onComplete, dispose: vi.fn() }) };
});

it("경고·두 모드·실행·결과를 키보드 가능한 control로 제공한다", () => {
  render(<FreezeDemo />);
  expect(screen.getByText(/최대 6초 동안 의도적으로/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("radio", { name: "매번 재파싱" }));
  fireEvent.click(screen.getByRole("button", { name: "6초 실행" }));
  expect(screen.getByText("실행 완료")).toBeInTheDocument();
  expect(screen.getAllByText(/Long Task/).length).toBeGreaterThan(0);
});
```

- [ ] **Step 6: 초기 marker UI가 동작 요구를 충족하지 못해 실패하는지 확인한다**

Run: `pnpm test:run tests/components/freeze-demo.test.tsx`

Expected: FAIL because the initial marker component has no controls.

- [ ] **Step 7: Long Task DOM 타임라인을 구현한다**

Create `src/features/demos/freeze/LongTaskTimeline.tsx`:

```tsx
import type { LongTaskRecord } from "./freeze-engine";
import styles from "./freeze-demo.module.css";

export function LongTaskTimeline({ entries }: { entries: readonly LongTaskRecord[] }) {
  return (
    <div>
      <h4>Long Task 타임라인</h4>
      <ol className={styles.timeline} aria-label="Long Task 시작 시점과 지속 시간">
        {entries.map((entry, index) => (
          <li key={`${entry.startTime}-${index}`} style={{ width: `${Math.min(100, Math.max(4, entry.duration / 2))}%` }}>
            {Math.round(entry.startTime)}ms · {Math.round(entry.duration)}ms
          </li>
        ))}
      </ol>
    </div>
  );
}
```

- [ ] **Step 8: PerformanceObserver·frame gap·세션 UI를 구현한다**

Replace `src/features/demos/freeze/FreezeDemo.tsx`:

```tsx
"use client";

import { useEffect, useReducer, useRef } from "react";
import { createSyntheticCookieSource, summarizeLongTasks, type LongTaskRecord } from "./freeze-engine";
import { createFreezeSession, type FreezeMode, type FreezeSession } from "./freeze-session";
import { LongTaskTimeline } from "./LongTaskTimeline";
import styles from "./freeze-demo.module.css";

type State = { mode: FreezeMode; status: "idle" | "running" | "complete"; elapsedMs: number; tasks: LongTaskRecord[]; maxFrameGapMs: number };
type Action = { type: "mode"; mode: FreezeMode } | { type: "start" } | { type: "tick"; elapsedMs: number } | { type: "complete"; tasks: LongTaskRecord[]; maxFrameGapMs: number };
const initial: State = { mode: "cached", status: "idle", elapsedMs: 0, tasks: [], maxFrameGapMs: 0 };
function reducer(state: State, action: Action): State {
  if (action.type === "mode") return { ...state, mode: action.mode };
  if (action.type === "start") return { ...state, status: "running", elapsedMs: 0, tasks: [], maxFrameGapMs: 0 };
  if (action.type === "tick") return { ...state, elapsedMs: action.elapsedMs };
  return { ...state, status: "complete", tasks: action.tasks, maxFrameGapMs: action.maxFrameGapMs };
}

export default function FreezeDemo() {
  const [state, dispatch] = useReducer(reducer, initial);
  const sessionRef = useRef<FreezeSession | null>(null);
  const observerRef = useRef<PerformanceObserver | null>(null);
  const frameRef = useRef(0);
  const tasksRef = useRef<LongTaskRecord[]>([]);
  const maxGapRef = useRef(0);

  const finish = () => {
    observerRef.current?.disconnect();
    cancelAnimationFrame(frameRef.current);
    dispatch({ type: "complete", tasks: tasksRef.current.slice(0, 100), maxFrameGapMs: maxGapRef.current });
  };
  const start = () => {
    sessionRef.current?.dispose();
    tasksRef.current = [];
    maxGapRef.current = 0;
    dispatch({ type: "start" });
    if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      observerRef.current = new PerformanceObserver((list) => {
        tasksRef.current.push(...list.getEntries().map(({ startTime, duration }) => ({ startTime, duration })));
      });
      observerRef.current.observe({ entryTypes: ["longtask"] });
    }
    let previous = performance.now();
    const frame = (now: number) => { maxGapRef.current = Math.max(maxGapRef.current, now - previous); previous = now; frameRef.current = requestAnimationFrame(frame); };
    frameRef.current = requestAnimationFrame(frame);
    sessionRef.current = createFreezeSession({
      source: createSyntheticCookieSource(), mode: state.mode,
      onTick: (elapsedMs) => dispatch({ type: "tick", elapsedMs }), onComplete: finish,
    });
    sessionRef.current.start();
  };

  useEffect(() => {
    const stopWhenHidden = () => { if (document.hidden) sessionRef.current?.stop(); };
    const stopOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") sessionRef.current?.stop(); };
    document.addEventListener("visibilitychange", stopWhenHidden);
    document.addEventListener("keydown", stopOnEscape);
    return () => { document.removeEventListener("visibilitychange", stopWhenHidden); document.removeEventListener("keydown", stopOnEscape); sessionRef.current?.dispose(); observerRef.current?.disconnect(); cancelAnimationFrame(frameRef.current); };
  }, []);

  const summary = summarizeLongTasks(state.tasks);
  const supported = typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes.includes("longtask");
  return (
    <div className={styles.demo} data-testid="freeze-demo" data-demo-chunk="demo-chunk:freeze">
      <p className={styles.warning}>재파싱 모드는 최대 6초 동안 의도적으로 화면 반응을 늦춥니다.</p>
      <fieldset disabled={state.status === "running"}><legend>쿠키 접근 방식</legend>
        <label><input type="radio" name="mode" checked={state.mode === "reparse"} onChange={() => dispatch({ type: "mode", mode: "reparse" })} />매번 재파싱</label>
        <label><input type="radio" name="mode" checked={state.mode === "cached"} onChange={() => dispatch({ type: "mode", mode: "cached" })} />한 번 파싱 후 캐시</label>
      </fieldset>
      {state.status !== "running" ? <button type="button" onClick={start}>6초 실행</button> : <button type="button" onClick={() => sessionRef.current?.stop()}>중지</button>}
      <div className={state.status === "running" ? styles.runningIndicator : styles.indicator} data-testid="freeze-indicator" aria-hidden="true" />
      <p aria-live="polite">{state.status === "complete" ? "실행 완료" : state.status === "running" ? `${Math.round(state.elapsedMs)}ms 실행 중` : "실행 대기"}</p>
      <dl className={styles.summary}><div><dt>Long Task</dt><dd>{supported ? `${summary.count}개` : "미지원"}</dd></div><div><dt>총 차단 시간</dt><dd>{supported ? `${Math.round(summary.totalBlockingMs)}ms` : "미지원"}</dd></div><div><dt>최대 프레임 간격</dt><dd>{Math.round(state.maxFrameGapMs)}ms</dd></div></dl>
      {supported ? <LongTaskTimeline entries={summary.entries} /> : <p>50ms 초과 프레임 간격을 프레임 지연 추정으로 확인하세요.</p>}
    </div>
  );
}
```

Create `src/features/demos/freeze/freeze-demo.module.css`:

```css
.demo { display: grid; gap: var(--space-4); }
.demo button, .demo label { min-height: 44px; }
.warning { color: var(--warning); font-weight: 700; }
.indicator, .runningIndicator { width: 24px; height: 24px; border-radius: 50%; background: var(--accent); }
.summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: var(--space-3); }
.summary div { padding: var(--space-3); border: 1px solid var(--line); }
.summary dd { margin: var(--space-2) 0 0; font-family: var(--font-mono), monospace; }
.timeline { display: grid; gap: var(--space-2); padding: 0; list-style: none; }
.timeline li { min-height: 28px; background: color-mix(in srgb, var(--warning) 24%, var(--surface)); font-family: var(--font-mono), monospace; }
@media (prefers-reduced-motion: no-preference) { .runningIndicator { animation: move 900ms ease-in-out infinite alternate; } }
@keyframes move { to { transform: translateX(min(60vw, 560px)); } }
```

- [ ] **Step 9: freeze 전체 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/unit/freeze-engine.test.ts tests/unit/freeze-session.test.ts tests/components/freeze-demo.test.tsx
pnpm lint
pnpm typecheck
```

Expected: 6 freeze tests pass and lint/typecheck exit 0.

- [ ] **Step 10: freeze 데모를 커밋한다**

```bash
git add src/features/demos/freeze tests/unit/freeze-session.test.ts tests/components/freeze-demo.test.tsx
git commit -m "feat: Long Task를 재현하는 freeze 데모 구현"
```

### Task 11: traffic 결정적 FIFO 엔진 TDD

**Spec coverage:** 4.2절 사용자 범위·두 서버 모델·seed·FIFO·P95·30,000 상한, 8절 결정성·용량·단조성 테스트

**Files:**
- Create: `src/features/demos/traffic/traffic-engine.ts`
- Create: `tests/unit/traffic-engine.test.ts`

**Interfaces:**
- Consumes: 없음. Worker와 React에 의존하지 않는 순수 TypeScript다.
- Produces: `ServerModel = "before" | "after"`; `TrafficConfig { concurrentUsers: number; model: ServerModel; seed: number }`; `TrafficSample { timeMs; p95Ms; throughput; queueDepth; rejectedCount }`; `TrafficState`; `capacityFor(model): number`; `createTrafficState(config): TrafficState`; `stepTraffic(state): TrafficState`.

- [ ] **Step 1: 결정성·용량·상한의 실패 테스트를 작성한다**

Create `tests/unit/traffic-engine.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { capacityFor, createTrafficState, stepTraffic } from "@/features/demos/traffic/traffic-engine";

function run(users: number, ticks: number) {
  let state = createTrafficState({ concurrentUsers: users, model: "before", seed: 20260819 });
  for (let index = 0; index < ticks; index += 1) state = stepTraffic(state);
  return state;
}

describe("traffic engine", () => {
  it("두 모델의 이론상 처리량을 160과 432 req/s로 계산한다", () => {
    expect(capacityFor("before")).toBe(160);
    expect(capacityFor("after")).toBe(432);
  });

  it("같은 seed와 설정은 같은 60초 series를 만든다", () => {
    expect(run(1500, 240).series).toEqual(run(1500, 240).series);
  });

  it("동시 사용자가 늘면 P95와 큐 깊이가 감소하지 않는다", () => {
    const low = run(500, 240).sample;
    const high = run(3000, 240).sample;
    expect(high.p95Ms).toBeGreaterThanOrEqual(low.p95Ms);
    expect(high.queueDepth).toBeGreaterThanOrEqual(low.queueDepth);
  });

  it("큐를 30000개로 제한하고 초과 요청을 거부한다", () => {
    const overloaded = run(3000, 500);
    expect(overloaded.queue.length).toBeLessThanOrEqual(30000);
    expect(overloaded.rejectedCount).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: traffic engine 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/unit/traffic-engine.test.ts`

Expected: FAIL with an import resolution error for `traffic-engine`.

- [ ] **Step 3: 모델 타입·seed PRNG·용량 계산을 구현한다**

Create `src/features/demos/traffic/traffic-engine.ts`:

```ts
export type ServerModel = "before" | "after";
export type TrafficConfig = { concurrentUsers: number; model: ServerModel; seed: number };
export type TrafficSample = { timeMs: number; p95Ms: number; throughput: number; queueDepth: number; rejectedCount: number };
type Request = { id: number; createdAt: number };
type ActiveRequest = Request & { completesAt: number };
type CompletedRequest = { completedAt: number; latencyMs: number };
export type TrafficState = {
  config: TrafficConfig;
  nowMs: number;
  randomState: number;
  arrivalRemainder: number;
  nextId: number;
  queue: readonly Request[];
  active: readonly ActiveRequest[];
  completed: readonly CompletedRequest[];
  rejectedCount: number;
  sample: TrafficSample;
  series: readonly TrafficSample[];
};

const models = { before: { slots: 40, meanMs: 250 }, after: { slots: 54, meanMs: 125 } } as const;
const TICK_MS = 250;
const MAX_QUEUE = 30000;

export function capacityFor(model: ServerModel): number {
  const config = models[model];
  return config.slots * (1000 / config.meanMs);
}

function random(state: number): { value: number; state: number } {
  const next = (state + 0x6d2b79f5) | 0;
  let value = next;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return { value: ((value ^ (value >>> 14)) >>> 0) / 4294967296, state: next };
}

function percentile95(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)];
}

export function createTrafficState(config: TrafficConfig): TrafficState {
  if (config.concurrentUsers < 100 || config.concurrentUsers > 3000 || config.concurrentUsers % 100 !== 0) {
    throw new Error("concurrentUsers는 100부터 3000까지 100 단위여야 합니다");
  }
  const sample = { timeMs: 0, p95Ms: 0, throughput: 0, queueDepth: 0, rejectedCount: 0 };
  return { config, nowMs: 0, randomState: config.seed, arrivalRemainder: 0, nextId: 1, queue: [], active: [], completed: [], rejectedCount: 0, sample, series: [] };
}
```

- [ ] **Step 4: FIFO 한 tick과 60초 표본을 구현한다**

Append to `src/features/demos/traffic/traffic-engine.ts`:

```ts
export function stepTraffic(state: TrafficState): TrafficState {
  const tickStartedAt = state.nowMs;
  const nowMs = tickStartedAt + TICK_MS;
  const rawArrivals = state.config.concurrentUsers * 0.2 * (TICK_MS / 1000) + state.arrivalRemainder;
  const arrivalCount = Math.floor(rawArrivals);
  const arrivals = Array.from({ length: arrivalCount }, (_, index) => ({ id: state.nextId + index, createdAt: tickStartedAt }));
  const available = Math.max(0, MAX_QUEUE - state.queue.length);
  const accepted = arrivals.slice(0, available);
  const rejectedCount = state.rejectedCount + arrivals.length - accepted.length;
  const queue = [...state.queue, ...accepted];
  const model = models[state.config.model];
  let randomState = state.randomState;
  let active = [...state.active];
  const completedThisTick: CompletedRequest[] = [];
  const fillSlots = (at: number) => {
    while (active.length < model.slots && queue.length > 0) {
      const request = queue.shift();
      if (!request) break;
      const randomSample = random(randomState);
      randomState = randomSample.state;
      active.push({ ...request, completesAt: at + model.meanMs * (0.8 + randomSample.value * 0.4) });
    }
  };
  fillSlots(tickStartedAt);
  while (active.length > 0) {
    const nextCompletion = Math.min(...active.map(({ completesAt }) => completesAt));
    if (nextCompletion > nowMs) break;
    const finished = active.filter(({ completesAt }) => completesAt <= nextCompletion);
    active = active.filter(({ completesAt }) => completesAt > nextCompletion);
    completedThisTick.push(...finished.map((request) => ({
      completedAt: nextCompletion,
      latencyMs: nextCompletion - request.createdAt,
    })));
    fillSlots(nextCompletion);
  }
  const completed = [...state.completed, ...completedThisTick].filter((request) => request.completedAt > nowMs - 60000);
  const recentSecond = completed.filter((request) => request.completedAt > nowMs - 1000);
  const sample: TrafficSample = {
    timeMs: nowMs,
    p95Ms: Math.round(percentile95(completed.map((request) => request.latencyMs))),
    throughput: recentSecond.length,
    queueDepth: queue.length,
    rejectedCount,
  };
  const series = nowMs % 1000 === 0 ? [...state.series, sample].slice(-60) : state.series;
  return {
    ...state,
    nowMs,
    randomState,
    arrivalRemainder: rawArrivals - arrivalCount,
    nextId: state.nextId + arrivalCount,
    queue,
    active,
    completed,
    rejectedCount,
    sample,
    series,
  };
}
```

- [ ] **Step 5: traffic 엔진 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/unit/traffic-engine.test.ts
pnpm typecheck
```

Expected: 4 tests pass; capacity 160/432, deterministic series, monotonic load behavior, queue cap all pass.

- [ ] **Step 6: traffic 엔진을 커밋한다**

```bash
git add src/features/demos/traffic/traffic-engine.ts tests/unit/traffic-engine.test.ts
git commit -m "feat: 결정적 traffic 요청 큐 엔진 구현"
```

### Task 12: traffic Worker·Canvas·접근 가능한 UI 구현

**Spec coverage:** 4.2절 Worker 프로토콜·4Hz·두 그래프·실측/가상 구분·reduced motion·오류 복구, 7절 Canvas 대체 표, 8절 Worker·컴포넌트 테스트

**Files:**
- Create: `src/features/demos/traffic/traffic-protocol.ts`
- Create: `src/features/demos/traffic/traffic.worker.ts`
- Create: `src/features/demos/traffic/MetricCanvas.tsx`
- Create: `src/features/demos/traffic/traffic-demo.module.css`
- Create: `tests/unit/traffic-protocol.test.ts`
- Create: `tests/components/traffic-demo.test.tsx`
- Modify: `src/features/demos/traffic/TrafficSpikeDemo.tsx`

**Interfaces:**
- Consumes: Task 11의 `TrafficConfig`, `TrafficSample`, `TrafficState`, `createTrafficState`, `stepTraffic`.
- Produces: `TrafficWorkerIn = { type: "start" | "configure"; config: TrafficConfig } | { type: "stop" }`; `TrafficWorkerOut = { type: "sample"; sample: TrafficSample; series: readonly TrafficSample[] } | { type: "error"; message: string }`; `isTrafficWorkerIn(value: unknown): value is TrafficWorkerIn`; default `TrafficSpikeDemo(): JSX.Element` with marker `demo-chunk:traffic`.

- [ ] **Step 1: Worker protocol의 실패 테스트를 작성한다**

Create `tests/unit/traffic-protocol.test.ts`:

```ts
import { expect, it } from "vitest";
import { isTrafficWorkerIn } from "@/features/demos/traffic/traffic-protocol";

it("유효한 start와 stop만 Worker 입력으로 허용한다", () => {
  expect(isTrafficWorkerIn({ type: "start", config: { concurrentUsers: 1500, model: "before", seed: 20260819 } })).toBe(true);
  expect(isTrafficWorkerIn({ type: "stop" })).toBe(true);
  expect(isTrafficWorkerIn({ type: "start", config: { concurrentUsers: 1550, model: "before", seed: 1 } })).toBe(false);
  expect(isTrafficWorkerIn({ type: "unknown" })).toBe(false);
});
```

- [ ] **Step 2: protocol 모듈 부재로 실패하는지 확인한다**

Run: `pnpm test:run tests/unit/traffic-protocol.test.ts`

Expected: FAIL with an import resolution error for `traffic-protocol`.

- [ ] **Step 3: Worker 메시지 타입과 검증을 구현한다**

Create `src/features/demos/traffic/traffic-protocol.ts`:

```ts
import type { TrafficConfig, TrafficSample } from "./traffic-engine";

export type TrafficWorkerIn =
  | { type: "start" | "configure"; config: TrafficConfig }
  | { type: "stop" };
export type TrafficWorkerOut =
  | { type: "sample"; sample: TrafficSample; series: readonly TrafficSample[] }
  | { type: "error"; message: string };

export function isTrafficWorkerIn(value: unknown): value is TrafficWorkerIn {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.type === "stop") return true;
  if ((candidate.type !== "start" && candidate.type !== "configure") || typeof candidate.config !== "object" || candidate.config === null) return false;
  const config = candidate.config as Record<string, unknown>;
  return typeof config.concurrentUsers === "number"
    && config.concurrentUsers >= 100
    && config.concurrentUsers <= 3000
    && config.concurrentUsers % 100 === 0
    && (config.model === "before" || config.model === "after")
    && typeof config.seed === "number";
}
```

- [ ] **Step 4: Worker의 250ms 실행과 종료를 구현한다**

Create `src/features/demos/traffic/traffic.worker.ts`:

```ts
/// <reference lib="webworker" />
import { createTrafficState, stepTraffic, type TrafficState } from "./traffic-engine";
import { isTrafficWorkerIn, type TrafficWorkerOut } from "./traffic-protocol";

const scope: DedicatedWorkerGlobalScope = self as unknown as DedicatedWorkerGlobalScope;
let state: TrafficState | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
const stop = () => { if (timer !== null) clearInterval(timer); timer = null; };
const post = (message: TrafficWorkerOut) => scope.postMessage(message);

scope.onmessage = ({ data }: MessageEvent<unknown>) => {
  if (!isTrafficWorkerIn(data)) { post({ type: "error", message: "잘못된 Worker 메시지입니다." }); return; }
  if (data.type === "stop") { stop(); return; }
  stop();
  try {
    state = createTrafficState(data.config);
    timer = setInterval(() => {
      if (!state) return;
      state = stepTraffic(state);
      post({ type: "sample", sample: state.sample, series: state.series });
    }, 250);
  } catch (error) {
    post({ type: "error", message: error instanceof Error ? error.message : "시뮬레이터를 시작할 수 없습니다." });
  }
};

export {};
```

- [ ] **Step 5: traffic UI의 실패 테스트를 작성한다**

Create `tests/components/traffic-demo.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import TrafficSpikeDemo from "@/features/demos/traffic/TrafficSpikeDemo";

const motion = vi.hoisted(() => ({ reduced: false }));
vi.mock("framer-motion", () => ({ useReducedMotion: () => motion.reduced }));

class FakeWorker {
  static instance: FakeWorker;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { FakeWorker.instance = this; }
}

beforeEach(() => {
  motion.reduced = false;
  vi.stubGlobal("Worker", FakeWorker);
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
    strokeStyle: "", lineWidth: 1,
  } as unknown as CanvasRenderingContext2D);
});

it("사용자와 모델을 Worker에 보내고 표로 표본을 표시한다", () => {
  render(<TrafficSpikeDemo />);
  fireEvent.change(screen.getByLabelText("동시 사용자"), { target: { value: "1500" } });
  fireEvent.click(screen.getByRole("radio", { name: "최적화 후" }));
  expect(FakeWorker.instance.postMessage).toHaveBeenLastCalledWith({ type: "configure", config: { concurrentUsers: 1500, model: "after", seed: 20260819 } });
  act(() => FakeWorker.instance.onmessage?.({ data: { type: "sample", sample: { timeMs: 1000, p95Ms: 450, throughput: 432, queueDepth: 12, rejectedCount: 0 }, series: [] } } as MessageEvent));
  expect(screen.getByRole("cell", { name: "450ms" })).toBeInTheDocument();
  expect(screen.getByText("원리 설명용 가상 모델")).toBeInTheDocument();
});

it("reduced-motion에서는 1Hz 갱신 모드를 표시한다", () => {
  motion.reduced = true;
  render(<TrafficSpikeDemo />);
  expect(screen.getByTestId("traffic-demo")).toHaveAttribute("data-reduced-motion", "true");
});
```

- [ ] **Step 6: 초기 marker UI가 control 요구를 충족하지 못해 실패하는지 확인한다**

Run: `pnpm test:run tests/components/traffic-demo.test.tsx`

Expected: FAIL because the slider and model radios are absent.

- [ ] **Step 7: Canvas 그래프를 구현한다**

Create `src/features/demos/traffic/MetricCanvas.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import type { TrafficSample } from "./traffic-engine";

export function MetricCanvas({ series, metric, label }: { series: readonly TrafficSample[]; metric: "p95Ms" | "throughput"; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const values = series.map((sample) => sample[metric]);
    const maximum = Math.max(1, ...values);
    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--accent");
    context.lineWidth = 2;
    context.beginPath();
    values.forEach((value, index) => {
      const x = values.length <= 1 ? 0 : index * canvas.width / (values.length - 1);
      const y = canvas.height - value / maximum * (canvas.height - 8) - 4;
      if (index === 0) context.moveTo(x, y); else context.lineTo(x, y);
    });
    context.stroke();
  }, [metric, series]);
  return <canvas ref={ref} width={560} height={180} role="img" aria-label={label} />;
}
```

- [ ] **Step 8: Worker 수명주기·control·접근 가능한 표를 구현한다**

Replace `src/features/demos/traffic/TrafficSpikeDemo.tsx`:

```tsx
"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useReducer, useRef, useState } from "react";
import { SimulationMetric } from "@/components/work/SimulationMetric";
import type { ServerModel, TrafficSample } from "./traffic-engine";
import type { TrafficWorkerOut } from "./traffic-protocol";
import { MetricCanvas } from "./MetricCanvas";
import styles from "./traffic-demo.module.css";

type State = { users: number; model: ServerModel; sample: TrafficSample; series: readonly TrafficSample[] };
type Action = { type: "users"; value: number } | { type: "model"; value: ServerModel } | { type: "sample"; sample: TrafficSample; series: readonly TrafficSample[] };
const emptySample = { timeMs: 0, p95Ms: 0, throughput: 0, queueDepth: 0, rejectedCount: 0 };
function reducer(state: State, action: Action): State {
  if (action.type === "users") return { ...state, users: action.value };
  if (action.type === "model") return { ...state, model: action.value };
  return { ...state, sample: action.sample, series: action.series };
}

export default function TrafficSpikeDemo() {
  const [state, dispatch] = useReducer(reducer, { users: 100, model: "before", sample: emptySample, series: [] });
  const [error, setError] = useState("");
  const [workerKey, setWorkerKey] = useState(0);
  const workerRef = useRef<Worker | null>(null);
  const reducedMotion = useReducedMotion() ?? false;
  const messageCount = useRef(0);

  useEffect(() => {
    try {
      const worker = new Worker(new URL("./traffic.worker.ts", import.meta.url), { type: "module" });
      workerRef.current = worker;
      worker.onmessage = ({ data }: MessageEvent<TrafficWorkerOut>) => {
        if (data.type === "error") { setError(data.message); return; }
        messageCount.current += 1;
        if (!reducedMotion || messageCount.current % 4 === 0) dispatch({ type: "sample", sample: data.sample, series: data.series });
      };
      worker.onerror = () => setError("이 환경에서는 시뮬레이터를 실행할 수 없습니다.");
      worker.postMessage({ type: "start", config: { concurrentUsers: 100, model: "before", seed: 20260819 } });
      return () => { worker.postMessage({ type: "stop" }); worker.terminate(); };
    } catch { setError("이 환경에서는 시뮬레이터를 실행할 수 없습니다."); }
  }, [reducedMotion, workerKey]);

  const configure = (users: number, model: ServerModel) => {
    workerRef.current?.postMessage({ type: "configure", config: { concurrentUsers: users, model, seed: 20260819 } });
  };
  return (
    <div className={styles.demo} data-testid="traffic-demo" data-demo-chunk="demo-chunk:traffic" data-reduced-motion={reducedMotion}>
      <div className={styles.actual}><strong>실제 사례 결과</strong><span>P95 15,000ms → 450ms</span><span>처리량 2.7배</span></div>
      <p>원리 설명용 가상 모델</p>
      <label>동시 사용자 <output>{state.users}</output><input aria-label="동시 사용자" type="range" min="100" max="3000" step="100" value={state.users} onChange={(event) => { const users = Number(event.target.value); dispatch({ type: "users", value: users }); configure(users, state.model); }} /></label>
      <fieldset><legend>서버 모델</legend>{(["before", "after"] as const).map((model) => <label key={model}><input type="radio" name="server-model" checked={state.model === model} onChange={() => { dispatch({ type: "model", value: model }); configure(state.users, model); }} />{model === "before" ? "최적화 전" : "최적화 후"}</label>)}</fieldset>
      {error ? <div role="alert"><p>{error}</p><button type="button" onClick={() => { setError(""); setWorkerKey((key) => key + 1); }}>다시 불러오기</button></div> : <>
        <div className={styles.graphs}><MetricCanvas series={state.series} metric="p95Ms" label="최근 60초 P95 그래프" /><MetricCanvas series={state.series} metric="throughput" label="최근 60초 처리량 그래프" /></div>
        <div className={styles.metrics}><SimulationMetric label="P95" value={state.sample.p95Ms} unit="ms" /><SimulationMetric label="처리량" value={state.sample.throughput} unit=" req/s" /></div>
        <table><caption>현재 가상 요청 큐 수치</caption><thead><tr><th>P95</th><th>처리량</th><th>큐 깊이</th><th>거부</th></tr></thead><tbody><tr><td>{state.sample.p95Ms}ms</td><td>{state.sample.throughput} req/s</td><td>{state.sample.queueDepth}</td><td>{state.sample.rejectedCount}</td></tr></tbody></table>
      </>}
    </div>
  );
}
```

Create `src/features/demos/traffic/traffic-demo.module.css`:

```css
.demo { display: grid; gap: var(--space-6); }
.actual, .metrics, .graphs { display: grid; gap: var(--space-3); }
.actual { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); padding: var(--space-4); border: 1px solid var(--positive); }
.demo input[type="range"] { width: 100%; min-height: 44px; }
.demo label, .demo button { min-height: 44px; }
.graphs canvas { width: 100%; height: auto; border-bottom: 1px solid var(--line); }
.demo table { width: 100%; border-collapse: collapse; }
.demo th, .demo td { padding: var(--space-3); border: 1px solid var(--line); text-align: right; font-family: var(--font-mono), monospace; }
@media (min-width: 768px) { .graphs, .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
```

- [ ] **Step 9: traffic 전체 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/unit/traffic-engine.test.ts tests/unit/traffic-protocol.test.ts tests/components/traffic-demo.test.tsx
pnpm lint
pnpm typecheck
```

Expected: 6 traffic tests pass and lint/typecheck exit 0.

- [ ] **Step 10: Worker traffic 데모를 커밋한다**

```bash
git add src/features/demos/traffic tests/unit/traffic-protocol.test.ts tests/components/traffic-demo.test.tsx
git commit -m "feat: Worker 기반 traffic 시뮬레이터 구현"
```

### Task 13: 격리된 Stackflow 웹뷰 UX 데모 구현

**Spec coverage:** 4.3절 폰 프레임·세 Activity·스와이프백·상태 텍스트·테마·reduced motion, 9절 메인 내비게이션 금지

**Files:**
- Create: `src/features/demos/stackflow/stackflow.config.ts`
- Create: `src/features/demos/stackflow/StackflowStatus.tsx`
- Create: `src/features/demos/stackflow/ShelfActivity.tsx`
- Create: `src/features/demos/stackflow/BookActivity.tsx`
- Create: `src/features/demos/stackflow/ReaderActivity.tsx`
- Create: `src/features/demos/stackflow/stackflow.instance.tsx`
- Create: `src/features/demos/stackflow/stackflow-demo.module.css`
- Create: `tests/components/stackflow-demo.test.tsx`
- Modify: `src/features/demos/stackflow/StackflowDemo.tsx`

**Interfaces:**
- Consumes: Task 8의 default dynamic target 규칙; `next-themes`; Stackflow v2의 `defineConfig`, `stackflow`, `useFlow`, `ActivityComponentType`.
- Produces: module augmentation `Register { Shelf: Record<string, never>; Book: { bookId: string; title: string }; Reader: { bookId: string; title: string } }`; `StackflowStatusProvider({ children, animate }: PropsWithChildren<{ animate: boolean }>): JSX.Element`; `useStackflowStatus(): { animate: boolean; status: { depth: number; last: "대기" | "push" | "pop" }; report: (depth: number, last: "대기" | "push" | "pop") => void }`; `useSyncStackflowStatus(): void`; default `StackflowDemo(): JSX.Element` with marker `demo-chunk:stackflow`.

- [ ] **Step 1: Stackflow 공식 패키지를 설치한다**

Run:

```bash
pnpm add @stackflow/config@latest @stackflow/core@latest @stackflow/react@latest @stackflow/plugin-renderer-basic@latest @stackflow/plugin-basic-ui@latest
```

Expected: five `@stackflow` packages are added to `dependencies` and lockfile resolution exits 0.

- [ ] **Step 2: 격리·상태 설명의 실패 테스트를 작성한다**

Create `tests/components/stackflow-demo.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import StackflowDemo from "@/features/demos/stackflow/StackflowDemo";

vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark" }) }));
vi.mock("@/features/demos/stackflow/stackflow.instance", () => ({ Stack: () => <div>서재 Activity</div> }));

it("폰 프레임 안에 Stack과 텍스트 상태를 렌더한다", () => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<StackflowDemo />);
  expect(screen.getByTestId("stackflow-demo")).toHaveAttribute("data-demo-chunk", "demo-chunk:stackflow");
  expect(screen.getByText("서재 Activity")).toBeInTheDocument();
  expect(screen.getByText("stack depth 1 · 대기")).toBeInTheDocument();
  expect(screen.getByLabelText("웹뷰 스택 탐색 데모")).toBeInTheDocument();
  expect(screen.getByTestId("stackflow-demo")).toHaveAttribute("data-reduced-motion", "true");
});
```

- [ ] **Step 3: 초기 marker UI가 폰 프레임 요구를 충족하지 못해 실패하는지 확인한다**

Run: `pnpm test:run tests/components/stackflow-demo.test.tsx`

Expected: FAIL because the initial component has no phone frame or stack status.

- [ ] **Step 4: Activity 타입과 350ms config를 정의한다**

Create `src/features/demos/stackflow/stackflow.config.ts`:

```ts
import { defineConfig } from "@stackflow/config";

declare module "@stackflow/config" {
  interface Register {
    Shelf: Record<string, never>;
    Book: { bookId: string; title: string };
    Reader: { bookId: string; title: string };
  }
}

export const stackflowConfig = defineConfig({
  activities: [{ name: "Shelf" }, { name: "Book" }, { name: "Reader" }],
  initialActivity: () => "Shelf",
  transitionDuration: 350,
});
```

- [ ] **Step 5: stack depth·마지막 전환 context를 구현한다**

Create `src/features/demos/stackflow/StackflowStatus.tsx`:

```tsx
"use client";

import { useStack } from "@stackflow/react";
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

type Status = { depth: number; last: "대기" | "push" | "pop" };
type StatusContext = { animate: boolean; status: Status; report: (depth: number, last: Status["last"]) => void };
const Context = createContext<StatusContext | null>(null);

export function StackflowStatusProvider({ children, animate }: PropsWithChildren<{ animate: boolean }>) {
  const [status, setStatus] = useState<Status>({ depth: 1, last: "대기" });
  const value = useMemo(() => ({ animate, status, report: (depth: number, last: Status["last"]) => setStatus({ depth, last }) }), [animate, status]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useStackflowStatus(): StatusContext {
  const value = useContext(Context);
  if (!value) throw new Error("StackflowStatusProvider 안에서 사용해야 합니다");
  return value;
}

export function useSyncStackflowStatus(): void {
  const stack = useStack();
  const { status, report } = useStackflowStatus();
  const depth = stack.activities.length;
  useEffect(() => {
    if (depth !== status.depth) report(depth, depth > status.depth ? "push" : "pop");
  }, [depth, report, status.depth]);
}
```

- [ ] **Step 6: 서재·책 상세·리더 Activity를 구현한다**

Create `src/features/demos/stackflow/ShelfActivity.tsx`:

```tsx
import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useFlow, type ActivityComponentType } from "@stackflow/react";
import { useStackflowStatus, useSyncStackflowStatus } from "./StackflowStatus";

const books = [
  { bookId: "perf", title: "브라우저 성능 읽기" },
  { bookId: "webview", title: "웹뷰 경계 설계" },
  { bookId: "viewer", title: "콘텐츠 뷰어 구조" },
] as const;

export const ShelfActivity: ActivityComponentType<"Shelf"> = () => {
  const { push } = useFlow();
  const { animate } = useStackflowStatus();
  useSyncStackflowStatus();
  return <AppScreen appBar={{ title: "서재" }}><div><h4>내 서재</h4>{books.map((book) => <button key={book.bookId} type="button" onClick={() => push("Book", book, { animate })}>{book.title}</button>)}</div></AppScreen>;
};
```

Create `src/features/demos/stackflow/BookActivity.tsx`:

```tsx
import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useFlow, type ActivityComponentType } from "@stackflow/react";
import { useStackflowStatus, useSyncStackflowStatus } from "./StackflowStatus";

export const BookActivity: ActivityComponentType<"Book"> = ({ params }) => {
  const { push, pop } = useFlow();
  const { animate } = useStackflowStatus();
  useSyncStackflowStatus();
  return <AppScreen appBar={{ title: "책 상세" }}><div><button type="button" onClick={() => pop({ animate })}>서재로</button><h4>{params.title}</h4><p>Worker와 웹뷰 브릿지로 읽기 흐름을 지킵니다.</p><button type="button" onClick={() => push("Reader", params, { animate })}>읽기 시작</button></div></AppScreen>;
};
```

Create `src/features/demos/stackflow/ReaderActivity.tsx`:

```tsx
import { AppScreen } from "@stackflow/plugin-basic-ui";
import { useFlow, type ActivityComponentType } from "@stackflow/react";
import { useStackflowStatus, useSyncStackflowStatus } from "./StackflowStatus";

export const ReaderActivity: ActivityComponentType<"Reader"> = ({ params }) => {
  const { pop } = useFlow();
  const { animate } = useStackflowStatus();
  useSyncStackflowStatus();
  return <AppScreen appBar={{ title: "리더" }}><div><button type="button" onClick={() => pop({ animate })}>책 상세로</button><h4>{params.title}</h4><p>1 / 24</p><p>왼쪽 가장자리에서 스와이프해 이전 화면으로 돌아가 보세요.</p></div></AppScreen>;
};
```

- [ ] **Step 7: basic renderer와 Cupertino UI로 Stack 인스턴스를 만든다**

Create `src/features/demos/stackflow/stackflow.instance.tsx`:

```tsx
import { basicUIPlugin } from "@stackflow/plugin-basic-ui";
import { basicRendererPlugin } from "@stackflow/plugin-renderer-basic";
import { stackflow } from "@stackflow/react";
import { BookActivity } from "./BookActivity";
import { ReaderActivity } from "./ReaderActivity";
import { ShelfActivity } from "./ShelfActivity";
import { stackflowConfig } from "./stackflow.config";

export const { Stack } = stackflow({
  config: stackflowConfig,
  components: { Shelf: ShelfActivity, Book: BookActivity, Reader: ReaderActivity },
  plugins: [basicRendererPlugin(), basicUIPlugin({ theme: "cupertino" })],
});
```

- [ ] **Step 8: 테마·reduced-motion과 격리 폰 프레임을 구현한다**

Replace `src/features/demos/stackflow/StackflowDemo.tsx`:

```tsx
"use client";

import "@stackflow/plugin-basic-ui/index.css";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Stack } from "./stackflow.instance";
import { StackflowStatusProvider, useStackflowStatus } from "./StackflowStatus";
import styles from "./stackflow-demo.module.css";

function Phone() {
  const { status } = useStackflowStatus();
  return <><div className={styles.phone} aria-label="웹뷰 스택 탐색 데모"><Stack /></div><p aria-live="polite">stack depth {status.depth} · {status.last}</p></>;
}

export default function StackflowDemo() {
  const { resolvedTheme } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduceMotion(media.matches);
    update(); media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return <div className={styles.demo} data-testid="stackflow-demo" data-demo-chunk="demo-chunk:stackflow" data-theme={resolvedTheme} data-reduced-motion={reduceMotion}><StackflowStatusProvider animate={!reduceMotion}><Phone /></StackflowStatusProvider></div>;
}
```

Create `src/features/demos/stackflow/stackflow-demo.module.css`:

```css
.demo { display: grid; justify-items: center; gap: var(--space-3); isolation: isolate; }
.phone { width: min(360px, 100%); height: min(720px, 75dvh); overflow: clip; contain: layout paint style; border: 8px solid var(--text); border-radius: var(--phone-radius); background: var(--surface); }
.phone button { min-width: 44px; min-height: 44px; }
.demo[data-reduced-motion="true"] .phone * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
```

- [ ] **Step 9: Stackflow 데모와 전체 타입 검사를 통과시킨다**

Run:

```bash
pnpm test:run tests/components/stackflow-demo.test.tsx
pnpm lint
pnpm typecheck
pnpm build
```

Expected: Stackflow test passes, build exits 0, and `@stackflow` remains reachable only through the stackflow dynamic target.

- [ ] **Step 10: Stackflow 데모를 커밋한다**

```bash
git add package.json pnpm-lock.yaml src/features/demos/stackflow tests/components/stackflow-demo.test.tsx
git commit -m "feat: 격리된 Stackflow 웹뷰 데모 구현"
```

### Task 14: Playwright 기능·42개 시각회귀·axe 접근성 게이트 구현

**Spec coverage:** 2절 전체 IA, 4절 데모 조작, 6절 light/dark·viewport, 7절 WCAG·확대, 8절 Playwright 42 snapshot·데모 상태·axe 14 상태

**Files:**
- Create: `src/lib/performance/visual-fixture.ts`
- Create: `tests/e2e/navigation.spec.ts`
- Create: `tests/e2e/visual.spec.ts`
- Create: `tests/e2e/demo-visual.spec.ts`
- Create: `tests/e2e/accessibility.spec.ts`
- Create: `tests/e2e/__snapshots__/*.png` (Playwright generated baselines)
- Modify: `src/components/home/LiveBrowserMetrics.tsx`
- Modify: `src/app/page.tsx`
- Modify: `playwright.config.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: 7개 공개 route; Task 7의 `LiveBrowserMetrics`; Task 8의 `data-testid`; Task 10·12·13의 controls.
- Produces: `VisualMetricFixture { values: Record<VitalName, number>; frame: FrameSnapshot }`; `VISUAL_METRIC_FIXTURE`; 확장된 `LiveBrowserMetrics(props: { frameMeter?: FrameMeter; support?: VitalSupport; fixture?: VisualMetricFixture }): JSX.Element`; visual build script `pnpm build:visual`; 42개의 고정 full-page baseline; axe serious/critical 0 gate.

- [ ] **Step 1: E2E 접근성 도구와 visual build 스크립트를 추가한다**

Run:

```bash
pnpm add -D @axe-core/playwright@latest cross-env@latest
pnpm pkg set scripts.build:visual="cross-env NEXT_PUBLIC_VISUAL_TEST=1 next build"
```

Expected: packages and `build:visual` script are present.

- [ ] **Step 2: 실측 패널의 결정적 visual fixture를 구현한다**

Create `src/lib/performance/visual-fixture.ts`:

```ts
import type { FrameSnapshot } from "./frame-meter";
import type { VitalName } from "./vitals";

export type VisualMetricFixture = { values: Record<VitalName, number>; frame: FrameSnapshot };
export const VISUAL_METRIC_FIXTURE: VisualMetricFixture = {
  values: { LCP: 1180, CLS: 0.012, INP: 86 },
  frame: { medianMs: 16.7, fps: 60 },
};
```

Extend the `LiveBrowserMetrics` props and initial state in `src/components/home/LiveBrowserMetrics.tsx` with this exact implementation:

```tsx
import type { VisualMetricFixture } from "@/lib/performance/visual-fixture";

export function LiveBrowserMetrics({
  frameMeter,
  support,
  fixture,
}: {
  frameMeter?: FrameMeter;
  support?: VitalSupport;
  fixture?: VisualMetricFixture;
}) {
  const meter = useMemo(() => frameMeter ?? createFrameMeter(), [frameMeter]);
  const supported = useMemo(
    () => fixture ? { LCP: true, CLS: true, INP: true } : support ?? detectVitalSupport(),
    [fixture, support],
  );
  const [values, setValues] = useState<Values>(fixture?.values ?? {});
  const [frame, setFrame] = useState<FrameSnapshot | null>(fixture?.frame ?? null);
  const [announcement, setAnnouncement] = useState("");
  const onVital = useCallback((metric: { name: string; value: number }) => {
    if (fixture || (metric.name !== "LCP" && metric.name !== "CLS" && metric.name !== "INP")) return;
    setValues((current) => ({ ...current, [metric.name]: metric.value }));
    setAnnouncement(`${metric.name} 측정 완료`);
  }, [fixture]);
  useReportWebVitals(onVital);
  useEffect(() => {
    if (fixture || document.hidden) return;
    let stop = meter.start(setFrame);
    const onVisibility = () => { stop(); if (!document.hidden) stop = meter.start(setFrame); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); };
  }, [fixture, meter]);

  const text = (name: VitalName) => !supported[name]
    ? "이 브라우저에서 미지원"
    : values[name] === undefined
      ? name === "INP" ? "입력 전" : "측정 중"
      : formatVital(name, values[name]);

  return (
    <section className={styles.panel} aria-label="현재 브라우저 실측 성능">
      {(["LCP", "CLS", "INP"] as const).map((name) => <div key={name}><span>{name}</span><strong>{text(name)}</strong></div>)}
      <div><span>렌더 프레임</span><strong>{frame ? `${frame.medianMs}ms · ${frame.fps} FPS` : "측정 중"}</strong></div>
      <span className={styles.srOnly} aria-live="polite">{announcement}</span>
    </section>
  );
}
```

Modify `src/app/page.tsx` where metrics are passed:

```tsx
import { VISUAL_METRIC_FIXTURE } from "@/lib/performance/visual-fixture";

const fixture = process.env.NEXT_PUBLIC_VISUAL_TEST === "1" ? VISUAL_METRIC_FIXTURE : undefined;

export default function HomePage() {
  return <><Hero metrics={<LiveBrowserMetrics fixture={fixture} />} /><WorkBento items={workItems} /><CareerTimeline /><Contact /></>;
}
```

- [ ] **Step 3: production build 기반 Playwright 설정으로 교체한다**

Replace `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

const productionBudget = process.env.PLAYWRIGHT_PRODUCTION === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  snapshotPathTemplate: "{testDir}/__snapshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["html"], ["github"]] : "list",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", screenshot: "only-on-failure" },
  webServer: {
    command: productionBudget ? "pnpm build && pnpm start" : "pnpm build:visual && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

- [ ] **Step 4: IA와 데모 기능 E2E를 작성한다**

Create `tests/e2e/navigation.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("홈에서 여섯 사례와 앵커를 탐색한다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /케이스스터디 보기/ })).toHaveCount(6);
  await page.getByRole("link", { name: "경력" }).click();
  await expect(page.locator("#career")).toBeInViewport();
  await page.getByRole("link", { name: /안드로이드 웹뷰.*케이스스터디 보기/ }).click();
  await expect(page).toHaveURL(/\/work\/webview-freeze$/);
  expect(await page.getByRole("heading", { level: 2 }).allTextContents()).toEqual(["문제", "행동", "성과"]);
});

test("허용되지 않은 slug는 404다", async ({ page }) => {
  const response = await page.goto("/work/not-registered");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "요청한 작업을 찾을 수 없습니다." })).toBeVisible();
});

test("세 데모를 조작해도 App Router URL은 바뀌지 않는다", async ({ page }) => {
  await page.goto("/work/webview-freeze");
  const freezeLoader = page.getByRole("button", { name: "freeze 데모 불러오기" });
  if (await freezeLoader.isVisible().catch(() => false)) await freezeLoader.click();
  await page.getByRole("button", { name: "6초 실행" }).click();
  await page.getByRole("button", { name: "중지" }).click();
  await expect(page.getByText("실행 완료")).toBeVisible();

  await page.goto("/work/traffic-spike");
  const trafficLoader = page.getByRole("button", { name: "traffic 데모 불러오기" });
  if (await trafficLoader.isVisible().catch(() => false)) await trafficLoader.click();
  await page.getByLabel("동시 사용자").evaluate((element) => {
    const input = element as HTMLInputElement;
    input.value = "1500";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.getByRole("radio", { name: "최적화 후" }).check();
  await expect(page.getByText("원리 설명용 가상 모델")).toBeVisible();

  await page.goto("/work/epub-comic-viewer");
  const stackflowLoader = page.getByRole("button", { name: "stackflow 데모 불러오기" });
  if (await stackflowLoader.isVisible().catch(() => false)) await stackflowLoader.click();
  const url = page.url();
  await page.getByRole("button", { name: "브라우저 성능 읽기" }).click();
  await page.getByRole("button", { name: "읽기 시작" }).click();
  await expect(page.getByText("stack depth 3 · push")).toBeVisible();
  const phone = page.getByLabel("웹뷰 스택 탐색 데모");
  const box = await phone.boundingBox();
  if (!box) throw new Error("Stackflow 폰 프레임을 찾을 수 없습니다.");
  await page.mouse.move(box.x + 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.75, box.y + box.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect(page.getByText("stack depth 2 · pop")).toBeVisible();
  expect(page.url()).toBe(url);
});
```

- [ ] **Step 5: 42개 full-page 시각회귀를 작성한다**

Create `tests/e2e/visual.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const routes = [
  ["home", "/"], ["webview-freeze", "/work/webview-freeze"], ["traffic-spike", "/work/traffic-spike"],
  ["vue-next-migration", "/work/vue-next-migration"], ["epub-comic-viewer", "/work/epub-comic-viewer"],
  ["ai-workflow", "/work/ai-workflow"], ["isr-redis", "/work/isr-redis-cachehandler-poc"],
] as const;
const viewports = [["mobile", 320, 800], ["tablet", 768, 1024], ["desktop", 1440, 1000]] as const;
const themes = ["light", "dark"] as const;

for (const [routeName, route] of routes) for (const [viewportName, width, height] of viewports) for (const theme of themes) {
  test(`${routeName} ${viewportName} ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.addInitScript(() => {
      Object.defineProperty(window, "IntersectionObserver", {
        configurable: true,
        value: class {
          observe() {}
          unobserve() {}
          disconnect() {}
          takeRecords() { return []; }
        },
      });
    });
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveScreenshot(`${routeName}-${viewportName}-${theme}.png`, { fullPage: true, animations: "disabled" });
  });
}
```

- [ ] **Step 6: 데모 대표 상태 snapshot을 작성한다**

Create `tests/e2e/demo-visual.spec.ts`:

```ts
import { expect, test, type Page } from "@playwright/test";

async function loadDemo(page: Page, name: "freeze" | "traffic" | "stackflow") {
  const loader = page.getByRole("button", { name: `${name} 데모 불러오기` });
  if (await loader.isVisible().catch(() => false)) await loader.click();
  await expect(page.getByTestId(`${name}-demo`)).toBeVisible();
}

const freezeStates = [
  { name: "idle", supported: true, tasks: [], mode: "cached", run: false },
  { name: "reparse", supported: true, tasks: [{ startTime: 100, duration: 82 }, { startTime: 350, duration: 87 }], mode: "reparse", run: true },
  { name: "cached", supported: true, tasks: [], mode: "cached", run: true },
  { name: "unsupported", supported: false, tasks: [], mode: "cached", run: false },
] as const;

for (const fixture of freezeStates) {
  test(`freeze ${fixture.name} 상태`, async ({ page }) => {
    await page.addInitScript(({ supported, tasks }) => {
      class MockPerformanceObserver {
        static supportedEntryTypes = supported ? ["longtask"] : [];
        constructor(private callback: (list: { getEntries(): typeof tasks }) => void) {}
        observe() { this.callback({ getEntries: () => tasks }); }
        disconnect() {}
      }
      Object.defineProperty(window, "PerformanceObserver", { configurable: true, value: MockPerformanceObserver });
    }, fixture);
    await page.goto("/work/webview-freeze");
    await loadDemo(page, "freeze");
    if (fixture.mode === "reparse") await page.getByRole("radio", { name: "매번 재파싱" }).check();
    if (fixture.run) {
      await page.getByRole("button", { name: "6초 실행" }).click();
      await page.getByRole("button", { name: "중지" }).click();
    }
    await expect(page.getByTestId("freeze-demo")).toHaveScreenshot(`freeze-${fixture.name}.png`, { animations: "disabled" });
  });
}

for (const model of ["before", "after"] as const) {
  test(`traffic ${model} 상태`, async ({ page }) => {
    await page.addInitScript(() => {
      class MockWorker {
        onmessage: ((event: { data: unknown }) => void) | null = null;
        onerror: (() => void) | null = null;
        postMessage(message: { type: string; config?: { model: "before" | "after" } }) {
          if (message.type === "stop") return;
          const after = message.config?.model === "after";
          const sample = { timeMs: 1000, p95Ms: after ? 450 : 15000, throughput: after ? 432 : 160, queueDepth: after ? 12 : 1200, rejectedCount: 0 };
          queueMicrotask(() => this.onmessage?.({ data: { type: "sample", sample, series: [sample] } }));
        }
        terminate() {}
      }
      Object.defineProperty(window, "Worker", { configurable: true, value: MockWorker });
    });
    await page.goto("/work/traffic-spike");
    await loadDemo(page, "traffic");
    await page.getByLabel("동시 사용자").evaluate((element) => {
      const input = element as HTMLInputElement;
      input.value = "1500";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    if (model === "after") await page.getByRole("radio", { name: "최적화 후" }).check();
    await expect(page.getByRole("cell", { name: model === "after" ? "450ms" : "15000ms" })).toBeVisible();
    await expect(page.getByTestId("traffic-demo")).toHaveScreenshot(`traffic-${model}.png`, { animations: "disabled" });
  });
}

test("Stackflow 서재·상세·리더·reduced-motion 상태", async ({ page }) => {
  await page.goto("/work/epub-comic-viewer");
  await loadDemo(page, "stackflow");
  const demo = page.getByTestId("stackflow-demo");
  await expect(demo).toHaveScreenshot("stackflow-shelf.png", { animations: "disabled" });
  await page.getByRole("button", { name: "브라우저 성능 읽기" }).click();
  await expect(demo).toHaveScreenshot("stackflow-book.png", { animations: "disabled" });
  await page.getByRole("button", { name: "읽기 시작" }).click();
  await expect(demo).toHaveScreenshot("stackflow-reader.png", { animations: "disabled" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(demo).toHaveAttribute("data-reduced-motion", "true");
  await expect(demo).toHaveScreenshot("stackflow-reduced-motion.png", { animations: "disabled" });
});
```

- [ ] **Step 7: light/dark 14개 axe와 overflow 검사를 작성한다**

Create `tests/e2e/accessibility.spec.ts`:

```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/", "/work/webview-freeze", "/work/traffic-spike", "/work/vue-next-migration", "/work/epub-comic-viewer", "/work/ai-workflow", "/work/isr-redis-cachehandler-poc"];
for (const route of routes) for (const theme of ["light", "dark"] as const) {
  test(`axe ${theme} ${route}`, async ({ page }) => {
    await page.addInitScript((value) => localStorage.setItem("theme", value), theme);
    await page.goto(route);
    const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    expect(result.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  });
}

test("세 데모 대표 상태에 serious·critical axe 위반이 없다", async ({ page }) => {
  const demos = [
    ["/work/webview-freeze", "freeze"],
    ["/work/traffic-spike", "traffic"],
    ["/work/epub-comic-viewer", "stackflow"],
  ] as const;
  for (const [route, name] of demos) {
    await page.goto(route);
    const loader = page.getByRole("button", { name: `${name} 데모 불러오기` });
    if (await loader.isVisible().catch(() => false)) await loader.click();
    await expect(page.getByTestId(`${name}-demo`)).toBeVisible();
    const result = await new AxeBuilder({ page }).include(`[data-testid="${name}-demo"]`).analyze();
    expect(result.violations.filter(({ impact }) => impact === "critical" || impact === "serious")).toEqual([]);
  }
});

test("320px와 200% 확대에서 페이지 수평 overflow가 없다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/");
  await page.evaluate(() => { document.documentElement.style.zoom = "2"; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  await page.locator(".skip-link").focus();
  await expect(page.locator(".skip-link")).toBeFocused();
});

test("Tab으로 skip link에 도달하고 Escape로 freeze를 중지한다", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.locator(".skip-link")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
  await page.goto("/work/webview-freeze");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const loader = page.getByRole("button", { name: "freeze 데모 불러오기" });
  if (await loader.isVisible().catch(() => false)) await loader.click();
  await page.getByRole("button", { name: "6초 실행" }).click();
  expect(await page.getByTestId("freeze-indicator").evaluate((node) => getComputedStyle(node).animationName)).toBe("none");
  await page.keyboard.press("Escape");
  await expect(page.getByText("실행 완료")).toBeVisible();
});
```

- [ ] **Step 8: 기능·axe를 먼저 통과시키고 baseline을 생성한다**

Run:

```bash
pnpm test:e2e tests/e2e/navigation.spec.ts tests/e2e/accessibility.spec.ts
pnpm test:e2e tests/e2e/visual.spec.ts tests/e2e/demo-visual.spec.ts --update-snapshots
pnpm test:e2e
```

Expected: navigation and 17 accessibility tests pass; 42 full-page plus 10 demo baseline images are created; the final full suite passes with no diff.

- [ ] **Step 9: 시각·접근성 게이트를 커밋한다**

```bash
git add package.json pnpm-lock.yaml playwright.config.ts src/lib/performance/visual-fixture.ts src/components/home/LiveBrowserMetrics.tsx src/app/page.tsx tests/e2e
git commit -m "test: 시각회귀와 접근성 게이트 추가"
```

### Task 15: 홈 150KB·데모 청크·Lighthouse 회귀 게이트 구현

**Spec coverage:** 1절 성공 기준, 4절 청크 격리, 7절 모든 성능 예산, 8절 manifest·Lighthouse 회귀

**Files:**
- Create: `scripts/check-demo-chunks.mjs`
- Create: `tests/e2e/performance-budget.spec.ts`
- Create: `lighthouserc.cjs`
- Modify: `package.json`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: Task 8·10·12·13의 DOM marker `demo-chunk:freeze|traffic|stackflow`; Task 14 production Playwright server.
- Produces: `pnpm check:chunks`; `pnpm perf:lhci`; 홈 initial script `encodedBodySize < 153600`; three marker locations with `Set.size === 3`; Lighthouse median Performance/Accessibility 1.0, LCP 1500ms, CLS 0.05 assertions.

- [ ] **Step 1: Lighthouse CI를 설치하고 스크립트를 등록한다**

Run:

```bash
pnpm add -D @lhci/cli@latest
pnpm pkg set scripts.check:chunks="node scripts/check-demo-chunks.mjs" scripts.perf:lhci="pnpm build && lhci autorun"
```

Expected: `@lhci/cli`, `check:chunks`, `perf:lhci` are present.

- [ ] **Step 2: 세 marker의 물리 청크 분리 검사를 작성한다**

Create `scripts/check-demo-chunks.mjs`:

```js
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = join(process.cwd(), ".next", "static", "chunks");
const markers = ["demo-chunk:freeze", "demo-chunk:traffic", "demo-chunk:stackflow"];

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}

const chunks = (await files(root)).filter((file) => file.endsWith(".js"));
const contents = await Promise.all(chunks.map(async (file) => [file, await readFile(file, "utf8")]));
const locations = new Map(markers.map((marker) => [marker, contents.filter(([, source]) => source.includes(marker)).map(([file]) => file)]));
for (const [marker, found] of locations) {
  if (found.length !== 1) throw new Error(`${marker}는 정확히 한 client chunk에 있어야 합니다: ${found.join(", ")}`);
}
const uniqueFiles = new Set([...locations.values()].flat());
if (uniqueFiles.size !== 3) throw new Error(`세 데모가 ${uniqueFiles.size}개 청크에 배치됐습니다.`);
console.log(Object.fromEntries(locations));
```

- [ ] **Step 3: 홈 전송 JS와 초기 marker 부재 E2E를 작성한다**

Create `tests/e2e/performance-budget.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("홈 초기 gzip JavaScript가 150KB 미만이고 데모 marker가 없다", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const result = await page.evaluate(async () => {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const scripts = resources.filter(({ initiatorType, name }) => initiatorType === "script" && name.includes("/_next/static/"));
    const sources = await Promise.all(scripts.map(({ name }) => fetch(name).then((response) => response.text())));
    return { encodedBodySize: scripts.reduce((sum, item) => sum + item.encodedBodySize, 0), source: sources.join("\n") };
  });
  expect(result.encodedBodySize).toBeLessThan(150 * 1024);
  expect(result.source).not.toContain("demo-chunk:freeze");
  expect(result.source).not.toContain("demo-chunk:traffic");
  expect(result.source).not.toContain("demo-chunk:stackflow");
  expect(result.source).not.toContain("@stackflow");
});
```

- [ ] **Step 4: Lighthouse CI 3회 중앙값 기준을 작성한다**

Create `lighthouserc.cjs`:

```js
module.exports = {
  ci: {
    collect: {
      startServerCommand: "pnpm start",
      startServerReadyPattern: "Ready",
      url: ["http://127.0.0.1:3000/"],
      numberOfRuns: 3,
      settings: { formFactor: "mobile", onlyCategories: ["performance", "accessibility", "best-practices", "seo"] },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 1, aggregationMethod: "median" }],
        "categories:accessibility": ["error", { minScore: 1, aggregationMethod: "median" }],
        "largest-contentful-paint": ["error", { maxNumericValue: 1500, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.05, aggregationMethod: "median" }],
      },
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
```

Append to `.gitignore`:

```gitignore
.lighthouseci/
.next/diagnostics/
```

- [ ] **Step 5: production 성능과 청크 검사를 실행한다**

Run:

```bash
pnpm build
pnpm check:chunks
pnpm exec cross-env PLAYWRIGHT_PRODUCTION=1 playwright test tests/e2e/performance-budget.spec.ts
pnpm next experimental-analyze --output
pnpm perf:lhci
```

Expected: each marker appears in one unique chunk; home encoded JavaScript is below 153600 bytes with no demo marker; analyzer writes `.next/diagnostics/analyze`; Lighthouse median reports Performance 1.0, Accessibility 1.0, LCP below 1500ms, CLS below 0.05.

- [ ] **Step 6: 성능 회귀 게이트를 커밋한다**

```bash
git add package.json pnpm-lock.yaml scripts/check-demo-chunks.mjs tests/e2e/performance-budget.spec.ts lighthouserc.cjs .gitignore
git commit -m "test: 성능 예산과 데모 청크 회귀 검사 추가"
```

### Task 16: CI·Vercel 배포 준비와 최종 검증

**Spec coverage:** 1절 운영 전제, 5절 Vercel 배포, 7·8절 전체 품질 게이트, 9절 분석 도구·custom domain 비범위

**Files:**
- Create: `.nvmrc`
- Create: `vercel.json`
- Create: `.github/workflows/ci.yml`
- Create: `README.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: Tasks 1–15의 모든 scripts와 검사; Git identity `changminKo / rhckdals123@gmail.com`.
- Produces: Node 22 실행 기준; frozen pnpm install; GitHub Actions `quality` job; Vercel framework/install/build 설정; `git@github.com:changminKo/portfolio-site.git` remote; Vercel preview build artifact.

- [ ] **Step 1: Node·Vercel 설정을 작성한다**

Create `.nvmrc`:

```text
22
```

Create `vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "installCommand": "corepack enable && pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

Run:

```bash
pnpm pkg set packageManager="pnpm@10.15.0"
```

- [ ] **Step 2: 전체 품질 GitHub Actions workflow를 작성한다**

Create `.github/workflows/ci.yml`:

```yaml
name: quality

on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 10.15.0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test:run
      - run: pnpm build
      - run: pnpm check:chunks
      - run: pnpm test:e2e
      - run: pnpm exec cross-env PLAYWRIGHT_PRODUCTION=1 playwright test tests/e2e/performance-budget.spec.ts
      - run: pnpm perf:lhci
```

- [ ] **Step 3: 실행 문서와 공개 route를 기록한다**

Create `README.md`:

````markdown
# 고창민 포트폴리오

“측정으로 증명하는 성능 엔지니어”를 6개 케이스스터디와 3개 원리 재현 데모로 보여 주는 한국어 포트폴리오입니다.

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

## 공개 경로

- `/`
- `/work/webview-freeze`
- `/work/traffic-spike`
- `/work/vue-next-migration`
- `/work/epub-comic-viewer`
- `/work/ai-workflow`
- `/work/isr-redis-cachehandler-poc`

콘텐츠는 저장소의 `content/work/*.mdx`에서 관리하며 CMS와 방문자 추적 도구를 사용하지 않습니다.
````

- [ ] **Step 4: 깨끗한 설치와 전체 로컬 게이트를 실행한다**

Run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm check:chunks
pnpm test:e2e
pnpm exec cross-env PLAYWRIGHT_PRODUCTION=1 playwright test tests/e2e/performance-budget.spec.ts
pnpm perf:lhci
```

Expected: all commands exit 0; unit/component tests, 42 page snapshots, 10 demo snapshots, 17 accessibility tests, bundle checks, and Lighthouse assertions pass.

- [ ] **Step 5: Vercel project를 연결하고 preview build를 검증한다**

Run:

```bash
pnpm dlx vercel@latest link --project portfolio-site --yes
pnpm dlx vercel@latest build
```

Expected: `.vercel/project.json` links `portfolio-site`, Vercel build exits 0, and the output lists `/` plus six static `/work/...` routes. `.vercel/` remains ignored by Vercel CLI's generated `.gitignore` entry.

- [ ] **Step 6: 배포 준비 파일을 커밋한다**

```bash
git add .nvmrc vercel.json .github/workflows/ci.yml README.md package.json pnpm-lock.yaml .gitignore
git commit -m "chore: Vercel 배포와 CI 준비"
```

- [ ] **Step 7: 원격 저장소를 생성하고 main을 push한다**

Run:

```bash
gh repo create changminKo/portfolio-site --public --source=. --remote=origin --push
git remote -v
```

Expected: `origin` fetch/push URL is `git@github.com:changminKo/portfolio-site.git`, GitHub `main` contains the local commits, and the CI `quality` workflow starts.

---

## Spec Traceability

| 스펙 섹션 | 구현 태스크 |
|---|---|
| 1. 개요·목표 | Tasks 5, 7, 15, 16 |
| 2. 정보 구조와 페이지별 명세 | Tasks 5, 6, 8, 14 |
| 3. 케이스스터디 6개 콘텐츠 | Tasks 3, 4, 5, 6 |
| 4. 데모 3개 상세 설계 | Tasks 8–13 |
| 5. 기술 아키텍처 | Tasks 1–8, 11–13, 16 |
| 6. 디자인 시스템 방향 | Tasks 2, 5, 6, 13, 14 |
| 7. 성능·접근성 요구사항 | Tasks 2, 7, 8, 10, 12–15 |
| 8. 테스트 전략 | Tasks 1, 3, 6–16 |
| 9. 비범위 | Global Constraints, Tasks 4, 8, 13, 16 |
