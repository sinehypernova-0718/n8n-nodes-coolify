/**
 * The editor description of the database update operation.
 *
 * The fields are rendered from the field contract in
 * `nodes/Coolify/requests/database/databaseUpdateFields.ts`, so the editor and
 * the request body can never disagree about a field.
 */

import type { INodeProperties } from 'n8n-workflow';

import {
	databaseUpdateCollections,
	databaseUpdateTopLevelSpecs,
} from '../../requests/database/databaseUpdateFields';
import {
	databaseFieldProperty,
	showDatabaseFor,
	sortedDatabaseItems,
} from './databaseFieldProperties';

/**
 * The operation of the update endpoint.
 */
export const DATABASE_UPDATE_OPERATION = 'update';

/**
 * The display name of every collection of the update operation.
 */
const COLLECTION_DISPLAY_NAMES: Record<string, string> = {
	publicAccess: 'Public Access',
	resourceLimits: 'Resource Limits',
	healthCheck: 'Health Check',
	postgresqlSettings: 'PostgreSQL Settings',
	mysqlSettings: 'MySQL Settings',
	mariadbSettings: 'MariaDB Settings',
	mongodbSettings: 'MongoDB Settings',
	redisSettings: 'Redis Settings',
	keydbSettings: 'KeyDB Settings',
	dragonflySettings: 'DragonFly Settings',
	clickhouseSettings: 'Clickhouse Settings',
	sqliteSettings: 'SQLite Settings',
};

/**
 * The description of every collection of the update operation.
 */
const COLLECTION_DESCRIPTIONS: Record<string, string> = {
	publicAccess:
		'Optional public access settings of the database. The API only changes the settings that are filled in.',
	resourceLimits:
		'Optional resource limits of the database. The API only changes the settings that are filled in.',
	healthCheck:
		'Optional health check settings of the database. The API only changes the settings that are filled in.',
	postgresqlSettings:
		'Settings of a PostgreSQL database. The API rejects a field that belongs to another engine.',
	mysqlSettings:
		'Settings of a MySQL database. The API rejects a field that belongs to another engine.',
	mariadbSettings:
		'Settings of a MariaDB database. The API rejects a field that belongs to another engine.',
	mongodbSettings:
		'Settings of a MongoDB database. The API rejects a field that belongs to another engine.',
	redisSettings:
		'Settings of a Redis database. The API rejects a field that belongs to another engine.',
	keydbSettings:
		'Settings of a KeyDB database. The API rejects a field that belongs to another engine.',
	dragonflySettings:
		'Settings of a DragonFly database. The API rejects a field that belongs to another engine.',
	clickhouseSettings:
		'Settings of a Clickhouse database. The API rejects a field that belongs to another engine.',
	sqliteSettings:
		'Settings of a SQLite database. The API rejects a field that belongs to another engine.',
};

/**
 * The description of the database update operation.
 *
 * The update only changes the settings the user filled in, so the settings
 * that are not touched keep their current value. A boolean is a three-state
 * control, because a boolean that is simply switched off would otherwise
 * always change the setting.
 *
 * @returns The description of the update operation.
 */
export function databaseUpdateDescription(): INodeProperties[] {
	const properties: INodeProperties[] = [];

	for (const spec of databaseUpdateTopLevelSpecs()) {
		properties.push({
			...databaseFieldProperty(spec),
			displayOptions: showDatabaseFor([DATABASE_UPDATE_OPERATION]),
		});
	}

	for (const group of databaseUpdateCollections()) {
		properties.push({
			displayName: COLLECTION_DISPLAY_NAMES[group.collection],
			name: group.collection,
			type: 'collection',
			default: {},
			description: COLLECTION_DESCRIPTIONS[group.collection],
			displayOptions: showDatabaseFor([DATABASE_UPDATE_OPERATION]),
			options: sortedDatabaseItems(group.specs),
		});
	}

	return properties;
}
