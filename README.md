# n8n-nodes-coolify

An n8n community node for [Coolify](https://coolify.io/) — the open-source self-hostable PaaS.
It is designed to let you manage Coolify applications, services, databases, servers, and
deployments from your n8n workflows.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Install the package through your n8n instance using the community node installation interface.

1. Open your n8n instance.
2. Navigate to **Settings → Community Nodes**.
3. Select **Install**.
4. Enter the package name `@sinehypernova-0718/n8n-nodes-coolify`.
5. Review and accept the installation confirmation.
6. Once the installation completes, open a workflow and search for the Coolify node.

For detailed instructions, see the
[n8n community nodes installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

> **Note:** The package name entered during installation must match the name under which this project
> is published to npm (`@sinehypernova-0718/n8n-nodes-coolify`). Community node installation
> availability also depends on your n8n deployment configuration and administrator policies.

## Credentials

The Coolify node authenticates against the Coolify REST API with an API token, sent as a
`Bearer` token in the `Authorization` header.

### Prerequisites

- A Coolify instance — either [Coolify Cloud](https://coolify.io/pricing) or your own
  self-hosted installation (version 4.3.0 or newer, see [Compatibility](#compatibility)).
- An API token created in Coolify under **Keys & Tokens → API Tokens**, scoped to the team you
  want to work with. The token carries the permissions selected at creation time
  (`read`, `write`, `root`), so create the least privileged token that covers your workflow.
  The token needs the **`read`** permission — a deploy-only token cannot be tested, because the
  credential test reads the team bound to the token.
- On self-hosted instances, API access must be enabled by an administrator, and the caller must
  match the IP allowlist when one is configured.

### Configure the credential

| Setting      | Value                                                                                                                                                                                                                                                                  |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Base URL     | Base URL of the Coolify API, including the `/api/v1` path. Use `https://app.coolify.io/api/v1` for Coolify Cloud, or the URL of your own instance (for example `https://coolify.example.com/api/v1`). A trailing slash is tolerated; the `/api/v1` suffix is required. |
| Access Token | The API token created in Coolify. It is sent as `Authorization: Bearer <token>`.                                                                                                                                                                                       |

The credential test calls `GET /team` against the configured base URL — the endpoint that
returns the team bound to the token — so it verifies the token against the same instance your
workflows will use. The test is read-only, and it reports whether a failure was caused by the
token (401), by permissions, API access or the IP allowlist (403), or by a base URL that does not
point at the API (404).

Keep your token private. Never commit credentials to the repository or include tokens in issue
reports, screenshots, or logs.

## Operations

**Status: not implemented yet.** This repository currently ships the package scaffold, the
credential, and the CI/publishing pipeline. The Coolify operations are the next piece of work and
are tracked in the repository issues.

The operation set below is planned against the documented
[Coolify API v1](https://coolify.io/docs/api/overview) and is listed so the intended scope is
explicit. Nothing below is exposed in the node yet.

| Resource | Planned operation | Endpoint |
|---|---|---|
| Application | List | `GET /applications` |
| Application | Get | `GET /applications/{uuid}` |
| Application | Update | `PATCH /applications/{uuid}` |
| Application | Delete | `DELETE /applications/{uuid}` |
| Application | Start / Stop / Restart | `POST /applications/{uuid}/start`, `…/stop`, `…/restart` |
| Application | List / Create / Update / Delete env | `GET|POST|PATCH|DELETE /applications/{uuid}/envs` |
| Application | Logs | `GET /applications/{uuid}/logs` |
| Service | List / Get | `GET /services`, `GET /services/{uuid}` |
| Database | List / Get | `GET /databases`, `GET /databases/{uuid}` |
| Server | List / Get | `GET /servers`, `GET /servers/{uuid}` |
| Project | List / Get | `GET /projects`, `GET /projects/{uuid}` |
| Deployment | List / Get | `GET /deployments`, `GET /deployments/{uuid}` |
| Deployment | Deploy | `POST /deployments` (by application tag or UUID) |
| Deployment | List by application | `GET /deployments/{applicationUuid}` |
| Deployment | Cancel | `POST /deployments/{uuid}/cancel` |
| Team | Get current | `GET /team` |
| System | Version / Healthcheck | `GET /version`, `GET /healthcheck` |

Until those operations land, the node renders a notice in the n8n editor instead of exposing
GitHub Issues resources that the starter template shipped with.

## Rate limits and retries

All Coolify API calls go through one shared transport
(`nodes/Coolify/shared/apiRequest.ts`) that applies the retry policy of
`nodes/Coolify/shared/rateLimit.ts`. The policy follows the
[Coolify rate-limit documentation](https://coolify.io/docs/api/rate-limits).

- **The limit is never hardcoded.** The documented default is 200 requests per minute, but a
  self-hosted instance can change it with the `API_RATE_LIMIT` environment variable, so the
  server's response headers are the only source of truth.
- **Only requests that are safe to repeat are retried.** Reads (`GET`, `HEAD`, `OPTIONS`) are
  retried on `408`, `429`, transient `5xx` responses and transport failures. Writes are never
  retried automatically: a `429` alone is no proof that a write can be repeated, because Coolify
  also answers `429` when a deployment queue or an upstream provider is busy. A write is only
  retried when the operation explicitly declares that a repeat is harmless.
- **The wait comes from the server.** `Retry-After` (seconds) is honoured exactly, `X-RateLimit-Reset`
  (unix timestamp) is the fallback, and an exponential backoff with random jitter is used when the
  response carries neither. A server-mandated wait longer than the internal maximum wait of 60
  seconds fails the request instead of retrying early.
- **At most three retries** per request, and never in parallel.
- Permanent failures (`400`, `401`, `403`, `404`, `409`, `422`) are surfaced immediately, with the
  Coolify message, the status code and the response body preserved.

The retry limits and timeouts are internal constants. There are no node-level options for them.

## Compatibility

This package is designed for n8n's community node ecosystem and uses the n8n node API.

- **Integration type:** n8n community node.
- **Implementation language:** TypeScript.
- **API:** Coolify API v1.
- **Coolify version:** 4.3.0 or newer. The credential test uses `GET /team`, the canonical
  endpoint for "the team bound to the token" in the
  [Coolify OpenAPI specification](https://github.com/coollabsio/coolify/blob/main/openapi.yaml).
  Coolify 4.0.x–4.2.x only expose the older `/teams/current` alias of the same endpoint, so the
  credential test reports HTTP 404 on those instances.
- **Authentication:** Coolify API token (Bearer), with the `read` permission.
- **Package distribution:** npm — end users install the published package with the n8n
  community nodes interface, and npm remains the registry the package is published to.
- **Development package manager:** pnpm — the repository is developed, built, and published with
  pnpm, pinned through the `packageManager` field in `package.json` and `pnpm-lock.yaml`.

The package declares its n8n node metadata and entry points in `package.json`. Compatibility
depends on the n8n version, the available `n8n-workflow` APIs, and the package's dependencies.

The `0.1.x` releases are pre-1.0 releases. Operation coverage and compatibility may evolve as the
integration develops.

## Development

### Requirements

- **[Node.js](https://nodejs.org/)** (v22 or higher) and **pnpm**
  - Linux/Mac/WSL: Install via [nvm](https://github.com/nvm-sh/nvm)
  - Windows: Follow [Microsoft's NodeJS guide](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows)
- **[git](https://git-scm.com/downloads)**
- **[Corepack](https://nodejs.org/api/corepack.html)** (optional) — pnpm 12.4.2 is pinned in
  `package.json` via the `packageManager` field

```bash
corepack enable   # optional, if you do not have pnpm installed globally
pnpm install
```

> [!NOTE]
> The `@n8n/node-cli` is included as a dev dependency and is installed automatically when you run
> `pnpm install`. The CLI includes n8n for local development, so you do not need to install n8n
> globally.

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

> **Note:** `pnpm run release` is what CI runs. Locally, use `pnpm run release:local` to create
> the tag, because `@n8n/node-cli` pins release-it's branch check to `main` while this repository
> develops on `master`. The repository configuration in `.release-it.json` handles the `master`
> branch, the `vX.Y.Z` tag format, and the changelog generation.

### Repository structure

```text
n8n-nodes-coolify/
├── credentials/
│   └── CoolifyApi.credentials.ts   # Coolify API token credential (base URL + token)
├── nodes/
│   └── Coolify/
│       ├── Coolify.node.ts         # The node itself
│       ├── Coolify.node.json       # n8n codex metadata (categories, documentation links)
│       └── shared/
│           ├── apiRequest.ts       # Shared authenticated transport with the retry policy
│           └── rateLimit.ts        # Rate-limit policy, header parsing and delay calculation
├── test/
│   ├── apiRequest.test.ts          # Tests for the shared transport
│   └── rateLimit.test.ts           # Tests for the rate-limit policy
├── icons/
│   └── coolify.svg                 # Node and credential icon
├── .github/workflows/
│   ├── ci.yml                      # Lint + tests + build on pushes to master and on pull requests
│   └── publish.yml                 # Publishes to npm on v*.*.* tags
├── .release-it.json                # Local release configuration (branch, tag format, changelog)
├── package.json                    # Package metadata and scripts
├── pnpm-lock.yaml                  # Pinned dependency graph
└── pnpm-workspace.yaml             # pnpm workspace + dependency build-script policy
```

## Release process

Releases are published by GitHub Actions, never from a local machine, so that every published
version carries an npm provenance attestation (required by n8n for verified community nodes).

1. Make sure `master` is up to date and the working tree is clean.
2. Run `pnpm run release:local`. It lints, builds, prompts for a version bump, updates
   `CHANGELOG.md`, commits, creates a `vX.Y.Z` tag, and pushes it.
3. The push of the tag triggers `.github/workflows/publish.yml`, which checks out the tag,
   verifies that the tag matches `package.json`, checks that the version is not already on npm,
   and publishes it to npm with provenance.

> **Note:** the release creates a GitHub release as well, which needs a `GITHUB_TOKEN` with
> `repo` scope in your environment (for example `export GITHUB_TOKEN=$(gh auth token)`).
> Without it, release-it falls back to opening the GitHub release page in the browser.

### Required repository configuration

- A repository secret named `NPM_TOKEN` holding an npm granular access token with **read and
  write** publish permission for `@sinehypernova-0718/n8n-nodes-coolify`.
  Alternatively, configure [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers)
  for this repository and the `publish.yml` workflow, and leave `NPM_TOKEN` unset.
- The default branch must be `master`; CI and the publish workflow are configured for it.
- On self-hosted Coolify instances, an administrator must enable API access for the token's team.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Coolify API documentation](https://coolify.io/docs/api/overview)
- [Coolify API authorization](https://coolify.io/docs/api/authorization)
- [Coolify API tokens](https://coolify.io/docs/core/security/credentials/api-tokens)
- [Coolify API — Authenticated Team (`GET /team`)](https://coolify.io/docs/api/endpoints/teams/get-token-team)

## License

[MIT](LICENSE.md)
