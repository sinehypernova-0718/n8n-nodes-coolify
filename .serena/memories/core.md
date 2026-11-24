# n8n-nodes-coolify — top-level map

n8n community node package for the Coolify API v1. Package: `@sinehypernova-0718/n8n-nodes-coolify`.

## Resources
Six resources; the parameter value is lowercase camelCase (except `application`), the label is singular and title cased: `application` (Application), `auditEvent` (Audit Event), `cloudInitScript` (Cloud Init Script), `cloudToken` (Cloud Token), `database` (Database), `deployment` (Deployment).

## Layout
- `nodes/Coolify/Coolify.node.ts` — class `Coolify`. `nodeProperties` = resource selector + the six `...<resource>Fields` arrays. `resourceRequestBuilders` maps each resource value to its own registry, `resourceLabels` holds the labels, `asNodeError` normalises a caught error, `fetchAuditEvents` paginates audit events. `execute()` resolves `resource`/`operation`, wraps the context in `withOperationCollectionFallback`, calls the builder and sends the resulting `CoolifyRequest` through the transport. `methods` wires `listSearch` and `loadOptions`.
- `nodes/Coolify/descriptions/<Resource>/<Resource>Description.ts` — operation selector + one field section per operation; ends with `export const <resource>Fields = groupOptionalParameters(<resource>Properties, '<resource>')`. Sibling modules hold the field sets (`applicationCreateFields.ts`, `applicationUpdateFields.ts`, `applicationFieldProperties.ts`, `storageBackupScheduleFields.ts`, `databaseCreateFields.ts`, ...); the directory `index.ts` re-exports them, `descriptions/index.ts` is the barrel.
- `nodes/Coolify/descriptions/parameterCollections.ts` — the version 1/2 rewriting of optional fields (see `mem:conventions`). `cloudToken` is not passed through it.
- `nodes/Coolify/requests/<resource>/<operation>.ts` — one builder per operation; `index.ts` exports `<resource>RequestBuilders`; `requests/index.ts` is the barrel; `requests/types.ts` = `CoolifyRequest` / `CoolifyRequestBuilder`.
- `nodes/Coolify/requests/<resource>/*Fields.ts` — the field contract of the resource (field specs + `buildCreate<Resource>Body` / `buildUpdate<Resource>Body`), consumed by both the description and the builder.
- `nodes/Coolify/shared/` — `apiRequest.ts` (the single transport), `rateLimit.ts` (retry policy, no n8n imports), `parameterResolution.ts` (`operationOptionsParameterName`, `getCollectionParameter`, `withOperationCollectionFallback`), `pathSegment.ts`, `locatorValue.ts`.
- `nodes/Coolify/searchFunctions/index.ts` — `listSearch` (`searchApplications`, `searchDatabases`, `searchProjects`, `searchServers`, `searchTags`, `searchCloudInitScripts`, `searchDeployableResources`, `searchDestinations`, `searchEnvironments`) and `loadOptions` (`getEnvironments`, `getTagNames`); all go through `coolifyApiRequest`.

## Invariants
- Every API call goes through `coolifyApiRequest(ctx, method, path, options)`; a builder only describes a request and never reads credentials or calls `httpRequest`.
- Dispatch is per resource (`resourceRequestBuilders[resource][operation]`): an operation value of one resource can never reach another resource's builder.
- Descriptions hold `INodeProperties` only, builders hold request construction only, the transport stays in `shared/`.
- A body field is declared once in the field contract and used by both the description and the builder.
- The node has type versions 1 and 2. Version 2 moves optional fields into the per-operation collection `<resource><Operation>Options`; version 1 keeps the flat root parameters. Builders read with `this.getNodeParameter` and get the right source either way.
- The bearer token never leaves the n8n runtime; the rate limit is never hardcoded; only safe-to-repeat requests are retried.
- `auditEvent`/`list` is the only operation `execute()` special-cases, because it paginates (`fetchAuditEvents`: 100 per page, default 50, at most 1000 pages).

## Verification
- No test suite and no `test` script; `test/` is an empty leftover directory. Gates: `pnpm run lint`, `pnpm run build`, `pnpm exec tsc --noEmit`.

Read next: `mem:conventions` (code and description patterns), `mem:tech_stack` (tooling), `mem:suggested_commands` (commands), `mem:coolify_api` (verified Applications and Deployments contracts), `mem:coolify-resource-implementation-playbook` (generic pipeline and new-resource checklist), `mem:task_completion` (done criteria).
