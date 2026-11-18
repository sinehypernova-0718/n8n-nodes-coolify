# Tech stack

- Language: TypeScript 5.9.3, `strict: true`, `noImplicitAny`, `noUnusedLocals`, `noImplicitReturns`, `strictNullChecks`, `incremental`, `declaration`, `sourceMap`, `skipLibCheck`.
- Module target: `commonjs`, `moduleResolution: node`, `target: es2019`, output `./dist/`.
- `tsconfig.json` `include` covers only `credentials/**/*`, `nodes/**/*`, `nodes/**/*.json`, `package.json`; `test/` is not part of the build (and no test suite exists).
- Package manager: pnpm, pinned `packageManager: pnpm@12.4.2`; lockfile `pnpm-lock.yaml`.
- n8n tooling: `@n8n/node-cli` (`*`) provides `n8n-node build|dev|lint|release|prerelease`; `n8n-workflow` is the peer dependency (types and helpers such as `IExecuteFunctions`, `NodeApiError`, `sleep`, `sleepWithAbort`).
- No test framework: no `test` script, no vitest dependency, no `vitest.config.ts`; `test/` is an empty leftover directory. Verification is lint + build + `tsc --noEmit`.
- Lint/format: eslint 9.29.0 (flat config `eslint.config.mjs`) via `n8n-node lint`; prettier 3.8.3 with `.prettierrc.js`.
- `n8n-node lint` also runs `eslint-plugin-n8n-nodes-base` and `@n8n/eslint-plugin-community-nodes` (pulled in by `@n8n/node-cli`). Their node-parameter rules are binding on every description: single-sentence descriptions must not end with a period and multi-sentence ones must; weak descriptions are removed; descriptions start uppercase; a boolean description starts with "Whether"; display names and option names are title cased; options and collection items are alphabetised at five or more; an options default must be one of its options; a collection default must be an object; collection items carry no `required`; the resource label is singular; a description file is `<resource>Description.ts` in singular form; every operation option needs an `action`; the selectors need `noDataExpression`; `execute()` needs `continueOnFail` and throws only `NodeApiError`/`NodeOperationError` with `{ itemIndex }`; a caught error is never re-thrown unchanged; a literal is never assigned to a secret-looking name (`...key`, `...auth`, `...passwd`).
- Release: `release-it` 20.2.0 (`.release-it.json`), branch `master`, tag format `vX.Y.Z`.
- Node.js >= 22 required (per README); `@types/node` `^22.20.5`.
- npm package metadata: `n8n.nodes`/`n8n.credentials` point at `dist/...`; only `dist` is published.
