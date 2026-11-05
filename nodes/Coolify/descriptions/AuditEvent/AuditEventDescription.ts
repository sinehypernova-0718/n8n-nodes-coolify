import type { INodeProperties } from 'n8n-workflow';

/**
 * Description of the Coolify audit event resource.
 *
 * The operation selector lists the audit event operations this node supports.
 * An operation is only listed here once its request builder exists, so the
 * editor never offers an operation that the node cannot execute.
 */
export const auditEventFields: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'list',
		displayOptions: {
			show: {
				resource: ['auditEvent'],
			},
		},
		options: [
			{
				name: 'List',
				value: 'list',
				description:
					'List a page of audit events of the team, newest first. Only team admins and owners can view audit events, a token without that access is expected to receive HTTP 403. Actor e-mail, token, metadata, changes, IP address and user agent are returned only for tokens with the read:sensitive or root permission.',
				action: 'List audit events',
			},
		],
	},

	// ----------------------------------
	//        auditEvent:list
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		default: false,
		displayOptions: {
			show: {
				resource: ['auditEvent'],
				operation: ['list'],
			},
		},
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 50,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['auditEvent'],
				operation: ['list'],
				returnAll: [false],
			},
		},
		description: 'Max number of results to return',
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['auditEvent'],
				operation: ['list'],
			},
		},
		description: 'Text to filter the audit events by',
	},
	{
		displayName: 'Action',
		name: 'action',
		type: 'string',
		default: '',
		displayOptions: {
			show: {
				resource: ['auditEvent'],
				operation: ['list'],
			},
		},
		description: 'Action to filter the audit events by. Use all for every action.',
	},
	{
		displayName: 'Source',
		name: 'source',
		type: 'options',
		default: '',
		displayOptions: {
			show: {
				resource: ['auditEvent'],
				operation: ['list'],
			},
		},
		options: [
			{
				name: 'All',
				value: 'all',
			},
			{
				name: 'Any Source',
				value: '',
			},
			{
				name: 'API',
				value: 'api',
			},
			{
				name: 'MCP',
				value: 'mcp',
			},
			{
				name: 'Scheduler',
				value: 'scheduler',
			},
			{
				name: 'System',
				value: 'system',
			},
			{
				name: 'UI',
				value: 'ui',
			},
			{
				name: 'Webhook',
				value: 'webhook',
			},
		],
		description:
			'Source the audit event originated from. Any Source leaves the filter unset, All sends source=all explicitly.',
	},
];
