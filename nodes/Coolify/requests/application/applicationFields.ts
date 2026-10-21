/**
 * The field contract of the application creation endpoints.
 *
 * The five creation endpoints of the Coolify API share one flat request body
 * and differ only in the source they build the application from. This module
 * holds that contract once:
 *
 * - the variants and the endpoint they use,
 * - the fields every variant accepts, in the groups the editor renders them,
 * - the rules the request builder applies when it turns the editor values
 *   into the request body.
 *
 * The editor renders the fields from this module and the request builders
 * build the body from it, so a field can never be shown without being sent
 * or sent without being shown.
 *
 * The contract was verified against the official OpenAPI specification and
 * the `ApplicationsController::create_application` implementation of the
 * Coolify release v4.4.6.
 */

import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

/**
 * The creation variants of the Coolify API.
 */
export const APPLICATION_CREATE_VARIANTS = [
	'public',
	'githubApp',
	'privateRepository',
	'dockerfile',
	'dockerImage',
] as const;

/**
 * A creation variant of the Coolify API.
 */
export type ApplicationCreateVariant = (typeof APPLICATION_CREATE_VARIANTS)[number];

/**
 * The endpoint of every creation variant.
 */
export const APPLICATION_CREATE_PATHS: Record<ApplicationCreateVariant, string> = {
	public: 'applications/public',
	githubApp: 'applications/private-github-app',
	privateRepository: 'applications/private-deploy-key',
	dockerfile: 'applications/dockerfile',
	dockerImage: 'applications/dockerimage',
};

/**
 * The kind of the editor control of a field.
 */
export type ApplicationFieldType =
	| 'string'
	| 'boolean'
	| 'number'
	| 'options'
	| 'stringList'
	| 'composeDomains';

/**
 * The group of a field. The group decides where the editor renders the field.
 */
export type ApplicationFieldGroup =
	| 'identity'
	| 'source'
	| 'common'
	| 'deployment'
	| 'build'
	| 'gitBuild'
	| 'healthCheck'
	| 'limits'
	| 'docker'
	| 'webhooks'
	| 'commands';

/**
 * The groups that the editor renders as a collection of optional fields.
 */
export const APPLICATION_FIELD_COLLECTIONS: Record<
	Exclude<ApplicationFieldGroup, 'identity' | 'source' | 'common'>,
	string
> = {
	deployment: 'deploymentSettings',
	build: 'buildSettings',
	gitBuild: 'gitBuildSettings',
	healthCheck: 'healthCheckSettings',
	limits: 'resourceLimitSettings',
	docker: 'dockerSettings',
	webhooks: 'webhookSecretSettings',
	commands: 'deploymentCommandSettings',
};

/**
 * The contract of a single field of an application request.
 */
export interface ApplicationFieldSpec {
	/** The name of the field in the Coolify API. */
	apiName: string;
	/** The label of the field in the editor. */
	displayName: string;
	/** The kind of the editor control. */
	type: ApplicationFieldType;
	/** The description of the field. */
	description: string;
	/** The default value of the editor control. */
	defaultValue?: string | number | boolean | string[];
	/** The options of an options control. */
	options?: { name: string; value: string }[];
	/** Whether the API requires the field for the variants that have it. */
	required?: boolean;
	/**
	 * The default of the field in the Coolify API, for the boolean fields whose
	 * default is `true`. Those fields are always sent, so the user can switch
	 * them off explicitly.
	 */
	apiDefault?: boolean;
	/** Whether the value of the field is a secret. */
	secret?: boolean;
	/** The number of rows of a text control. */
	rows?: number;
}

/**
 * Build the name of a field in the editor from its name in the API.
 *
 * @param apiName The name of the field in the Coolify API.
 * @returns The name of the field in the editor.
 */
export function applicationFieldUiName(apiName: string): string {
	return apiName.replace(/_([a-z0-9])/g, (_match, character: string) => character.toUpperCase());
}

/**
 * Shortcut for a field specification.
 */
function field(
	apiName: string,
	displayName: string,
	type: ApplicationFieldType,
	description: string,
	extra: Partial<ApplicationFieldSpec> = {},
): ApplicationFieldSpec {
	return { apiName, displayName, type, description, ...extra };
}

/**
 * The build packs of the Coolify API.
 */
const BUILD_PACK_OPTIONS = [
	{ name: 'Docker Compose', value: 'dockercompose' },
	{ name: 'Dockerfile', value: 'dockerfile' },
	{ name: 'Nixpacks', value: 'nixpacks' },
	{ name: 'Railpack', value: 'railpack' },
	{ name: 'Static', value: 'static' },
];

/**
 * The fields every variant accepts.
 */
const IDENTITY_FIELDS: ApplicationFieldSpec[] = [
	field(
		'project_uuid',
		'Project UUID',
		'string',
		'UUID of the project the application belongs to',
		{
			required: true,
		},
	),
	field('server_uuid', 'Server UUID', 'string', 'UUID of the server that hosts the application', {
		required: true,
	}),
	field(
		'environment_name',
		'Environment Name',
		'string',
		'Name of the environment. The API needs the environment name or the environment UUID',
	),
	field(
		'environment_uuid',
		'Environment UUID',
		'string',
		'UUID of the environment. The API needs the environment name or the environment UUID',
	),
	field(
		'destination_uuid',
		'Destination UUID',
		'string',
		'UUID of the destination. The API needs it when the server has more than one destination',
	),
	field(
		'name',
		'Name',
		'string',
		'Name of the application. The API generates a name when it is not given',
	),
	field('description', 'Description', 'string', 'Description of the application'),
];

/**
 * The optional fields every variant accepts.
 */
const COMMON_FIELDS: ApplicationFieldSpec[] = [
	field(
		'domains',
		'Domains',
		'string',
		'Comma-separated list of the URLs of the application. It cannot be used for a Docker Compose application',
	),
	field(
		'noindex_domains',
		'Noindex Domains',
		'stringList',
		'Domains that are served with a noindex header. They have to be part of the domains',
	),
	field(
		'ports_exposes',
		'Ports Exposes',
		'string',
		'Ports the container exposes, for example 80,443',
	),
	field(
		'ports_mappings',
		'Ports Mappings',
		'string',
		'Port mappings of the container, for example 80:80,443:443',
	),
	field(
		'instant_deploy',
		'Instant Deploy',
		'boolean',
		'Whether a deployment is queued right away. It needs a token with the deploy ability',
	),
	field(
		'tags',
		'Tags',
		'stringList',
		'Tags of the application. Every tag needs at least two characters',
	),
	field(
		'autogenerate_domain',
		'Auto Generate Domain',
		'boolean',
		'Whether the API generates a domain when the application has no domain',
		{ defaultValue: true, apiDefault: true },
	),
	field(
		'force_domain_override',
		'Force Domain Override',
		'boolean',
		'Whether the domains are used even when they conflict with another resource',
	),
	field(
		'redirect',
		'Redirect',
		'options',
		'How the redirect between the domain with and without www is set',
		{
			options: [
				{ name: 'No Redirect', value: '' },
				{ name: 'WWW', value: 'www' },
				{ name: 'Non WWW', value: 'non-www' },
				{ name: 'Both', value: 'both' },
			],
		},
	),
];

/**
 * The fields of the deployment settings.
 */
const DEPLOYMENT_FIELDS: ApplicationFieldSpec[] = [
	field(
		'is_force_https_enabled',
		'Is Force Https Enabled',
		'boolean',
		'Whether HTTPS is forced for the application',
		{ defaultValue: true, apiDefault: true },
	),
	field(
		'is_preview_deployments_enabled',
		'Is Preview Deployments Enabled',
		'boolean',
		'Whether preview deployments are enabled for pull requests',
	),
	field(
		'is_log_drain_enabled',
		'Is Log Drain Enabled',
		'boolean',
		'Whether the logs of the application are drained',
	),
	field(
		'is_raw_compose_deployment_enabled',
		'Is Raw Compose Deployment Enabled',
		'boolean',
		'Whether the raw Docker Compose definition is deployed. It only works for a Docker Compose application',
	),
	field(
		'use_build_server',
		'Use Build Server',
		'boolean',
		'Whether the application is built on the build server of the instance',
	),
	field(
		'use_build_secrets',
		'Use Build Secrets',
		'boolean',
		'Whether Docker build secrets are used for the build time environment variables',
	),
	field(
		'is_env_sorting_enabled',
		'Is Env Sorting Enabled',
		'boolean',
		'Whether the environment variables are sorted',
	),
	field(
		'is_pr_deployments_public_enabled',
		'Is Pr Deployments Public Enabled',
		'boolean',
		'Whether the pull request deployments are public',
	),
	field(
		'stop_grace_period',
		'Stop Grace Period',
		'number',
		'Grace period in seconds before the container is stopped',
		{ defaultValue: 30 },
	),
	field(
		'docker_images_to_keep',
		'Docker Images To Keep',
		'number',
		'Number of Docker images that are kept',
		{ defaultValue: 0 },
	),
	field(
		'max_restart_count',
		'Max Restart Count',
		'number',
		'Number of restarts of the container before it is stopped',
		{ defaultValue: 0 },
	),
	field(
		'preview_url_template',
		'Preview URL Template',
		'string',
		'Template of the URL of a preview deployment',
	),
	field(
		'connect_to_docker_network',
		'Connect To Docker Network',
		'boolean',
		'Whether the application is connected to the predefined Docker network',
	),
];

/**
 * The build flags every variant accepts.
 */
const BUILD_FIELDS: ApplicationFieldSpec[] = [
	field(
		'is_git_submodules_enabled',
		'Is Git Submodules Enabled',
		'boolean',
		'Whether the Git submodules are cloned',
	),
	field('is_git_lfs_enabled', 'Is Git Lfs Enabled', 'boolean', 'Whether Git LFS is enabled'),
	field(
		'is_git_shallow_clone_enabled',
		'Is Git Shallow Clone Enabled',
		'boolean',
		'Whether the repository is cloned shallow',
	),
	field(
		'disable_build_cache',
		'Disable Build Cache',
		'boolean',
		'Whether the build cache is disabled',
	),
	field(
		'inject_build_args_to_dockerfile',
		'Inject Build Args To Dockerfile',
		'boolean',
		'Whether the build arguments are injected into the Dockerfile build',
	),
	field(
		'include_source_commit_in_build',
		'Include Source Commit In Build',
		'boolean',
		'Whether the source commit is included in the build',
	),
	field('is_gzip_enabled', 'Is Gzip Enabled', 'boolean', 'Whether gzip compression is enabled'),
	field(
		'is_stripprefix_enabled',
		'Is Stripprefix Enabled',
		'boolean',
		'Whether the path prefix is stripped',
	),
];

/**
 * The build settings of the variants that build the application from a Git
 * repository.
 */
const GIT_BUILD_FIELDS: ApplicationFieldSpec[] = [
	field('git_commit_sha', 'Git Commit Sha', 'string', 'Commit SHA that is deployed'),
	field('base_directory', 'Base Directory', 'string', 'Base directory for all commands'),
	field('is_static', 'Is Static', 'boolean', 'Whether the application is a static site'),
	field(
		'is_spa',
		'Is Spa',
		'boolean',
		'Whether the application is a single page application. It only applies when the application is static',
	),
	field(
		'is_auto_deploy_enabled',
		'Is Auto Deploy Enabled',
		'boolean',
		'Whether a deployment is queued on a push to the repository',
		{ defaultValue: true, apiDefault: true },
	),
	field('static_image', 'Static Image', 'options', 'Image that serves a static application', {
		options: [{ name: 'Nginx Alpine', value: 'nginx:alpine' }],
	}),
	field(
		'install_command',
		'Install Command',
		'string',
		'Command that installs the dependencies of the application',
	),
	field('build_command', 'Build Command', 'string', 'Command that builds the application'),
	field('start_command', 'Start Command', 'string', 'Command that starts the application'),
	field(
		'publish_directory',
		'Publish Directory',
		'string',
		'Directory that is published for a static application',
	),
	field(
		'dockerfile',
		'Dockerfile',
		'string',
		'Content of the Dockerfile that is deployed with the repository',
		{ rows: 6 },
	),
	field(
		'dockerfile_location',
		'Dockerfile Location',
		'string',
		'Path of the Dockerfile inside the repository',
	),
	field(
		'docker_compose_location',
		'Docker Compose Location',
		'string',
		'Path of the Docker Compose file inside the repository',
	),
	field(
		'docker_compose_custom_start_command',
		'Docker Compose Custom Start Command',
		'string',
		'Command that starts the Docker Compose application',
	),
	field(
		'docker_compose_custom_build_command',
		'Docker Compose Custom Build Command',
		'string',
		'Command that builds the Docker Compose application',
	),
	field(
		'docker_compose_domains',
		'Docker Compose Domains',
		'composeDomains',
		'Domains per Docker Compose service. The top level domains cannot be used for a Docker Compose application',
	),
	field('watch_paths', 'Watch Paths', 'string', 'Watch paths of the repository, one per line', {
		rows: 3,
	}),
	field(
		'is_preserve_repository_enabled',
		'Is Preserve Repository Enabled',
		'boolean',
		'Whether the repository is kept when the application is updated',
	),
];

/**
 * The fields of the health check settings.
 */
const HEALTH_CHECK_FIELDS: ApplicationFieldSpec[] = [
	field(
		'health_check_enabled',
		'Health Check Enabled',
		'boolean',
		'Whether the container has a health check',
	),
	field('health_check_path', 'Health Check Path', 'string', 'Path the health check requests'),
	field('health_check_port', 'Health Check Port', 'string', 'Port the health check requests'),
	field(
		'health_check_host',
		'Health Check Host',
		'string',
		'Host the health check requests. It has to be a hostname or an IP address',
	),
	field('health_check_method', 'Health Check Method', 'options', 'Method the health check uses', {
		options: [
			{ name: 'GET', value: 'GET' },
			{ name: 'HEAD', value: 'HEAD' },
			{ name: 'POST', value: 'POST' },
			{ name: 'OPTIONS', value: 'OPTIONS' },
		],
	}),
	field(
		'health_check_return_code',
		'Health Check Return Code',
		'number',
		'Status code the health check expects',
		{ defaultValue: 200 },
	),
	field('health_check_scheme', 'Health Check Scheme', 'options', 'Scheme the health check uses', {
		options: [
			{ name: 'HTTP', value: 'http' },
			{ name: 'HTTPS', value: 'https' },
		],
	}),
	field(
		'health_check_response_text',
		'Health Check Response Text',
		'string',
		'Text the health check expects in the response',
	),
	field(
		'health_check_interval',
		'Health Check Interval',
		'number',
		'Interval in seconds between two health checks',
		{ defaultValue: 10 },
	),
	field(
		'health_check_timeout',
		'Health Check Timeout',
		'number',
		'Time in seconds the health check may take',
		{ defaultValue: 10 },
	),
	field(
		'health_check_retries',
		'Health Check Retries',
		'number',
		'Number of retries before the container is marked as unhealthy',
		{ defaultValue: 3 },
	),
	field(
		'health_check_start_period',
		'Health Check Start Period',
		'number',
		'Time in seconds the container needs to start before the health check counts',
		{ defaultValue: 0 },
	),
];

/**
 * The fields of the resource limit settings.
 */
const LIMIT_FIELDS: ApplicationFieldSpec[] = [
	field('limits_memory', 'Limits Memory', 'string', 'Memory limit of the container'),
	field('limits_memory_swap', 'Limits Memory Swap', 'string', 'Memory swap limit of the container'),
	field(
		'limits_memory_swappiness',
		'Limits Memory Swappiness',
		'number',
		'Memory swappiness of the container',
		{ defaultValue: 0 },
	),
	field(
		'limits_memory_reservation',
		'Limits Memory Reservation',
		'string',
		'Memory reservation of the container',
	),
	field('limits_cpus', 'Limits Cpus', 'string', 'CPU limit of the container'),
	field('limits_cpuset', 'Limits Cpuset', 'string', 'CPU set of the container'),
	field('limits_cpu_shares', 'Limits Cpu Shares', 'number', 'CPU shares of the container', {
		defaultValue: 0,
	}),
];

/**
 * The fields of the Docker settings.
 */
const DOCKER_FIELDS: ApplicationFieldSpec[] = [
	field('custom_labels', 'Custom Labels', 'string', 'Custom labels of the container', {
		rows: 3,
	}),
	field(
		'custom_docker_run_options',
		'Custom Docker Run Options',
		'string',
		'Custom options of the docker run command',
		{ rows: 3 },
	),
	field(
		'is_container_label_escape_enabled',
		'Is Container Label Escape Enabled',
		'boolean',
		'Whether the special characters of a label are escaped',
		{ defaultValue: true, apiDefault: true },
	),
	field(
		'is_consistent_container_name_enabled',
		'Is Consistent Container Name Enabled',
		'boolean',
		'Whether the container keeps the same name across deployments',
	),
	field(
		'custom_internal_name',
		'Custom Internal Name',
		'string',
		'Custom name of the container inside the Docker network',
	),
	field(
		'custom_container_name_prefix',
		'Custom Container Name Prefix',
		'string',
		'Prefix of the generated container names',
	),
	field(
		'is_http_basic_auth_enabled',
		'Is Http Basic Auth Enabled',
		'boolean',
		'Whether the application is protected with HTTP basic authentication',
	),
	field(
		'http_basic_auth_username',
		'Http Basic Auth Username',
		'string',
		'User name of the HTTP basic authentication',
	),
	field(
		'http_basic_auth_password',
		'Http Basic Auth Password',
		'string',
		'Password of the HTTP basic authentication',
		{ secret: true },
	),
	field('is_gpu_enabled', 'Is Gpu Enabled', 'boolean', 'Whether the container uses a GPU'),
	field('gpu_driver', 'Gpu Driver', 'string', 'Name of the GPU driver'),
	field('gpu_count', 'Gpu Count', 'string', 'Number of GPUs the container uses'),
	field('gpu_device_ids', 'Gpu Device Ids', 'string', 'Comma-separated list of the GPU device IDs'),
	field('gpu_options', 'Gpu Options', 'string', 'Options of the GPU runtime'),
];

/**
 * The fields of the manual webhook secrets.
 */
const WEBHOOK_FIELDS: ApplicationFieldSpec[] = [
	field(
		'manual_webhook_secret_github',
		'Manual Webhook Secret Github',
		'string',
		'Manual webhook secret for GitHub. It needs a token with the deploy ability',
		{ secret: true },
	),
	field(
		'manual_webhook_secret_gitlab',
		'Manual Webhook Secret Gitlab',
		'string',
		'Manual webhook secret for GitLab. It needs a token with the deploy ability',
		{ secret: true },
	),
	field(
		'manual_webhook_secret_bitbucket',
		'Manual Webhook Secret Bitbucket',
		'string',
		'Manual webhook secret for Bitbucket. It needs a token with the deploy ability',
		{ secret: true },
	),
	field(
		'manual_webhook_secret_gitea',
		'Manual Webhook Secret Gitea',
		'string',
		'Manual webhook secret for Gitea. It needs a token with the deploy ability',
		{ secret: true },
	),
];

/**
 * The fields of the deployment commands.
 */
const COMMAND_FIELDS: ApplicationFieldSpec[] = [
	field(
		'post_deployment_command',
		'Post Deployment Command',
		'string',
		'Command that runs after the deployment',
		{ rows: 3 },
	),
	field(
		'post_deployment_command_container',
		'Post Deployment Command Container',
		'string',
		'Container the command after the deployment runs in',
	),
	field(
		'pre_deployment_command',
		'Pre Deployment Command',
		'string',
		'Command that runs before the deployment',
		{ rows: 3 },
	),
	field(
		'pre_deployment_command_container',
		'Pre Deployment Command Container',
		'string',
		'Container the command before the deployment runs in',
	),
];

/**
 * The source fields of a variant.
 */
const SOURCE_FIELDS: Record<ApplicationCreateVariant, ApplicationFieldSpec[]> = {
	public: [
		field('git_repository', 'Git Repository', 'string', 'URL of the public Git repository', {
			required: true,
		}),
		field('git_branch', 'Git Branch', 'string', 'Branch of the Git repository', {
			required: true,
		}),
		field('build_pack', 'Build Pack', 'options', 'Build pack of the application', {
			required: true,
			options: BUILD_PACK_OPTIONS,
		}),
		field(
			'docker_registry_image_name',
			'Docker Registry Image Name',
			'string',
			'Name of the Docker image the application uses',
		),
		field(
			'docker_registry_image_tag',
			'Docker Registry Image Tag',
			'string',
			'Tag of the Docker image the application uses',
		),
	],
	githubApp: [
		field('git_repository', 'Git Repository', 'string', 'URL of the private Git repository', {
			required: true,
		}),
		field('git_branch', 'Git Branch', 'string', 'Branch of the Git repository', {
			required: true,
		}),
		field('build_pack', 'Build Pack', 'options', 'Build pack of the application', {
			required: true,
			options: BUILD_PACK_OPTIONS,
		}),
		field(
			'github_app_uuid',
			'GitHub App UUID',
			'string',
			'UUID of the GitHub App that gives access to the private repository',
			{ required: true },
		),
		field(
			'docker_registry_image_name',
			'Docker Registry Image Name',
			'string',
			'Name of the Docker image the application uses',
		),
		field(
			'docker_registry_image_tag',
			'Docker Registry Image Tag',
			'string',
			'Tag of the Docker image the application uses',
		),
	],
	privateRepository: [
		field('git_repository', 'Git Repository', 'string', 'URL of the private Git repository', {
			required: true,
		}),
		field('git_branch', 'Git Branch', 'string', 'Branch of the Git repository', {
			required: true,
		}),
		field('build_pack', 'Build Pack', 'options', 'Build pack of the application', {
			required: true,
			options: BUILD_PACK_OPTIONS,
		}),
		field(
			'private_key_uuid',
			'Private Key UUID',
			'string',
			'UUID of the private key that gives access to the private repository',
			{ required: true },
		),
		field(
			'docker_registry_image_name',
			'Docker Registry Image Name',
			'string',
			'Name of the Docker image the application uses',
		),
		field(
			'docker_registry_image_tag',
			'Docker Registry Image Tag',
			'string',
			'Tag of the Docker image the application uses',
		),
	],
	dockerfile: [
		field(
			'dockerfile',
			'Dockerfile',
			'string',
			'Content of the Dockerfile. The node encodes it as base64, which is what the API expects',
			{ required: true, rows: 8 },
		),
		field(
			'build_pack',
			'Build Pack',
			'options',
			'Build pack of the application. The API fixes it to Dockerfile for this variant',
			{ options: [{ name: 'Dockerfile', value: 'dockerfile' }], defaultValue: 'dockerfile' },
		),
		field('base_directory', 'Base Directory', 'string', 'Base directory for all commands'),
		field(
			'docker_registry_image_name',
			'Docker Registry Image Name',
			'string',
			'Name of the Docker image the application uses',
		),
		field(
			'docker_registry_image_tag',
			'Docker Registry Image Tag',
			'string',
			'Tag of the Docker image the application uses',
		),
	],
	dockerImage: [
		field(
			'docker_registry_image_name',
			'Docker Registry Image Name',
			'string',
			'Name of the Docker image the application uses',
			{ required: true },
		),
		field(
			'docker_registry_image_tag',
			'Docker Registry Image Tag',
			'string',
			'Tag of the Docker image the application uses',
		),
	],
};

/**
 * A group of fields and the variants that accept them.
 */
interface ApplicationFieldGroupSpec {
	group: ApplicationFieldGroup;
	variants: ApplicationCreateVariant[];
	fields: ApplicationFieldSpec[];
}

/**
 * The groups of the creation request and the variants that accept them.
 */
const FIELD_GROUPS: ApplicationFieldGroupSpec[] = [
	{
		group: 'identity',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: IDENTITY_FIELDS,
	},
	{
		group: 'source',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: [],
	},
	{
		group: 'common',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: COMMON_FIELDS,
	},
	{
		group: 'deployment',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: DEPLOYMENT_FIELDS,
	},
	{
		group: 'build',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: BUILD_FIELDS,
	},
	{
		group: 'gitBuild',
		variants: ['public', 'githubApp', 'privateRepository'],
		fields: GIT_BUILD_FIELDS,
	},
	{
		group: 'healthCheck',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: HEALTH_CHECK_FIELDS,
	},
	{
		group: 'limits',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: LIMIT_FIELDS,
	},
	{
		group: 'docker',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: DOCKER_FIELDS,
	},
	{
		group: 'webhooks',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: WEBHOOK_FIELDS,
	},
	{
		group: 'commands',
		variants: [...APPLICATION_CREATE_VARIANTS],
		fields: COMMAND_FIELDS,
	},
];

/**
 * A field of an application request together with the group it belongs to.
 */
export interface ApplicationGroupedFieldSpec extends ApplicationFieldSpec {
	/** The group the editor renders the field in. */
	group: ApplicationFieldGroup;
}

/**
 * The fields of a variant, in the order the editor renders them.
 *
 * @param variant The creation variant.
 * @returns The fields the variant accepts.
 */
export function applicationFieldSpecs(
	variant: ApplicationCreateVariant,
): ApplicationGroupedFieldSpec[] {
	const specs: ApplicationGroupedFieldSpec[] = [];

	for (const group of FIELD_GROUPS) {
		if (!group.variants.includes(variant)) {
			continue;
		}

		const fields = group.group === 'source' ? SOURCE_FIELDS[variant] : group.fields;

		for (const spec of fields) {
			specs.push({ ...spec, group: group.group });
		}
	}

	return specs;
}

/**
 * The groups of a variant that the editor renders as a collection.
 *
 * @param variant The creation variant.
 * @returns The groups of the variant that hold optional fields.
 */
export function applicationCollectionGroups(
	variant: ApplicationCreateVariant,
): ApplicationFieldGroupSpec[] {
	return FIELD_GROUPS.filter(
		(group) =>
			group.group !== 'identity' &&
			group.group !== 'source' &&
			group.group !== 'common' &&
			group.variants.includes(variant),
	);
}

/**
 * Read a value of the editor and decide whether it belongs in the request.
 *
 * A field is only sent when the user set it:
 *
 * - a text field is sent when it is not empty,
 * - a boolean field is sent when it is switched on, and always when the API
 *   defaults it to `true`, so the user can switch it off explicitly,
 * - a number field and a list of strings are sent when they are not empty,
 * - a collection of domains is sent when it has entries.
 *
 * @param value The value of the field in the editor.
 * @param spec The contract of the field.
 * @returns The value to send, or undefined when the field stays out of the request.
 */
export function applicationFieldValue(
	value: unknown,
	spec: ApplicationFieldSpec,
): unknown | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}

	if (spec.type === 'boolean') {
		if (typeof value !== 'boolean') {
			return undefined;
		}
		return value === true || spec.apiDefault === true ? value : undefined;
	}

	if (spec.type === 'number') {
		return typeof value === 'number' ? value : undefined;
	}

	if (spec.type === 'stringList' || spec.type === 'composeDomains') {
		if (!Array.isArray(value)) {
			return undefined;
		}
		return value.length > 0 ? value : undefined;
	}

	if (spec.type === 'options') {
		return typeof value === 'string' && value !== '' ? value : undefined;
	}

	return typeof value === 'string' && value !== '' ? value : undefined;
}

/**
 * Build the request body of an application creation request.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param variant The creation variant.
 * @returns The request body of the Coolify API.
 */
export function buildCreateApplicationBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	variant: ApplicationCreateVariant,
): IDataObject {
	const body: IDataObject = {};

	for (const spec of applicationFieldSpecs(variant)) {
		const uiName = applicationFieldUiName(spec.apiName);
		const collection =
			APPLICATION_FIELD_COLLECTIONS[spec.group as keyof typeof APPLICATION_FIELD_COLLECTIONS];

		let raw: unknown;
		if (collection) {
			const values = ctx.getNodeParameter(collection, itemIndex, {}) as IDataObject;
			raw = values?.[uiName];
		} else {
			raw = ctx.getNodeParameter(uiName, itemIndex, spec.defaultValue);
		}

		const value = applicationFieldValue(raw, spec);
		if (value === undefined) {
			continue;
		}

		body[spec.apiName] = value;
	}

	return body;
}

/**
 * Pattern the ports of a container have to match in the Coolify API.
 */
const PORTS_EXPOSES_PATTERN = /^\d+(,\d+)*$/;

/**
 * Pattern the port mappings of a container have to match in the Coolify API.
 */
const PORTS_MAPPINGS_PATTERN = /^\d+:\d+(,\d+:\d+)*$/;

/**
 * Pattern a commit SHA has to match in the Coolify API.
 */
const COMMIT_SHA_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._\-/]*$/;

/**
 * Validate the fields that every creation variant needs.
 *
 * The rules are the ones the Coolify API applies, so a request that leaves
 * them out is rejected before it is sent. The API validates the remaining
 * fields itself.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param body The request body that is built from the editor values.
 */
export function validateCreateApplicationFields(
	ctx: IExecuteFunctions,
	itemIndex: number,
	body: IDataObject,
): void {
	const fail = (message: string): never => {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	};

	if (!body.project_uuid) {
		fail('The project UUID is required to create an application');
	}
	if (!body.server_uuid) {
		fail('The server UUID is required to create an application');
	}
	if (!body.environment_name && !body.environment_uuid) {
		fail('The environment name or the environment UUID is required to create an application');
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
	if (Array.isArray(body.tags)) {
		const tooShort = body.tags.filter((tag) => typeof tag !== 'string' || tag.trim().length < 2);
		if (tooShort.length > 0) {
			fail('Every tag needs at least two characters');
		}
	}
}
