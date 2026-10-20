# n8n-nodes-coolify — engineering playbook

Operating rules for agents working in this repository.

**Precedence.** This file is self-contained: everything needed to work correctly here is
stated below. Serena project memories (`.serena/memories/`: `core`, `tech_stack`,
`conventions`, `suggested_commands`, `task_completion`, `memory_maintenance`) and the
project-scoped `opencode.jsonc` are **local to one machine and not shared**. Treat them as
optional supplements: read them when present, never depend on them, and never assume a
fact that only they contain. If a memory and this file disagree, this file wins for
*rules*, the memory may still hold the newer *fact* — report the conflict instead of
silently editing either.

**Where things belong.** Operational rules and task routing live in this file. Durable
project facts belong in the Serena memories. Machine-wide configuration (models,
providers, MCP servers, global Serena settings) belongs in the global OpenCode and Serena
config files, never here. Do not add machine paths or repository paths to a global
setting when a project-scoped setting suffices.

---

## 1. Mandatory workflow

Never skip a step, never reorder them, never treat one step as satisfying another.

1. **Investigate — read-only.** No file edits, no formatting, no `git add`/`commit`, no
   releases, no dependency changes. Reading, searching, and running read-only commands
   are allowed.
2. **Plan — concise and evidence-based.** Report: what you found (file + symbol or line),
   what will change, which files, how it will be verified, and any open questions. Every
   claim must be backed by something you actually retrieved. Do not assert that a Coolify
   endpoint, option, header or field exists without evidence from this repository, from
   documentation you fetched, or from the upstream OpenAPI.
3. **Wait for explicit approval.** Stop after the plan. Approval means an explicit "go" /
   "approved" from the user. Silence, a pending tool call, or your own draft is not
   approval. If the request is ambiguous, ask instead of assuming.
4. **Implement only the approved scope.** No opportunistic refactors, renames,
   reformatting, dependency bumps, or extra files. If the approved plan turns out to be
   wrong mid-flight, stop and report instead of improvising.
5. **Verify.** Run the checks that the changed area requires (see §7). Read the diff.
6. **Report.** Files changed, behavioural changes, commands actually executed with their
   real results, and remaining risks or unresolved questions. A check you did not run is
   reported as **not run** — never as "passed", and never as "should pass".

### Investigation rules

- Read before concluding. A symbol's contract, its callers' expectations, and its error
  path matter more than the first screen of a file.
- Evidence order: repository code and tests → this file → documentation you fetched →
  general web sources.
- If the request can be answered without changing anything, say so instead of inventing
  a change.

---

## 2. Serena-first code intelligence

Serena is the primary way to *understand* this codebase. It runs project-scoped with
`--project n8n-nodes-coolify`, `--context ide`, modes `interactive` + `editing`, plus
`no-onboarding`; it exposes 22 tools.

**Verify activation before trusting semantic results.** If a symbol query returns nothing
for a symbol you know exists, the project is not active — say so, do not conclude the
symbol is missing. Call `initial_instructions` once per session (it is the Serena usage
manual).

**Memory-first navigation.** When the local memories are present: `list_memories`, then
read `core` (the top-level map), then only the memory the task needs (`tech_stack`,
`conventions`, `suggested_commands`, `task_completion`). `memory_maintenance` governs
memory hygiene. Do not read all of them by default, and do not re-run onboarding.

**Symbol-first, not file-first.**

| Goal | Tool |
|---|---|
| Outline an unfamiliar file | `get_symbols_overview` (one call gives the whole outline) |
| Locate a definition | `find_symbol` with `name_path_pattern` (+ `relative_path`) |
| See every call site before changing a shared function | `find_referencing_symbols` |
| Interface / override fan-out | `find_implementations`, `find_declaration` |
| Fast type/health signal on touched files | `get_diagnostics_for_file` |
| Text with no symbol (strings, config keys, comments) | `search_for_pattern` (regex) |

Do not read whole source files when a symbol query answers the question.

**Reuse and dependency discipline.** Reuse what you already retrieved; never re-query a
symbol to "confirm" it. Follow a dependency only when it can change the answer (a caller
of a function you are changing, the module a symbol comes from). Do not fan out into
unrelated areas of the repository.

**Editing.** `replace_in_files` for one pattern across many files; `replace_content` for
one file; `replace_symbol_body` / `insert_before_symbol` / `insert_after_symbol` for
symbol-level edits; `rename_symbol` for a genuine rename (it updates references).
Prefer symbol-level edits over rewriting files.

**Known tool exclusions in this setup — do not fight them.** The `ide` context removes
Serena's `read_file`, `list_dir`, `find_file`, `execute_shell_command` and
`create_text_file`: use the native read / shell / write tools for those. The project is
single-project, so `activate_project` and `get_current_config` are unavailable and the
`onboarding` tool is removed.

**Memory hygiene.** Update a memory only for durable, verified, non-obvious knowledge (a
convention, an invariant, a command, a pitfall) — not for task-local notes, volatile line
numbers, or anything unverified. When a change invalidates a documented invariant, update
the matching memory in the same task. Keep the `mem:`-reference graph intact.

---

## 3. MCP orchestration

Nine servers are connected. Each has one job. Calling all of them on every task is a
failure mode, not diligence.

| Server | Use it for | Do not use it for |
|---|---|---|
| **serena** | Symbols, references, implementations, diagnostics, project memories, symbol-level edits | Whole-file text, shell commands, creating new files |
| **git** | Local VCS state: status, diff, log, show, branch, commit, reset | Remote GitHub operations; paths outside this repository (it is bound to this repo and rejects others) |
| **github** *(authenticated)* | Hosted-repo work on `sinehypernova-0718/n8n-nodes-coolify`: issues, PRs, reviews, releases, upstream code search, collaborators | Local history (use `git`); open-web research (use `exa`/`firecrawl`) |
| **context7** | Version-accurate library/framework documentation (`n8n-workflow`, `vitest`, TypeScript) | General web research; live page content (use `exa`/`firecrawl`) |
| **exa** | Open-ended semantic web search, reading a known page, multi-step agent research | Structured extraction or site crawling (use `firecrawl`); library API docs (use `context7`) |
| **firecrawl** *(authenticated)* | Structured extraction (`scrape`/`parse`/`map`/`crawl`), site-wide crawling, scheduled monitors, public developer index (`developer_search`), government sources (`gov_search`), paper research | Cheap lookups — it is the most context-expensive server here; account usage limits (`credit_usage`) |
| **playwright** | Real-browser verification: the n8n editor, a Coolify instance, a rendered docs page | Static documentation; this repository's tests are unit tests, not browser tests |
| **context-mode** *(optional)* | Context reduction over large payloads: `ctx_execute_file` / `ctx_execute` compute over a file or command output so only a summary reaches the conversation; `ctx_index` + `ctx_search` make fetched content queryable | Small files, where the overhead exceeds the benefit |
| **vercel** | **Do not invoke for this repository.** It is an npm-published n8n node package: no Vercel project, no `vercel.json`, no Vercel CI. Use it only if the user explicitly changes that policy | Everything else in this repo |

**Authentication is not authorisation.** `github` and `firecrawl` are authenticated, so
read and research tools work. Before any mutating call (comment, issue, PR, release,
monitor creation, feedback) confirm that the action is wanted, is inside the approved
scope, and is permitted for the account in use. Authentication proves access, not
consent.

### Breaking the overlaps

- **Search:** `exa` (semantic, open web) · `firecrawl` (structured, site-wide, monitors) ·
  `github.search_code` (code inside GitHub) · `context7` (library docs) ·
  `firecrawl.developer_search` (public repos/issues/PRs, not your account).
- **Reading a page:** `exa.web_fetch_exa` for prose · `firecrawl.scrape` / `parse` for
  structured data or a schema · `context-mode.ctx_fetch_and_index` when you will *query*
  the page repeatedly instead of reading it once.
- **Version control:** `git` for the working tree, `github` for the hosted repository.
- **Context reduction:** `context-mode` when the payload is large and only an aggregate is
  needed; otherwise read the file normally.
- **Complementary, not duplicated:** fetch a page once with `exa` or `firecrawl`, add
  `context7` only when the answer is about a library API, and index with `context-mode`
  only when you will query the result repeatedly.

### Task routing

| Task | Primary | Secondary | Skip |
|---|---|---|---|
| Local code change | `serena` (navigate) + native edit/shell | `git` (diff, status) | github, exa, firecrawl, playwright, vercel |
| Understanding an unfamiliar module | `serena` (`get_symbols_overview` → `find_symbol`) | native `read` for prose/config | all web servers |
| Documentation research (library API) | `context7` | `exa.web_fetch_exa` for the official page | firecrawl crawling/monitoring |
| Upstream, issue or PR investigation | `github` | `firecrawl.developer_search` for public code | `git` (local only) |
| Website or UI verification | `playwright` | `firecrawl.scrape` for static text | context-mode |
| Git operations (local) | `git` | native shell `git` for porcelain output | github write tools |
| Large payload, or repeated queries over fetched docs | `context-mode` (`ctx_execute_file`, `ctx_index` + `ctx_search`) | — | reading whole files into context |
| Deployment / runtime errors | `vercel` only for Vercel-hosted targets, and never for this repo without an explicit policy change | — | everything else here |
| Project knowledge and memories | `serena` memories (when present) | this file | — |

**Rule:** pick the one server that owns the task. Add a second only when it adds
information the first cannot provide. Never call a server "to be thorough".

---

## 4. Token efficiency without losing correctness

- Retrieve the **smallest sufficient** context: one symbol, one file section, one
  targeted search result — not a directory listing plus a full read.
- Reuse retrieved context; never re-read a file already read this session.
- Prefer targeted results: `get_symbols_overview` over reading a file, `find_symbol` over
  grep-then-read, `git diff` over re-reading changed files.
- Run independent research in parallel only when the calls are genuinely independent
  (e.g. two documentation lookups) and only when one better-targeted call cannot
  replace them.
- No progress narration, no restating the plan, no "I will now…" preambles. Report
  results, not process.
- Keep outputs small: `depth: 0` / `include_body: false` on symbol queries, `max_answer_chars`
  when a result is expected to be large (Serena's global cap is
  `default_max_tool_answer_chars: 40000`).
- **Never** trade away correctness, test coverage, or a required verification step to
  save tokens. If a shortcut would hide an API contract, a dependency, an error path or
  an edge case, take the larger read.

---

## 5. Project engineering rules

### Architecture (source map)

Six hand-written sources plus tests:

- `nodes/Coolify/shared/apiRequest.ts` — the single authenticated transport.
- `nodes/Coolify/shared/rateLimit.ts` — the retry / rate-limit policy, deliberately free
  of `n8n-workflow` imports so it can be unit-tested in isolation.
- `nodes/Coolify/Coolify.node.ts` — the node class. It is currently a **bootstrap**: it
  renders a `notice` property and exposes no operations. The planned operation and
  endpoint list is in the README "Operations" section; those endpoints are *planned*, not
  implemented.
- `credentials/CoolifyApi.credentials.ts` — the `coolifyApi` credential.
- `test/apiRequest.test.ts`, `test/rateLimit.test.ts` — vitest suites mirroring the two
  shared modules.

### Transport invariant

Every Coolify API call goes through `coolifyApiRequest(ctx, method, path, options)` in
`apiRequest.ts`. Never call `ctx.helpers.httpRequest` directly: authentication, request
shaping, the retry policy and the error surface are implemented exactly once, there.
`options.retrySafety` is the only way a write may ever be retried.

### Credential and security invariants

- The bearer token lives in the n8n credential and is attached by the runtime
  (`Authorization: Bearer …`, `Accept: application/json`). It must never be read,
  logged, echoed, copied into code, tests, errors, prompts or this file.
- The base URL comes from the credential (`host`, default `https://app.coolify.io/api/v1`,
  trailing slash tolerated, `/api/v1` required). A missing base URL is reported as a
  `NodeApiError` with actionable guidance.
- The credential's test request is `GET /team`; its failure rules explain HTTP 400, 401,
  403 and 404.
- Never print credential values, `~/.config/opencode/auth.json`, or token environment
  variables. Never commit secrets. Never echo a token in a report.
- The transport sets `returnFullResponse: true` and `ignoreHttpStatusErrors: true`
  deliberately: the n8n runtime otherwise hides the response headers, and the rate-limit
  headers are exactly what the retry policy needs. Do not "clean this up".

### Retry and rate-limit semantics (authoritative)

- Retries happen only for **safe-to-repeat** requests. `GET` / `HEAD` / `OPTIONS` are safe
  by default; every write is `unsafe` unless the caller explicitly passes
  `retrySafety: 'safe'`. A `429` alone never proves a write is repeatable — Coolify also
  answers `429` when a deployment queue or an upstream provider is busy.
- Retryable failures: HTTP `408`, `429`, `500`, `502`, `503`, `504`; and transport-level
  failures `ECONNRESET`, `ETIMEDOUT`, `ECONNABORTED`, `ECONNREFUSED`, `EPIPE`, `EAI_AGAIN`,
  `ENOTFOUND`, `ENETUNREACH`, `ENETDOWN`, `EHOSTUNREACH`, `EHOSTDOWN`,
  `ERR_SOCKET_CONNECTION_TIMEOUT`, `UND_ERR_BODY_TIMEOUT`, `UND_ERR_CONNECT_TIMEOUT`,
  `UND_ERR_HEADERS_TIMEOUT`, `UND_ERR_SOCKET`. `501` is permanent.
- Permanent failures (`400`, `401`, `403`, `404`, `409`, `422`, …) are surfaced
  immediately, preserving the Coolify status code, message and response body in the
  n8n-shaped error (`httpCode`, `message`, body attached as `context.data`).
- Wait source precedence: `Retry-After` → `X-RateLimit-Reset` → exponential backoff
  (`500 ms × 2^attempt`) plus jitter (≤ `500 ms`), capped at `30 s`.
- Budget: at most `MAX_RETRIES = 3` extra attempts, and the maximum server-mandated wait
  is `MAX_RETRY_AFTER_MS = 60 s`. A wait beyond the budget **fails the request** instead
  of retrying early. Retries are never issued in parallel.
- The wait is abortable: a cancelled execution stops the wait.
- `REQUEST_TIMEOUT_MS = 30_000` per request. The retry limits and timeouts are internal
  constants; there are no node-level options for them.
- The rate limit is **never hardcoded** — the server's response headers are the only
  source of truth.

### Code conventions

- TypeScript with `strict`, `noImplicitAny`, `noUnusedLocals`, `noImplicitReturns`,
  `strictNullChecks`; `commonjs`, `target: es2019`, output `dist/`, declarations and
  sourcemaps.
- Prettier: tabs (width 2), single quotes, semicolons, `trailingComma: all`,
  `printWidth: 100`, LF line endings, `arrowParens: always`.
- Named exports in `shared/`; `export type` / `export interface` for types; constants
  `UPPER_SNAKE_CASE`; functions `camelCase`.
- TSDoc (`/** … */`) on exported functions and non-obvious constants, with `{@link Symbol}`
  cross-references inside a module. Comments explain **why**, not what.
- Magic numbers become named constants.
- n8n node pattern: metadata as a class property, methods on the class, `INodeType` /
  `ICredentialType` implemented.
- `test/` is **not** part of `tsconfig.json`, so `tsc --noEmit` does not type-check the
  tests.

### Test coverage and known gaps

- Covered: the whole retry policy (`rateLimit.ts`: failure classification, delay
  computation, header parsing, default safety, policy constants) and the transport
  behaviour (`apiRequest.ts`: retry vs no-retry per method and safety, budget exhaustion,
  wait-source fallbacks, error shape, cancellation, non-parallel retries).
- Gaps — do not assume coverage: the credential module, the node class itself, and any
  end-to-end path through a real n8n runtime are untested. A change in those areas needs
  a new test; a change to shared policy needs the mirrored suite updated.
- Test style: vitest `describe` / `it` with sentence-style names that describe behaviour
  ("it('retries a read on a transient server error')"), and inline fakes/stubs
  (`createRuntime`, `createContext` in `test/apiRequest.test.ts`) — no external mock
  framework; time and randomness are injected for determinism.

### Commands

| Purpose | Command |
|---|---|
| Install | `pnpm install` |
| Lint | `pnpm run lint` (eslint via `n8n-node lint`; autofix `pnpm run lint:fix`) |
| Tests | `pnpm run test` (watch: `pnpm run test:watch`) |
| Single test file | `pnpm exec vitest run test/rateLimit.test.ts` |
| Build | `pnpm run build` (watch: `pnpm run build:watch`) |
| Type check only | `pnpm exec tsc --noEmit` (does **not** cover `test/`) |
| Format check | `pnpm exec prettier --check .` (only when formatting was touched) |
| Local n8n with the node loaded | `pnpm run dev` |
| Local release | `pnpm run release:local` (CI publish entry point: `pnpm run release`) |

CI runs `lint` → `test` → `build` on pull requests and on pushes to `master`;
`publish.yml` publishes to npm on `v*.*.*` tags. The default branch is `master`, not
`main`. Node.js ≥ 22 is required.

---

## 6. Testing and completion criteria

1. **Choose the scope of the checks.**
   - Documentation or comment-only change → no test run; state that explicitly.
   - `rateLimit.ts` change → `pnpm exec vitest run test/rateLimit.test.ts`.
   - `apiRequest.ts` change → `pnpm exec vitest run test/apiRequest.test.ts`.
   - Change in `nodes/` or `credentials/` → `pnpm run test` (full suite).
   - Anything that can ship → `pnpm run lint` **and** `pnpm run test` **and**
     `pnpm run build`; add `pnpm exec prettier --check .` if formatting was touched.
   - Configuration- or documentation-only change (this file, OpenCode/Serena config,
     memories) → a build is not justified; verify the configuration instead (see below).
2. **Never weaken a test to make it pass.** Fix the code, or report the conflict.
3. **Inspect the diff** before reporting: `git diff` / `git diff_unstaged` via the `git`
   MCP, plus `git status` for untracked files. Confirm that only the approved scope
   changed.
4. **Report exactly what ran:**

   ```
   Files changed:  <path> — <one-line behavioural change>
   Tests executed: <command> → <pass/fail counts, real output>
   Not executed:   <command> → <why>
   Diff reviewed:  <what you checked>
   Open questions: <risks, assumptions, follow-ups>
   ```

### Configuration verification (no build needed)

- `opencode mcp list` → the servers you rely on show `connected`.
- Serena startup log (`~/.serena/logs/<date>/mcp_*.txt`) → `Activating
  n8n-nodes-coolify` and the expected `Active modes`.
- A `serena find_symbol` call that resolves a known symbol, e.g. `coolifyApiRequest`.
- `serena memories check` → no referential integrity issues.
- On a Windows console set `PYTHONIOENCODING=utf-8` before running the Serena CLI, or it
  crashes while printing a non-ASCII character.

---

## 7. Scope, security and maintenance rules for this file

- This file serves agents in **this** repository. Machine-wide behaviour belongs in the
  global OpenCode and Serena configuration; project-scoped MCP settings belong in the
  project `opencode.jsonc`. Do not add repository paths to global configuration.
- Keep it operational: rules, invariants, and routing. Facts live in the Serena
  memories; generic TypeScript or n8n knowledge belongs nowhere.
- Update this file when a rule changes. Do not accumulate history, changelogs, or one-off
  task notes here.
- Never weaken the approval gate, the verification requirements, or the credential
  invariants to make a task faster.
- Never modify `.gitignore` or change which files are tracked as part of an unrelated
  task; report the observation instead.
