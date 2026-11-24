# Conventions

- Formatting (prettier, `.prettierrc.js`): tabs, width 2, single quotes, semicolons, trailing commas `all`, `printWidth: 100`, LF endings, `arrowParens: 'always'`.
- Node + credential classes implement `INodeType` / `ICredentialType`; metadata as a class property (`description`), methods on the class.
- Shared transport is split into a thin `apiRequest.ts` (HTTP + n8n runtime integration) and a pure `rateLimit.ts` (no n8n imports) so the policy can be verified in isolation.
- `apiRequest.ts` builds its own error objects (`NodeApiError`, `ExecutionBaseError`) to mimic the n8n runtime error shape, preserving Coolify status code, message and response body.
- Named exports everywhere in `shared/`, `requests/` and `descriptions/`; types use `export type`/`export interface`; constants `UPPER_SNAKE_CASE`; functions camelCase.
- TSDoc-style `/** ... */` on exported functions and non-obvious constants; `{@link Symbol}` cross-references inside the module.
- Magic numbers are named constants; comments explain "why" (e.g. why writes are not retried), not what.
- No test framework is configured: do not add `test/` files expecting vitest.

## Resource and description layout

- One n8n resource per Coolify resource; selector value lowercase camelCase (`auditEvent`), label singular and title cased ("Audit Event").
- `descriptions/<Resource>/` holds `<Resource>Description.ts` (operation selector + one section per operation) plus its field modules; the directory `index.ts` re-exports the public names; `descriptions/index.ts` re-exports `<resource>Fields`.
- The operation selector lists only implemented operations; the request-builder registry of the same resource must list the same set.
- Every field's `displayOptions.show` names both `resource` and `operation`.
- Operation fields are grouped by a `// ---- <resource>:<operation> ----` banner comment.
- `noDataExpression: true` on the resource and operation selectors.
- Describe only fields the published API documents; a field the controller accepts but the OpenAPI does not publish stays out of the editor.

## Node versions 1 and 2

- `version: [1, 2]`; version 2 is the default and version 1 is the legacy layout kept for existing workflows.
- Declare an optional field once, flat and shown for the operations that use it. `groupOptionalParameters(properties, resource)` (`parameterCollections.ts`) then derives the version-2 operation collection `<resource><Operation>Options` (`operationOptionsParameterName`) and re-emits the flat field behind `'@version': [1]`.
- The collection label comes from `COLLECTION_LABELS`; an operation missing there falls back to "Optional Settings".
- Inside a collection, a condition naming a root parameter must be root-relative (`/resource`, `/operation`); sibling field names stay relative; `@version` is never rewritten.
- A required field, a `notice`, a `collection`, or a `resourceLocator` (re-emitted as a string for v1) is not moved into the collection.
- Builders read through `withOperationCollectionFallback` (wired in `execute()`): a collection field resolves from the collection, a root field from the root, and an absent collection field yields the default without resurrecting a legacy root value. `getCollectionParameter` is the explicit form.

## Request builders

- One file per operation: `requests/<resource>/<operation>.ts`, `export async function <verb><Object>Request(this: IExecuteFunctions, itemIndex: number): Promise<CoolifyRequest>`.
- A builder returns `{ method, path, qs?, body?, retrySafety? }`; `path` is relative to the credential base URL (no `/api/v1`).
- A builder never calls the transport and never reads credentials; the node sends the request.
- Builders are registered in `requests/<resource>/index.ts` as `<resource>RequestBuilders`; the registry is added to `resourceRequestBuilders` and `resourceLabels` in `Coolify.node.ts` and exported from `requests/index.ts`.
- Parameters via `this.getNodeParameter(name, itemIndex, default)`; a required identifier the API rejects without → local `NodeOperationError` with `{ itemIndex }`.
- Responses are returned as the API sends them; never reshape, never invent a schema.
- A mutation stays `unsafe` unless the endpoint is provably free of side effects when repeated.

## Field contract and omission rules

- `requests/<resource>/*Fields.ts` declares a body field once: API name, label, editor kind, description, default, options, required, and the API default of a boolean; the description renders it and `buildCreate<Resource>Body` / `buildUpdate<Resource>Body` sends it.
- Sent only when the user set it: text when not empty, list when it has entries, number when it is a number.
- Boolean sent when switched on; a boolean whose API default is `true` is always sent so the user can switch it off (flag `apiDefault`).
- A field of a `collection` parameter is sent only when the user added the item.
- Never send empty strings, empty lists or invented defaults.
- Destructive effects are stated in the operation description and a `notice` field; removal is always an explicit toggle, never a side effect of an empty input.
