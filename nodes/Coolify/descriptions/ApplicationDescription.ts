import type { INodeProperties } from 'n8n-workflow';

import { applicationCreateDescription } from './applicationCreateFields';

/**
 * Description of the Coolify application resource.
 *
 * The operation selector lists the application operations this node supports.
 * An operation is only listed here once its request builder exists, so the
 * editor never offers an operation that the node cannot execute.
 */
export const applicationFields: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['application'],
			},
		},
		options: [
			{
				name: 'Add Destination',
				value: 'addDestination',
				description: 'Attach an additional destination to an application',
				action: 'Add a destination',
			},
			{
				name: 'Create (Docker Image Without Git)',
				value: 'createDockerImage',
				description: 'Create a new application from a prebuilt Docker image',
				action: 'Create an application',
			},
			{
				name: 'Create (Dockerfile Without Git)',
				value: 'createDockerfile',
				description: 'Create a new application from a Dockerfile',
				action: 'Create an application',
			},
			{
				name: 'Create (Private - Deploy Key)',
				value: 'createPrivateDeployKey',
				description: 'Create a new application from a private repository through a deploy key',
				action: 'Create an application',
			},
			{
				name: 'Create (Private - GH App)',
				value: 'createPrivateGithubApp',
				description: 'Create a new application from a private repository through a GitHub App',
				action: 'Create an application',
			},
			{
				name: 'Create (Public)',
				value: 'createPublic',
				description: 'Create a new application from a public Git repository',
				action: 'Create an application',
			},
			{
				name: 'Create Env',
				value: 'createEnv',
				description: 'Create an environment variable on an application',
				action: 'Create an environment variable',
			},
			{
				name: 'Create Preview Deployment',
				value: 'createPreviewDeployment',
				description: 'Open a preview deployment for a pull request and queue its deployment',
				action: 'Create a preview deployment',
			},
			{
				name: 'Create Storage',
				value: 'createStorage',
				description: 'Create a storage for an application',
				action: 'Create a storage',
			},
			{
				name: 'Create Tag',
				value: 'createTag',
				description: 'Add a tag to an application',
				action: 'Add a tag',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete an application by UUID',
				action: 'Delete an application',
			},
			{
				name: 'Delete Env',
				value: 'deleteEnv',
				description: 'Delete an environment variable of an application',
				action: 'Delete an environment variable',
			},
			{
				name: 'Delete Preview Deployment',
				value: 'deletePreviewDeployment',
				description:
					'Delete a preview deployment. The running deployments are cancelled, the containers are stopped and the volumes and networks of the preview are removed.',
				action: 'Delete a preview deployment',
			},
			{
				name: 'Delete Storage',
				value: 'deleteStorage',
				description: 'Delete a storage of an application',
				action: 'Delete a storage',
			},
			{
				name: 'Delete Storage Backup Schedule',
				value: 'deleteStorageBackupSchedule',
				description:
					'Delete the backup schedule of a storage, together with its existing local and S3 backup archives',
				action: 'Delete a backup schedule',
			},
			{
				name: 'Delete Tag',
				value: 'deleteTag',
				description: 'Remove a tag from an application',
				action: 'Remove a tag',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get a single application by UUID',
				action: 'Get an application',
			},
			{
				name: 'Get Application Logs',
				value: 'getLogs',
				description:
					'Get the container logs of an application. Requires a token with the read:sensitive or root ability.',
				action: 'Get application logs',
			},
			{
				name: 'Get Preview Application Logs',
				value: 'getPreviewLogs',
				description:
					'Get the container logs of a preview deployment. Requires a token with the read:sensitive or root ability and Coolify 4.4.0 or newer.',
				action: 'Get preview application logs',
			},
			{
				name: 'Get Preview Deployment',
				value: 'getPreviewDeployment',
				description:
					'Get a preview deployment by pull request ID. Requires Coolify 4.4.0 or newer.',
				action: 'Get a preview deployment',
			},
			{
				name: 'List',
				value: 'list',
				description: 'List the applications of the team',
				action: 'List applications',
			},
			{
				name: 'List Destinations',
				value: 'listDestinations',
				description: 'List the destinations of an application',
				action: 'List destinations',
			},
			{
				name: 'List Envs',
				value: 'listEnvs',
				description: 'List the environment variables of an application',
				action: 'List environment variables',
			},
			{
				name: 'List Preview Deployments',
				value: 'listPreviewDeployments',
				description:
					'List the preview deployments of an application. Requires Coolify 4.4.0 or newer.',
				action: 'List preview deployments',
			},
			{
				name: 'List Rollback Images',
				value: 'listRollbackImages',
				description: 'List the images an application can be rolled back to',
				action: 'List rollback images',
			},
			{
				name: 'List Storages',
				value: 'listStorages',
				description: 'List the storages of an application',
				action: 'List storages',
			},
			{
				name: 'List Tags',
				value: 'listTags',
				description: 'List the tags of an application',
				action: 'List tags',
			},
			{
				name: 'Remove Destination',
				value: 'removeDestination',
				description: 'Detach a destination from an application',
				action: 'Remove a destination',
			},
			{
				name: 'Restart',
				value: 'restart',
				description: 'Restart an application by UUID',
				action: 'Restart an application',
			},
			{
				name: 'Run Storage Backup',
				value: 'runStorageBackup',
				description: 'Queue an immediate backup of a storage',
				action: 'Run a storage backup',
			},
			{
				name: 'Set Storage Backup Schedule',
				value: 'setStorageBackupSchedule',
				description: 'Create or replace the backup schedule of a storage',
				action: 'Set a backup schedule',
			},
			{
				name: 'Start',
				value: 'start',
				description: 'Start an application by UUID',
				action: 'Start an application',
			},
			{
				name: 'Stop',
				value: 'stop',
				description: 'Stop an application by UUID',
				action: 'Stop an application',
			},
			{
				name: 'Update Env',
				value: 'updateEnv',
				description: 'Update an environment variable of an application',
				action: 'Update an environment variable',
			},
			{
				name: 'Update Envs (Bulk)',
				value: 'updateEnvsBulk',
				description: 'Update several environment variables of an application at once',
				action: 'Update environment variables',
			},
			{
				name: 'Update Preview Domains',
				value: 'updatePreviewDomains',
				description: 'Replace the domains of a preview deployment',
				action: 'Update preview domains',
			},
			{
				name: 'Update Storage',
				value: 'updateStorage',
				description: 'Update a storage of an application',
				action: 'Update a storage',
			},
		],
		default: 'list',
	},

	// ----------------------------------
	//        application:list
	// ----------------------------------
	{
		displayName: 'Tag',
		name: 'tag',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['list'],
			},
		},
		description: 'Filter the applications by tag name',
	},

	// ----------------------------------
	//        application:get
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['get'],
			},
		},
		description: 'UUID of the application to retrieve',
	},

	// ----------------------------------
	//       application:delete
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'deleteWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['delete'],
			},
		},
		description: 'Deleting an application removes it, and optionally its configuration and volumes',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['delete'],
			},
		},
		description: 'UUID of the application to delete',
	},
	{
		displayName: 'Delete Configurations',
		name: 'deleteConfigurations',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['delete'],
			},
		},
		description: 'Whether to delete the configuration of the application',
	},
	{
		displayName: 'Delete Volumes',
		name: 'deleteVolumes',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['delete'],
			},
		},
		description: 'Whether to delete the volumes of the application',
	},
	{
		displayName: 'Docker Cleanup',
		name: 'dockerCleanup',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['delete'],
			},
		},
		description:
			'Whether to run a Docker cleanup on the server when its disk usage is at or above the cleanup threshold',
	},
	{
		displayName: 'Delete Connected Networks',
		name: 'deleteConnectedNetworks',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['delete'],
			},
		},
		description: 'Whether to delete the networks the application is connected to',
	},

	// ----------------------------------
	//      application:listEnvs
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['listEnvs'],
			},
		},
		description: 'UUID of the application whose environment variables are listed',
	},

	// ----------------------------------
	//     application:listStorages
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['listStorages'],
			},
		},
		description: 'UUID of the application whose storages are listed',
	},

	// ----------------------------------
	//       application:listTags
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['listTags'],
			},
		},
		description: 'UUID of the application whose tags are listed',
	},

	// ----------------------------------
	//   application:listDestinations
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['listDestinations'],
			},
		},
		description: 'UUID of the application whose destinations are listed',
	},

	// ----------------------------------
	// application:listRollbackImages
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['listRollbackImages'],
			},
		},
		description: 'UUID of the application whose rollback images are listed',
	},

	// ----------------------------------
	// application:listPreviewDeployments
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['listPreviewDeployments'],
			},
		},
		description: 'UUID of the application whose preview deployments are listed',
	},

	// ----------------------------------
	//  application:getPreviewDeployment
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getPreviewDeployment'],
			},
		},
		description: 'UUID of the application the preview deployment belongs to',
	},
	{
		displayName: 'Pull Request ID',
		name: 'pullRequestId',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 2_147_483_647,
		},
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getPreviewDeployment'],
			},
		},
		description: 'ID of the pull request the preview deployment belongs to',
	},

	// ----------------------------------
	//      application:createTag
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createTag'],
			},
		},
		description: 'UUID of the application the tag is added to',
	},
	{
		displayName: 'Tag Name',
		name: 'tagName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createTag'],
			},
		},
		description:
			'Name of the tag to add. Provide either Tag Name or Tag Names, not both. Coolify lowercases the name and removes HTML tags before it stores it.',
	},
	{
		displayName: 'Tag Names',
		name: 'tagNames',
		type: 'string',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Tag Name',
		},
		default: [],
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createTag'],
			},
		},
		description:
			'Names of the tags to add. Provide either Tag Name or Tag Names, not both. Coolify lowercases the names and removes HTML tags before it stores them.',
	},

	// ----------------------------------
	//      application:deleteTag
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteTag'],
			},
		},
		description: 'UUID of the application the tag is removed from',
	},
	{
		displayName: 'Tag UUID',
		name: 'tagUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteTag'],
			},
		},
		description: 'UUID of the tag to remove',
	},

	// ----------------------------------
	//      application:createEnv
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createEnv'],
			},
		},
		description: 'UUID of the application the environment variable is created on',
	},
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createEnv'],
			},
		},
		description:
			'Key of the environment variable, it must start with a letter or an underscore and may only contain letters, digits, underscores and dots',
	},
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createEnv'],
			},
		},
		description: 'Value of the environment variable, it may contain a secret',
	},
	{
		displayName: 'Is Preview',
		name: 'isPreview',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createEnv'],
			},
		},
		description: 'Whether the environment variable is used in preview deployments',
	},
	{
		displayName: 'Is Literal',
		name: 'isLiteral',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createEnv'],
			},
		},
		description: 'Whether the environment variable is a literal that is not expanded',
	},
	{
		displayName: 'Is Multiline',
		name: 'isMultiline',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createEnv'],
			},
		},
		description: 'Whether the environment variable spans multiple lines',
	},
	{
		displayName: 'Is Shown Once',
		name: 'isShownOnce',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createEnv'],
			},
		},
		description: 'Whether the saved value is hidden in the Coolify UI and API responses',
	},

	// ----------------------------------
	//      application:updateEnv
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'updateEnvWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description:
			'The Coolify API resets the preview, literal, multiline and shown once flags of the variable when they are not part of the request. This is a known limitation of the endpoint, it does not support a partial update that preserves the flags.',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description: 'UUID of the application the environment variable belongs to',
	},
	{
		displayName: 'Key',
		name: 'key',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description:
			'Key of the environment variable to update. The Coolify API matches the variable by its key.',
	},
	{
		displayName: 'Value',
		name: 'value',
		type: 'string',
		typeOptions: {
			password: true,
		},
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description: 'New value of the environment variable, it may contain a secret',
	},
	{
		displayName: 'Is Preview',
		name: 'isPreview',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description: 'Whether the environment variable is used in preview deployments',
	},
	{
		displayName: 'Is Literal',
		name: 'isLiteral',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description: 'Whether the environment variable is a literal that is not expanded',
	},
	{
		displayName: 'Is Multiline',
		name: 'isMultiline',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description: 'Whether the environment variable spans multiple lines',
	},
	{
		displayName: 'Is Shown Once',
		name: 'isShownOnce',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnv'],
			},
		},
		description: 'Whether the saved value is hidden in the Coolify UI and API responses',
	},

	// ----------------------------------
	//      application:deleteEnv
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteEnv'],
			},
		},
		description: 'UUID of the application the environment variable belongs to',
	},
	{
		displayName: 'Environment Variable UUID',
		name: 'envUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteEnv'],
			},
		},
		description: 'UUID of the environment variable to delete',
	},

	// ----------------------------------
	//       application:start
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['start'],
			},
		},
		description: 'UUID of the application to start',
	},
	{
		displayName: 'Force',
		name: 'force',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['start'],
			},
		},
		description: 'Whether to force a rebuild of the application',
	},
	{
		displayName: 'Instant Deploy',
		name: 'instantDeploy',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['start'],
			},
		},
		description: 'Whether to skip the deployment queue',
	},

	// ----------------------------------
	//        application:stop
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['stop'],
			},
		},
		description: 'UUID of the application to stop',
	},
	{
		displayName: 'Docker Cleanup',
		name: 'dockerCleanup',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['stop'],
			},
		},
		description:
			'Whether to run a Docker cleanup on the server when its disk usage is at or above the cleanup threshold',
	},

	// ----------------------------------
	//    application:updateEnvsBulk
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'updateEnvsBulkWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnvsBulk'],
			},
		},
		description:
			'The Coolify API resets the preview, literal, multiline and shown once flags of every updated variable when they are not part of the request. This is a known limitation of the endpoint, it does not support a partial update that preserves the flags.',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnvsBulk'],
			},
		},
		description: 'UUID of the application the environment variables belong to',
	},
	{
		displayName: 'Environment Variables',
		name: 'data',
		type: 'collection',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Environment Variable',
		},
		default: [],
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateEnvsBulk'],
			},
		},
		description:
			'The environment variables to update, the API creates the ones that do not exist yet',
		options: [
			{
				displayName: 'Is Literal',
				name: 'isLiteral',
				type: 'boolean',
				default: false,
				description: 'Whether the environment variable is a literal that is not expanded',
			},
			{
				displayName: 'Is Multiline',
				name: 'isMultiline',
				type: 'boolean',
				default: false,
				description: 'Whether the environment variable spans multiple lines',
			},
			{
				displayName: 'Is Preview',
				name: 'isPreview',
				type: 'boolean',
				default: false,
				description: 'Whether the environment variable is used in preview deployments',
			},
			{
				displayName: 'Is Shown Once',
				name: 'isShownOnce',
				type: 'boolean',
				default: false,
				description: 'Whether the saved value is hidden in the Coolify UI and API responses',
			},
			{
				displayName: 'Key',
				name: 'key',
				type: 'string',
				default: '',
				description:
					'Key of the environment variable, it must start with a letter or an underscore and may only contain letters, digits, underscores and dots',
			},
			{
				displayName: 'Value',
				name: 'value',
				type: 'string',
				typeOptions: {
					password: true,
				},
				default: '',
				description: 'Value of the environment variable, it may contain a secret',
			},
		],
	},

	// ----------------------------------
	//     application:createStorage
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createStorage'],
			},
		},
		description: 'UUID of the application the storage belongs to',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{
				name: 'Persistent',
				value: 'persistent',
			},
			{
				name: 'File',
				value: 'file',
			},
		],
		default: 'persistent',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createStorage'],
			},
		},
		description: 'Kind of the storage, a volume or a mounted file',
	},
	{
		displayName: 'Mount Path',
		name: 'mountPath',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createStorage'],
			},
		},
		description: 'Path of the storage inside the container',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createStorage'],
				type: ['persistent'],
			},
		},
		description:
			'Name of the volume, it must start with a letter or a digit and may only contain letters, digits, dots, underscores and hyphens',
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createStorage'],
				type: ['file'],
			},
		},
		description: 'Content of the mounted file',
	},
	{
		displayName: 'Is Directory',
		name: 'isDirectory',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createStorage'],
				type: ['file'],
			},
		},
		description: 'Whether the storage mounts a directory instead of a file',
	},
	{
		displayName: 'Host Path',
		name: 'fsPath',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createStorage'],
				type: ['file'],
			},
		},
		description: 'Path on the server, required for a directory mount',
	},

	// ----------------------------------
	//     application:updateStorage
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateStorage'],
			},
		},
		description: 'UUID of the application the storage belongs to',
	},
	{
		displayName: 'Storage UUID',
		name: 'storageUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateStorage'],
			},
		},
		description: 'UUID of the storage to update',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{
				name: 'Persistent',
				value: 'persistent',
			},
			{
				name: 'File',
				value: 'file',
			},
		],
		default: 'persistent',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateStorage'],
			},
		},
		description: 'Kind of the storage, a volume or a mounted file',
	},
	{
		displayName: 'Is Preview Suffix Enabled',
		name: 'isPreviewSuffixEnabled',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateStorage'],
			},
		},
		description: 'Whether a suffix is added to the storage for preview deployments',
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateStorage'],
				type: ['persistent'],
			},
		},
		description:
			'Name of the volume, it must start with a letter or a digit and may only contain letters, digits, dots, underscores and hyphens',
	},
	{
		displayName: 'Mount Path',
		name: 'mountPath',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateStorage'],
			},
		},
		description: 'Path of the storage inside the container',
	},
	{
		displayName: 'Content',
		name: 'content',
		type: 'string',
		typeOptions: {
			rows: 4,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updateStorage'],
				type: ['file'],
			},
		},
		description: 'Content of the mounted file',
	},

	// ----------------------------------
	//     application:deleteStorage
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteStorage'],
			},
		},
		description: 'UUID of the application the storage belongs to',
	},
	{
		displayName: 'Storage UUID',
		name: 'storageUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteStorage'],
			},
		},
		description: 'UUID of the storage to delete',
	},

	// ----------------------------------
	//    application:addDestination
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['addDestination'],
			},
		},
		description: 'UUID of the application the destination is attached to',
	},
	{
		displayName: 'Destination UUID',
		name: 'destinationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['addDestination'],
			},
		},
		description: 'UUID of the destination to attach',
	},

	// ----------------------------------
	//   application:removeDestination
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['removeDestination'],
			},
		},
		description: 'UUID of the application the destination is detached from',
	},
	{
		displayName: 'Destination UUID',
		name: 'destinationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['removeDestination'],
			},
		},
		description: 'UUID of the destination to detach',
	},

	// ----------------------------------
	//        application:restart
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['restart'],
			},
		},
		description: 'UUID of the application to restart',
	},

	// ----------------------------------
	//      application:runStorageBackup
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'runStorageBackupWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['runStorageBackup'],
			},
		},
		description:
			'The storage needs a backup schedule, the Coolify API rejects the request otherwise',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['runStorageBackup'],
			},
		},
		description: 'UUID of the application the storage belongs to',
	},
	{
		displayName: 'Storage UUID',
		name: 'storageUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['runStorageBackup'],
			},
		},
		description: 'UUID of the storage to back up',
	},

	// ----------------------------------
	// application:setStorageBackupSchedule
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'setStorageBackupScheduleWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description:
			'The Coolify API replaces the whole schedule with the values of this form, so every value is sent. Editing an existing schedule resets the timeout and the missing backup notification days to the values shown here.',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'UUID of the application the storage belongs to',
	},
	{
		displayName: 'Storage UUID',
		name: 'storageUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'UUID of the storage to back up',
	},
	{
		displayName: 'Frequency',
		name: 'frequency',
		type: 'string',
		default: '',
		required: true,
		placeholder: '0 2 * * *',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description:
			'Schedule of the backup as a cron or a human expression, Coolify validates the expression',
	},
	{
		displayName: 'Enabled',
		name: 'enabled',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Whether the backup schedule is enabled',
	},
	{
		displayName: 'Save To S3',
		name: 'saveS3',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Whether the backups are also stored in an S3 storage',
	},
	{
		displayName: 'S3 Storage UUID',
		name: 's3StorageUuid',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
				saveS3: [true],
			},
		},
		description: 'UUID of the S3 storage the backups are written to',
	},
	{
		displayName: 'Disable Local Backup',
		name: 'disableLocalBackup',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
				saveS3: [true],
			},
		},
		description:
			'Whether the local backups are skipped when the backups are stored in an S3 storage',
	},
	{
		displayName: 'Stop During Backup',
		name: 'stopDuringBackup',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description:
			'Whether the containers of the application are stopped during the backup. Needs a token with the deploy ability.',
	},
	{
		displayName: 'Retention Amount Locally',
		name: 'retentionAmountLocally',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 10_000,
		},
		default: 7,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Number of local backups that are kept',
	},
	{
		displayName: 'Retention Days Locally',
		name: 'retentionDaysLocally',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 2_147_483_647,
		},
		default: 0,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Number of days a local backup is kept',
	},
	{
		displayName: 'Retention Max Storage Locally',
		name: 'retentionMaxStorageLocally',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 9_999_999_999,
			numberPrecision: 2,
		},
		default: 0,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Maximum size of the local backups in bytes, zero means no limit',
	},
	{
		displayName: 'Retention Amount S3',
		name: 'retentionAmountS3',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 10_000,
		},
		default: 7,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Number of S3 backups that are kept',
	},
	{
		displayName: 'Retention Days S3',
		name: 'retentionDaysS3',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 2_147_483_647,
		},
		default: 0,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Number of days an S3 backup is kept',
	},
	{
		displayName: 'Retention Max Storage S3',
		name: 'retentionMaxStorageS3',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 9_999_999_999,
			numberPrecision: 2,
		},
		default: 0,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description: 'Maximum size of the S3 backups in bytes, zero means no limit',
	},
	{
		displayName: 'Timeout',
		name: 'timeout',
		type: 'number',
		typeOptions: {
			minValue: 60,
			maxValue: 36_000,
		},
		default: 36_000,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description:
			'Time in seconds after which a running backup is stopped. The value is always sent, so it is set to the value shown here on every request.',
	},
	{
		displayName: 'Missing Backup Notification Days',
		name: 'missingBackupNotificationDays',
		type: 'number',
		typeOptions: {
			minValue: 0,
			maxValue: 365,
		},
		default: 0,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['setStorageBackupSchedule'],
			},
		},
		description:
			'Number of days without a backup before an alert is raised, zero disables the alert. The value is always sent, so it is set to the value shown here on every request.',
	},

	// ----------------------------------
	// application:deleteStorageBackupSchedule
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'deleteStorageBackupScheduleWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteStorageBackupSchedule'],
			},
		},
		description:
			'Deleting the backup schedule also deletes the existing local and S3 backup archives of the storage, and the request is rejected while a backup or a recovery is running',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteStorageBackupSchedule'],
			},
		},
		description: 'UUID of the application the storage belongs to',
	},
	{
		displayName: 'Storage UUID',
		name: 'storageUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deleteStorageBackupSchedule'],
			},
		},
		description: 'UUID of the storage the backup schedule belongs to',
	},

	// ----------------------------------
	// application:createPreviewDeployment
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description: 'UUID of the application the preview deployment is created for',
	},
	{
		displayName: 'Pull Request ID',
		name: 'pullRequestId',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 2_147_483_647,
		},
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description: 'ID of the pull request the preview deployment belongs to',
	},
	{
		displayName: 'Pull Request URL',
		name: 'pullRequestHtmlUrl',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description: 'URL of the pull request, Coolify validates the URL',
	},
	{
		displayName: 'Git Type',
		name: 'gitType',
		type: 'options',
		options: [
			{
				name: 'Bitbucket',
				value: 'bitbucket',
			},
			{
				name: 'Gitea',
				value: 'gitea',
			},
			{
				name: 'GitHub',
				value: 'github',
			},
			{
				name: 'GitLab',
				value: 'gitlab',
			},
			{
				name: 'None',
				value: '',
			},
		],
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description:
			'Git provider that hosts the pull request. Required for an application that has no GitHub or GitLab App source.',
	},
	{
		displayName: 'Commit',
		name: 'commit',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description: 'Commit SHA that is deployed, required for a Bitbucket pull request',
	},
	{
		displayName: 'Docker Tag',
		name: 'dockerTag',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description:
			'Tag of the Docker image that is deployed. Only for an application that is built from a Docker image.',
	},
	{
		displayName: 'Force',
		name: 'force',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description: 'Whether the preview deployment is rebuilt without the build cache',
	},
	{
		displayName: 'Instant Deploy',
		name: 'instantDeploy',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['createPreviewDeployment'],
			},
		},
		description:
			'Whether the deployment is queued. Switch it off to only create the preview, for example to set its domains first.',
	},

	// ----------------------------------
	// application:deletePreviewDeployment
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'deletePreviewDeploymentWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deletePreviewDeployment'],
			},
		},
		description:
			'Deleting a preview deployment cancels its running deployments, stops its containers and removes its volumes and networks',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deletePreviewDeployment'],
			},
		},
		description: 'UUID of the application the preview deployment belongs to',
	},
	{
		displayName: 'Pull Request ID',
		name: 'pullRequestId',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 2_147_483_647,
		},
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['deletePreviewDeployment'],
			},
		},
		description: 'ID of the pull request the preview deployment belongs to',
	},

	// ----------------------------------
	//  application:updatePreviewDomains
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'updatePreviewDomainsWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
			},
		},
		description:
			'The Coolify API replaces the domains of the preview deployment, the current domains are not read and kept. The mode decides which kind of application the request is for, and the API rejects a request of the other kind.',
	},
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
			},
		},
		description: 'UUID of the application the preview deployment belongs to',
	},
	{
		displayName: 'Pull Request ID',
		name: 'pullRequestId',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 2_147_483_647,
		},
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
			},
		},
		description: 'ID of the pull request the preview deployment belongs to',
	},
	{
		displayName: 'Mode',
		name: 'mode',
		type: 'options',
		options: [
			{
				name: 'Application Domains',
				value: 'application',
			},
			{
				name: 'Docker Compose Service Domains',
				value: 'dockerCompose',
			},
		],
		default: 'application',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
			},
		},
		description:
			'Kind of application the preview deployment belongs to. Use the Docker Compose mode for an application that is built from a Docker Compose file.',
	},
	{
		displayName: 'Domains',
		name: 'domains',
		type: 'string',
		default: '',
		placeholder: 'https://preview.example.com',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
				mode: ['application'],
				removeDomains: [false],
			},
		},
		description: 'Comma-separated list of the URLs of the preview deployment',
	},
	{
		displayName: 'Remove Domains',
		name: 'removeDomains',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
				mode: ['application'],
			},
		},
		description: 'Whether the current domains of the preview deployment are removed',
	},
	{
		displayName: 'Docker Compose Domains',
		name: 'dockerComposeDomains',
		type: 'collection',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Service Domain',
		},
		default: [],
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
				mode: ['dockerCompose'],
			},
		},
		description:
			'Domains per Docker Compose service. The API removes the domain of every service that is not listed here.',
		options: [
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				default: '',
				description: 'URL of the domain of the service',
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				description: 'Name of the Docker Compose service the domain belongs to',
			},
			{
				displayName: 'Redirect',
				name: 'redirect',
				type: 'options',
				options: [
					{
						name: 'No Redirect',
						value: '',
					},
					{
						name: 'WWW',
						value: 'www',
					},
					{
						name: 'Non WWW',
						value: 'non-www',
					},
					{
						name: 'Both',
						value: 'both',
					},
				],
				default: '',
				description: 'How the redirect between the domain with and without www is set',
			},
		],
	},
	{
		displayName: 'Force Domain Override',
		name: 'forceDomainOverride',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['updatePreviewDomains'],
			},
		},
		description:
			'Whether the domains are used even when a conflict with another resource is detected',
	},

	// ----------------------------------
	//        application:getLogs
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getLogs'],
			},
		},
		description: 'UUID of the application the logs belong to',
	},
	{
		displayName: 'Lines',
		name: 'lines',
		type: 'string',
		default: '',
		placeholder: '100 or all',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getLogs'],
			},
		},
		description:
			'Number of lines to show from the end of the log, or all. The API shows the last 100 lines when the field is empty.',
	},
	{
		displayName: 'Show Timestamps',
		name: 'showTimestamps',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getLogs'],
			},
		},
		description: 'Whether the lines of the log show their timestamps',
	},
	{
		displayName: 'Service Name',
		name: 'serviceName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getLogs'],
			},
		},
		description:
			'Name of the Docker Compose service the log is read from. The API answers 404 when no running container matches the name.',
	},

	// ----------------------------------
	//     application:getPreviewLogs
	// ----------------------------------
	{
		displayName: 'Application UUID',
		name: 'applicationUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getPreviewLogs'],
			},
		},
		description: 'UUID of the application the preview deployment belongs to',
	},
	{
		displayName: 'Pull Request ID',
		name: 'pullRequestId',
		type: 'number',
		typeOptions: {
			minValue: 1,
			maxValue: 2_147_483_647,
		},
		default: 0,
		required: true,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getPreviewLogs'],
			},
		},
		description: 'ID of the pull request the preview deployment belongs to',
	},
	{
		displayName: 'Lines',
		name: 'lines',
		type: 'string',
		default: '',
		placeholder: '100 or all',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getPreviewLogs'],
			},
		},
		description:
			'Number of lines to show from the end of the log, or all. The API shows the last 100 lines when the field is empty.',
	},
	{
		displayName: 'Show Timestamps',
		name: 'showTimestamps',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getPreviewLogs'],
			},
		},
		description: 'Whether the lines of the log show their timestamps',
	},
	{
		displayName: 'Service Name',
		name: 'serviceName',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['application'],
				operation: ['getPreviewLogs'],
			},
		},
		description:
			'Name of the Docker Compose service the log is read from. The API answers 404 when no running container matches the name.',
	},

	// ----------------------------------
	//   application:create (all variants)
	// ----------------------------------
	...applicationCreateDescription(),
];
