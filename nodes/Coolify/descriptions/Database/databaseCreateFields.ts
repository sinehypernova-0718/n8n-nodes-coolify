/**
 * The editor description of the database creation operations.
 *
 * The fields are rendered from the field contract in
 * `nodes/Coolify/requests/database/databaseFields.ts`, so the editor and the
 * request body can never disagree about a field. Every engine has its own
 * operation, so the fields of one engine are never shown for another.
 */

import type { INodeProperties } from 'n8n-workflow';

import {
	DATABASE_CREATE_SHARED_FIELDS,
	DATABASE_ENGINE_FIELDS,
	DATABASE_ENGINES,
	DATABASE_LIMIT_FIELDS,
	DATABASE_PUBLIC_ACCESS_FIELDS,
	type DatabaseEngine,
} from '../../requests/database/databaseFields';
import {
	databaseFieldProperty,
	showDatabaseFor,
	sortedDatabaseItems,
} from './databaseFieldProperties';

/**
 * The operation of every creation variant.
 */
export const DATABASE_CREATE_OPERATIONS: Record<DatabaseEngine, string> = {
	postgresql: 'createPostgresql',
	mysql: 'createMysql',
	mariadb: 'createMariadb',
	mongodb: 'createMongodb',
	redis: 'createRedis',
	clickhouse: 'createClickhouse',
	dragonfly: 'createDragonfly',
	keydb: 'createKeydb',
	sqlite: 'createSqlite',
};

/**
 * The description of the database creation operations.
 *
 * The identity and common fields are shared by all creation variants, so they
 * are rendered once and shown for every creation operation. The fields of an
 * engine belong to a single variant, and the public access and limit fields
 * are rendered as a collection of optional settings.
 *
 * @returns The description of the creation operations.
 */
export function databaseCreateDescription(): INodeProperties[] {
	const properties: INodeProperties[] = [];

	const allCreateOperations = DATABASE_ENGINES.map((engine) => DATABASE_CREATE_OPERATIONS[engine]);

	for (const spec of DATABASE_CREATE_SHARED_FIELDS) {
		properties.push({
			...databaseFieldProperty(spec),
			...(spec.required ? { required: true } : {}),
			displayOptions: showDatabaseFor(allCreateOperations),
		});
	}

	for (const engine of DATABASE_ENGINES) {
		for (const spec of DATABASE_ENGINE_FIELDS[engine]) {
			properties.push({
				...databaseFieldProperty(spec),
				displayOptions: showDatabaseFor([DATABASE_CREATE_OPERATIONS[engine]]),
			});
		}
	}

	const operationsWithPublicAccess = DATABASE_ENGINES.filter((engine) => engine !== 'sqlite').map(
		(engine) => DATABASE_CREATE_OPERATIONS[engine],
	);

	properties.push({
		displayName: 'Public Access',
		name: 'publicAccess',
		type: 'collection',
		default: {},
		description:
			'Optional public access settings of the database. The API only applies the fields that are filled in.',
		displayOptions: showDatabaseFor(operationsWithPublicAccess),
		options: sortedDatabaseItems(DATABASE_PUBLIC_ACCESS_FIELDS),
	});

	properties.push({
		displayName: 'Resource Limits',
		name: 'resourceLimits',
		type: 'collection',
		default: {},
		description:
			'Optional resource limits of the database. The API only applies the fields that are filled in.',
		displayOptions: showDatabaseFor(allCreateOperations),
		options: sortedDatabaseItems(DATABASE_LIMIT_FIELDS),
	});

	return properties;
}
