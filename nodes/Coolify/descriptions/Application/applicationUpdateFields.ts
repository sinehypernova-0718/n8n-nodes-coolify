/**
 * The editor description of the application update operation.
 *
 * The fields are rendered from the field contract in
 * `nodes/Coolify/requests/application/applicationUpdateFields.ts`, so the
 * editor and the request body can never disagree about a field.
 */

import type { INodeProperties } from 'n8n-workflow';

import {
	APPLICATION_UPDATE_COLLECTIONS,
	applicationUpdateCollectionGroups,
	applicationUpdateFieldSpecs,
} from '../../requests/application/applicationUpdateFields';
import { fieldProperty, showFor, sortedItems } from './applicationFieldProperties';

/**
 * The operation of the update endpoint.
 */
export const APPLICATION_UPDATE_OPERATION = 'update';

/**
 * The display name of every collection of the update operation.
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
 * The description of the application update operation.
 *
 * The update only changes the settings the user filled in, so the settings
 * that are not touched keep their current value. The identity and the source
 * of the application are rendered at the top level, every other setting is
 * rendered as a collection of optional settings.
 *
 * @returns The description of the update operation.
 */
export function applicationUpdateDescription(): INodeProperties[] {
	const properties: INodeProperties[] = [];

	const specs = applicationUpdateFieldSpecs();

	// The settings that are rendered at the top level.
	for (const spec of specs) {
		if (spec.group !== 'identity' && spec.group !== 'source') {
			continue;
		}

		properties.push({
			...fieldProperty(spec),
			displayOptions: showFor([APPLICATION_UPDATE_OPERATION]),
		});
	}

	// The optional settings, grouped in collections.
	for (const group of applicationUpdateCollectionGroups()) {
		const groupSpecs = specs.filter((spec) => spec.group === group);

		properties.push({
			displayName: COLLECTION_DISPLAY_NAMES[group],
			name: APPLICATION_UPDATE_COLLECTIONS[group],
			type: 'collection',
			default: {},
			description:
				'Optional settings of the application. The API only changes the settings that are filled in.',
			displayOptions: showFor([APPLICATION_UPDATE_OPERATION]),
			options: sortedItems(groupSpecs),
		});
	}

	return properties;
}
