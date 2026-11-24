# Coolify Resource Verification Playbook

A durable, resource-agnostic method to **verify** any resource of
`@sinehypernova-0718/n8n-nodes-coolify` (Application, Database, Audit Event, Cloud Init
Script, Cloud Token, and every future resource) against the working tree and the
authoritative Coolify API, and to report findings.

This is the **audit counterpart** of `mem:coolify-resource-implementation-playbook` (the
implementation guide). Read that memory first for the execution pipeline and the
new-resource checklist; this memory does not repeat them and instead tells you how to
check an implementation and how to report what you found. Code style and description
patterns live in `mem:conventions`; the verified Applications/Deployments upstream
contract lives in `mem:coolify_api`; the tooling and commands live in `mem:tech_stack`
and `mem:suggested_commands`; the done-criteria live in `mem:task_completion`.

## Evidence labels — use one on every claim

- **VERIFIED** — read directly in the working tree (exact path + symbol) or in fetched
  authoritative upstream source/spec.
- **INFERRED** — a conclusion deduced from VERIFIED facts; state the deduction.
- **UNRESOLVED** — authoritative sources conflict, or a claim could not be confirmed.
  Report both sides; never pick silently.
- **UNVERIFIED** — assumed or not checked; say so.

Memories are supplemental and may lag behind the code (`AGENTS.md`; the Serena
`initial_prompt` in `.serena/project.yml` says the same). Never let a memory override the
actual code or the authoritative API documentation; when they disagree, the code and the
spec win and the disagreement itself is a finding.

---

## 0. Verification standards (binding, never weakened)

1. A successful `pnpm run lint` / `pnpm run build` / `pnpm run typecheck` proves
   types and style, **never** API correctness.
2. Following an existing convention proves consistency, **not** correctness — a
   wrong-but-consistent implementation passes every convention check.
3. Check the official upstream contract independently of the code; never derive an
   endpoint, field or default from the node's own builder.
4. Verify **every operation individually**; two operations of the same resource rarely
   share a contract.
5. Never invent an endpoint, path parameter, query parameter, header, body field,
   accepted value, type, default, response shape, status code or permission model.
6. Never claim a command, test or check was executed unless it actually ran; report
   everything else as **not run** with the reason.
7. Separate **confirmed defect**, **potential defect**, **unverified behaviour** and
   **accepted limitation**.
8. Prefer evidence: exact path, symbol, line, and the source that proves it.
9. A verification-only audit is **read-only**. Do not edit code, docs, memories or
   config, and never commit / push / publish / release without explicit authorization.

---

## 1. Repository baseline (the working tree is the source of truth)

The working tree at `master` implements **five** resources (VERIFIED by reading
`nodes/Coolify/Coolify.node.ts`):

| resource value   | label           | description file                                              | registry symbol                 | operations |
| ---------------- | --------------- | ------------------------------------------------------------- | ------------------------------- | ---------: |
| `application`    | Application     | `descriptions/Application/ApplicationDescription.ts`          | `applicationRequestBuilders`    |         42 |
| `auditEvent`     | Audit Event     | `descriptions/AuditEvent/AuditEventDescription.ts`            | `auditEventRequestBuilders`     |          1 |
| `cloudInitScript`| Cloud Init Script | `descriptions/CloudInitScript/CloudInitScriptDescription.ts`| `cloudInitScriptRequestBuilders`|          5 |
| `cloudToken`     | Cloud Token     | `descriptions/CloudToken/CloudTokenDescription.ts`            | `cloudTokenRequestBuilders`     |          6 |
| `database`       | Database        | `descriptions/Database/DatabaseDescription.ts`                | `databaseRequestBuilders`       |         17 |

Total: **71 operations**. The counts above are VERIFIED and mutually consistent: the
number of `action:` entries in each `<Resource>Description.ts` equals the number of keys
in the matching `<resource>RequestBuilders` registry. Re-run this reconciliation by hand
on every change that adds or removes an operation (no test enforces it).

### Layered architecture map (exact paths / symbols)

- `nodes/Coolify/Coolify.node.ts` — class `Coolify implements INodeType`.
  - `nodeProperties` = the `resource` options selector + `...applicationFields`,
    `...auditEventFields`, `...cloudInitScriptFields`, `...cloudTokenFields`,
    `...databaseFields`.
  - `resourceRequestBuilders: Record<string, Record<string, CoolifyRequestBuilder>>` maps
    each resource value to its own registry (dispatch is per resource).
  - `resourceLabels: Record<string, string>` holds the display labels.
  - `asNodeError(node, error, itemIndex)` passes `NodeApiError` / `NodeOperationError`
    through and wraps everything else.
  - `fetchAuditEvents(...)` — the only operation `execute()` special-cases
    (`auditEvent:list`); constants `AUDIT_EVENT_PAGE_SIZE = 100`,
    `DEFAULT_AUDIT_EVENT_LIMIT = 50`, `MAX_AUDIT_EVENT_PAGES = 1_000`.
  - `execute()`: reads `resource`/`operation`, dispatches
    `resourceRequestBuilders[resource][operation]`, wraps the context with
    `withOperationCollectionFallback(this, nodeProperties)`, calls the builder, then sends
    the `CoolifyRequest` through `coolifyApiRequest`.
  - `description.version: [1, 2]`, `usableAsTool: true`, `group: ['input']`,
    `inputs`/`outputs` use `NodeConnectionTypes.Main`; credential `coolifyApi`.
  - `methods.listSearch` = `{ searchApplications, searchDatabases, searchProjects,
    searchServers, searchTags, searchCloudInitScripts, searchDestinations,
    searchEnvironments }`; `methods.loadOptions` = `{ getEnvironments, getTagNames }`.
- `nodes/Coolify/descriptions/` — `<Resource>/<Resource>Description.ts` (operation
  selector + one section per operation) with sibling field modules
  (`applicationCreateFields.ts`, `applicationUpdateFields.ts`, `applicationFieldProperties.ts`,
  `storageBackupScheduleFields.ts`, `databaseCreateFields.ts`, `databaseUpdateFields.ts`,
  `databaseFieldProperties.ts`). `descriptions/index.ts` exports the five
  `<resource>Fields` arrays. `descriptions/parameterCollections.ts` owns
  `groupOptionalParameters` and the version 1/2 rewriting.
- `nodes/Coolify/requests/` — one `<operation>.ts` per operation; `<resource>/index.ts`
  exports `<resource>RequestBuilders`; `requests/index.ts` is the barrel; `requests/types.ts`
  defines `CoolifyRequest` (`{ method, path, qs?, body?, retrySafety? }`) and
  `CoolifyRequestBuilder` (`(this: IExecuteFunctions, itemIndex: number) => Promise<CoolifyRequest>`).
  `<resource>/*Fields.ts` holds the field contract and `buildCreate<Resource>Body` /
  `buildUpdate<Resource>Body`; `<resource>/parameters.ts` holds `require<Resource>Uuid`.
- `nodes/Coolify/shared/` — `apiRequest.ts` (`coolifyApiRequest`, `COOLIFY_CREDENTIAL_TYPE`,
  `REQUEST_TIMEOUT_MS = 30_000`), `rateLimit.ts` (policy; **no** n8n imports),
  `parameterResolution.ts` (`operationOptionsParameterName`, `getCollectionParameter`,
  `withOperationCollectionFallback`), `pathSegment.ts` (`encodePathSegment`),
  `locatorValue.ts` (`locatorValue`, `locatorMode`).
- `nodes/Coolify/searchFunctions/index.ts` — the locator/loadOption pickers; every one
  calls `coolifyApiRequest`.
- `credentials/CoolifyApi.credentials.ts` — class `CoolifyApi implements ICredentialType`,
  name `coolifyApi`, fields `host` (default `https://app.coolify.io/api/v1`) and
  `accessToken` (password); `authenticate` sends `Authorization: Bearer …` +
  `Accept: application/json`; credential test `GET /team`.
- `package.json` — `n8n.n8nNodesApiVersion: 1`, `n8n.strict: true`, only `dist` published;
  scripts `build`/`build:watch`/`dev`/`lint`/`lint:fix`/`release`/`release:local`/`prepublishOnly`;
  **no `test` script**, no `engines` field.
- `tsconfig.json` — `include: ["credentials/**/*","nodes/**/*","nodes/**/*.json","package.json"]`
  (so `test/` is never type-checked); `strict`, `noImplicitAny`, `noUnusedLocals`,
  `noImplicitReturns`, `strictNullChecks`, `commonjs`, `target: es2019`, `outDir: ./dist/`.
- `eslint.config.mjs` — `import { config } from '@n8n/node-cli/eslint'; export default config;`
  (the node-param rules come through `@n8n/node-cli`).
- `.prettierrc.js` — tabs (width 2), single quotes, semicolons, `trailingComma: 'all'`,
  `printWidth: 100`, `endOfLine: 'lf'`, `arrowParens: 'always'`.
- `.github/workflows/ci.yml` — `pull_request` + `push` to `master`: `pnpm install
  --frozen-lockfile` → `pnpm run lint` → `pnpm run build`; Node `lts/*`.
  `.github/workflows/publish.yml` — publishes to npm on `v*.*.*` tags.

### Test reality (do not pretend otherwise)

- **No test suite and no `test` script.** A `test/` directory exists in the local working
  tree but is empty and untracked, and `tsconfig.json` excludes it.
- The only executable gates are `pnpm run lint`, `pnpm run build` and
  `pnpm run typecheck`; formatting is `pnpm exec prettier --check <changed files>`.
- "Add missing coverage" in a code task therefore means: state that a test layer is
  absent, exercise the behaviour by reading the compiled/`tsc`-checked code and comparing
  it to the contract, and flag the coverage gap — do not invent a framework.

---

## 2. API research & source-of-truth hierarchy

**Priority order (highest first).** A lower source never overrides a higher one.

1. The upstream Coolify **OpenAPI specification** (`openapi.yaml`) at a pinned release
   tag — machine-readable, but see the spec-vs-implementation caveat below.
2. The upstream Coolify **source** at the same tag: `routes/api.php`, the controllers
   under `app/Http/Controllers/Api/`, the models, `bootstrap/helpers/api.php`,
   `app/Support/ValidationPatterns.php`. The controller is the truth for what is
   *accepted* and what *validation* enforces.
3. The **published docs** (`coolify.io/docs/api/...`) — good for auth, rate limits and
   errors.
4. **Repo code** — `mem:coolify_api` (verified Applications/Deployments contract),
   `requests/<resource>/*Fields.ts`, the builders.
5. Search snippets, third-party examples, AI output, assumptions — **never authoritative**.

**Spec vs implementation is a first-class finding.** The OpenAPI routinely disagrees with
the controller (missing `required`, undocumented-but-accepted fields, different response
status/body). Record both and mark it UNRESOLVED; do not silently pick one. `mem:coolify_api`
already lists examples (e.g. `dockerfile` must be base64; creation answers `201 {uuid,domains}`;
`POST …/envs` requires `key` although unpublisted).

**Pin the version.** Always state the release tag you verified against (e.g. `v4.4.6`).
When a newer release changes a parameter (e.g. `cancel_previous` added to `/deploy` in
`v4.7.6`, absent in `v4.4.6`), report the version difference and which contract the code
targets instead of assuming the newest.

### Per-operation verification matrix — verify each cell against the sources above

- HTTP method and the **exact endpoint path** (relative to base URL + `/api/v1`).
- Path parameters; **query** parameters; required headers; request body.
- Required vs optional fields; accepted values / enums; types; defaults; validation
  constraints (lengths, ranges, regex, base64, cron).
- Response structure and the relevant status codes (success and documented errors).
- Auth requirements and permission/scoping (ability, `read:sensitive`/`root`, team scope).
- Pagination, filtering, sorting, and whether execution is synchronous or queued.
- Version-specific behaviour and documented limitations.

### Resolving conflicting or incomplete sources

- Controller over spec for what is accepted; spec over controller for the *published*
  name/type of a field.
- When the docs are silent, read `routes/api.php` + the controller + the model; if still
  ambiguous, mark the cell UNVERIFIED rather than guessing.
- When the node sends a field the published spec does not list, that is a finding
  (either the node is over-sending, or the spec is incomplete — say which you can prove).
- Distinguish **confirmed API behaviour** (a source proves it) from **assumption**
  (nothing proves it). Never label an assumption "verified".

---

## 3. Resource implementation architecture (trace all twelve layers)

For every operation, walk the whole chain. At each layer: what to inspect, and the signal
of an inconsistency.

| # | Layer | Inspect (exact) | Inconsistency signal |
| - | ----- | --------------- | -------------------- |
| 1 | Resource / operation definitions | `resource` options in `Coolify.node.ts`; `operation` options in `<Resource>Description.ts` | operation listed without a builder; label not singular/title-cased; `noDataExpression` missing |
| 2 | UI descriptions / parameter config | field objects in `<Resource>Description.ts` + field modules | a field shown that is never sent, or sent that is never shown; missing `displayOptions.show.resource`+`.operation`; description rule violations (§5) |
| 3 | Display conditions / dependent fields | `displayOptions.show`, `loadOptionsDependsOn`, `resourceLocator` modes | field visible for the wrong operation; `loadOptionsDependsOn` naming a collection path instead of the root name |
| 4 | Input validation / required-vs-optional | `require<Resource>Uuid`, `read<Resource>Name`, `<resource>/*Fields.ts` validators | required id validated only by the API; empty string sent; a nullable field treated as required |
| 5 | Request builders | `requests/<resource>/<operation>.ts` | wrong method/path; `/api/v1` in the path; unsent default; absent `retrySafety` on a mutation |
| 6 | Exports & registration | `requests/<resource>/index.ts`, `requests/index.ts`, `resourceRequestBuilders` | registry key ≠ operation value; builder exported but not registered, or vice versa |
| 7 | Execution dispatch | `Coolify.execute()` | resource not in `resourceRequestBuilders`/`resourceLabels`; a per-operation special case not mirrored by its builder |
| 8 | Shared transport & auth | `shared/apiRequest.ts`, `credentials/CoolifyApi.credentials.ts` | any call bypassing `coolifyApiRequest`; token read/logged; base URL assumptions |
| 9 | Response handling / output consistency | `execute()` return path, `isDataObject`, `returnJsonArray` | response reshaped; arrays vs objects mishandled; `null`/empty filtered silently |
| 10 | Errors, rate limiting, pagination | `shared/rateLimit.ts`, `asNodeError`, `fetchAuditEvents` | wrong retry safety; a paginated endpoint left unpaginated, or an unpaginated one given a `returnAll`; unbounded page loop |
| 11 | README / CHANGELOG / docs | `README.md`, `CHANGELOG.md`, `Coolify.node.json` | docs number/label/behaviour ≠ code (see §7 pattern D1) |
| 12 | Tests & CI | `.github/workflows/ci.yml`; absence of a test suite | claiming coverage that does not exist; CI gate not actually run |

---

## 4. Universal verification checklist (resource-agnostic)

Run every group for every resource.

**Contract**
- [ ] Method + path of every operation match the pinned upstream source.
- [ ] Path segments are built with `encodePathSegment` (`shared/pathSegment.ts`); no raw
      interpolation of a user value into the path.
- [ ] Query keys, body keys, required/optional status, enums, types, defaults and
      constraints match the spec/controller.
- [ ] Spec-vs-controller differences recorded (UNRESOLVED), not silently resolved.

**UI ↔ request consistency**
- [ ] Every editor field maps to a body/query/path element the builder sends; every sent
      element maps to a field the editor shows (for that operation).
- [ ] `displayOptions.show` names both `resource` and `operation` on every field.
- [ ] Resource locators use the right `searchListMethod` and a matching mode set.
- [ ] `loadOptionsDependsOn` refers to root parameter names (never a collection path).

**Types**
- [ ] `pnpm run typecheck` clean; no `any` leaks; `unknown` narrowed before use.
- [ ] `strict`, `noUnusedLocals`, `noImplicitReturns`, `noImplicitAny` all respected.

**n8n v2 compatibility**
- [ ] `version: [1, 2]` and the v1/v2 optional-field split is intact
      (`groupOptionalParameters`, `withOperationCollectionFallback`).
- [ ] A resource that groups optional fields is present in **both** the union in
      `groupOptionalParameters` and the hardcoded list in `withOperationCollectionFallback`.
- [ ] Inside a collection, root conditions are root-relative (`/resource`, `/operation`);
      siblings stay relative; `@version` is never rewritten.
- [ ] `noDataExpression` on the resource and operation selectors; `usableAsTool` intact.

**Shared abstractions**
- [ ] Every call goes through `coolifyApiRequest`; no direct `helpers.httpRequest`.
- [ ] No duplicated transport/retry/params logic outside `shared/`.

**Optional fields, empties, defaults, nullability**
- [ ] Text sent only when non-empty; lists only when non-empty; numbers only when a number.
- [ ] Boolean sent when switched on; a boolean whose **API default is `true`** carries the
      default in the editor and is sent when switched off (`apiDefault` pattern).
- [ ] Collection fields sent only when the user added the item; never an invented default.
- [ ] `null` vs absent vs empty is intentional and documented.

**Resource locators / dependent options**
- [ ] Pickers return `{ name, value }` records with the right value (uuid vs name).
- [ ] A dependent picker reads its parent from the root or the operation collection
      correctly (`searchFunctions/index.ts` pattern) and returns `{ results: [] }` when
      the parent is unset.

**Pagination & limits**
- [ ] Requires pagination in the API ⇒ a bounded, non-parallel, terminating loop.
- [ ] Does **not** require pagination ⇒ no `returnAll`/`limit` invented.
- [ ] Page cap and per-page size are named constants; overflow fails loudly, never
      truncates silently.

**Errors & robustness**
- [ ] Only `NodeApiError` / `NodeOperationError` (with `{ itemIndex }`) are thrown.
- [ ] A caught error is never re-thrown unchanged; `continueOnFail()` is honoured.
- [ ] Non-JSON / unexpected response bodies are handled, not assumed.
- [ ] `retrySafety` correct: reads safe by default; a write is `safe` only if provably
      side-effect-free when repeated (`application:stop` is the only explicit `safe`).

**Naming / descriptions / docs**
- [ ] Resource label singular + title-cased; display names title-cased.
- [ ] Description lint rules (§5) satisfied.
- [ ] Operation `name`/`value`/`action`/`description` accurate; destructive effects stated.
- [ ] README/CHANGELOG match the code (counts, labels, behaviour).

**Security**
- [ ] The bearer token is never read, logged, echoed or committed.
- [ ] No secret-looking identifier is assigned a literal (lint `no-hardcoded-secrets`).
- [ ] Error output never exposes a token; sensitive fields are not re-emitted as defaults.

**Backward compatibility**
- [ ] No removed/renamed operation, parameter or field without a v2 migration path.
- [ ] v1 workflows still resolve their flat parameters.
- [ ] A changed default does not silently change an existing workflow's request.

---

## 5. MCP-assisted methodology

Pick the one server that owns the task; add a second only when it adds information the
first cannot. **Cross-check; never trust a single source, and never ask another agent
whether "it is correct" instead of inspecting code and docs yourself.**

- **Serena** — repository exploration and architecture: `get_symbols_overview` (outline a
  file), `find_symbol` (locate a definition; `include_body: false`, `depth: 0`),
  `find_referencing_symbols` (every call site before judging a shared symbol),
  `find_implementations` / `find_declaration`, `get_diagnostics_for_file`,
  `search_for_pattern` (strings/config), memories. Use it to enumerate resources and to
  trace a builder from registry → description → dispatch. (Note: in the `ide` context
  `read_file`/`list_dir`/`find_file` are removed — use native read/shell for those.)
- **Exa** (`tools.exa.web_search_exa`, `web_fetch_exa`) — independent technical research,
  API discovery, reading a known page as prose.
- **Firecrawl** (`tools.firecrawl.firecrawl_scrape` / `_map` / `_crawl` / `_search`) —
  extracting official Coolify doc pages, endpoint specs, structured page data.
- **GitHub** — upstream source, history and comparisons. In a session where the local
  `git` namespace is empty, use the native shell `git` for local VCS and the GitHub
  server for the hosted repo. Read upstream via `get_file_contents` at a pinned tag
  (`coollabsio/coolify`): `openapi.yaml`, `routes/api.php`, `app/Http/Controllers/Api/*`.
- **Others** — `context7` for `n8n-workflow` API questions; `fff`/native `rg`/`fd` for
  local content search; `playwright` only for real-browser UI checks.

**Tool availability is session-dependent — discover, do not assume.** Before relying on a
namespace, discover what the session actually exposes from the harness's tool registry
(the Code Mode `ALL_TOOLS` catalog, queried with the global `search()` function, e.g.
`search({ namespace: "github" })`). A namespace that returned no tools in one session
(e.g. the `git` namespace was empty in a recent session; `playwright`/`vercel` were absent
from that catalog) is **not** thereby universally unavailable — re-discover each session
and use the native fallback (shell `git`, `rg`, `fd`) until the namespace appears.
Cross-check findings across at least two independent sources before recording them.

**Order of authority for a verification claim:** upstream spec/source (Exa/Firecrawl/
GitHub, pinned tag) → repo code (Serena/native read) → memory → web snippet. A web
snippet alone is never enough to call something verified.

---

## 6. Step-by-step audit procedure (repeatable)

1. **Identify** the resource and enumerate its intended operations (operation selector,
   registry, README).
2. **Inspect the working tree**: `git status`, `git diff`, recent history (`git log`),
   and whether the resource exists on `master` or only on a branch (§7 D1). A
   verification-only audit makes no changes.
3. **Establish the baseline conventions** (§1; `mem:conventions`).
4. **Research and verify every operation** against the pinned upstream source (§2).
5. **Build an API-contract → code mapping**: one row per operation
   (method, path, qs, body keys, required, retry safety, response) → builder file/symbol.
6. **Trace every operation** through all twelve layers (§3).
7. **Compare** with an equivalent existing resource to surface a *legitimate* difference
   (e.g. cloudToken's plain-string `uuid`) versus a defect.
8. **Audit UI behaviour** and n8n v1/v2 compatibility (§4, n8n v2 group).
9. **Inspect types, edge cases, errors, pagination and security** (§4 groups).
10. **Review tests / coverage**: record the absence of a test suite; do not fabricate one.
11. **Run the gates**: `pnpm run lint`, `pnpm run build`, `pnpm run typecheck`; run
    `pnpm exec prettier --check <changed files>` only for touched files. Report real output.
12. **Review documentation and the final diff** (`git status`, `git diff`).
13. **Produce the findings report** (§8): severity, file paths, evidence, recommended
    correction, and the verification label.

---

## 7. Common defect patterns & regression risks

General rules first; the repo examples are the concrete evidence found while writing this
memory. Treat each example as a *verified instance*, not as the only possible shape.

**D1 — Documentation/memory drift ahead of (or behind) the code.** *General:* docs and
memories can describe a resource that is not in the working tree, or omit one that is.
*Verified instance:* `README.md`, `CHANGELOG.md` (both `Unreleased`) and the Serena
memories `mem:core` ("Six resources … `deployment`"), `mem:coolify_api` and
`mem:task_completion` describe a **`deployment`** resource with a `searchDeployableResources`
picker and a `deploymentDeployOptions` collection. The **working tree has no Deployment
code** (`Coolify.node.ts` spreads five field arrays; there is no
`descriptions/Deployment/`, no `requests/deployment/`; `serena find_symbol
searchDeployableResources` resolves to nothing). The code exists only on the unmerged
branch `feat/deployment-resource` (commit `1ca87db`). *Audit rule:* verify the resource
exists on the branch under audit; when comparing branches, diff `Coolify.node.ts`,
`descriptions/`, `requests/` and `searchFunctions/` explicitly.

**D2 — A new grouped resource must be added to two hardcoded lists.** *General:* the v1/v2
collection machinery uses literal resource sets. *Verified instance:* both
`groupOptionalParameters(properties, resource)` in `descriptions/parameterCollections.ts`
(parameter type `'application' | 'database' | 'cloudInitScript' | 'auditEvent'`) and the
`['application','database','cloudInitScript','auditEvent']` check in
`withOperationCollectionFallback` (`shared/parameterResolution.ts`) omit `cloudToken` and
`deployment`. *Audit rule:* a resource that groups optional fields must appear in **both**;
`cloudToken` is excluded **because all of its fields are required** (it has no collection),
so its omission is by design — distinguish "excluded because it must be" from "forgotten".
The branch playbook's claim that the union includes `deployment` is **not** true of the
working tree (UNRESOLVED vs the branch).

**D3 — Inconsistent identity-parameter naming across resources.** *General:* a resource
that names its id differently breaks the shared `require<Resource>Uuid` convention and
risks parameter collisions. *Verified instance:* `cloudToken` names its id parameter
`uuid` (plain `string`, e.g. `CloudTokenDescription.ts:83`), unlike the
`<resource>Uuid` locator used by `application`/`database`/`cloudInitScript`. New resources
should use `<resource>Uuid`.

**D4 — Collection label lookup is keyed by operation only.** *General:* a global
operation→label map collides across resources because operation names repeat
(`list`, `update`, `getLogs`). *Verified instance:* `COLLECTION_LABELS[operation] ??
'Optional Settings'` (`parameterCollections.ts`, ~line 223) keys by operation alone;
`update` is shared by Application and Database and resolves to one label. Collisions are
currently benign (generic labels) but the key is not resource-scoped.

**D5 — The correct retry safety of a write must be declared, not assumed.** *General:* a
`429` is not proof a write is repeatable. *Verified instance:* reads are `safe` by default
(`defaultRetrySafety`, `SAFE_METHODS = {GET, HEAD, OPTIONS}`); explicit overrides are
`application:stop → 'safe'` (the only `safe` write) and `application:delete` /
`cloudInitScript:delete → 'unsafe'` (defensive). Every other mutation relies on the method
default (`unsafe`). *Audit rule:* a new mutation with no `retrySafety` is `unsafe` by
default — correct; a mutation marked `'safe'` needs a proof that a repeat is harmless.

**D6 — Boolean API-default inversion.** *General:* a boolean whose API default is `true`
must be shown, defaulted and sent so the user can switch it **off**. *Verified instance:*
the `apiDefault?: boolean` field on the Application field spec
(`requests/application/applicationFields.ts`) and the send rule
`value === true || spec.apiDefault === true ? value : undefined`. Verify each new boolean
against the API default; grep `apiDefault` to see which resources implement it.

**D7 — Pagination is endpoint-specific.** *General:* an offset/page paginator is not
interchangeable with a plain array. *Verified instance:* `auditEvent:list` is the only
paginated endpoint (`fetchAuditEvents`, `MAX_AUDIT_EVENT_PAGES = 1_000`, page-per-request
with id dedupe and metadata validation); `database`/`cloudInitScript`/`cloudToken` list
endpoints return raw arrays and take **no** `returnAll`/`limit`. *Audit rule:* never add
pagination to an unpaginated endpoint, and never leave a paginated one unpaginated.

**D8 — Pagination/filter validation lives in the builder.** *General:* the endpoint's own
limits are enforced locally. *Verified instance:* `listAuditEventsRequest` enforces
`MAX_FILTER_LENGTH = 255` on `search`/`action` and omits empty filters. Verify each local
limit against the source (spec/controller) rather than trusting the builder.

**D9 — Pre-existing formatting failures are not yours to fix.** *Verified instance:*
`README.md`, `CHANGELOG.md` and several `*Description.ts` files are CRLF in the working
tree while the index is LF, so `pnpm exec prettier --check .` fails regardless of the
change (`mem:task_completion` lists the files). Scope Prettier to the files the task
touched; new files must be clean; report pre-existing failures, never reformat unrelated
files.

**D10 — "Lint/build green ⇒ done" is not a conclusion.** CI runs only lint + build; there
is no test job. A build proves types, not the contract (§0).

---

## 8. Evidence & reporting standards

Report every finding in this shape (one block per finding):

```
Severity:      blocker | high | medium | low | info
Category:      confirmed defect | potential defect | unverified behaviour | accepted limitation
Resource/op:   <resource>:<operation>  (or "cross-cutting")
Location:      <exact path> — <symbol>  (line where useful)
Evidence:      <what you read/fetched; the source and its version tag>
Expected:      <the authoritative contract, with the source>
Observed:      <what the code does>
Impact:        <runtime effect on a workflow>
Correction:    <minimal recommended change>  (do NOT apply in a verification-only audit)
Verification:  VERIFIED | INFERRED | UNRESOLVED | UNVERIFIED
```

Rules:
- Cite the file and symbol for every code claim and the version tag for every API claim.
- State explicitly what you did **not** verify.
- Distinguish a **confirmed defect** (a source proves the code wrong) from a **potential
  defect** (suspicious, unproven) from **unverified behaviour** (not checked) from an
  **accepted limitation** (a deliberate, documented choice).
- Never assert "no issues" without naming what you inspected and what you ran.
- A check you did not run is reported as **not run** with the reason — never as passed.

---

## 9. Memory maintenance

- Keep this memory **resource-agnostic**. Add a resource-specific fact only as a labelled
  example of a general pattern, never as the rule itself.
- Do **not** duplicate `mem:coolify-resource-implementation-playbook`; reference it and
  keep only the verification angle here.
- Update this memory when the *method* changes (a new gate, a new authoritative source, a
  new cross-cutting defect class), not when a single resource changes.
- When a finding is resolved in code, move the durable lesson here and drop the
  task-specific detail; keep the `mem:`-reference graph intact.
- Verify paths/symbols before recording them; if a symbol does not resolve, record the
  gap rather than the guess. Run `serena memories check` after edits.

Read next: `mem:coolify-resource-implementation-playbook` (how to build a resource),
`mem:coolify_api` (verified Applications/Deployments contract), `mem:conventions`,
`mem:task_completion`, `mem:suggested_commands`, `mem:tech_stack`.
