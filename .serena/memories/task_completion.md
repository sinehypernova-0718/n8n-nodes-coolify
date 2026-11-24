# Task completion criteria

Run all of these before declaring a coding task done (from the repo root, pnpm installed):

1. `pnpm run lint` (eslint via `n8n-node lint`) — must be clean.
2. `pnpm run build` (`n8n-node build`) — compiles to `dist/` without type errors; `pnpm exec tsc --noEmit` is the standalone type gate.
3. `pnpm exec prettier --check <changed files>` if formatting was touched (repo style: tabs, single quotes, width 100).

CI (`.github/workflows/ci.yml`) runs lint + build on pull requests and on pushes to `master`; `publish.yml` publishes to npm on `v*.*.*` tags. There is no test job and no test suite.

Additional rules:
- The operation values of a resource's description and the keys of its `<resource>RequestBuilders` registry must be the same set. No test enforces it — reconcile the two files by hand in every change that adds or removes an operation.
- A check that only asserts what the code already does proves nothing: after changing a request builder, compare its method, path, body keys and query keys with the verified contract, and compare the field contract with the endpoint's property set in `openapi.yaml`.
- Scope the Prettier check to the changed files. The repository is kept formatted with `prettier --write .`; a file edited at the same time can still make the repository-wide check fail. Do not reformat a file you did not change — report the failure instead.
- Known pre-existing Prettier failures: `README.md`, `CHANGELOG.md`, `nodes/Coolify/descriptions/CloudInitScript/CloudInitScriptDescription.ts`, `nodes/Coolify/descriptions/CloudToken/CloudTokenDescription.ts` and `nodes/Coolify/descriptions/Database/DatabaseDescription.ts` are **CRLF in the working tree while the index is LF**, so `pnpm exec prettier --check .` fails on them regardless of the change. New files must be Prettier-clean; the pre-existing failures are reported, never reformatted away.
