import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import { encodePathSegment } from '../../shared/pathSegment';

/**
 * Read the UUID of the cloud init script an operation works on.
 *
 * Every endpoint but the list addresses the script through its UUID, so the
 * parameter is required and is validated before a request is built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The UUID of the cloud init script, encoded for the path of the endpoint.
 */
export function requireCloudInitScriptUuid(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const uuid = (ctx.getNodeParameter('cloudInitScriptUuid', itemIndex, '') as string).trim();

	if (!uuid) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Cloud init script UUID is required to ${purpose}`,
			{ itemIndex },
		);
	}

	return encodePathSegment(uuid);
}
