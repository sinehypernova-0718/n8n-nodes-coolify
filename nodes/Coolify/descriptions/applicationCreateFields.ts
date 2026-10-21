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
	applicationCollectionGroups,
	applicationFieldSpecs,
	applicationFieldUiName,
	type ApplicationCreateVariant,
	type ApplicationFieldSpec,
	type ApplicationGroupedFieldSpec,
} from '../requests/application/applicationFields';

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
 * The default value of a field, derived from its kind.
 */
function defaultValue(spec: ApplicationFieldSpec): INodeProperties['default'] {
	if (spec.defaultValue !== undefined) {
		return spec.defaultValue;
	}

	switch (spec.type) {
		case 'boolean':
			return false;
		case 'number':
			return 0;
		case 'stringList':
			return [];
		case 'composeDomains':
			return [];
		case 'options':
			return spec.options?.[0]?.value ?? '';
		default:
			return '';
	}
}

/**
 * The editor control of a field.
 */
function fieldProperty(spec: ApplicationFieldSpec): INodeProperties {
	const typeOptions: INodeProperties['typeOptions'] = {};

	if (spec.secret) {
		typeOptions.password = true;
	}
	if (spec.rows) {
		typeOptions.rows = spec.rows;
	}
	if (spec.type === 'stringList') {
		typeOptions.multipleValues = true;
		typeOptions.multipleValueButtonText = 'Add Value';
	}

	return {
		displayName: spec.displayName,
		name: applicationFieldUiName(spec.apiName),
		type:
			spec.type === 'stringList'
				? 'string'
				: spec.type === 'composeDomains'
					? 'collection'
					: spec.type,
		default: defaultValue(spec),
		description: spec.description,
		typeOptions: Object.keys(typeOptions).length > 0 ? typeOptions : undefined,
		options: spec.type === 'options' ? spec.options : undefined,
	};
}

/**
 * The editor control of the Docker Compose domains.
 */
function composeDomainsProperty(): INodeProperties {
	return {
		displayName: 'Docker Compose Domains',
		name: 'dockerComposeDomains',
		type: 'collection',
		typeOptions: {
			multipleValues: true,
			multipleValueButtonText: 'Add Service Domain',
		},
		default: [],
		description:
			'Domains per Docker Compose service. The top level domains cannot be used for a Docker Compose application.',
		options: [
			{
				displayName: 'Domain',
				name: 'domain',
				type: 'string',
				default: '',
				description: 'Comma-separated list of the URLs of the service',
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
					{ name: 'No Redirect', value: '' },
					{ name: 'WWW', value: 'www' },
					{ name: 'Non WWW', value: 'non-www' },
					{ name: 'Both', value: 'both' },
				],
				default: '',
				description: 'How the redirect between the domain with and without www is set',
			},
		],
	};
}

/**
 * The editor control of a field inside a collection.
 */
function collectionItemProperty(spec: ApplicationFieldSpec): INodeProperties {
	if (spec.type === 'composeDomains') {
		return composeDomainsProperty();
	}

	return fieldProperty(spec);
}

/**
 * Sort the items of a collection by their display name, the order the n8n lint
 * rules expect.
 */
function sortedItems(specs: ApplicationGroupedFieldSpec[]): INodeProperties[] {
	return [...specs]
		.sort((left, right) => left.displayName.localeCompare(right.displayName))
		.map(collectionItemProperty);
}

/**
 * The display options that show a field for the given operations.
 */
function showFor(operations: string[]): INodeProperties['displayOptions'] {
	return {
		show: {
			resource: ['application'],
			operation: operations,
		},
	};
}

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
	for (const spec of applicationFieldSpecs('public')) {
		if (spec.group !== 'identity' && spec.group !== 'common') {
			continue;
		}

		properties.push({
			...fieldProperty(spec),
			required: spec.required,
			displayOptions: showFor(allCreateOperations),
		});
	}

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
	for (const group of applicationCollectionGroups('public')) {
		const variants = APPLICATION_CREATE_VARIANTS.filter((variant) =>
			group.variants.includes(variant),
		);
		const operations = variants.map((variant) => APPLICATION_CREATE_OPERATIONS[variant]);
		const specs = applicationFieldSpecs(variants[0]).filter((spec) => spec.group === group.group);

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
			options: sortedItems(specs),
		});
	}

	return properties;
}
