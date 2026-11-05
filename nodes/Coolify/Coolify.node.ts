import {
	NodeApiError,
	NodeConnectionTypes,
	NodeOperationError,
	type IDataObject,
	type IExecuteFunctions,
	type INode,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import {
	applicationFields,
	auditEventFields,
	cloudInitScriptFields,
	cloudTokenFields,
	databaseFields,
} from './descriptions';
import {
	applicationRequestBuilders,
	auditEventRequestBuilders,
	cloudInitScriptRequestBuilders,
	cloudTokenRequestBuilders,
	databaseRequestBuilders,
	type CoolifyRequestBuilder,
	type CoolifyRequest,
} from './requests';
import { coolifyApiRequest } from './shared/apiRequest';

/**
 * Map an error of the execution to an n8n node error.
 *
 * The shared transport already reports a failed Coolify request as a
 * `NodeApiError` and the request builders report a rejected parameter as a
 * `NodeOperationError`. Both are passed through unchanged, so the status
 * code, the Coolify message and the response body of a failed request stay
 * visible in the editor. Anything else is wrapped, so the editor never shows
 * a bare error.
 *
 * @param node The node that failed.
 * @param error The error that was caught.
 * @param itemIndex Index of the input item that failed.
 * @returns The error to report to the n8n runtime.
 */
function asNodeError(
	node: INode,
	error: unknown,
	itemIndex: number,
): NodeApiError | NodeOperationError {
	if (error instanceof NodeApiError || error instanceof NodeOperationError) {
		return error;
	}

	return new NodeOperationError(node, error as Error, { itemIndex });
}

/**
 * The request builder registries of the resources, keyed by the value of the
 * resource parameter.
 *
 * Every resource resolves to the registry of its own operations, so an
 * operation value of one resource can never dispatch the request of another.
 */
const resourceRequestBuilders: Record<string, Record<string, CoolifyRequestBuilder>> = {
	application: applicationRequestBuilders,
	auditEvent: auditEventRequestBuilders,
	cloudInitScript: cloudInitScriptRequestBuilders,
	cloudToken: cloudTokenRequestBuilders,
	database: databaseRequestBuilders,
};

/**
 * Display label of a resource, used in the error message of an operation the
 * resource does not implement.
 */
const resourceLabels: Record<string, string> = {
	application: 'Application',
	auditEvent: 'Audit Event',
	cloudInitScript: 'Cloud Init Script',
	cloudToken: 'Cloud Token',
	database: 'Database',
};

/** Maximum page size documented by the Coolify audit events endpoint. */
const AUDIT_EVENT_PAGE_SIZE = 100;

/** Default number of audit events returned when Return All is disabled. */
const DEFAULT_AUDIT_EVENT_LIMIT = 50;

/** Type guard for object entries returned by Coolify. */
function isDataObject(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Fetch and validate the paginated audit event list. */
async function fetchAuditEvents(
	ctx: IExecuteFunctions,
	request: CoolifyRequest,
	itemIndex: number,
	returnAll: boolean,
	limit: number,
): Promise<IDataObject[]> {
	if (!returnAll && (!Number.isSafeInteger(limit) || limit < 1)) {
		throw new NodeOperationError(ctx.getNode(), 'Limit must be a positive integer', { itemIndex });
	}

	const perPage = returnAll ? AUDIT_EVENT_PAGE_SIZE : Math.min(limit, AUDIT_EVENT_PAGE_SIZE);
	const auditEvents: IDataObject[] = [];
	let page = 1;
	let lastPage: number | undefined;
	let total: number | undefined;

	while (lastPage === undefined || page <= lastPage) {
		const response = await coolifyApiRequest(ctx, request.method, request.path, {
			qs: { ...request.qs, page, per_page: perPage },
			body: request.body,
			retrySafety: request.retrySafety,
		});

		if (!isDataObject(response) || !Array.isArray(response.data)) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Coolify returned an invalid audit event paginator response',
				{
					itemIndex,
				},
			);
		}

		const responseLastPage = response.last_page;
		const responseTotal = response.total;
		const currentPage = response.current_page;
		if (
			typeof responseLastPage !== 'number' ||
			!Number.isSafeInteger(responseLastPage) ||
			responseLastPage < 1
		) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Coolify returned an invalid audit event last_page value',
				{
					itemIndex,
				},
			);
		}
		if (
			typeof currentPage !== 'number' ||
			!Number.isSafeInteger(currentPage) ||
			currentPage < 1 ||
			currentPage !== page
		) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Coolify returned an unexpected audit event page',
				{
					itemIndex,
				},
			);
		}
		if (
			typeof responseTotal !== 'number' ||
			!Number.isSafeInteger(responseTotal) ||
			responseTotal < 0 ||
			responseLastPage !== Math.max(1, Math.ceil(responseTotal / perPage))
		) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Coolify returned invalid audit event pagination metadata',
				{
					itemIndex,
				},
			);
		}

		if (lastPage !== undefined && (responseLastPage !== lastPage || responseTotal !== total)) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Coolify audit event pagination metadata changed during retrieval',
				{
					itemIndex,
				},
			);
		}
		lastPage = responseLastPage;
		total = responseTotal;

		const events = response.data.filter(isDataObject);
		if (events.length !== response.data.length || events.length > perPage) {
			throw new NodeOperationError(ctx.getNode(), 'Coolify returned invalid audit event entries', {
				itemIndex,
			});
		}
		const expectedPageEvents = Math.min(perPage, Math.max(0, responseTotal - (page - 1) * perPage));
		if (events.length === 0 && expectedPageEvents > 0) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Coolify returned an empty audit event page before the reported last page',
				{ itemIndex },
			);
		}
		if (events.length !== expectedPageEvents) {
			throw new NodeOperationError(
				ctx.getNode(),
				'Coolify returned an incomplete audit event page for the reported total',
				{ itemIndex },
			);
		}

		const remaining = returnAll ? events.length : limit - auditEvents.length;
		auditEvents.push(...events.slice(0, remaining));
		if (events.length === 0 || (!returnAll && auditEvents.length >= limit) || page >= lastPage) {
			break;
		}

		page += 1;
	}

	if (returnAll && auditEvents.length !== total) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Coolify returned fewer audit events than its paginator reported',
			{
				itemIndex,
			},
		);
	}

	return auditEvents;
}

export class Coolify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Coolify',
		name: 'coolify',
		// Themed icon form: n8n expects a light and a dark variant. The package
		// ships a single theme-neutral asset, so both variants point at it.
		// The path is relative to this file (nodes/Coolify/).
		icon: { light: 'file:../../icons/coolify.svg', dark: 'file:../../icons/coolify.svg' },
		group: ['input'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description:
			'Manage Coolify applications, audit events, cloud init scripts, cloud tokens and databases from your n8n workflows.',
		defaults: {
			name: 'Coolify',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'coolifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Application',
						value: 'application',
						description: 'Manage the applications of a Coolify team',
					},
					{
						name: 'Audit Event',
						value: 'auditEvent',
						description: 'List the audit events of a Coolify team',
					},
					{
						name: 'Cloud Init Script',
						value: 'cloudInitScript',
						description: 'Manage the reusable cloud init scripts of a Coolify team',
					},
					{
						name: 'Cloud Token',
						value: 'cloudToken',
						description: 'Manage the cloud provider tokens of a Coolify team',
					},
					{
						name: 'Database',
						value: 'database',
						description: 'Manage the databases of a Coolify team',
					},
				],
				default: 'application',
			},
			...applicationFields,
			...auditEventFields,
			...cloudInitScriptFields,
			...cloudTokenFields,
			...databaseFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;

				const requestBuilders = resourceRequestBuilders[resource];
				if (!requestBuilders) {
					throw new NodeOperationError(
						this.getNode(),
						`The resource "${resource}" is not implemented yet`,
						{ itemIndex: i },
					);
				}

				const buildRequest = requestBuilders[operation];
				if (!buildRequest) {
					throw new NodeOperationError(
						this.getNode(),
						`The ${resourceLabels[resource] ?? resource} operation "${operation}" is not implemented yet`,
						{ itemIndex: i },
					);
				}

				const request = await buildRequest.call(this, i);

				if (resource === 'auditEvent' && operation === 'list') {
					const returnAll = this.getNodeParameter('returnAll', i, false) as boolean;
					const limit = this.getNodeParameter('limit', i, DEFAULT_AUDIT_EVENT_LIMIT) as number;
					const auditEvents = await fetchAuditEvents(this, request, i, returnAll, limit);

					returnData.push(
						...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(auditEvents), {
							itemData: { item: i },
						}),
					);
					continue;
				}

				const response = await coolifyApiRequest(this, request.method, request.path, {
					qs: request.qs,
					body: request.body,
					retrySafety: request.retrySafety,
				});

				const responseData = (Array.isArray(response) ? response : [response]).filter(
					(entry): entry is IDataObject => typeof entry === 'object' && entry !== null,
				);

				returnData.push(
					...this.helpers.constructExecutionMetaData(this.helpers.returnJsonArray(responseData), {
						itemData: { item: i },
					}),
				);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push(
						...this.helpers.constructExecutionMetaData(
							this.helpers.returnJsonArray({ error: (error as Error).message }),
							{ itemData: { item: i } },
						),
					);
					continue;
				}
				throw asNodeError(this.getNode(), error, i);
			}
		}

		return [returnData];
	}
}
