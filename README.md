<p align="center">
  <img src="n8n-logo-white-accent.svg" width="200" alt="n8n" />
</p>

<h1 align="center">n8n-nodes-coolify</h1>

<p align="center">
  A community-built <a href="https://coolify.io/">Coolify</a> integration for <a href="https://n8n.io/">n8n</a>.
</p>

<p align="center">
  <i>Automate Coolify workflows, from application management to preview deployments.</i>
</p>

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

**@sinehypernova-0718/n8n-nodes-coolify** brings Coolify API operations into n8n workflows, letting you work with Coolify resources through the workflow editor instead of manually constructing API requests.

## ✨ Features

- **Coolify API v1 integration** — interact with the Coolify REST API directly from n8n workflows.
- **API token authentication** — authorize API requests with a Coolify API token sent as a bearer token.
- **Native n8n interface** — select resources, operations, and parameters through the workflow editor.
- **Application management** — 42 operations on the `Application` resource, including creation, lifecycle, environment variables, storages, backups, destinations, and tags.
- **Audit events** — list the team audit events on the `Audit Event` resource, paginated and filterable.
- **Cloud init scripts** — create, read, update, and delete the reusable cloud init scripts of the team on the `Cloud Init Script` resource.
- **Preview deployments** — open, list, inspect, and delete preview deployments for pull requests.
- **Rate-limit aware transport** — one shared transport that honours the server's rate-limit headers and retries only requests that are safe to repeat.

## 📁 Repository Structure

```text
n8n-nodes-coolify/
├── credentials/
│   └── CoolifyApi.credentials.ts
├── nodes/
│   └── Coolify/
│       ├── descriptions/
│       │   ├── ApplicationDescription.ts
│       │   ├── applicationCreateFields.ts
│       │   ├── applicationFieldProperties.ts
│       │   ├── applicationUpdateFields.ts
│       │   └── index.ts
│       ├── requests/
│       │   ├── application/
│       │   │   ├── <operation>.ts
│       │   │   └── index.ts
│       │   ├── types.ts
│       │   └── index.ts
│       ├── shared/
│       │   ├── apiRequest.ts
│       │   └── rateLimit.ts
│       └── Coolify.node.ts
├── test/
│   ├── apiRequest.test.ts
│   ├── applicationDescription.test.ts
│   ├── applicationRequests.test.ts
│   └── rateLimit.test.ts
├── icons/
│   └── coolify.svg
├── package.json
├── README.md
└── LICENSE.md
```

### Architecture

- **`credentials/`** — defines the Coolify API credential used to authenticate requests.
- **`descriptions/`** — contains the resource and operation definitions displayed in the n8n editor. Its `index.ts` explicitly exports the descriptions consumed by the main node.
- **`requests/application/`** — contains the request builders for the Coolify `Application` operations.
- **`requests/<resource>/<operation>.ts`** — keeps individual API request builders in separate operation-specific modules, such as `list.ts`, `get.ts`, `createPublic.ts`, and `update.ts`.
- **Resource `index.ts` files** — explicitly export the request builders belonging to each resource.
- **`requests/index.ts`** — re-exports the resource-level barrels, providing a single import entry point for request modules.
- **`shared/apiRequest.ts`** — the single authenticated transport. It shapes the request, attaches the bearer token, applies the retry policy, and converts failures into n8n errors.
- **`shared/rateLimit.ts`** — the rate-limit and retry policy, kept free of `n8n-workflow` imports so it can be unit-tested in isolation.
- **`Coolify.node.ts`** — defines the n8n node and coordinates operation execution, authenticated HTTP requests, retries, and error handling.

The architecture separates editor-facing configuration from API request construction and execution. Resource descriptions define the available operations and parameters, while request modules build operation-specific requests. The main node remains responsible for invoking authenticated HTTP requests through n8n's credential-aware helpers and handling execution results.

Explicit exports keep imports predictable and avoid unnecessary wildcard exports. The resource-specific modules remain independent, while the barrel files provide convenient entry points without introducing another execution layer.

Additional resources can follow the same structure, with their own descriptions and operation-specific request modules. This allows the integration to expand without requiring a redesign of the existing architecture.

## 📦 Installation

Install the package through your n8n instance using the community node installation interface.

1. Open your n8n instance.
2. Navigate to **Settings → Community Nodes**.
3. Select **Install**.
4. Enter the package name `@sinehypernova-0718/n8n-nodes-coolify`.
5. Review and accept the installation confirmation.
6. Once installation completes, open a workflow and search for the Coolify node.

For detailed instructions, see the [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

> **Note:** The package name entered during installation must match the name under which this project is published to npm (`@sinehypernova-0718/n8n-nodes-coolify`). Community node installation availability also depends on your n8n deployment configuration and administrator policies.

## ⚙️ Operations

The Coolify node exposes the supported Coolify API operations through n8n's resource and operation selectors. The available operations and parameters depend on the installed package version.

### Application

The node exposes three resources — **Application**, with 42 operations, **Audit Event**, with the List operation, and **Cloud Init Script**, with 5 operations. The other Coolify resources (services, databases, servers, projects, deployments) are not exposed yet.

Every operation is sent through the shared transport, so the rate limit and retry policy described below applies to all of them: reads are retried when the server reports a transient failure, writes are never repeated automatically.

#### Reading applications

| Operation              | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| `List`                 | List the applications of the team, optionally filtered by a tag |
| `Get`                  | Get a single application by UUID                                |
| `List Tags`            | List the tags of an application                                 |
| `List Rollback Images` | List the images an application can be rolled back to            |

#### Environment variables

| Operation            | Description                                                    |
| -------------------- | -------------------------------------------------------------- |
| `List Envs`          | List the environment variables of an application               |
| `Create Env`         | Create an environment variable on an application               |
| `Update Env`         | Update an environment variable of an application               |
| `Update Envs (Bulk)` | Update several environment variables of an application at once |
| `Delete Env`         | Delete an environment variable of an application               |

> **Note:** `Update Env` and `Update Envs (Bulk)` send the flags `is_preview`, `is_literal`, `is_multiline` and `is_shown_once` with the values the API applies by default, so a flag that is not part of the request is reset. Send every flag that the variable should keep.

#### Storages

| Operation        | Description                         |
| ---------------- | ----------------------------------- |
| `List Storages`  | List the storages of an application |
| `Create Storage` | Create a storage for an application |
| `Update Storage` | Update a storage of an application  |
| `Delete Storage` | Delete a storage of an application  |

#### Backups

| Operation                        | Description                                                                                      |
| -------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Set Storage Backup Schedule`    | Create or replace the backup schedule of a storage                                               |
| `Run Storage Backup`             | Queue an immediate backup of a storage                                                           |
| `Delete Storage Backup Schedule` | Delete the backup schedule of a storage, together with its existing local and S3 backup archives |

> **Note:** `Delete Storage Backup Schedule` removes the backup archives that already exist with the schedule, locally as well as in S3.

#### Destinations

| Operation            | Description                                        |
| -------------------- | -------------------------------------------------- |
| `List Destinations`  | List the destinations of an application            |
| `Add Destination`    | Attach an additional destination to an application |
| `Remove Destination` | Detach a destination from an application           |

#### Preview deployments

| Operation                   | Description                                                                                     |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `Create Preview Deployment` | Open a preview deployment for a pull request and queue its deployment                           |
| `List Preview Deployments`  | List the preview deployments of an application                                                  |
| `Get Preview Deployment`    | Get a preview deployment by pull request ID                                                     |
| `Update Preview Domains`    | Replace the domains of a preview deployment                                                     |
| `Delete Preview Deployment` | Delete a preview deployment, cancel its running deployments and remove its volumes and networks |

> **Note:** the preview operations need Coolify 4.4.0 or newer. `Update Preview Domains` replaces the domains instead of merging them: a domain that is not part of the request is removed, and a Docker Compose service that is not listed loses its domain. Removing every domain is a separate, explicit switch.

#### Logs

| Operation                      | Description                                    |
| ------------------------------ | ---------------------------------------------- |
| `Get Application Logs`         | Get the container logs of an application       |
| `Get Preview Application Logs` | Get the container logs of a preview deployment |

> **Note:** both log operations need a token with the `read:sensitive` or the `root` ability, and `Get Preview Application Logs` needs Coolify 4.4.0 or newer.

#### Tags

| Operation    | Description                      |
| ------------ | -------------------------------- |
| `Create Tag` | Add a tag to an application      |
| `Delete Tag` | Remove a tag from an application |

#### Creating applications

| Operation                           | Description                                                          |
| ----------------------------------- | -------------------------------------------------------------------- |
| `Create (Public)`                   | Create an application from a public Git repository                   |
| `Create (Private - GH App)`         | Create an application from a private repository through a GitHub App |
| `Create (Private - Deploy Key)`     | Create an application from a private repository through a deploy key |
| `Create (Dockerfile Without Git)`   | Create an application from a Dockerfile                              |
| `Create (Docker Image Without Git)` | Create an application from a prebuilt Docker image                   |

> **Note:** the creation operations can queue a deployment right away. That needs a token with the `deploy` ability, and the server needs a destination it can host the application on.

#### Lifecycle

| Operation  | Description                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------ |
| `Start`    | Start an application by UUID                                                                           |
| `Stop`     | Stop an application by UUID                                                                            |
| `Restart`  | Restart an application by UUID                                                                         |
| `Update`   | Update the settings of an application, only the settings that are filled in are changed                |
| `Clone`    | Clone an application to another destination of the team                                                |
| `Migrate`  | Migrate an application to another destination, the application is stopped and has to be deployed again |
| `Move`     | Move an application to another environment, the running containers are not affected                    |
| `Rollback` | Queue a rollback deployment of an application to a previous image                                      |
| `Delete`   | Delete an application by UUID                                                                          |

> **Note:** `Migrate` is only available on a development instance of Coolify, the API answers HTTP 404 on a production instance. `Rollback` needs a token with the `deploy` ability. `Delete` removes the configuration and the volumes of the application as well, the switches of the operation control that.

### Audit Event

#### Reading audit events

| Operation | Description                                                                              |
| --------- | ---------------------------------------------------------------------------------------- |
| `List`    | List one page of the audit events of the team, newest first, with pagination and filters |

> **Note:** the response is one page in the pagination format of Coolify, not a flat list. Only team admins and owners can view audit events, a token without that access is expected to receive HTTP 403. Actor e-mail, token, metadata, changes, IP address and user agent are returned only for tokens with the `read:sensitive` or the `root` ability.

### Cloud Init Script

#### Managing cloud init scripts

| Operation | Description                                                                        |
| --------- | ---------------------------------------------------------------------------------- |
| `List`    | List the cloud init scripts of the team, newest first                              |
| `Get`     | Get a cloud init script by UUID                                                    |
| `Create`  | Create a cloud init script with a name and its content                             |
| `Update`  | Update a cloud init script by UUID, only the fields that are filled in are changed |
| `Delete`  | Delete a cloud init script by UUID, the deletion is permanent                      |

> **Note:** the list endpoint is not paginated, it returns every script of the team. Only team admins and owners can use the resource, a token without that access is expected to receive HTTP 403. The content of a script is returned only for a token with the `read:sensitive` or the `root` ability that also satisfies the team authorization policy of Coolify, in practice the caller has to be an admin or owner of the team; a token ability on its own does not make the content visible. `Update` changes only the fields that are filled in, an emptied field keeps the value the script has, the API has no way to clear a field and rejects a blank value with HTTP 422. The API stores the content of a script without its leading and trailing whitespace. `Delete` removes the script permanently.

Operation parameters, filters, and available fields vary by endpoint. Refer to the operation descriptions in the n8n editor and the [Coolify API documentation](https://coolify.io/docs/api/overview) for endpoint-specific requirements.

This list describes the resources currently implemented in the integration. Additional resources and operations can be introduced in future releases.

## ⏱️ Rate limits and retries

All Coolify API calls go through one shared transport (`nodes/Coolify/shared/apiRequest.ts`) that applies the retry policy of `nodes/Coolify/shared/rateLimit.ts`. The policy follows the [Coolify rate-limit documentation](https://coolify.io/docs/api/rate-limits).

- **The limit is never hardcoded.** The documented default is 200 requests per minute, but a self-hosted instance can change it with the `API_RATE_LIMIT` environment variable, so the server's response headers are the only source of truth.
- **Only requests that are safe to repeat are retried.** Reads (`GET`, `HEAD`, `OPTIONS`) are retried on `408`, `429`, transient `5xx` responses and transport failures. Writes are never retried automatically: a `429` alone is no proof that a write can be repeated, because Coolify also answers `429` when a deployment queue or an upstream provider is busy. A write is only retried when the operation explicitly declares that a repeat is harmless.
- **The wait comes from the server.** `Retry-After` (seconds) is honoured exactly, `X-RateLimit-Reset` (unix timestamp) is the fallback, and an exponential backoff with random jitter is used when the response carries neither. A server-mandated wait longer than the internal maximum wait of 60 seconds fails the request instead of retrying early.
- **At most three retries** per request, and never in parallel.
- Permanent failures (`400`, `401`, `403`, `404`, `409`, `422`) are surfaced immediately, with the Coolify message, the status code and the response body preserved.

The retry limits and timeouts are internal constants. There are no node-level options for them.

## 🔐 Credentials

The Coolify node authenticates against the Coolify REST API with an API token, sent as a `Bearer` token in the `Authorization` header.

### Prerequisites

Before configuring the credential, you need:

- A Coolify instance — either [Coolify Cloud](https://coolify.io/pricing) or your own self-hosted installation (version 4.3.0 or newer, see the Compatibility section).
- An API token created in Coolify under **Keys & Tokens → API Tokens**, scoped to the team you want to work with. The token carries the permissions selected at creation time (`read`, `write`, `root`), so create the least privileged token that covers your workflow. The token needs the **`read`** permission — a deploy-only token cannot be tested, because the credential test reads the team bound to the token.
- On self-hosted instances, API access must be enabled by an administrator, and the caller must match the IP allowlist when one is configured.

### Configure the credential

Create a Coolify API credential in n8n and supply the values required by the credential configuration.

| Setting      | Value                                                                                                                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base URL     | Base URL of the Coolify API, including the `/api/v1` path. Use `https://app.coolify.io/api/v1` for Coolify Cloud, or the URL of your own instance (for example `https://coolify.example.com/api/v1`). A trailing slash is tolerated; the `/api/v1` suffix is required. |
| Access Token | The API token created in Coolify. It is sent as `Authorization: Bearer <token>`.                                                                                                                                                                                       |

The credential test calls `GET /team` against the configured base URL — the endpoint that returns the team bound to the token — so it verifies the token against the same instance your workflows will use. The test is read-only, and it reports whether a failure was caused by the token (401), by permissions, API access or the IP allowlist (403), or by a base URL that does not point at the API (404).

### Permissions and access

The configured token covers the read and write permissions used by the current implementation. Individual operations may still require a specific ability, team access, or an additional API permission.

Deployment, rollback, and preview deployment operations need a token with the `deploy` ability, and the log operations need the `read:sensitive` or the `root` ability.

Keep your token private. Never commit credentials to the repository or include tokens in issue reports, screenshots, or logs.

## 🧩 Compatibility

This package is designed for n8n's community node ecosystem and uses the n8n node API.

- **Integration type:** n8n community node.
- **Implementation language:** TypeScript.
- **API:** Coolify API v1.
- **Coolify version:** 4.3.0 or newer for the `Application` resource. The credential test uses `GET /team`, the canonical endpoint for "the team bound to the token" in the [Coolify OpenAPI specification](https://github.com/coollabsio/coolify/blob/main/openapi.yaml). Coolify 4.0.x–4.2.x only expose the older `/teams/current` alias of the same endpoint, so the credential test reports HTTP 404 on those instances. The preview deployment operations and `Get Preview Application Logs` need Coolify 4.4.0 or newer.
- **Authentication:** Coolify API token (Bearer), with the `read` permission.
- **Package distribution:** npm — end users install the published package with the n8n community nodes interface, and npm remains the registry the package is published to.
- **Development package manager:** pnpm — the repository is developed, built, and published with pnpm, pinned through the `packageManager` field in `package.json` and `pnpm-lock.yaml`.

The package declares its n8n node metadata and entry points in `package.json`. Compatibility depends on the n8n version, the available `n8n-workflow` APIs, and the package's dependencies.

The `0.1.x` releases are pre-1.0 releases. Operation coverage and compatibility may evolve as the integration develops.

## 🚀 Usage

After installing the node and configuring the API credential, you can incorporate Coolify API operations into your n8n workflows.

### Basic workflow setup

1. Create a workflow in n8n.
2. Add the Coolify node.
3. Select your Coolify API credential.
4. Choose the resource you want to work with, such as **Application**.
5. Select the required operation.
6. Configure its parameters, identifiers, and other required fields.
7. Connect the node to the other nodes in your workflow.
8. Execute the workflow and inspect the returned data.

### Troubleshooting

If an operation fails:

- Verify that the Coolify credential is configured with the right base URL and a valid token.
- Confirm that the token has the permission the operation needs (`read`, `write`, `deploy`, `read:sensitive`, or `root`).
- Check that the supplied application UUIDs exist and are accessible to the team bound to the token.
- On self-hosted instances, verify that API access is enabled and that the caller matches the IP allowlist.
- Verify required fields and supported parameter values.
- Review the error returned by n8n and consult the relevant Coolify API documentation.

For general workflow guidance, see the [n8n Try it out documentation](https://docs.n8n.io/try-it-out/).

## 🛠️ Development

### Requirements

- **[Node.js](https://nodejs.org/)** (v22 or higher) and **pnpm**
  - Linux/Mac/WSL: Install via [nvm](https://github.com/nvm-sh/nvm)
  - Windows: Follow [Microsoft's NodeJS guide](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows)
- **[git](https://git-scm.com/downloads)**
- **[Corepack](https://nodejs.org/api/corepack.html)** (optional) — pnpm 12.4.2 is pinned in `package.json` via the `packageManager` field

```bash
corepack enable   # optional, if you do not have pnpm installed globally
pnpm install
```

> [!NOTE]
> The `@n8n/node-cli` is included as a dev dependency and is installed automatically when you run `pnpm install`. The CLI includes n8n for local development, so you do not need to install n8n globally.

### Available scripts

| Script                   | Description                                                                                                                             |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run dev`           | Start n8n with your node and watch for changes (runs `n8n-node dev`)                                                                    |
| `pnpm run build`         | Compile TypeScript to JavaScript for production (runs `n8n-node build`)                                                                 |
| `pnpm run build:watch`   | Build in watch mode (auto-rebuild on changes)                                                                                           |
| `pnpm run lint`          | Check your code for errors and style issues (runs `n8n-node lint`)                                                                      |
| `pnpm run test`          | Run the unit tests (runs `vitest run`)                                                                                                  |
| `pnpm run test:watch`    | Run the unit tests in watch mode (runs `vitest`)                                                                                        |
| `pnpm run lint:fix`      | Automatically fix linting issues when possible (runs `n8n-node lint --fix`)                                                             |
| `pnpm run release:local` | Create a release locally: bump the version, update the changelog, commit, tag (`vX.Y.Z`), and push — this triggers the publish workflow |
| `pnpm run release`       | The publish entry point used by the GitHub Actions publish workflow: lints, builds, and publishes to npm with provenance                |

> **Note:** `pnpm run release` is what CI runs. Locally, use `pnpm run release:local` to create the tag, because `@n8n/node-cli` pins release-it's branch check to `main` while this repository develops on `master`. The repository configuration in `.release-it.json` handles the `master` branch, the `vX.Y.Z` tag format, and the changelog generation.

### Release process

Releases are published by GitHub Actions, never from a local machine, so that every published version carries an npm provenance attestation (required by n8n for verified community nodes).

1. Make sure `master` is up to date and the working tree is clean.
2. Run `pnpm run release:local`. It lints, builds, prompts for a version bump, updates `CHANGELOG.md`, commits, creates a `vX.Y.Z` tag, and pushes it.
3. The push of the tag triggers `.github/workflows/publish.yml`, which checks out the tag, verifies that the tag matches `package.json`, checks that the version is not already on npm, and publishes it to npm with provenance.

> **Note:** the release creates a GitHub release as well, which needs a `GITHUB_TOKEN` with `repo` scope in your environment (for example `export GITHUB_TOKEN=$(gh auth token)`).
> Without it, release-it falls back to opening the GitHub release page in the browser.

### Required repository configuration

- A repository secret named `NPM_TOKEN` holding an npm granular access token with **read and write** publish permission for `@sinehypernova-0718/n8n-nodes-coolify`.
  Alternatively, configure [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) for this repository and the `publish.yml` workflow, and leave `NPM_TOKEN` unset.
- The default branch must be `master`; CI and the publish workflow are configured for it.
- On self-hosted Coolify instances, an administrator must enable API access for the token's team.

## 🔗 Resources

- [Coolify API documentation](https://coolify.io/docs/api/overview) — API endpoints, request parameters, and responses.
- [Coolify API authorization](https://coolify.io/docs/api/authorization) — how the API authenticates a request.
- [Coolify API tokens](https://coolify.io/docs/core/security/credentials/api-tokens) — creating and scoping API tokens.
- [Coolify rate limits](https://coolify.io/docs/api/rate-limits) — the documented request budget and the response headers it is sent with.
- [Coolify API — Authenticated Team (`GET /team`)](https://coolify.io/docs/api/endpoints/teams/get-token-team) — the endpoint the credential test uses.
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes) — community node discovery and installation.
- [n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) — installation instructions.
- [n8n documentation](https://docs.n8n.io/) — workflow creation and node configuration.
- [GitHub repository](https://github.com/sinehypernova-0718/n8n-nodes-coolify) — source code, issues, and contributions.

## 📝 Version history

_First version of the node is yet to be released._

## 📄 License

This project is licensed under the [MIT License](LICENSE.md).

---

_This is an independent community project and is not an official Coolify or n8n product._
