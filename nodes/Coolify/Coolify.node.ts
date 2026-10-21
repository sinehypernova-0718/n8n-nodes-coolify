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

import { applicationFields } from './descriptions';
import { applicationRequestBuilders } from './requests';
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
			'Manage Coolify applications, services, databases, servers and deployments from your n8n workflows.',
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
				],
				default: 'application',
			},
			...applicationFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const operation = this.getNodeParameter('operation', i) as string;

				const buildRequest = applicationRequestBuilders[operation];
				if (!buildRequest) {
					throw new NodeOperationError(
						this.getNode(),
						`The Application operation "${operation}" is not implemented yet`,
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
