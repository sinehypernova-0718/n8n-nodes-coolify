import type { IDisplayOptions, INodeProperties } from 'n8n-workflow';
import { operationOptionsParameterName } from '../shared/parameterResolution';

/**
 * Rewrite the display conditions of a field that is moved into an operation collection.
 *
 * n8n evaluates a nested field's condition keys against the collection, so a key that
 * named a field of the node root, such as `resource` or `operation`, matches nothing
 * there and the option is treated as hidden. `n8n-workflow` resolves a key that starts
 * with `/` against the node root instead, so those keys are made root-relative here. A
 * key that names a sibling of the same collection stays relative, and the special
 * `@version` / `@tool` / `@feature` keys are left untouched.
 *
 * @param conditions The `show` or `hide` conditions of the field.
 * @param siblingNames The names of the fields of the same collection.
 * @returns The conditions with the root-level keys made root-relative.
 */
function rootRelativeConditions(
	conditions: IDisplayOptions['show'],
	siblingNames: Set<string>,
): IDisplayOptions['show'] {
	if (!conditions) return undefined;

	const rewritten: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(conditions as Record<string, unknown>)) {
		const keepRelative = key.startsWith('@') || key.startsWith('/') || siblingNames.has(key);
		rewritten[keepRelative ? key : `/${key}`] = value;
	}
	return rewritten as IDisplayOptions['show'];
}

/**
 * Make the display conditions of a grouped field resolve against the node root.
 *
 * @param displayOptions The display options of the field.
 * @param siblingNames The names of the fields of the same collection.
 * @returns The display options of the field inside the collection.
 */
function rootRelativeDisplayOptions(
	displayOptions: INodeProperties['displayOptions'],
	siblingNames: Set<string>,
): INodeProperties['displayOptions'] {
	if (!displayOptions) return undefined;

	return {
		...displayOptions,
		show: rootRelativeConditions(displayOptions.show, siblingNames),
		hide: rootRelativeConditions(displayOptions.hide, siblingNames),
	};
}

const COLLECTION_LABELS: Record<string, string> = {
	list: 'Filter Options',
	delete: 'Deletion Options',
	createEnv: 'Environment Variable Options',
	updateEnv: 'Environment Variable Options',
	start: 'Deployment Options',
	stop: 'Stop Options',
	createStorage: 'Storage Options',
	updateStorage: 'Storage Options',
	setStorageBackupSchedule: 'Schedule Options',
	createPreviewDeployment: 'Preview Deployment Options',
	updatePreviewDomains: 'Preview Domain Options',
	getLogs: 'Log Options',
	getPreviewLogs: 'Log Options',
	clone: 'Clone Options',
	migrate: 'Migration Options',
	update: 'Update Options',
	createTag: 'Tag Options',
	createPublic: 'Application Options',
	createPrivateGithubApp: 'Application Options',
	createPrivateDeployKey: 'Application Options',
	createDockerfile: 'Application Options',
	createDockerImage: 'Application Options',
	createPostgresql: 'Database Options',
	createMysql: 'Database Options',
	createMariadb: 'Database Options',
	createMongodb: 'Database Options',
	createRedis: 'Database Options',
	createClickhouse: 'Database Options',
	createDragonfly: 'Database Options',
	createKeydb: 'Database Options',
	createSqlite: 'Database Options',
};

/** Group optional operation fields while retaining the resource field definitions as the source of truth. */
export function groupOptionalParameters(
	properties: INodeProperties[],
	resource: 'application' | 'database' | 'cloudInitScript' | 'auditEvent',
): INodeProperties[] {
	const groups = new Map<string, INodeProperties[]>();
	const retained: INodeProperties[] = [];
	for (const property of properties) {
		const show = property.displayOptions?.show;
		const operations = show?.operation;
		if (
			property.required === true ||
			property.type === 'notice' ||
			property.type === 'collection' ||
			!Array.isArray(show?.resource) ||
			!show.resource.includes(resource) ||
			!Array.isArray(operations)
		) {
			retained.push(property);
			continue;
		}
		for (const operation of operations) {
			if (typeof operation !== 'string' || operation === 'legacy') continue;
			const items = groups.get(operation) ?? [];
			const item = { ...property };
			delete item.required;
			items.push(item);
			groups.set(operation, items);
		}
	}
	for (const [operation, options] of groups) {
		const siblingNames = new Set(options.map((option) => option.name));
		for (const option of options) {
			option.displayOptions = rootRelativeDisplayOptions(option.displayOptions, siblingNames);
		}

		retained.push({
			displayName: COLLECTION_LABELS[operation] ?? 'Optional Settings',
			name: operationOptionsParameterName(resource, operation),
			type: 'collection',
			default: {},
			description: 'Optional settings for this operation',
			displayOptions: { show: { resource: [resource], operation: [operation] } },
			options: options.sort((left, right) => left.displayName.localeCompare(right.displayName)),
		});
	}
	return retained;
}
