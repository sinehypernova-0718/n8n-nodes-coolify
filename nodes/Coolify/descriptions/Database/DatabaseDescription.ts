import type { INodeProperties } from 'n8n-workflow';

import { databaseCreateDescription } from './databaseCreateFields';
import { databaseUpdateDescription } from './databaseUpdateFields';

/**
 * Description of the Coolify database resource.
 *
 * The operation selector lists the database operations this node supports. An
 * operation is only listed here once its request builder exists, so the
 * editor never offers an operation that the node cannot execute.
 */
export const databaseFields: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'list',
		displayOptions: {
			show: {
				resource: ['database'],
			},
		},
		options: [
			{
				name: 'Create (Clickhouse)',
				value: 'createClickhouse',
				description:
					'Create a Clickhouse database on a server of the project. Needs a token with the write permission, and the deploy permission when the database is started right away.',
				action: 'Create a clickhouse database',
			},
			{
				name: 'Create (DragonFly)',
				value: 'createDragonfly',
				description:
					'Create a DragonFly database on a server of the project. Needs a token with the write permission, and the deploy permission when the database is started right away.',
				action: 'Create a dragonfly database',
			},
			{
				name: 'Create (KeyDB)',
				value: 'createKeydb',
				description:
					'Create a KeyDB database on a server of the project. Needs a token with the write permission, and the deploy permission when the database is started right away.',
				action: 'Create a keydb database',
			},
			{
				name: 'Create (MariaDB)',
				value: 'createMariadb',
				description:
					'Create a MariaDB database on a server of the project. Needs a token with the write permission, and the deploy permission when the database is started right away.',
				action: 'Create a mariadb database',
			},
			{
				name: 'Create (MongoDB)',
				value: 'createMongodb',
				description:
					'Create a MongoDB database on a server of the project. The published creation schema does not include the root password, set it with the update operation.',
				action: 'Create a mongodb database',
			},
			{
				name: 'Create (MySQL)',
				value: 'createMysql',
				description:
					'Create a MySQL database on a server of the project. Needs a token with the write permission, and the deploy permission when the database is started right away.',
				action: 'Create a mysql database',
			},
			{
				name: 'Create (PostgreSQL)',
				value: 'createPostgresql',
				description:
					'Create a PostgreSQL database on a server of the project. Needs a token with the write permission, and the deploy permission when the database is started right away.',
				action: 'Create a postgresql database',
			},
			{
				name: 'Create (Redis)',
				value: 'createRedis',
				description:
					'Create a Redis database on a server of the project. Needs a token with the write permission, and the deploy permission when the database is started right away.',
				action: 'Create a redis database',
			},
			{
				name: 'Create (SQLite)',
				value: 'createSqlite',
				description:
					'Create a SQLite database on a server of the project. Requires Coolify v4.4.0 or later.',
				action: 'Create a sqlite database',
			},
			{
				name: 'Delete',
				value: 'delete',
				description:
					'Delete a database and queue the removal of its containers, volumes and networks. The deletion cannot be undone.',
				action: 'Delete a database',
			},
			{
				name: 'Get',
				value: 'get',
				description:
					'Get a single database by UUID. Passwords and connection URLs are returned only for a token with the read:sensitive or the root ability.',
				action: 'Get a database',
			},
			{
				name: 'Get Logs',
				value: 'getLogs',
				description:
					'Get the container logs of a database. Requires a token with the read:sensitive or the root ability.',
				action: 'Get database logs',
			},
			{
				name: 'List',
				value: 'list',
				description:
					'List the databases of the team. The endpoint returns every database in one array and is not paginated.',
				action: 'List databases',
			},
			{
				name: 'Restart',
				value: 'restart',
				description:
					'Restart a database. The operation is queued on the server and does not wait for the database to restart.',
				action: 'Restart a database',
			},
			{
				name: 'Start',
				value: 'start',
				description:
					'Start a database. The operation is queued on the server and does not wait for the database to run.',
				action: 'Start a database',
			},
			{
				name: 'Stop',
				value: 'stop',
				description:
					'Stop a database. The operation is queued on the server and does not wait for the database to stop.',
				action: 'Stop a database',
			},
			{
				name: 'Update',
				value: 'update',
				description:
					'Update a database by UUID. Only the settings that are filled in are changed, every other setting keeps its current value.',
				action: 'Update a database',
			},
		],
	},

	// ----------------------------------
	//     database:create
	// ----------------------------------
	...databaseCreateDescription(),

	// ----------------------------------
	//     database:delete
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'deleteWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['delete'],
			},
		},
		description:
			'Deleting the database stops its containers and removes the resource. The flags below decide whether the volumes, the configurations, the connected networks and the Docker cleanup are removed as well, and the deletion cannot be undone.',
	},
	{
		displayName: 'Database UUID',
		name: 'databaseUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['delete'],
			},
		},
		description: 'UUID of the database to delete',
	},
	{
		displayName: 'Delete Configurations',
		name: 'deleteConfigurations',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['delete'],
			},
		},
		description: 'Whether the configuration files of the database are deleted',
	},
	{
		displayName: 'Delete Connected Networks',
		name: 'deleteConnectedNetworks',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['delete'],
			},
		},
		description: 'Whether the networks the database is connected to are deleted',
	},
	{
		displayName: 'Delete Volumes',
		name: 'deleteVolumes',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['delete'],
			},
		},
		description: 'Whether the volumes of the database are deleted. The stored data is lost.',
	},
	{
		displayName: 'Docker Cleanup',
		name: 'dockerCleanup',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['delete'],
			},
		},
		description:
			'Whether Docker cleanup runs when the disk usage of the server is at or above its cleanup threshold',
	},

	// ----------------------------------
	//     database:get
	// ----------------------------------
	{
		displayName: 'Database UUID',
		name: 'databaseUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['get'],
			},
		},
		description: 'UUID of the database to retrieve',
	},

	// ----------------------------------
	//     database:getLogs
	// ----------------------------------
	{
		displayName: 'Database UUID',
		name: 'databaseUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['getLogs'],
			},
		},
		description: 'UUID of the database the logs belong to',
	},
	{
		displayName: 'Lines',
		name: 'lines',
		type: 'string',
		default: '',
		placeholder: '100 or all',
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['getLogs'],
			},
		},
		description:
			'Number of lines to show from the end of the log, or all. The API shows the last 100 lines when the field is empty.',
	},
	{
		displayName: 'Show Timestamps',
		name: 'showTimestamps',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['getLogs'],
			},
		},
		description: 'Whether the lines of the log show their timestamps',
	},

	// ----------------------------------
	//     database:list
	// ----------------------------------
	// The list endpoint takes no parameter, so it is configured entirely through
	// the operation selector.

	// ----------------------------------
	//     database:restart
	// ----------------------------------
	{
		displayName: 'Database UUID',
		name: 'databaseUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['restart'],
			},
		},
		description: 'UUID of the database to restart',
	},

	// ----------------------------------
	//     database:start
	// ----------------------------------
	{
		displayName: 'Database UUID',
		name: 'databaseUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['start'],
			},
		},
		description: 'UUID of the database to start',
	},

	// ----------------------------------
	//     database:stop
	// ----------------------------------
	{
		displayName: 'Database UUID',
		name: 'databaseUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['stop'],
			},
		},
		description: 'UUID of the database to stop',
	},
	{
		displayName: 'Docker Cleanup',
		name: 'dockerCleanup',
		type: 'boolean',
		default: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['stop'],
			},
		},
		description:
			'Whether Docker cleanup runs when the disk usage of the server is at or above its cleanup threshold',
	},

	// ----------------------------------
	//     database:update
	// ----------------------------------
	{
		displayName: 'Database UUID',
		name: 'databaseUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['database'],
				operation: ['update'],
			},
		},
		description: 'UUID of the database to update',
	},
	...databaseUpdateDescription(),
];
