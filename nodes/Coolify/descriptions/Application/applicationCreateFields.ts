/**
 * The editor description of the application creation operations.
 *
 * The fields are rendered from the field contract in
 * `nodes/Coolify/requests/application/applicationFields.ts`, so the editor and
 * the request body can never disagree about a field.
 */

import type { INodeProperties } from 'n8n-workflow';

import {
	APPLICATION_CREATE_VARIANTS,
	APPLICATION_FIELD_COLLECTIONS,
	applicationCollectionGroupsOfEveryVariant,
	applicationFieldSpecs,
	applicationGroupFieldSpecs,
	applicationSharedFieldSpecs,
	type ApplicationCreateVariant,
} from '../../requests/application/applicationFields';
import { fieldProperty, showFor, sortedItems } from './applicationFieldProperties';

/**
 * The operation of every creation variant.
 */
export const APPLICATION_CREATE_OPERATIONS: Record<ApplicationCreateVariant, string> = {
	public: 'createPublic',
	githubApp: 'createPrivateGithubApp',
	privateRepository: 'createPrivateDeployKey',
	dockerfile: 'createDockerfile',
	dockerImage: 'createDockerImage',
};

/**
 * The display name of every creation variant.
 */
const COLLECTION_DISPLAY_NAMES: Record<string, string> = {
	common: 'Application Settings',
	deployment: 'Deployment Settings',
	build: 'Build Settings',
	gitBuild: 'Git Build Settings',
	healthCheck: 'Health Check Settings',
	limits: 'Resource Limit Settings',
	docker: 'Docker Settings',
	webhooks: 'Webhook Secret Settings',
	commands: 'Deployment Command Settings',
};

/**
 * The description of the application creation operations.
 *
 * The fields of the identity, common and deployment groups are shared by all
 * creation variants, so they are rendered once and shown for every creation
 * operation. The source fields belong to a single variant, and the remaining
 * groups are rendered as a collection of optional fields.
 *
 * @returns The description of the creation operations.
 */
export function applicationCreateDescription(): INodeProperties[] {
	const properties: INodeProperties[] = [];

	const allCreateOperations = APPLICATION_CREATE_VARIANTS.map(
		(variant) => APPLICATION_CREATE_OPERATIONS[variant],
	);

	// The shared top level fields.
	for (const spec of applicationSharedFieldSpecs()) {
		if (spec.apiName === 'environment_name' || spec.apiName === 'environment_uuid') continue;
		properties.push({
			...fieldProperty(spec),
			required: spec.required,
			displayOptions: showFor(allCreateOperations),
		});
	}
	properties.push(...environmentSelectorFields('application', allCreateOperations));

	// The source fields of every variant.
	for (const variant of APPLICATION_CREATE_VARIANTS) {
		for (const spec of applicationFieldSpecs(variant)) {
			if (spec.group !== 'source') {
				continue;
			}

			properties.push({
				...fieldProperty(spec),
				required: spec.required,
				displayOptions: showFor([APPLICATION_CREATE_OPERATIONS[variant]]),
			});
		}
	}

	// The optional fields, grouped in collections.
	for (const group of applicationCollectionGroupsOfEveryVariant()) {
		const operations = group.variants.map((variant) => APPLICATION_CREATE_OPERATIONS[variant]);

		properties.push({
			displayName: COLLECTION_DISPLAY_NAMES[group.group],
			name: APPLICATION_FIELD_COLLECTIONS[
				group.group as keyof typeof APPLICATION_FIELD_COLLECTIONS
			],
			type: 'collection',
			default: {},
			description:
				'Optional settings of the application. The API only applies the fields that are filled in.',
			displayOptions: showFor(operations),
			options: sortedItems(applicationGroupFieldSpecs(group.group)),
		});
	}

	return properties;
}

function environmentSelectorFields(resource: string, operations: string[]): INodeProperties[] {
	const show = { show: { resource: [resource], operation: operations } };
	return [
		// Version 1 identified the environment through a separate selector.
		{
			displayName: 'Environment Selection',
			name: 'environmentMode',
			type: 'options',
			default: 'fromList',
			required: true,
			options: [
				{ name: 'From List', value: 'fromList' },
				{ name: 'By Name', value: 'byName' },
				{ name: 'By UUID', value: 'byUuid' },
			],
			description: 'Choose how the environment is identified',
			displayOptions: { show: { ...show.show, '@version': [1] } },
		},
		{
			displayName: 'Environment Name or ID',
			name: 'environmentNameFromList',
			type: 'options',
			default: '',
			required: true,
			typeOptions: {
				loadOptionsMethod: 'getEnvironments',
				loadOptionsDependsOn: ['projectUuid.value'],
			},
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			displayOptions: {
				show: { ...show.show, environmentMode: ['fromList'], '@version': [1] },
			},
		},
		{
			displayName: 'Environment Name',
			name: 'environmentName',
			type: 'string',
			default: '',
			required: true,
			description: 'Exact name of the environment',
			displayOptions: {
				show: { ...show.show, environmentMode: ['byName'], '@version': [1] },
			},
		},
		{
			displayName: 'Environment UUID',
			name: 'environmentUuid',
			type: 'string',
			default: '',
			required: true,
			description: 'UUID of the environment',
			displayOptions: {
				show: { ...show.show, environmentMode: ['byUuid'], '@version': [1] },
			},
		},
		// Version 2 selects the environment through a resource locator, like the server.
		{
			displayName: 'Environment Name or ID',
			name: 'environment',
			type: 'resourceLocator',
			default: { mode: 'list', value: '' },
			required: true,
			typeOptions: { loadOptionsDependsOn: ['projectUuid.value'] },
			modes: [
				{
					displayName: 'From List',
					name: 'list',
					type: 'list',
					typeOptions: { searchListMethod: 'searchEnvironments', searchable: true },
				},
				{ displayName: 'By Name', name: 'name', type: 'string' },
				{ displayName: 'By UUID', name: 'id', type: 'string' },
			],
			description:
				'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
			displayOptions: { show: { ...show.show, '@version': [2] } },
		},
	];
}
