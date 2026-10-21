/**
 * The editor controls of the application field contract.
 *
 * The description of the application operations and the request builders of
 * the resource share one field contract, so the controls that render a field
 * live here. A field is therefore rendered the same way in every operation
 * that offers it.
 */

import type { INodeProperties } from 'n8n-workflow';

import {
	applicationFieldUiName,
	type ApplicationFieldSpec,
	type ApplicationGroupedFieldSpec,
} from '../../requests/application/applicationFields';

/**
 * The default value of a field, derived from its kind.
 */
export function defaultValue(spec: ApplicationFieldSpec): INodeProperties['default'] {
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
export function fieldProperty(spec: ApplicationFieldSpec): INodeProperties {
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
export function composeDomainsProperty(): INodeProperties {
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
export function collectionItemProperty(spec: ApplicationFieldSpec): INodeProperties {
	if (spec.type === 'composeDomains') {
		return composeDomainsProperty();
	}

	return fieldProperty(spec);
}

/**
 * Sort the items of a collection by their display name, the order the n8n lint
 * rules expect.
 */
export function sortedItems(specs: ApplicationGroupedFieldSpec[]): INodeProperties[] {
	return [...specs]
		.sort((left, right) => left.displayName.localeCompare(right.displayName))
		.map(collectionItemProperty);
}

/**
 * The display options that show a field for the given operations.
 */
export function showFor(operations: string[]): INodeProperties['displayOptions'] {
	return {
		show: {
			resource: ['application'],
			operation: operations,
		},
	};
}
