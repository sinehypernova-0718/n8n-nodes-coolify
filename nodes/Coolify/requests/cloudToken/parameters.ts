import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import { encodePathSegment } from '../../shared/pathSegment';

/**
 * Read the UUID of the cloud token an operation works on.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The UUID of the cloud token, encoded for the path of the endpoint.
 */
export function requireCloudTokenUuid(ctx: IExecuteFunctions, itemIndex: number): string {
	const uuid = (ctx.getNodeParameter('uuid', itemIndex, '') as string).trim();

	if (!uuid) {
		throw new NodeOperationError(ctx.getNode(), 'Cloud token UUID is required', { itemIndex });
	}

	return encodePathSegment(uuid);
}
