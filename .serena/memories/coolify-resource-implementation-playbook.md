# Coolify Resource Implementation Playbook

Implementation guide and architectural reference for adding and maintaining Coolify API resources in `@sinehypernova-0718/n8n-nodes-coolify`.

`mem:core` provides the high-level map; `mem:conventions` specifies code style and invariants; `mem:coolify_api` documents the verified Applications upstream contract.

---

## 1. Complete Execution Architecture

Every operation execution flows through a fixed, single-direction pipeline:

```text
n8n Editor UI
  │ (User selects Resource & Operation dropdowns)
  ▼
Resource Description (`nodes/Coolify/descriptions/<Resource>/<Resource>Description.ts`)
  │ (Evaluates `displayOptions.show` on `resource` and `operation`; renders fields/locators/collections)
  ▼
Parameter Input & Resolution (`nodes/Coolify/shared/parameterResolution.ts`)
  │ (Version 2 nests optional fields in `<resource><Operation>Options`; Version 1 keeps flat parameters)
  ▼
Main Node Execution Dispatcher (`nodes/Coolify/Coolify.node.ts` -> `Coolify.execute()`)
  │ 1. Extracts `resource` and `operation` via `this.getNodeParameter`
  │ 2. Looks up builder in `resourceRequestBuilders[resource][operation]`
  │ 3. Wraps context via `withOperationCollectionFallback(this, nodeProperties)`
  ▼
Request Builder (`nodes/Coolify/requests/<resource>/<operation>.ts`)
  │ 1. Reads & validates parameters via `ctx.getNodeParameter` / `locatorValue` / `getCollectionParameter`
  │ 2. Throws `NodeOperationError(ctx.getNode(), message, { itemIndex })` on invalid inputs
  │ 3. Constructs payload via field contracts (`buildCreate<Resource>Body` / `buildUpdate<Resource>Body`)
  │ 4. Returns `CoolifyRequest` object: `{ method, path, qs?, body?, retrySafety? }`
  ▼
Execution Interceptor (Special Cases in `Coolify.execute()`)
  │ • `auditEvent:list` -> intercepted for pagination via `fetchAuditEvents()`
  │ • All other operations -> proceed directly to transport
  ▼
Shared Authenticated Transport (`nodes/Coolify/shared/apiRequest.ts` -> `coolifyApiRequest()`)
  │ 1. Resolves base URL from `coolifyApi` credential (`credentials/CoolifyApi.credentials.ts`)
  │ 2. Prefixes path to `${baseUrl}/${path}` (stripping duplicate slashes)
  │ 3. Runtime injects `Authorization: Bearer <token>` and `Accept: application/json`
  │ 4. Executes HTTP call via `ctx.helpers.httpRequest` with `returnFullResponse: true`
  │ 5. Evaluates status & headers with retry policy (`nodes/Coolify/shared/rateLimit.ts`)
  │ 6. Automatically retries if `retrySafety === 'safe'` on 429 / 5xx / network errors up to 3 times
  ▼
Coolify API HTTP Server
  │ (Processes request against Laravel controller / database)
  ▼
Response Normalization & Return (`Coolify.execute()`)
  │ 1. Transport returns parsed JSON body (or throws structured `NodeApiError`)
  │ 2. Result normalized: `(Array.isArray(response) ? response : [response]).filter(isDataObject)`
  │ 3. Packaged into `INodeExecutionData[]` via `this.helpers.constructExecutionMetaData()`
  │ 4. Caught errors routed through `this.continueOnFail()` or normalised via `asNodeError()`
```

### Exact Symbols and Files by Stage
- **Credential Definition**: `credentials/CoolifyApi.credentials.ts` -> class `CoolifyApi` (`ICredentialType`).
- **Main Node**: `nodes/Coolify/Coolify.node.ts` -> class `Coolify` (`INodeType`), properties array `nodeProperties`.
- **Search Functions**: `nodes/Coolify/searchFunctions/index.ts` -> `searchApplications`, `searchDatabases`, `searchProjects`, `searchServers`, `searchTags`, `searchCloudInitScripts`, `searchDestinations`, `searchEnvironments`, `getTagNames`.
- **Description Entrypoint**: `nodes/Coolify/descriptions/<Resource>/<Resource>Description.ts` -> exported `<resource>Fields` array (`INodeProperties[]`).
- **Parameter Regrouping**: `nodes/Coolify/descriptions/parameterCollections.ts` -> `groupOptionalParameters()`, `operationOptionsParameterName()`.
- **Parameter Resolution Proxy**: `nodes/Coolify/shared/parameterResolution.ts` -> `withOperationCollectionFallback()`, `getCollectionParameter()`.
- **Request Registry**: `nodes/Coolify/requests/<resource>/index.ts` -> exported `<resource>RequestBuilders` (`Record<string, CoolifyRequestBuilder>`).
- **Request Type**: `nodes/Coolify/requests/types.ts` -> `CoolifyRequest`, `CoolifyRequestBuilder`.
- **Transport**: `nodes/Coolify/shared/apiRequest.ts` -> `coolifyApiRequest()`, `COOLIFY_CREDENTIAL_TYPE`.
- **Rate Limit Policy**: `nodes/Coolify/shared/rateLimit.ts` -> `classifyResponse()`, `computeRetryDelay()`, `MAX_RETRIES`.

---

## 2. File-Level Implementation Pattern

Adding a new resource `<resource>` (e.g. `service`, `privateKey`, `project`) requires a coordinated set of files split cleanly between **UI Descriptions** and **Request Builders**.

### Directory Structure
```text
nodes/Coolify/
├── descriptions/
│   ├── <Resource>/
│   │   ├── <Resource>Description.ts        # Operation selector & field definitions
│   │   ├── <resource>CreateFields.ts       # (Conditional) Creation field UI rendering
│   │   ├── <resource>UpdateFields.ts       # (Conditional) Update field UI rendering
│   │   ├── <resource>FieldProperties.ts    # (Conditional) Field spec to INodeProperties mapper
│   │   └── index.ts                        # Barrel re-exporting `<resource>Fields`
│   ├── index.ts                            # Descriptions barrel
│   └── parameterCollections.ts             # Version 1/2 optional grouping logic
├── requests/
│   ├── <resource>/
│   │   ├── <resource>Fields.ts             # Shared field contract (specs, bodies, validation)
│   │   ├── parameters.ts                   # Parameter extraction & UUID helpers
│   │   ├── <operation>.ts                  # One builder per operation (e.g. get.ts, list.ts)
│   │   └── index.ts                        # Resource registry `<resource>RequestBuilders`
│   ├── index.ts                            # Requests barrel
│   └── types.ts                            # CoolifyRequest & CoolifyRequestBuilder interfaces
└── Coolify.node.ts                         # Registration in nodeProperties & dispatcher
```

### File Responsibilities & Naming Rules
1. **`descriptions/<Resource>/<Resource>Description.ts`**:
   - Declares `const <resource>Properties: INodeProperties[]`.
   - Starts with `Operation` options property (`name: 'operation'`), listing implemented operations with `name`, `value`, `description`, `action`.
   - Sets `default: '<default_op>'` and `noDataExpression: true`.
   - Adds property sections for each operation, grouped with `// ---- <resource>:<operation> ----` banners.
   - Every property MUST have `displayOptions.show` specifying both `resource: ['<resource>']` and `operation: ['<op1>', ...]`.
   - Ends with `export const <resource>Fields = groupOptionalParameters(<resource>Properties, '<resource>');` (or exports directly if no optional fields exist).
2. **`descriptions/<Resource>/index.ts`**:
   - Re-exports `export { <resource>Fields } from './<Resource>Description';`.
   - Also re-exports any shared description constants or helper functions.
3. **`requests/<resource>/parameters.ts`**:
   - Helper `require<Resource>Uuid(ctx: IExecuteFunctions, itemIndex: number, purpose: string): string`.
   - Uses `locatorValue(ctx.getNodeParameter('<resource>Uuid', itemIndex, '')).trim()`.
   - Validates presence; throws `NodeOperationError(ctx.getNode(), '<Resource> UUID is required to ' + purpose, { itemIndex })` if empty.
   - Encodes via `encodePathSegment(uuid)` from `../../shared/pathSegment`.
4. **`requests/<resource>/<resource>Fields.ts`**:
   - Defines `interface <Resource>FieldSpec` and field records.
   - Defines validation functions (e.g. `read<Resource>Name`, string length checks).
   - Exports `buildCreate<Resource>Body` and `buildUpdate<Resource>Body`.
5. **`requests/<resource>/<operation>.ts`**:
   - Implements `export async function <operation><Resource>Request(this: IExecuteFunctions, itemIndex: number): Promise<CoolifyRequest>`.
   - Extracts parameters, formats query (`qs`) and body (`body`), sets `method` and `path`.
   - Explicitly sets `retrySafety: 'safe'` or `'unsafe'` when necessary.
6. **`requests/<resource>/index.ts`**:
   - Imports all operation builders.
   - Exports `export const <resource>RequestBuilders: Record<string, CoolifyRequestBuilder> = { <op>: <builder>, ... };`.
   - Re-exports builders, field contracts, and parameter validation helpers.

---

## 3. UI Description Conventions

### Display Options & Scoping
- Always specify both `resource` and `operation` in `displayOptions.show`:
  ```typescript
  displayOptions: {
    show: {
      resource: ['cloudInitScript'],
      operation: ['delete'],
    },
  }
  ```
- Mutually exclusive parameters for different operations may share the same parameter name (e.g., required `name` on `create` vs optional `name` on `update`), distinguished solely by `operation` array.

### Resource Locators (`resourceLocator`)
- Used for UUID fields referencing other resources (`projectUuid`, `serverUuid`, `destinationUuid`, `applicationUuid`, `databaseUuid`, `cloudInitScriptUuid`):
  ```typescript
  {
    displayName: 'Application UUID',
    name: 'applicationUuid',
    type: 'resourceLocator',
    default: { mode: 'list', value: '' },
    required: true,
    modes: [
      {
        displayName: 'From List',
        name: 'list',
        type: 'list',
        typeOptions: { searchListMethod: 'searchApplications', searchable: true },
      },
      { displayName: 'By UUID', name: 'id', type: 'string' },
    ],
    displayOptions: { show: { resource: ['application'], operation: ['get', 'delete'] } },
    description: 'UUID of the application',
  }
  ```

### Dynamic Dropdown Dependencies & Stale-Option Prevention
- When a locator depends on another parameter (e.g., `destinationUuid` depends on `serverUuid`):
  ```typescript
  typeOptions: {
    loadOptionsDependsOn: ['serverUuid.value'],
  }
  ```
- **Crucial Rule**: The path in `loadOptionsDependsOn` MUST reference the root parameter name (`'serverUuid.value'`), never a collection path (like `'applicationCreateOptions.serverUuid.value'`).
- Inside `searchFunctions/index.ts`, the search function checks `this.getCurrentNodeParameter('operation')`, checks for the value in the options collection if present, and falls back to root:
  ```typescript
  const server = object(options) && options.serverUuid !== undefined
    ? options.serverUuid
    : this.getCurrentNodeParameter('serverUuid');
  const serverUuid = locatorValue(server).trim();
  if (!serverUuid) return { results: [] };
  ```

### Dual-Version Support (v1 vs v2)
- Node declared with `version: [1, 2]`. Version 2 is the default modern layout.
- `groupOptionalParameters(properties, resource)` in `parameterCollections.ts`:
  - Derives an options collection named `operationOptionsParameterName(resource, operation)` (format: `<resource><Operation>Options`, e.g. `applicationCreatePublicOptions`).
  - Emits the collection under `@version: [2]`.
  - Re-emits original flat fields under `@version: [1]` for backward compatibility with existing workflows.
  - Rewrites display conditions inside collections: root parameters (`resource`, `operation`) are converted to root-relative paths (`/resource`, `/operation`), while sibling field references remain relative.
  - Excludes required fields, `resourceLocator` fields, `notice` fields, and nested `collection` parameters from grouping.
  - Resource locators in v1 are automatically rewritten to plain string inputs.
- Collection labels are looked up in `COLLECTION_LABELS` in `parameterCollections.ts`, falling back to `'Optional Settings'`.

### Three-State Boolean Controls (Partial Updates)
- For partial updates (e.g. `database:update`), standard checkboxes cannot distinguish between "set to false" and "leave unchanged".
- Instead, use an options dropdown with `DATABASE_UPDATE_BOOLEAN_OPTIONS`:
  ```typescript
  export const DATABASE_UPDATE_UNCHANGED = 'unchanged';
  export const DATABASE_UPDATE_BOOLEAN_OPTIONS = [
    { name: 'Unchanged', value: DATABASE_UPDATE_UNCHANGED },
    { name: 'Enabled', value: 'true' },
    { name: 'Disabled', value: 'false' },
  ];
  ```
- Request builder checks:
  ```typescript
  if (value === 'true') body[field] = true;
  else if (value === 'false') body[field] = false;
  // 'unchanged' is omitted from payload
  ```

---

## 4. Request Builder Conventions

### Function Signature
Every request builder must conform to `CoolifyRequestBuilder`:
```typescript
import type { IExecuteFunctions } from 'n8n-workflow';
import type { CoolifyRequest } from '../types';

export async function <operation><Resource>Request(
  this: IExecuteFunctions,
  itemIndex: number,
): Promise<CoolifyRequest> { ... }
```

### Path & URL Construction
- `path` is relative to credential base URL (`host`). Never include `/api/v1` or leading slashes.
- UUIDs and string identifiers interpolated into paths MUST be sanitized with `encodePathSegment(uuid)`:
  ```typescript
  path: `applications/${applicationUuid}/start`
  ```

### Parameter Retrieval
- With collection fallback active, use:
  ```typescript
  const value = this.getNodeParameter('fieldName', itemIndex, defaultValue);
  ```
- If extracting a resource locator:
  ```typescript
  const raw = this.getNodeParameter('serverUuid', itemIndex, '');
  const serverUuid = locatorValue(raw).trim();
  ```
- If extracting directly from a collection without proxy:
  ```typescript
  const flag = getCollectionParameter(this, itemIndex, 'collectionName', 'flag', 'flag', true);
  ```

### Payload & Query Omission Invariants
- **Never send empty strings**: `TrimStrings` on Coolify converts `""` to `null`, causing 422 errors on non-nullable fields.
- **Never send empty lists or dummy defaults**.
- **Booleans**:
  - If API default is `false`: send only when user enables it (`=== true`).
  - If API default is `true`: send explicitly (`=== true` or `false`) so user has power to disable it.
  - If partial update: send only when set to `'true'` or `'false'`, omit if `'unchanged'`.
- **Numbers**: validate bounds (e.g. `limit >= 1`, port `1..65535`).

### Retry Safety Rules
- Set `retrySafety: 'safe'` only if repeating the request is completely idempotent and free of side effects (e.g. `stop` operation on an already stopped app).
- Set `retrySafety: 'unsafe'` for all deletions, deployments, queue runs, and creations.
- By default, GET is `safe`, all mutations (POST, PATCH, PUT, DELETE) default to `unsafe`.

---

## 5. Shared Infrastructure & Transport

### Credentials (`credentials/CoolifyApi.credentials.ts`)
- Credential name: `coolifyApi`.
- Fields: `host` (Base URL, default `https://app.coolify.io/api/v1`) and `accessToken` (password).
- Verification test: `GET /team`. Maps response codes:
  - 400: Malformed URL or incomplete token.
  - 401: Token missing, invalid, expired, or revoked.
  - 403: Token lacks `read` permission, instance API disabled, or IP not allowlisted.
  - 404: Base URL missing `/api/v1` or Coolify < 4.3.0.

### Transport (`nodes/Coolify/shared/apiRequest.ts`)
- Function: `coolifyApiRequest(ctx, method, path, options)`.
- Enforces `REQUEST_TIMEOUT_MS = 30_000`.
- Sets `returnFullResponse: true` and `ignoreHttpStatusErrors: true` to inspect rate-limit headers.
- URL construction: strips trailing slashes from credential host and leading slashes from path.

### Rate Limiting & Backoff (`nodes/Coolify/shared/rateLimit.ts`)
- Never hardcodes rate limit values; uses response headers (`Retry-After`, `X-RateLimit-Reset`).
- Backoff parameters: `MAX_RETRIES = 3`, `BASE_BACKOFF_MS = 500`, `MAX_BACKOFF_MS = 30_000`, `JITTER_MS = 500`, `MAX_RETRY_AFTER_MS = 60_000`.
- Classifies failures into `safe-rate-limit`, `unsafe-rate-limit`, `safe-transient`, `unsafe-transient`, `terminal`.

### Error Propagation (`asNodeError` in `Coolify.node.ts`)
- `NodeApiError` and `NodeOperationError` pass through directly to retain upstream status code, message, and response body in the n8n UI.
- All other generic errors are wrapped in `NodeOperationError(node, error, { itemIndex })`.

---

## 6. Observed Architectural Variations & Edge Cases

When implementing new resources, be aware of existing patterns and historical deviations:

| Resource | Locators Used? | UUID Parameter Name | Grouped via `groupOptionalParameters`? | Has Dedicated Search Functions? | Special Execution Logic? |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Application** | Yes (`resourceLocator`) | `applicationUuid` | Yes | Yes (`searchApplications`) | None |
| **Database** | Yes (`resourceLocator`) | `databaseUuid` | Yes | Yes (`searchDatabases`) | Three-state update options |
| **Cloud Init Script** | Yes (`resourceLocator`) | `cloudInitScriptUuid`| Yes | Yes (`searchCloudInitScripts`) | None |
| **Cloud Token** | No (plain `string`) | `uuid` *(Deviation)* | **No** *(All fields required)* | No | Permission 403 doc warnings |
| **Audit Event** | N/A (list only) | N/A | Yes | No | **Custom pagination in `execute()`** |
| **Deployment** | Yes (`resourceLocator`) | `deploymentUuid` / `resourceUuid` / `applicationUuid` | Yes | Yes (`searchDeployableResources`, `searchTags`, `searchApplications`) | None |

### Key Deviations & Pitfalls to Note:
1. **`CloudToken` parameter naming**: `cloudToken` uses parameter name `uuid` instead of `cloudTokenUuid`. For all new resources, prefer `<resource>Uuid` to prevent parameter name collisions across resources.
2. **Exclusion from `groupOptionalParameters`**: `cloudToken` is not processed by `groupOptionalParameters` because all its operations take only required fields. If a resource has no optional parameters, it can export its property array directly.
3. **Union Types in `parameterCollections.ts` and `parameterResolution.ts`**:
   - `groupOptionalParameters` has a strict resource parameter type:
     `resource: 'application' | 'database' | 'cloudInitScript' | 'auditEvent' | 'deployment'`
   - `withOperationCollectionFallback` contains a hardcoded list:
     `if (!['application', 'database', 'cloudInitScript', 'auditEvent', 'deployment'].includes(resource))`
   - **Crucial**: Whenever adding a new resource that uses optional parameter collections, its resource key MUST be added to both of these files!
4. **Pagination**: Coolify's API is largely unpaginated (returns raw arrays). `auditEvent` is the sole endpoint supporting page/per_page. If an endpoint is unpaginated, do not add `returnAll` or pagination loops.
5. **Merged resource locator search (`deployment`)**: `searchDeployableResources` merges the `applications`, `services` and `databases` list endpoints into one locator and prefixes each name with the resource kind (`Application: …`), because the UUID alone does not say which resource it addresses. The two target locators of `deployment:deploy` (`resourceUuid`, `tag`) are `resourceLocator` fields, so `groupOptionalParameters` keeps them at the node root in v2 while `force` / `pullRequestId` / `dockerTag` are grouped into `deploymentDeployOptions`.
6. **Prettier / line-ending pitfall**: several files (`README.md`, `CHANGELOG.md`, `CloudInitScriptDescription.ts`, `CloudTokenDescription.ts`, `DatabaseDescription.ts`) are **CRLF in the working tree while the index is LF**, and the tables of the Markdown files are hand-padded wider than Prettier would render them. A repo-wide `pnpm exec prettier --check .` therefore fails for reasons that pre-date any change. Scope the Prettier check to the files the task actually touched (new files must be Prettier-clean) and report the pre-existing failures instead of reformatting unrelated files.

---

## 7. Step-by-Step New Resource Implementation Checklist

Follow this checklist strictly when introducing a new resource:

### Phase 1: API Contract Inspection
- [ ] Inspect official OpenAPI / upstream controller for endpoints, allowed fields, required flags, and HTTP status codes.
- [ ] Determine required vs optional fields. Note whether partial updates allow clearing fields or reject empty strings.
- [ ] Determine retry safety for mutations (almost always `unsafe` unless idempotency is verified).

### Phase 2: Request Builders (`nodes/Coolify/requests/<resource>/`)
- [ ] Create `requests/<resource>/parameters.ts`: implement `require<Resource>Uuid()` using `locatorValue` and `encodePathSegment`.
- [ ] Create `requests/<resource>/<resource>Fields.ts`: declare field specs, UI name mappings, and body builders (`buildCreate<Resource>Body`, `buildUpdate<Resource>Body`).
- [ ] Create individual operation files: `<operation>.ts` returning `CoolifyRequest`.
- [ ] Create `requests/<resource>/index.ts`: export `<resource>RequestBuilders` map and all public symbols.
- [ ] Export `<resource>RequestBuilders` in `nodes/Coolify/requests/index.ts`.

### Phase 3: UI Descriptions (`nodes/Coolify/descriptions/<Resource>/`)
- [ ] Create `descriptions/<Resource>/<Resource>Description.ts`:
  - Define operation selector with `noDataExpression: true`.
  - Define operation properties with `displayOptions.show: { resource: ['<resource>'], operation: [...] }`.
  - Use `type: 'resourceLocator'` for relational UUIDs.
  - If optional fields exist: wrap with `groupOptionalParameters(<resource>Properties, '<resource>')`.
- [ ] If grouped with `groupOptionalParameters`:
  - Update `nodes/Coolify/descriptions/parameterCollections.ts` to add the resource name to the function signature and add collection labels in `COLLECTION_LABELS`.
  - Update `nodes/Coolify/shared/parameterResolution.ts` to include the resource name in `withOperationCollectionFallback()`.
- [ ] Create `descriptions/<Resource>/index.ts` re-exporting `<resource>Fields`.
- [ ] Export `<resource>Fields` in `nodes/Coolify/descriptions/index.ts`.

### Phase 4: Search & Locator Support (`nodes/Coolify/searchFunctions/`)
- [ ] If resource has a list endpoint and can be referenced by other resources: add `search<Resource>s` in `nodes/Coolify/searchFunctions/index.ts`.
- [ ] Wire the search function into `methods.listSearch` in `nodes/Coolify/Coolify.node.ts`.

### Phase 5: Node Registration (`nodes/Coolify/Coolify.node.ts`)
- [ ] Add option entry to `resource` parameter in `nodeProperties` (`name: '<Resource>', value: '<resource>'`).
- [ ] Spread `...<resource>Fields` into `nodeProperties`.
- [ ] Register `<resource>RequestBuilders` in `resourceRequestBuilders` map.
- [ ] Register display label in `resourceLabels` map.
- [ ] Update node description subtitle or overview comments if needed.

### Phase 6: Verification Gates
- [ ] Run type check: `pnpm exec tsc --noEmit`.
- [ ] Run linter: `pnpm run lint`.
- [ ] Run build: `pnpm run build`.
- [ ] Inspect generated `dist/` bundle to ensure all files and declarations compile cleanly.
