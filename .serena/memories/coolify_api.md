# Coolify API contract (verified)

Verified against the official OpenAPI of the Coolify release **v4.4.6** (`https://raw.githubusercontent.com/coollabsio/coolify/v4.4.6/openapi.yaml`, `openapi: 3.1.0`; `info.version: 0.1` is not a product version) and the `v4.4.6` sources (`routes/api.php`, `app/Http/Controllers/Api/ApplicationsController.php`, `ApplicationPreviewsController.php`, `VolumeBackupsController.php`, `Concerns/HandlesTagsApi.php`, `bootstrap/helpers/api.php`, `app/Support/ValidationPatterns.php`).

## Scope

This memory verifies the **Applications** and **Deployments** tags of v4.4.6. The `auditEvent`, `cloudInitScript`, `cloudToken` and `database` resources are implemented in the node, but their upstream contracts are **not** verified here: read their `requests/<resource>/*Fields.ts` contract modules and builders, and do not infer their behaviour from this memory. The Deployment contract is recorded in the `## Deployments endpoints (verified, v4.4.6)` section below.

## Applications endpoints

42 operations carry the `Applications` tag. Paths (relative to the credential base URL + `/api/v1`):

- list `GET /applications` (query `tag`); get `GET /applications/{uuid}`; update `PATCH /applications/{uuid}`; delete `DELETE /applications/{uuid}`
- create: `POST /applications/public`, `/private-github-app`, `/private-deploy-key`, `/dockerfile`, `/dockerimage`
- lifecycle: `POST /applications/{uuid}/start|stop|restart|clone|rollback|migrate|move`; `GET /applications/{uuid}/rollback-images`
- envs: `GET|POST /applications/{uuid}/envs`, `PATCH /applications/{uuid}/envs`, `PATCH /applications/{uuid}/envs/bulk`, `DELETE /applications/{uuid}/envs/{env_uuid}`
- storages: `GET|POST|PATCH /applications/{uuid}/storages`, `DELETE /applications/{uuid}/storages/{storage_uuid}`
- backups: `PUT|DELETE /applications/{uuid}/storages/{storage_uuid}/backups`, `POST /applications/{uuid}/storages/{storage_uuid}/backups/run`
- tags: `GET|POST /applications/{uuid}/tags`, `DELETE /applications/{uuid}/tags/{tag_uuid}`
- destinations: `GET|POST /applications/{uuid}/destinations`, `DELETE /applications/{uuid}/destinations/{destination_uuid}`
- previews: `GET|POST /applications/{uuid}/previews`, `GET|PATCH|DELETE /applications/{uuid}/previews/{pull_request_id}`, `GET /applications/{uuid}/previews/{pull_request_id}/logs`, `GET /applications/{uuid}/logs`

Not part of the resource (other Coolify tags): `PATCH /applications/{uuid}/secret-manager` (Secret Managers), `…/scheduled-tasks` (Scheduled Tasks), `…/services/{uuid}/applications` (Service applications), `GET /deployments/applications/{uuid}` (Deployments).

## Version floor

The preview endpoints exist from **v4.4.0**; v4.3.0 has 37 of the 42. Added in 4.4.0: `GET|POST /applications/{uuid}/previews`, `GET|PATCH /applications/{uuid}/previews/{pull_request_id}`, `GET /applications/{uuid}/previews/{pull_request_id}/logs`.

## Spec vs implementation (report the difference, do not silently pick one)

- `environment_name` and `environment_uuid` are both `required` in the OpenAPI, but the controller needs **at least one** (422 "You need to provide at least one of environment_name or environment_uuid.") and resolves the name first, then the UUID.
- Creation answers **201 `{uuid, domains}`**; the OpenAPI documents only `{uuid}`.
- `PATCH /applications/{uuid}/envs` answers **201** and requires `key` + `value`; the controller accepts `is_runtime`, `is_buildtime`, `comment` beyond the published body and **resets** `is_preview`/`is_literal`/`is_multiline`/`is_shown_once` when they are not in the request. Only `is_runtime`/`is_buildtime`/`comment` are guarded by a presence check → **no safe partial update for the published flags**.
- `POST /applications/{uuid}/envs` requires `key` although the OpenAPI lists no required property.
- `dockerfile` must be **base64** encoded for `POST /applications/dockerfile` (422 "The dockerfile should be base64 encoded."); the Git variants take the same field as plain text.
- `POST /applications/{uuid}/previews`: `git_type`/`commit` must be **absent** for a Docker-Image app and `docker_tag` must be absent for a Git app; `commit` is required for `bitbucket`; `git_type` is required without a GitHub/GitLab App source; the app must be Git-based or a Docker image (400).
- `PATCH /applications/{uuid}/previews/{pull_request_id}`: `domains` must be **present** for a non-Compose app and **absent** for a Compose app, which instead needs `docker_compose_domains` (`name` required, `domain`, `redirect`). The API replaces the domains, and a Compose service that is not listed loses its domain.
- `PUT …/backups`: `frequency` is a cron **or** human expression (max 255); `disable_local_backup` needs `save_s3`; `s3_storage_uuid` is required with `save_s3`; `timeout` 60..36000; `retention_amount_*` 0..10000; `retention_days_*` 0..2147483647; `retention_max_storage_*` 0..9999999999; `missing_backup_notification_days` 0..365.
- `GET …/logs`: `lines` is an integer -1..10000 (default 100) or the string `all`; plus `show_timestamps` and `service_name` (404 when no running container matches).
- Accepted by the controller but **not published** (keep out of the editor): `type`, `custom_network_aliases`, `health_check_type`, `health_check_command`, `docker_compose_raw`, `custom_nginx_configuration`.
- `health_check_port` is published as `string|null` but validated as an integer 1..65535.

## Creation variants

Property counts per variant, identical to the OpenAPI property sets (verified): public 101, private-github-app 102, private-deploy-key 102, dockerfile 83, dockerimage 80. 80 fields are common to all five; the rest are the Git source/build fields, the two credential fields (`github_app_uuid`, `private_key_uuid`), `dockerfile`, `build_pack` and `base_directory`.

Side effects and credential assumptions of a creation:

- `instant_deploy` queues a deployment and needs the `deploy` or `root` ability (403 "Missing required permissions: deploy"); without it a Compose app dispatches `LoadComposeFile`. The answer is 201 `{uuid, domains}` or 200 `{message}` when the deployment was skipped.
- The server must be able to host resources and have at least one destination; `destination_uuid` is required when the server has more than one destination.
- The GitHub App must belong to the team or be system-wide, the private key must belong to the team (404 otherwise).
- `name` is optional: generated from the repository and branch, or `dockerfile-<id>` / `docker-image-<id>`.
- `domains` is rejected for a Docker Compose build pack.
- `tags` need at least two characters each; `ports_exposes` is `\d+(,\d+)*`; `ports_mappings` is `\d+:\d+(,\d+:\d+)*`.

## Retry safety of the applications endpoints

- Safe to repeat: `stop` only (stopping a stopped application is harmless) — the single operation marked `retrySafety: 'safe'`.
- Every other mutation stays `unsafe`: `start`, `restart`, `rollback` and the backup run queue work and must never be repeated.

## Deployments endpoints (verified, v4.4.6)

Verified against the v4.4.6 OpenAPI (`/deployments`, `/deployments/{uuid}`, `/deployments/{uuid}/cancel`, `/deploy`, `/deployments/applications/{uuid}`), `app/Http/Controllers/Api/DeployController.php`, `Application::deployments()`, `app/Models/Application.php`, `routes/api.php`.

| Operation                  | Method + path (relative to the credential base URL) | Query / body                                                                                                                  | Notes                                                                                                                                                                                                                                    |
| -------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| list                       | `GET /deployments`                                  | none                                                                                                                          | Plain array of the team's `ApplicationDeploymentQueue` whose status is `in_progress` or `queued` only, oldest first. Finished/failed/cancelled deployments are absent; read one by UUID instead.                                         |
| get                        | `GET /deployments/{uuid}`                           | none                                                                                                                          | One `ApplicationDeploymentQueue`. 404 when the deployment's application is not in the team. `logs` is hidden unless the token has `read:sensitive`/`root`.                                                                               |
| listApplicationDeployments | `GET /deployments/applications/{uuid}`              | `skip` (integer >= 0, default 0), `take` (integer >= 1, default 10)                                                           | Returns `{count, deployments}` (an object, not a bare array). 404 when the application is not in the team; `logs` per entry only with `read:sensitive`/`root`.                                                                           |
| deploy                     | `POST /deploy`                                      | `uuid` OR `tag` (each a comma separated list), `force` (boolean), `pull_request_id` (alias `pr`, 1..2147483647), `docker_tag` | Every parameter is read with `$request->input()`, so query or body both work. Returns `{deployments:[{message,resource_uuid,deployment_uuid}]}` for UUID targets; a tag target answers `{message                                         | details}`. 400 rules: uuid+tag, tag+pr, docker_tag without pr, tag+docker_tag, neither uuid nor tag. `docker_tag`only applies to a Docker Image application. Requires`api.ability:deploy`. |
| cancel                     | `POST /deployments/{uuid}/cancel`                   | none                                                                                                                          | Returns `{message,deployment_uuid,status}`. Only a deployment whose status is `queued` or `in_progress` can be cancelled; anything else answers 400. 403 when the deployment's server is not in the team. Requires `api.ability:deploy`. |

Retry safety: the three GETs are safe by default. `deploy` and `cancel` are `unsafe` — they queue a deployment / act on one and must never be repeated.

Node decisions: resource value `deployment`, label `Deployment`, five operations (`cancel`, `deploy`, `get`, `list`, `listApplicationDeployments`). `deploy` exposes a `resourceUuid` resourceLocator (list = `searchDeployableResources`, which merges applications + services + databases with the kind prefixed to each name; modes `list`/`id`) and a `tag` resourceLocator (list = `searchTags`); both locators stay at the node root in v2, while `force`, `pullRequestId` and `dockerTag` are grouped into the `deploymentDeployOptions` collection. `listApplicationDeployments` exposes `applicationUuid` (locator, `searchApplications`) plus `skip`/`take` in `deploymentListApplicationDeploymentsOptions` (label "Pagination Options"). `get` and `cancel` take a plain `deploymentUuid` string, validated locally. Only `pull_request_id` is sent, never the `pr` alias.

Version difference (report, do not silently pick): a newer release (present in v4.7.6, absent in v4.4.6) adds a `cancel_previous` query parameter (`none`/`queued`/`building`) to `/deploy`. It is deliberately **not** exposed, so the operation stays within the v4.4.6 contract.
