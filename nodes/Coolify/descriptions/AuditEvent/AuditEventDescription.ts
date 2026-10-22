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
	// The optional numbers carry `default: null`, which describes a parameter
	// the user never set. n8n resolves such a parameter through lodash `get`
	// with the fallback `null` the request builder passes, so an untouched or
	// cleared field is omitted from the query while `0` is returned as `0` —
	// see `listAuditEventsRequest`.
	{
		displayName: 'Items Per Page',
		name: 'perPage',
		type: 'number',
		default: null,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		displayOptions: {
			show: {
				resource: ['auditEvent'],
				operation: ['list'],
			},
		},
		description: 'Number of audit events to return in one page, between 1 and 100',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		default: null,
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				resource: ['auditEvent'],
				operation: ['list'],
			},
		},
		description: 'Page number of the audit events to return',
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
