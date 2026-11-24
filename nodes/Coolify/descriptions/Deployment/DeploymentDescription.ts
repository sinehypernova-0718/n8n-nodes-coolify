import type { INodeProperties } from 'n8n-workflow';
import { groupOptionalParameters } from '../parameterCollections';

/**
 * Description of the Coolify deployment resource.
 *
 * The operation selector lists the deployment operations this node supports.
 * An operation is only listed here once its request builder exists, so the
 * editor never offers an operation that the node cannot execute.
 */
const deploymentProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'list',
		displayOptions: {
			show: {
				resource: ['deployment'],
			},
		},
		options: [
			{
				name: 'Cancel',
				value: 'cancel',
				description:
					'Cancel a deployment by UUID. Only a deployment that is queued or in progress can be cancelled, a deployment that is finished, failed or already cancelled is answered with HTTP 400. The cancellation is queued on the server, the response does not wait for the deployment to stop.',
				action: 'Cancel a deployment',
			},
			{
				name: 'Deploy',
				value: 'deploy',
				description:
					'Deploy an application, a service or a database by UUID, or every resource that carries a tag. The API queues the deployments and returns their UUIDs, it does not wait for them to finish. Requires a token with the deploy ability.',
				action: 'Deploy a resource',
			},
			{
				name: 'Get',
				value: 'get',
				description:
					'Get a deployment by UUID. The deployment log is returned only for a token with the read:sensitive or the root ability.',
				action: 'Get a deployment',
			},
			{
				name: 'List',
				value: 'list',
				description:
					'List the deployments that are currently queued or in progress. A finished, failed or cancelled deployment is not part of the list, read it by UUID with Get instead.',
				action: 'List deployments',
			},
			{
				name: 'List Application Deployments',
				value: 'listApplicationDeployments',
				description:
					'List the deployments of an application, newest first, together with the total number of its deployments. The deployment log of each entry is returned only for a token with the read:sensitive or the root ability.',
				action: 'List the deployments of an application',
			},
		],
	},

	// ----------------------------------
	//        deployment:cancel
	// ----------------------------------
	{
		displayName: 'Deployment UUID',
		name: 'deploymentUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['cancel'],
			},
		},
		description: 'UUID of the deployment to cancel',
	},

	// ----------------------------------
	//        deployment:deploy
	// ----------------------------------
	{
		displayName: 'Resource UUID',
		name: 'resourceUuid',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: {
					searchListMethod: 'searchDeployableResources',
					searchable: true,
					// The databases of a service have no list of their own, so the
					// lookup reads them once per service. Requiring a filter keeps
					// that fan-out off the empty list, and n8n debounces the filter
					// and caches the result of each query.
					searchFilterRequired: true,
					slowLoadNotice: {
						message:
							'Selecting from the list can take a moment on a large team. Enter the UUID with "By UUID" if it is slow.',
						timeout: 10_000,
					},
				},
			},
			{ displayName: 'By UUID', name: 'id', type: 'string' },
		],
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['deploy'],
			},
		},
		description:
			'UUID of an application, a service or a database to deploy, including a database of a service. Provide this or a tag, not both. Separate several UUIDs with a comma.',
	},
	{
		displayName: 'Tag',
		name: 'tag',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchTags', searchable: true },
			},
			{ displayName: 'By Name', name: 'name', type: 'string' },
		],
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['deploy'],
			},
		},
		description:
			'Name of a tag whose applications and services are deployed. Provide this or a resource UUID, not both. Separate several tag names with a comma.',
	},
	{
		displayName: 'Force',
		name: 'force',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['deploy'],
			},
		},
		description: 'Whether to rebuild the images without the Docker build cache',
	},
	{
		displayName: 'Pull Request ID',
		name: 'pullRequestId',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: 1,
			maxValue: 2_147_483_647,
		},
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['deploy'],
			},
		},
		description:
			'Pull request ID to deploy instead of the main branch. Cannot be combined with a tag, and the pull request needs a preview deployment.',
	},
	{
		displayName: 'Docker Tag',
		name: 'dockerTag',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['deploy'],
			},
		},
		description:
			'Docker image tag of a Docker Image preview deployment. Requires a pull request ID and cannot be combined with a tag.',
	},

	// ----------------------------------
	//        deployment:get
	// ----------------------------------
	{
		displayName: 'Deployment UUID',
		name: 'deploymentUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['get'],
			},
		},
		description: 'UUID of the deployment to retrieve',
	},

	// ----------------------------------
	//        deployment:list
	// ----------------------------------
	// The list endpoint takes no parameter of this node, so it is configured
	// entirely through the operation selector.

	// ----------------------------------
	//   deployment:listApplicationDeployments
	// ----------------------------------
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
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['listApplicationDeployments'],
			},
		},
		description: 'UUID of the application whose deployments are listed',
	},
	{
		displayName: 'Skip',
		name: 'skip',
		type: 'number',
		default: 0,
		typeOptions: {
			minValue: 0,
		},
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['listApplicationDeployments'],
			},
		},
		description: 'Number of deployments to skip, counting from the newest',
	},
	{
		displayName: 'Take',
		name: 'take',
		type: 'number',
		default: 10,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['deployment'],
				operation: ['listApplicationDeployments'],
			},
		},
		description: 'Max number of deployments to return',
	},
];

export const deploymentFields = groupOptionalParameters(deploymentProperties, 'deployment');
