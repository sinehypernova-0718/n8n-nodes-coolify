/**
 * The field contract of the database update endpoint.
 *
 * The Coolify API updates a database with a partial update: it only changes
 * the fields of the request body and keeps every other field as it is.
 *
 * The editor therefore never sends a field the user did not touch:
 *
 * - a boolean is a three-state control, it either keeps its current value or
 *   is set to enabled or disabled,
 * - a number is a text control, it is only changed when a value is entered,
 * - a text field is only changed when it is filled in.
 *
 * The contract was verified against the `DatabasesController` of release
 * v4.5.1 (read on 2026-10-28). The update endpoint accepts the fields of the
 * engine the database belongs to; a field of another engine is answered with
 * HTTP 422. The editor cannot know the engine of a database before the
 * request, so it renders one collection per engine and the user opens the
 * collection that belongs to the database.
 *
 * Three fields of the published update schema are deliberately absent:
 * `redact_all_env_values_in_logs`, `include_coolify_default_variables` and
 * `is_log_drain_enabled`. The controller validates them, but they are missing
 * from the per-engine list of allowed fields, so a request that carries one of
 * them is answered with HTTP 422 "This field is not allowed". The same
 * behaviour was verified in Coolify v4.4.0, v4.5.0 and v4.5.1.
 */

import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import {
	databaseFieldUiName,
	encodeDatabaseConfiguration,
	validatePublicAccess,
	type DatabaseFieldSpec,
} from './databaseFields';

/**
 * The value of a three-state control that keeps the current value.
 */
export const DATABASE_UPDATE_UNCHANGED = 'unchanged';

/**
 * The choices of a three-state boolean control.
 */
export const DATABASE_UPDATE_BOOLEAN_OPTIONS = [
	{ name: 'Unchanged', value: DATABASE_UPDATE_UNCHANGED },
	{ name: 'Enabled', value: 'true' },
	{ name: 'Disabled', value: 'false' },
];

/**
 * A collection of the update operation.
 */
export interface DatabaseUpdateCollection {
	/** The name of the collection parameter in the editor. */
	collection: string;
	/** The fields the collection holds. */
	specs: DatabaseFieldSpec[];
}

/**
 * The fields of the update operation that are rendered at the top level.
 */
export function databaseUpdateTopLevelSpecs(): DatabaseFieldSpec[] {
	return [
		{
			apiName: 'name',
			displayName: 'Name',
			type: 'string',
			description: 'Name of the database. It is only changed when a value is entered.',
		},
		{
			apiName: 'description',
			displayName: 'Description',
			type: 'string',
			description:
				'Description of the database. It is only changed when a value is entered, an empty field keeps the current description.',
		},
		{
			apiName: 'image',
			displayName: 'Image',
			type: 'string',
			description: 'Docker image of the database. It is only changed when a value is entered.',
		},
		{
			apiName: 'instant_deploy',
			displayName: 'Restart After Update',
			type: 'booleanSetting',
			description:
				'Whether the database is restarted after the update. It is only changed when it is set to Enabled or Disabled, and it needs a token with the deploy permission.',
		},
	];
}

/**
 * The collections of the update operation, in the order the editor renders
 * them.
 *
 * The public access, limit and health check collections apply to every
 * engine. The nine engine collections hold the fields of one engine each; a
 * field of another engine is rejected by the API.
 */
export function databaseUpdateCollections(): DatabaseUpdateCollection[] {
	return [
		{
			collection: 'publicAccess',
			specs: [
				{
					apiName: 'is_public',
					displayName: 'Public',
					type: 'booleanSetting',
					description:
						'Whether the database is reachable through a public port. It is only changed when it is set to Enabled or Disabled, and a public port is required when it is enabled.',
				},
				{
					apiName: 'public_port',
					displayName: 'Public Port',
					type: 'numberSetting',
					description:
						'Public port of the database, between 1024 and 65535. It is only changed when a value is entered.',
					minValue: 1024,
					maxValue: 65535,
				},
				{
					apiName: 'public_port_timeout',
					displayName: 'Public Port Timeout',
					type: 'numberSetting',
					description:
						'Proxy timeout of the public port in seconds. It is only changed when a value is entered.',
					minValue: 1,
				},
			],
		},
		{
			collection: 'resourceLimits',
			specs: [
				{
					apiName: 'limits_memory',
					displayName: 'Memory Limit',
					type: 'string',
					description:
						'Memory limit of the database, for example 512m. It is only changed when a value is entered.',
				},
				{
					apiName: 'limits_memory_swap',
					displayName: 'Memory Swap Limit',
					type: 'string',
					description:
						'Memory swap limit of the database, for example 1g. It is only changed when a value is entered.',
				},
				{
					apiName: 'limits_memory_swappiness',
					displayName: 'Memory Swappiness',
					type: 'numberSetting',
					description:
						'Memory swappiness of the database. It is only changed when a value is entered.',
				},
				{
					apiName: 'limits_memory_reservation',
					displayName: 'Memory Reservation',
					type: 'string',
					description:
						'Memory reservation of the database, for example 256m. It is only changed when a value is entered.',
				},
				{
					apiName: 'limits_cpus',
					displayName: 'CPU Limit',
					type: 'string',
					description:
						'CPU limit of the database, for example 0.5. It is only changed when a value is entered.',
				},
				{
					apiName: 'limits_cpuset',
					displayName: 'CPU Set',
					type: 'string',
					description:
						'CPU set of the database, for example 0-1. It is only changed when a value is entered.',
				},
				{
					apiName: 'limits_cpu_shares',
					displayName: 'CPU Shares',
					type: 'numberSetting',
					description: 'CPU shares of the database. It is only changed when a value is entered.',
				},
			],
		},
		{
			collection: 'healthCheck',
			specs: [
				{
					apiName: 'health_check_enabled',
					displayName: 'Health Check Enabled',
					type: 'booleanSetting',
					description:
						'Whether the health check of the database is enabled. It is only changed when it is set to Enabled or Disabled.',
				},
				{
					apiName: 'health_check_interval',
					displayName: 'Health Check Interval',
					type: 'numberSetting',
					description:
						'Interval of the health check in seconds. It is only changed when a value is entered.',
					minValue: 1,
				},
				{
					apiName: 'health_check_timeout',
					displayName: 'Health Check Timeout',
					type: 'numberSetting',
					description:
						'Timeout of the health check in seconds. It is only changed when a value is entered.',
					minValue: 1,
				},
				{
					apiName: 'health_check_retries',
					displayName: 'Health Check Retries',
					type: 'numberSetting',
					description:
						'Number of failed health checks before the database is reported unhealthy. It is only changed when a value is entered.',
					minValue: 1,
				},
				{
					apiName: 'health_check_start_period',
					displayName: 'Health Check Start Period',
					type: 'numberSetting',
					description:
						'Grace period of the health check in seconds. It is only changed when a value is entered.',
					minValue: 0,
				},
			],
		},
		{
			collection: 'postgresqlSettings',
			specs: [
				{
					apiName: 'postgres_user',
					displayName: 'PostgreSQL User',
					type: 'string',
					description: 'User of the PostgreSQL database',
				},
				{
					apiName: 'postgres_password',
					displayName: 'PostgreSQL Password',
					type: 'password',
					description: 'Password of the PostgreSQL user',
				},
				{
					apiName: 'postgres_db',
					displayName: 'PostgreSQL Database',
					type: 'string',
					description: 'Name of the PostgreSQL database',
				},
				{
					apiName: 'postgres_initdb_args',
					displayName: 'Initdb Arguments',
					type: 'string',
					description: 'Arguments passed to initdb of PostgreSQL',
				},
				{
					apiName: 'postgres_host_auth_method',
					displayName: 'Host Auth Method',
					type: 'string',
					description: 'Host authentication method of PostgreSQL',
				},
				{
					apiName: 'postgres_conf',
					displayName: 'PostgreSQL Configuration',
					type: 'string',
					description:
						'Content of postgresql.conf. The node sends it Base64 encoded, as the API requires.',
					rows: 8,
					base64: true,
				},
			],
		},
		{
			collection: 'mysqlSettings',
			specs: [
				{
					apiName: 'mysql_root_password',
					displayName: 'Root Password',
					type: 'password',
					description: 'Root password of MySQL',
				},
				{
					apiName: 'mysql_password',
					displayName: 'MySQL Password',
					type: 'password',
					description: 'Password of the MySQL user',
				},
				{
					apiName: 'mysql_user',
					displayName: 'MySQL User',
					type: 'string',
					description: 'User of the MySQL database',
				},
				{
					apiName: 'mysql_database',
					displayName: 'MySQL Database',
					type: 'string',
					description: 'Name of the MySQL database',
				},
				{
					apiName: 'mysql_conf',
					displayName: 'MySQL Configuration',
					type: 'string',
					description: 'Content of my.cnf. The node sends it Base64 encoded, as the API requires.',
					rows: 8,
					base64: true,
				},
			],
		},
		{
			collection: 'mariadbSettings',
			specs: [
				{
					apiName: 'mariadb_conf',
					displayName: 'MariaDB Configuration',
					type: 'string',
					description:
						'Content of the MariaDB configuration. The node sends it Base64 encoded, as the API requires.',
					rows: 8,
					base64: true,
				},
				{
					apiName: 'mariadb_root_password',
					displayName: 'Root Password',
					type: 'password',
					description: 'Root password of MariaDB',
				},
				{
					apiName: 'mariadb_user',
					displayName: 'MariaDB User',
					type: 'string',
					description: 'User of the MariaDB database',
				},
				{
					apiName: 'mariadb_password',
					displayName: 'MariaDB Password',
					type: 'password',
					description: 'Password of the MariaDB user',
				},
				{
					apiName: 'mariadb_database',
					displayName: 'MariaDB Database',
					type: 'string',
					description: 'Name of the MariaDB database',
				},
			],
		},
		{
			collection: 'mongodbSettings',
			specs: [
				{
					apiName: 'mongo_conf',
					displayName: 'MongoDB Configuration',
					type: 'string',
					description:
						'Content of the MongoDB configuration. The node sends it Base64 encoded, as the API requires.',
					rows: 8,
					base64: true,
				},
				{
					apiName: 'mongo_initdb_root_username',
					displayName: 'Root Username',
					type: 'string',
					description: 'Root username MongoDB is initialized with',
				},
				{
					apiName: 'mongo_initdb_root_password',
					displayName: 'Root Password',
					type: 'password',
					description: 'Root password of MongoDB',
				},
				{
					apiName: 'mongo_initdb_database',
					displayName: 'Initial Database',
					type: 'string',
					description: 'Database MongoDB is initialized with',
				},
			],
		},
		{
			collection: 'redisSettings',
			specs: [
				{
					apiName: 'redis_password',
					displayName: 'Redis Password',
					type: 'password',
					description: 'Password of Redis',
				},
				{
					apiName: 'redis_conf',
					displayName: 'Redis Configuration',
					type: 'string',
					description:
						'Content of redis.conf. The node sends it Base64 encoded, as the API requires.',
					rows: 8,
					base64: true,
				},
			],
		},
		{
			collection: 'keydbSettings',
			specs: [
				{
					apiName: 'keydb_password',
					displayName: 'KeyDB Password',
					type: 'password',
					description: 'Password of KeyDB',
				},
				{
					apiName: 'keydb_conf',
					displayName: 'KeyDB Configuration',
					type: 'string',
					description:
						'Content of keydb.conf. The node sends it Base64 encoded, as the API requires.',
					rows: 8,
					base64: true,
				},
			],
		},
		{
			collection: 'dragonflySettings',
			specs: [
				{
					apiName: 'dragonfly_password',
					displayName: 'DragonFly Password',
					type: 'password',
					description: 'Password of DragonFly',
				},
			],
		},
		{
			collection: 'clickhouseSettings',
			specs: [
				{
					apiName: 'clickhouse_admin_user',
					displayName: 'Admin User',
					type: 'string',
					description: 'Admin user of Clickhouse',
				},
				{
					apiName: 'clickhouse_admin_password',
					displayName: 'Admin Password',
					type: 'password',
					description: 'Admin password of Clickhouse',
				},
			],
		},
		{
			collection: 'sqliteSettings',
			specs: [
				{
					apiName: 'sqlite_databases',
					displayName: 'SQLite Databases',
					type: 'string',
					description:
						'Comma-separated list of the SQLite database file names, up to 255 characters',
				},
			],
		},
	];
}

/**
 * Build the request body of the database update endpoint.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request body with only the fields the user changed.
 */
export function buildUpdateDatabaseBody(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	const body: IDataObject = {};

	for (const spec of databaseUpdateTopLevelSpecs()) {
		applyUpdateField(
			body,
			spec,
			ctx.getNodeParameter(databaseFieldUiName(spec.apiName), itemIndex, ''),
			ctx,
			itemIndex,
		);
	}

	for (const group of databaseUpdateCollections()) {
		const values = (ctx.getNodeParameter(group.collection, itemIndex, {}) ?? {}) as IDataObject;

		for (const spec of group.specs) {
			const uiName = databaseFieldUiName(spec.apiName);
			if (!(uiName in values)) {
				continue;
			}
			applyUpdateField(body, spec, values[uiName], ctx, itemIndex);
		}
	}

	validateUpdateDatabaseBody(ctx, itemIndex, body);
	return body;
}

/**
 * Add a field to the request body when it carries a changed value.
 */
function applyUpdateField(
	body: IDataObject,
	spec: DatabaseFieldSpec,
	raw: unknown,
	ctx: IExecuteFunctions,
	itemIndex: number,
): void {
	if (spec.type === 'booleanSetting') {
		if (raw === 'true') {
			body[spec.apiName] = true;
		} else if (raw === 'false') {
			body[spec.apiName] = false;
		}
		return;
	}

	if (spec.type === 'numberSetting') {
		const value = String(raw ?? '').trim();
		if (value === '') {
			return;
		}

		const parsed = Number(value);
		if (!Number.isInteger(parsed)) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The ${spec.displayName} must be a whole number`,
				{ itemIndex },
			);
		}
		if (spec.minValue !== undefined && parsed < spec.minValue) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The ${spec.displayName} must be at least ${spec.minValue}`,
				{ itemIndex },
			);
		}
		if (spec.maxValue !== undefined && parsed > spec.maxValue) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The ${spec.displayName} must be at most ${spec.maxValue}`,
				{ itemIndex },
			);
		}

		body[spec.apiName] = parsed;
		return;
	}

	if (typeof raw !== 'string' || raw.trim() === '') {
		return;
	}

	if (spec.base64) {
		body[spec.apiName] = encodeDatabaseConfiguration(raw);
		return;
	}

	body[spec.apiName] = raw.trim();
}

/**
 * Validate the fields of an update request that the node checks itself.
 */
function validateUpdateDatabaseBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	body: IDataObject,
): void {
	const fail = (message: string): never => {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	};

	validatePublicAccess(body, fail);
}
