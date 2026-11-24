# Commands (Windows / PowerShell context)

- Install deps: `pnpm install`
- Lint: `pnpm run lint`; autofix: `pnpm run lint:fix`
- Build: `pnpm run build`; watch: `pnpm run build:watch`
- Type check only: `pnpm run typecheck`
- Format check (changed files only): `pnpm exec prettier --check <paths>`
- Dev n8n with the node loaded: `pnpm run dev`
- Local release (bump+changelog+tag+push): `pnpm run release:local` — CI publish entry point: `pnpm run release`
- No test command exists: `package.json` has no `test` script and no test framework is installed.

Notes:
- Repo default branch is `master`, not `main`.
- Repo files use LF endings and tabs (prettier `useTabs: true`, `endOfLine: 'lf'`).
- Scope the Prettier check to the changed files: the repository-wide check fails on pre-existing files.
