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
