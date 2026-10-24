/**
 * The field contract of the application update endpoint.
 *
 * The Coolify API updates an application with a partial update: it only
 * changes the fields of the request body and keeps every other field of the
 * application as it is. The endpoint rejects a field it does not know, so the
 * contract of this module is the set of the fields the endpoint publishes.
 *
 * Because a field that is not sent keeps its current value, the settings of
 * the update are not plain values:
 *
 * - a boolean setting has three states, it either keeps its current value or
 *   it is switched on or off,
 * - a number setting is only sent when the user entered a value,
 * - a text setting is only sent when the user entered a value,
 * - an enumeration carries an additional value that keeps the current
 *   setting.
 *
 * The contract was verified against the official OpenAPI specification and the
 * `ApplicationsController::update_by_uuid` implementation of the Coolify
 * release v4.5.0. A few fields the specification publishes for this endpoint
 * are not part of the contract:
 *
 * - `project_uuid`, `server_uuid`, `environment_name` and `destination_uuid`
 *   are not part of the fields the endpoint accepts, so it rejects them and
 *   they cannot be updated here,
 * - `github_app_uuid` and `dockerfile` are accepted by the endpoint for some
 *   applications, but the node does not expose them yet.
 *
 * Some of the remaining fields are only published by recent Coolify 4.x
 * releases, so an older instance may reject them.
 */

import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import {
	applicationFieldSpecs,
	applicationFieldUiName,
	COMMIT_SHA_PATTERN,
	encodeFieldValue,
	PORTS_EXPOSES_PATTERN,
	PORTS_MAPPINGS_PATTERN,
	validateBoundedApplicationFields,
	type ApplicationFieldGroup,
	type ApplicationGroupedFieldSpec,
} from './applicationFields';

/**
 * The fields the update endpoint of the Coolify API accepts.
 */
export const APPLICATION_UPDATE_FIELDS = [
	'base_directory',
	'build_command',
	'build_pack',
	'connect_to_docker_network',
	'custom_container_name_prefix',
	'custom_docker_run_options',
	'custom_internal_name',
	'custom_labels',
	'description',
	'disable_build_cache',
	'docker_compose_custom_build_command',
	'docker_compose_custom_start_command',
	'docker_compose_domains',
	'docker_compose_location',
	'docker_images_to_keep',
	'docker_registry_image_name',
	'docker_registry_image_tag',
	'dockerfile_location',
	'domains',
	'force_domain_override',
	'git_branch',
	'git_commit_sha',
	'git_repository',
	'gpu_count',
	'gpu_device_ids',
	'gpu_driver',
	'gpu_options',
	'health_check_enabled',
	'health_check_host',
	'health_check_interval',
	'health_check_method',
	'health_check_path',
	'health_check_port',
	'health_check_response_text',
	'health_check_retries',
	'health_check_return_code',
	'health_check_scheme',
	'health_check_start_period',
	'health_check_timeout',
	'http_basic_auth_argon2id_memory_cost',
	'http_basic_auth_argon2id_time_cost',
	'http_basic_auth_bcrypt_cost',
	'http_basic_auth_hash_algorithm',
	'include_source_commit_in_build',
	'inject_build_args_to_dockerfile',
	'install_command',
	'instant_deploy',
	'is_auto_deploy_enabled',
	'is_consistent_container_name_enabled',
	'is_container_label_escape_enabled',
	'is_env_sorting_enabled',
	'is_force_https_enabled',
	'is_git_lfs_enabled',
	'is_git_shallow_clone_enabled',
	'is_git_submodules_enabled',
	'is_gpu_enabled',
	'is_gzip_enabled',
	'is_log_drain_enabled',
	'is_permanent_redirect_enabled',
	'is_pr_deployments_public_enabled',
	'is_preserve_repository_enabled',
	'is_preview_deployments_enabled',
	'is_raw_compose_deployment_enabled',
	'is_spa',
	'is_static',
	'is_stripprefix_enabled',
	'limits_cpu_shares',
	'limits_cpus',
	'limits_cpuset',
	'limits_memory',
	'limits_memory_reservation',
	'limits_memory_swap',
	'limits_memory_swappiness',
	'manual_webhook_secret_bitbucket',
	'manual_webhook_secret_gitea',
	'manual_webhook_secret_github',
	'manual_webhook_secret_gitlab',
	'max_restart_count',
	'name',
	'noindex_domains',
	'ports_exposes',
	'ports_mappings',
	'post_deployment_command',
	'post_deployment_command_container',
	'pre_deployment_command',
	'pre_deployment_command_container',
	'preview_url_template',
	'publish_directory',
	'redact_all_env_values_in_logs',
	'redirect',
	'start_command',
	'stop_grace_period',
	'traefik_certificate_resolver',
	'use_build_secrets',
	'use_build_server',
	'watch_paths',
] as const;

/**
 * The value of a setting that keeps its current value.
 */
export const APPLICATION_UPDATE_UNCHANGED = 'unchanged';

/**
 * The value of a boolean setting that is switched on.
 */
export const APPLICATION_UPDATE_ENABLED = 'enabled';

/**
 * The value of a boolean setting that is switched off.
 */
export const APPLICATION_UPDATE_DISABLED = 'disabled';

/**
 * The options of a boolean setting.
 */
export const APPLICATION_UPDATE_BOOLEAN_OPTIONS = [
	{ name: 'Unchanged', value: APPLICATION_UPDATE_UNCHANGED },
	{ name: 'Enabled', value: APPLICATION_UPDATE_ENABLED },
	{ name: 'Disabled', value: APPLICATION_UPDATE_DISABLED },
];

/**
 * The groups of the update contract that the editor renders as a collection.
 */
export const APPLICATION_UPDATE_COLLECTION_GROUPS = [
	'common',
	'deployment',
	'build',
	'gitBuild',
	'healthCheck',
	'limits',
	'docker',
	'webhooks',
	'commands',
] as const;

/**
 * A group of the update contract that the editor renders as a collection.
 */
export type ApplicationUpdateCollectionGroup =
	(typeof APPLICATION_UPDATE_COLLECTION_GROUPS)[number];

/**
 * The collection that holds the optional settings of a group.
 */
export const APPLICATION_UPDATE_COLLECTIONS: Record<ApplicationUpdateCollectionGroup, string> = {
	common: 'updateApplicationSettings',
	deployment: 'updateDeploymentSettings',
	build: 'updateBuildSettings',
	gitBuild: 'updateGitBuildSettings',
	healthCheck: 'updateHealthCheckSettings',
	limits: 'updateResourceLimitSettings',
	docker: 'updateDockerSettings',
	webhooks: 'updateWebhookSecretSettings',
	commands: 'updateDeploymentCommandSettings',
};

/**
 * How the value of a field is turned into the request body.
 *
 * - `value` is the value of the field,
 * - `booleanSetting` is a boolean that can also keep its current value,
 * - `numberSetting` is a number that is only sent when the user entered one.
 */
export type ApplicationUpdateFieldKind = 'value' | 'booleanSetting' | 'numberSetting';

/**
 * The contract of a field of the application update endpoint.
 */
export interface ApplicationUpdateFieldSpec extends ApplicationGroupedFieldSpec {
	/** How the value of the field is turned into the request body. */
	kind: ApplicationUpdateFieldKind;
}

/**
 * The names of the fields the update endpoint accepts.
 */
const UPDATE_FIELD_NAMES = new Set<string>(APPLICATION_UPDATE_FIELDS);

/**
 * The longest name an application may have.
 */
const MAX_APPLICATION_NAME_LENGTH = 255;

/**
 * The longest port number a health check may use.
 */
const MAX_HEALTH_CHECK_PORT = 65535;

/**
 * The largest number of Docker images an application may keep.
 */
const MAX_DOCKER_IMAGES_TO_KEEP = 100;

/**
 * Sort the options of an enumeration by their name, the order the n8n lint
 * rules expect.
 */
function sortOptions(
	options: { name: string; value: string }[],
): { name: string; value: string }[] {
	return [...options].sort((left, right) =>
		left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
	);
}

/**
 * Add the value that keeps the current setting to an enumeration.
 *
 * The update endpoint cannot express "no value": a field it leaves out keeps
 * the current setting of the application. An option without a value is
 * therefore meaningless in the update, and it is dropped so the editor never
 * offers a choice that the request would silently ignore.
 *
 * @param options The options of the enumeration.
 * @returns The options of the enumeration of the update endpoint.
 */
function withUnchangedOption(
	options: { name: string; value: string }[],
): { name: string; value: string }[] {
	return sortOptions([
		...options.filter((option) => option.value !== ''),
		{ name: 'Unchanged', value: APPLICATION_UPDATE_UNCHANGED },
	]);
}

/**
 * The description of a field of the update endpoint.
 *
 * The description of the creation contract does not fit a partial update: a
 * setting of the update is only changed when the user changed it.
 *
 * @param spec The contract of the field.
 * @returns The description of the field.
 */
function updateDescription(spec: ApplicationGroupedFieldSpec): string {
	const parts: string[] = [];

	if (spec.apiName === 'git_repository') {
		parts.push('URL of the Git repository');
	} else if (spec.apiName === 'custom_labels') {
		parts.push(
			'Custom labels of the container. The node encodes them as base64, which is what the API expects',
		);
	} else {
		parts.push(spec.description);
	}

	if (spec.type === 'boolean') {
		parts.push('It is only changed when it is set to Enabled or Disabled');
	} else if (spec.type === 'number' || spec.type === 'string') {
		parts.push('It is only changed when a value is entered');
	}

	return `${parts.join('. ')}.`;
}

/**
 * The contract of a field of the update endpoint.
 *
 * @param spec The contract of the field of the creation contract.
 * @returns The contract of the field of the update endpoint.
 */
function toUpdateSpec(spec: ApplicationGroupedFieldSpec): ApplicationUpdateFieldSpec {
	const updateSpec: ApplicationUpdateFieldSpec = {
		...spec,
		kind: 'value',
		description: updateDescription(spec),
	};

	delete updateSpec.required;
	delete updateSpec.apiDefault;

	if (spec.type === 'boolean') {
		updateSpec.kind = 'booleanSetting';
		updateSpec.type = 'options';
		updateSpec.options = APPLICATION_UPDATE_BOOLEAN_OPTIONS;
		updateSpec.defaultValue = APPLICATION_UPDATE_UNCHANGED;
	} else if (spec.type === 'number') {
		updateSpec.kind = 'numberSetting';
		updateSpec.type = 'string';
		updateSpec.defaultValue = '';
	} else if (spec.type === 'options') {
		updateSpec.options = withUnchangedOption(spec.options ?? []);
		updateSpec.defaultValue = APPLICATION_UPDATE_UNCHANGED;
	}

	return updateSpec;
}

/**
 * The fields of the update endpoint, in the order the editor renders them.
 *
 * @returns The fields the update endpoint accepts.
 */
export function applicationUpdateFieldSpecs(): ApplicationUpdateFieldSpec[] {
	return applicationFieldSpecs('public')
		.filter((spec) => UPDATE_FIELD_NAMES.has(spec.apiName))
		.map((spec) => toUpdateSpec(spec));
}

/**
 * The groups of the update contract that the editor renders as a collection.
 *
 * @returns The groups of the update contract that hold optional settings.
 */
export function applicationUpdateCollectionGroups(): ApplicationUpdateCollectionGroup[] {
	return [...APPLICATION_UPDATE_COLLECTION_GROUPS];
}

/**
 * The collection that holds the optional settings of a group.
 *
 * @param group The group of a field.
 * @returns The name of the collection, or undefined when the group is rendered
 * at the top level.
 */
function collectionName(group: ApplicationFieldGroup): string | undefined {
	return (APPLICATION_UPDATE_COLLECTIONS as Partial<Record<ApplicationFieldGroup, string>>)[group];
}

/**
 * Build the request body of an application update request.
 *
 * Only the settings the user changed are sent, every other setting of the
 * application keeps its current value.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request body of the Coolify API.
 */
export function buildUpdateApplicationBody(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const body: IDataObject = {};

	for (const spec of applicationUpdateFieldSpecs()) {
		const uiName = applicationFieldUiName(spec.apiName);
		const collection = collectionName(spec.group);

		let raw: unknown;
		if (collection) {
			const values = ctx.getNodeParameter(collection, itemIndex, {}) as IDataObject;
			raw = values?.[uiName];
		} else {
			raw = ctx.getNodeParameter(uiName, itemIndex, spec.defaultValue);
		}

		if (raw === undefined || raw === null) {
			continue;
		}

		if (spec.kind === 'booleanSetting') {
			if (raw === APPLICATION_UPDATE_ENABLED) {
				body[spec.apiName] = true;
			} else if (raw === APPLICATION_UPDATE_DISABLED) {
				body[spec.apiName] = false;
			}
			continue;
		}

		if (spec.kind === 'numberSetting') {
			const value = typeof raw === 'string' ? raw.trim() : '';
			if (value === '') {
				continue;
			}

			const parsed = Number(value);
			if (!Number.isFinite(parsed)) {
				throw new NodeOperationError(ctx.getNode(), `${spec.displayName} must be a number`, {
					itemIndex,
				});
			}

			body[spec.apiName] = parsed;
			continue;
		}

		if (spec.type === 'stringList' || spec.type === 'composeDomains') {
			if (Array.isArray(raw) && raw.length > 0) {
				body[spec.apiName] = raw;
			}
			continue;
		}

		if (spec.type === 'options') {
			if (typeof raw === 'string' && raw !== '' && raw !== APPLICATION_UPDATE_UNCHANGED) {
				body[spec.apiName] = raw;
			}
			continue;
		}

		if (typeof raw === 'string' && raw.trim() !== '') {
			body[spec.apiName] = encodeFieldValue(raw.trim(), spec);
		}
	}

	return body;
}

/**
 * Validate the fields of an application update request.
 *
 * The rules are the ones the Coolify API applies, so a request that breaks
 * them is rejected before it is sent. The API validates the remaining fields
 * itself.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param body The request body that is built from the editor values.
 */
export function validateUpdateApplicationFields(
	ctx: IExecuteFunctions,
	itemIndex: number,
	body: IDataObject,
): void {
	const fail = (message: string): never => {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	};

	if (typeof body.name === 'string' && body.name.length > MAX_APPLICATION_NAME_LENGTH) {
		fail(`The name must not be longer than ${MAX_APPLICATION_NAME_LENGTH} characters`);
	}
	if (typeof body.ports_exposes === 'string' && !PORTS_EXPOSES_PATTERN.test(body.ports_exposes)) {
		fail('The exposed ports must be a comma-separated list of ports, for example 80,443');
	}
	if (
		typeof body.ports_mappings === 'string' &&
		!PORTS_MAPPINGS_PATTERN.test(body.ports_mappings)
	) {
		fail('The port mappings must be a comma-separated list of port mappings, for example 80:80');
	}
	if (typeof body.git_commit_sha === 'string' && !COMMIT_SHA_PATTERN.test(body.git_commit_sha)) {
		fail('The commit SHA may only contain letters, digits, dots, underscores, hyphens and slashes');
	}
	if (
		typeof body.health_check_port === 'string' &&
		body.health_check_port.trim() !== '' &&
		!/^\d+$/.test(body.health_check_port.trim())
	) {
		fail('The health check port must be a port number');
	}
	if (
		typeof body.health_check_port === 'string' &&
		body.health_check_port.trim() !== '' &&
		Number(body.health_check_port) > MAX_HEALTH_CHECK_PORT
	) {
		fail(`The health check port must not be greater than ${MAX_HEALTH_CHECK_PORT}`);
	}
	if (
		typeof body.max_restart_count === 'number' &&
		(!Number.isInteger(body.max_restart_count) || body.max_restart_count < 0)
	) {
		fail('The max restart count must be a number of zero or more');
	}
	if (
		typeof body.docker_images_to_keep === 'number' &&
		(!Number.isInteger(body.docker_images_to_keep) ||
			body.docker_images_to_keep < 0 ||
			body.docker_images_to_keep > MAX_DOCKER_IMAGES_TO_KEEP)
	) {
		fail(`The number of Docker images to keep must be between 0 and ${MAX_DOCKER_IMAGES_TO_KEEP}`);
	}

	validateBoundedApplicationFields(applicationUpdateFieldSpecs(), body, fail);

	if (Array.isArray(body.docker_compose_domains)) {
		for (const entry of body.docker_compose_domains as IDataObject[]) {
			const name = typeof entry.name === 'string' ? entry.name.trim() : '';
			const domain = typeof entry.domain === 'string' ? entry.domain.trim() : '';

			if (!name) {
				fail('Every Docker Compose domain needs the name of its service');
			}
			if (!domain) {
				fail(`The Docker Compose service "${name}" needs a domain`);
			}
		}
	}
}
