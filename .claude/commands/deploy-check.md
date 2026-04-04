Run a pre-deployment verification checklist for the mdeai.co project.

## Arguments

- `$ARGUMENTS` — Optional: `quick` (lint + build only) or `full` (complete audit). Default: `full`.

## Quick Check (`quick`)

1. `npm run lint` — zero errors
2. `npm run build` — successful production build
3. `npm run test` — all tests pass (if any exist)
4. Check for `console.log` statements in `src/` (warn, don't block)

## Full Check (`full`)

Everything in Quick, plus:

### Security Scan
- Verify `.env` contains only `VITE_` prefixed vars (public keys)
- Scan for hardcoded API keys or secrets in `src/`
- Check that no service role key references exist in frontend code
- Verify edge functions validate auth on every endpoint

### Build Health
- Check for TypeScript `@ts-ignore` or `@ts-expect-error` (warn)
- Check for `any` type usage (warn with count)
- Verify all page routes in `App.tsx` have corresponding page components
- Check for unused imports (via lint)

### Data Integrity
- Verify all data-fetching components handle 4 states
- Check that forms use react-hook-form + Zod (not uncontrolled)
- Verify pagination is set on list queries

### Dependencies
- Check for outdated critical deps (`npm outdated --depth=0`)
- Verify no duplicate lockfiles issue (bun.lockb vs package-lock.json)

## Output Format

```
DEPLOY CHECK: [quick|full]
================================
[PASS] Lint — 0 errors
[PASS] Build — success (Xs)
[WARN] Tests — no test files found
[FAIL] Security — found hardcoded key in src/lib/foo.ts:42
================================
RESULT: [READY / NOT READY]
Action items: [list if NOT READY]
```
