# Core Web Vitals Improvements Plan (2026-10-15)

## Goal
Achieve **Good** Lighthouse scores for Core Web Vitals (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) without adding dependencies.

## Tasks (sequential, native execution)
1. **Critical CSS for hero section**
   - Add inline minimal CSS for the hero text block.
   - Verify LCP drops below 2.5 s.
   - Commit: `:recycle: refactor(core): inline critical hero CSS`
2. **Preload placeholder hero image**
   - Add `<link rel="preload" href="/assets/hero.webp" as="image">` in `index.html`.
   - Verify LCP improvement.
   - Commit: `:sparkles: feat(perfiles): preload hero placeholder`
3. **Chunk long search loops**
   - In `src/services/searchService.ts` break loops >50 ms with `await scheduler.yield()` (or `setTimeout(0)`).
   - Verify INP ≤ 200 ms.
   - Commit: `:bug: fix(search): chunk search loop to avoid UI freeze`
4. **Route lazy‑loading**
   - Convert route imports to `React.lazy` + `Suspense`.
   - Verify bundle size reduction and LCP.
   - Commit: `:sparkles: feat(routes): lazy‑load route components`
5. **Preconnect to Google Fonts**
   - Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` in `index.html`.
   - Verify network timing.
   - Commit: `:art: style(fonts): preconnect Google Fonts`
6. **Font‑display swap**
   - Ensure `@font-face` includes `font-display: swap`.
   - Verify text‑rendering speed.
   - Commit: `:art: style(fonts): add font-display swap`

## Verification
After each task run `pnpm exec vitest run` (tests must stay green) and `npx lighthouse http://localhost:5173 --quiet --output=json --output-path=tmp/lh.json`. Ensure thresholds.

## Final Step
Run full Lighthouse audit, confirm all CWV metrics are **Good**, merge `core-web-vitals` into `develop`.
