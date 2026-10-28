/**
 * The editor controls of the database field contract.
 *
 * The description of the database operations and the request builders of the
 * resource share one field contract, so the controls that render a field live
 * here. A field is therefore rendered the same way in every operation that
 * offers it.
 */

import type { INodeProperties } from 'n8n-workflow';

import {
	databaseFieldUiName,
	type DatabaseFieldSpec,
} from '../../requests/database/databaseFields';
import {
	DATABASE_UPDATE_BOOLEAN_OPTIONS,
	DATABASE_UPDATE_UNCHANGED,
} from '../../requests/database/databaseUpdateFields';

/**
 * The default value of a field, derived from its kind.
 */
export function databaseDefaultValue(spec: DatabaseFieldSpec): INodeProperties['default'] {
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
		case 'booleanSetting':
			return DATABASE_UPDATE_UNCHANGED;
		default:
			return '';
	}
}

/**
 * The editor control of a field.
 */
export function databaseFieldProperty(spec: DatabaseFieldSpec): INodeProperties {
	const typeOptions: INodeProperties['typeOptions'] = {};

	if (spec.type === 'password') {
		typeOptions.password = true;
	}
	if (spec.rows) {
		typeOptions.rows = spec.rows;
	}
	if (spec.type === 'stringList') {
		typeOptions.multipleValues = true;
		typeOptions.multipleValueButtonText = 'Add Value';
	}
	if (spec.type === 'number') {
		if (spec.minValue !== undefined) {
			typeOptions.minValue = spec.minValue;
		}
		if (spec.maxValue !== undefined) {
			typeOptions.maxValue = spec.maxValue;
		}
	}

	const type: INodeProperties['type'] =
		spec.type === 'password' || spec.type === 'stringList' || spec.type === 'numberSetting'
			? 'string'
			: spec.type === 'booleanSetting'
				? 'options'
				: spec.type;

	return {
		displayName: spec.displayName,
		name: databaseFieldUiName(spec.apiName),
		type,
		default: databaseDefaultValue(spec),
		description: spec.description,
		typeOptions: Object.keys(typeOptions).length > 0 ? typeOptions : undefined,
		options: spec.type === 'booleanSetting' ? DATABASE_UPDATE_BOOLEAN_OPTIONS : undefined,
	};
}

/**
 * Sort the items of a collection by their display name, the order the n8n
 * lint rules expect.
 */
export function sortedDatabaseItems(specs: DatabaseFieldSpec[]): INodeProperties[] {
	return [...specs]
		.sort((left, right) => left.displayName.localeCompare(right.displayName))
		.map(databaseFieldProperty);
}

/**
 * The display options that show a field for the given operations.
 */
export function showDatabaseFor(operations: string[]): INodeProperties['displayOptions'] {
	return {
		show: {
			resource: ['database'],
			operation: operations,
		},
	};
}
