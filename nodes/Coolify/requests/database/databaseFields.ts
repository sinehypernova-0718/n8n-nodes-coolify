/**
 * The field contract of the database creation endpoints.
 *
 * Coolify creates a standalone database through one endpoint per engine, and
 * every engine accepts the same identity, network and limit fields plus a
 * small set of engine-specific fields. This module holds that contract once:
 *
 * - the fields the endpoints accept, so the editor renders them from here,
 * - the rules the request builders apply when they turn the editor values
 *   into a request body.
 *
 * The nine creation endpoints differ only in the engine-specific fields they
 * publish, so the editor renders one operation per engine and this module
 * decides which fields each of those operations offers.
 *
 * The contract was verified against the Coolify OpenAPI specification and the
 * `DatabasesController` of release v4.5.1 (read on 2026-10-28). Two rules of
 * the controller shape the request:
 *
 * - At least one of `environment_name` and `environment_uuid` is required,
 *   but neither is individually required.
 * - The API applies its own default to a field the request leaves out, so an
 *   optional field is only sent when the user set it.
 *
 * The MongoDB creation schema of the OpenAPI publishes `mongo_conf` and
 * `mongo_initdb_root_username` only. The controller also accepts
 * `mongo_initdb_root_password` and `mongo_initdb_database`, but an
 * undocumented field stays out of the editor; both fields are published by the
 * update schema and are offered there instead.
 */

import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

/**
 * The database engines the Coolify API can create.
 */
export const DATABASE_ENGINES = [
	'postgresql',
	'mysql',
	'mariadb',
	'mongodb',
	'redis',
	'clickhouse',
	'dragonfly',
	'keydb',
	'sqlite',
] as const;

/**
 * A database engine the Coolify API can create.
 */
export type DatabaseEngine = (typeof DATABASE_ENGINES)[number];

/**
 * The kind of the editor control of a database field.
 *
 * `booleanSetting` and `numberSetting` are the three-state controls of the
 * update operation: they can keep the current value of the database.
 */
export type DatabaseFieldType =
	| 'string'
	| 'password'
	| 'number'
	| 'boolean'
	| 'stringList'
	| 'booleanSetting'
	| 'numberSetting';

/**
 * The contract of a single field of a database request.
 */
export interface DatabaseFieldSpec {
	/** The name of the field in the Coolify API. */
	apiName: string;
	/** The label of the field in the editor. */
	displayName: string;
	/** The kind of the editor control. */
	type: DatabaseFieldType;
	/** The description of the field in the editor. */
	description: string;
	/** Whether the API rejects the request without the field. */
	required?: boolean;
	/** The default of the control, the default the API applies where one exists. */
	defaultValue?: string | number | boolean | string[];
	/** The smallest value the API accepts. */
	minValue?: number;
	/** The largest value the API accepts. */
	maxValue?: number;
	/** The number of rows of a multi-line text control. */
	rows?: number;
	/** Whether the API expects the value Base64 encoded. */
	base64?: boolean;
}

/**
 * The name of the editor parameter of a field.
 *
 * The API names a database field in snake case, the editor names the same
 * field in camel case, so the mapping lives here and is used by both the
 * description and the request builder.
 *
 * @param apiName The name of the field in the Coolify API.
 * @returns The name of the parameter in the editor.
 */
export function databaseFieldUiName(apiName: string): string {
	return apiName.replace(/_([a-z0-9])/g, (_match, character: string) => character.toUpperCase());
}

/**
 * The fields every creation endpoint accepts and that are rendered at the top
 * level of the operation.
 */
export const DATABASE_CREATE_SHARED_FIELDS: DatabaseFieldSpec[] = [
	{
		apiName: 'project_uuid',
		displayName: 'Project UUID',
		type: 'string',
		description: 'UUID of the project the database belongs to',
		required: true,
	},
	{
		apiName: 'server_uuid',
		displayName: 'Server UUID',
		type: 'string',
		description: 'UUID of the server that hosts the database',
		required: true,
	},
	{
		apiName: 'environment_name',
		displayName: 'Environment Name',
		type: 'string',
		description:
			'Name of the environment. The API needs the environment name or the environment UUID.',
	},
	{
		apiName: 'environment_uuid',
		displayName: 'Environment UUID',
		type: 'string',
		description:
			'UUID of the environment. The API needs the environment name or the environment UUID.',
	},
	{
		apiName: 'destination_uuid',
		displayName: 'Destination UUID',
		type: 'string',
		description:
			'UUID of the destination. The API needs it when the server has more than one destination.',
	},
	{
		apiName: 'name',
		displayName: 'Name',
		type: 'string',
		description: 'Name of the database. The API generates a name when it is not given.',
	},
	{
		apiName: 'description',
		displayName: 'Description',
		type: 'string',
		description: 'Description of the database',
	},
	{
		apiName: 'image',
		displayName: 'Image',
		type: 'string',
		description:
			'Docker image of the database. The API uses its own default image when it is not given.',
	},
	{
		apiName: 'instant_deploy',
		displayName: 'Instant Deploy',
		type: 'boolean',
		description:
			'Whether the database is started right after it is created. Needs a token with the deploy permission.',
	},
	{
		apiName: 'tags',
		displayName: 'Tags',
		type: 'stringList',
		description: 'Tags to assign to the database. Every tag needs at least two characters.',
	},
];

/**
 * The optional public access fields of a creation endpoint.
 *
 * SQLite does not publish these fields, so its creation operation does not
 * offer the collection.
 */
export const DATABASE_PUBLIC_ACCESS_FIELDS: DatabaseFieldSpec[] = [
	{
		apiName: 'is_public',
		displayName: 'Public',
		type: 'boolean',
		description:
			'Whether the database is reachable through a public port. A valid public port is required when it is switched on.',
	},
	{
		apiName: 'public_port',
		displayName: 'Public Port',
		type: 'number',
		description: 'Public port of the database, between 1024 and 65535',
		defaultValue: 0,
		minValue: 1024,
		maxValue: 65535,
	},
	{
		apiName: 'public_port_timeout',
		displayName: 'Public Port Timeout',
		type: 'number',
		description: 'Proxy timeout of the public port in seconds',
		defaultValue: 3600,
		minValue: 1,
	},
];

/**
 * The optional resource limit fields of a creation endpoint.
 */
export const DATABASE_LIMIT_FIELDS: DatabaseFieldSpec[] = [
	{
		apiName: 'limits_memory',
		displayName: 'Memory Limit',
		type: 'string',
		description: 'Memory limit of the database, for example 512m',
	},
	{
		apiName: 'limits_memory_swap',
		displayName: 'Memory Swap Limit',
		type: 'string',
		description: 'Memory swap limit of the database, for example 1g',
	},
	{
		apiName: 'limits_memory_swappiness',
		displayName: 'Memory Swappiness',
		type: 'number',
		description: 'Memory swappiness of the database',
		defaultValue: 0,
	},
	{
		apiName: 'limits_memory_reservation',
		displayName: 'Memory Reservation',
		type: 'string',
		description: 'Memory reservation of the database, for example 256m',
	},
	{
		apiName: 'limits_cpus',
		displayName: 'CPU Limit',
		type: 'string',
		description: 'CPU limit of the database, for example 0.5',
	},
	{
		apiName: 'limits_cpuset',
		displayName: 'CPU Set',
		type: 'string',
		description: 'CPU set of the database, for example 0-1',
	},
	{
		apiName: 'limits_cpu_shares',
		displayName: 'CPU Shares',
		type: 'number',
		description: 'CPU shares of the database',
		defaultValue: 0,
	},
];

/**
 * The engine-specific fields of every creation endpoint.
 *
 * The configuration fields of PostgreSQL, MySQL, MariaDB, MongoDB, Redis and
 * KeyDB travel Base64 encoded. The API decodes them before it stores the
 * configuration file, and rejects a value that is not valid Base64 with HTTP
 * 422. The editor therefore accepts plain text and the builder encodes it.
 */
export const DATABASE_ENGINE_FIELDS: Record<DatabaseEngine, DatabaseFieldSpec[]> = {
	postgresql: [
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
			description:
				'Password of the PostgreSQL user. The API generates a password when it is not given.',
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
	mysql: [
		{
			apiName: 'mysql_root_password',
			displayName: 'Root Password',
			type: 'password',
			description: 'Root password of MySQL. The API generates a password when it is not given.',
		},
		{
			apiName: 'mysql_password',
			displayName: 'MySQL Password',
			type: 'password',
			description: 'Password of the MySQL user. The API generates a password when it is not given.',
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
	mariadb: [
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
			description: 'Root password of MariaDB. The API generates a password when it is not given.',
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
			description:
				'Password of the MariaDB user. The API generates a password when it is not given.',
		},
		{
			apiName: 'mariadb_database',
			displayName: 'MariaDB Database',
			type: 'string',
			description: 'Name of the MariaDB database',
		},
	],
	mongodb: [
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
	],
	redis: [
		{
			apiName: 'redis_password',
			displayName: 'Redis Password',
			type: 'password',
			description: 'Password of Redis. The API generates a password when it is not given.',
		},
		{
			apiName: 'redis_conf',
			displayName: 'Redis Configuration',
			type: 'string',
			description: 'Content of redis.conf. The node sends it Base64 encoded, as the API requires.',
			rows: 8,
			base64: true,
		},
	],
	clickhouse: [
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
			description:
				'Admin password of Clickhouse. The API generates a password when it is not given.',
		},
	],
	dragonfly: [
		{
			apiName: 'dragonfly_password',
			displayName: 'DragonFly Password',
			type: 'password',
			description: 'Password of DragonFly. The API generates a password when it is not given.',
		},
	],
	keydb: [
		{
			apiName: 'keydb_password',
			displayName: 'KeyDB Password',
			type: 'password',
			description: 'Password of KeyDB. The API generates a password when it is not given.',
		},
		{
			apiName: 'keydb_conf',
			displayName: 'KeyDB Configuration',
			type: 'string',
			description: 'Content of keydb.conf. The node sends it Base64 encoded, as the API requires.',
			rows: 8,
			base64: true,
		},
	],
	sqlite: [
		{
			apiName: 'sqlite_databases',
			displayName: 'SQLite Databases',
			type: 'string',
			description: 'Comma-separated list of the SQLite database file names, up to 255 characters',
		},
	],
};

/**
 * The smallest public port the Coolify API accepts.
 */
export const PUBLIC_PORT_MIN = 1024;

/**
 * The largest public port the Coolify API accepts.
 */
export const PUBLIC_PORT_MAX = 65535;

/**
 * The longest value of the SQLite database list the Coolify API accepts.
 */
const SQLITE_DATABASES_MAX_LENGTH = 255;

/**
 * The shortest tag the Coolify API accepts.
 */
const TAG_MIN_LENGTH = 2;

/**
 * The fields of a creation operation, in the order the editor renders them.
 *
 * @param engine The engine of the creation operation.
 * @returns The shared fields followed by the fields of the engine.
 */
export function databaseCreateFieldSpecs(engine: DatabaseEngine): DatabaseFieldSpec[] {
	return [...DATABASE_CREATE_SHARED_FIELDS, ...DATABASE_ENGINE_FIELDS[engine]];
}

/**
 * Encode a configuration file the way the Coolify API expects it.
 *
 * @param value The plain text of the configuration file.
 * @returns The Base64 form of the UTF-8 bytes of the value.
 */
export function encodeDatabaseConfiguration(value: string): string {
	return Buffer.from(value, 'utf8').toString('base64');
}

/**
 * Build the request body of a database creation endpoint.
 *
 * The body carries only the fields the user set. A required field is
 * validated before the request is built, so the API never has to report a
 * missing one.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param engine The engine of the creation operation.
 * @returns The request body of the Coolify API.
 */
export function buildCreateDatabaseBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	engine: DatabaseEngine,
): IDataObject {
	const body: IDataObject = {};

	for (const spec of databaseCreateFieldSpecs(engine)) {
		const value = readDatabaseFieldValue(ctx, itemIndex, spec);
		if (value !== undefined) {
			body[spec.apiName] = value;
		}
	}

	Object.assign(body, readPublicAccess(ctx, itemIndex, engine));
	Object.assign(body, readDatabaseCollection(ctx, itemIndex, 'resourceLimits'));

	validateCreateDatabaseBody(ctx, itemIndex, body);
	return body;
}

/**
 * Read the value of a field that is rendered at the top level.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param spec The contract of the field.
 * @returns The value to send, or `undefined` when the user did not set it.
 */
function readDatabaseFieldValue(
	ctx: IExecuteFunctions,
	itemIndex: number,
	spec: DatabaseFieldSpec,
): IDataObject[string] | undefined {
	switch (spec.type) {
		case 'boolean':
			return ctx.getNodeParameter(databaseFieldUiName(spec.apiName), itemIndex, false) === true
				? true
				: undefined;
		case 'number': {
			const value = ctx.getNodeParameter(databaseFieldUiName(spec.apiName), itemIndex, 0) as number;
			return Number.isFinite(value) ? value : undefined;
		}
		case 'stringList': {
			const raw = ctx.getNodeParameter(databaseFieldUiName(spec.apiName), itemIndex, []) as
				| string[]
				| string;
			const values = Array.isArray(raw) ? raw : [raw];
			const entries = values.map((entry) => String(entry).trim()).filter((entry) => entry !== '');
			if (entries.length === 0) {
				return undefined;
			}
			if (spec.apiName === 'tags') {
				validateTags(ctx, itemIndex, entries);
			}
			return entries;
		}
		case 'password':
		case 'string': {
			const value = String(
				ctx.getNodeParameter(databaseFieldUiName(spec.apiName), itemIndex, '') as string,
			);
			return readTextValue(ctx, itemIndex, spec, value);
		}
		default:
			return undefined;
	}
}

/**
 * Turn the value of a text field into the value the body carries.
 */
function readTextValue(
	ctx: IExecuteFunctions,
	itemIndex: number,
	spec: DatabaseFieldSpec,
	value: string,
): string | undefined {
	if (value.trim() === '') {
		if (spec.required) {
			throw new NodeOperationError(
				ctx.getNode(),
				`The ${spec.displayName} is required to create a database`,
				{ itemIndex },
			);
		}
		return undefined;
	}

	// A configuration file keeps its whitespace, everything else is trimmed
	// like the Coolify API trims it.
	if (spec.base64) {
		return encodeDatabaseConfiguration(value);
	}

	return value.trim();
}

/**
 * Read the optional public access fields.
 *
 * SQLite publishes neither a public port nor a public flag, so its creation
 * request never carries one of these fields. A port of `0` is the value of an
 * item the user added without setting a port, so it is omitted instead of
 * sending a port the API would reject.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param engine The engine of the creation operation.
 * @returns The public access fields the user set.
 */
function readPublicAccess(
	ctx: IExecuteFunctions,
	itemIndex: number,
	engine: DatabaseEngine,
): IDataObject {
	if (engine === 'sqlite') {
		return {};
	}

	const values = (ctx.getNodeParameter('publicAccess', itemIndex, {}) ?? {}) as IDataObject;
	const body: IDataObject = {};

	if (values.isPublic === true) {
		body.is_public = true;
	}

	const publicPort = values.publicPort;
	if (typeof publicPort === 'number' && publicPort !== 0) {
		body.public_port = publicPort;
	}

	const publicPortTimeout = values.publicPortTimeout;
	if (typeof publicPortTimeout === 'number' && publicPortTimeout > 0) {
		body.public_port_timeout = publicPortTimeout;
	}

	return body;
}

/**
 * Read a collection of optional fields.
 *
 * A collection the user never added is absent from the request, so the API
 * applies its own default to the fields it holds.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param collection The name of the collection parameter.
 * @returns The fields the user set.
 */
function readDatabaseCollection(
	ctx: IExecuteFunctions,
	itemIndex: number,
	collection: string,
): IDataObject {
	const values = (ctx.getNodeParameter(collection, itemIndex, {}) ?? {}) as IDataObject;
	const body: IDataObject = {};

	for (const [uiName, value] of Object.entries(values)) {
		if (value === undefined || value === null) {
			continue;
		}

		if (typeof value === 'boolean') {
			body[toApiName(uiName)] = value;
			continue;
		}

		if (typeof value === 'number') {
			body[toApiName(uiName)] = value;
			continue;
		}

		if (typeof value === 'string' && value.trim() !== '') {
			body[toApiName(uiName)] = value.trim();
		}
	}

	return body;
}

/**
 * Turn the name of an editor parameter into the name of the API field.
 *
 * @param uiName The name of the parameter in the editor.
 * @returns The name of the field in the Coolify API.
 */
function toApiName(uiName: string): string {
	return uiName.replace(/([A-Z])/g, (_match, character: string) => `_${character.toLowerCase()}`);
}

/**
 * Validate the tags of a creation request.
 */
function validateTags(ctx: IExecuteFunctions, itemIndex: number, tags: string[]): void {
	const tooShort = tags.filter((tag) => tag.length < TAG_MIN_LENGTH);
	if (tooShort.length > 0) {
		throw new NodeOperationError(ctx.getNode(), 'Every tag needs at least two characters', {
			itemIndex,
		});
	}
}

/**
 * Validate the fields every creation request needs.
 *
 * The rules are the ones the Coolify API applies, so a request that breaks
 * them is rejected before it is sent.
 */
function validateCreateDatabaseBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	body: IDataObject,
): void {
	const fail = (message: string): never => {
		throw new NodeOperationError(ctx.getNode(), message, { itemIndex });
	};

	if (!body.project_uuid) {
		fail('The project UUID is required to create a database');
	}
	if (!body.server_uuid) {
		fail('The server UUID is required to create a database');
	}
	if (!body.environment_name && !body.environment_uuid) {
		fail('The environment name or the environment UUID is required to create a database');
	}

	validatePublicAccess(body, fail);

	if (typeof body.sqlite_databases === 'string') {
		if (body.sqlite_databases.length > SQLITE_DATABASES_MAX_LENGTH) {
			fail(
				`The SQLite databases must not be longer than ${SQLITE_DATABASES_MAX_LENGTH} characters`,
			);
		}
	}
}

/**
 * Validate the public access of a request.
 *
 * The Coolify API silently switches a database private when `is_public` is
 * set without a public port, so the combination is rejected here instead of
 * producing a database the user did not ask for.
 *
 * @param body The request body.
 * @param fail The error factory of the calling validator.
 */
export function validatePublicAccess(body: IDataObject, fail: (message: string) => never): void {
	const isPublic = body.is_public === true;

	if (isPublic && body.public_port === undefined) {
		fail('The public port is required when the database is public');
	}

	if (body.public_port !== undefined) {
		if (
			typeof body.public_port !== 'number' ||
			!Number.isInteger(body.public_port) ||
			body.public_port < PUBLIC_PORT_MIN ||
			body.public_port > PUBLIC_PORT_MAX
		) {
			fail(
				`The public port must be a whole number between ${PUBLIC_PORT_MIN} and ${PUBLIC_PORT_MAX}`,
			);
		}
	}
}
