import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import { encodePathSegment } from '../../shared/pathSegment';
import { locatorValue } from '../../shared/locatorValue';

/**
 * Read the UUID of the destination an operation works on.
 *
 * The Get, Update and Delete endpoints address a destination through its UUID
 * through the global `destinations` path, so the parameter is required and is
 * validated before a request is built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The UUID of the destination, encoded for the path of the endpoint.
 */
export function requireDestinationUuid(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const uuid = locatorValue(ctx.getNodeParameter('destinationUuid', itemIndex, '')).trim();

	if (!uuid) {
		throw new NodeOperationError(ctx.getNode(), `Destination UUID is required to ${purpose}`, {
			itemIndex,
		});
	}

	return encodePathSegment(uuid);
}

/**
 * Read the UUID of the server a destination belongs to.
 *
 * The Create and the List by Server endpoint address the server through its
 * UUID, so the parameter is required and is validated before a request is
 * built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The UUID of the server, encoded for the path of the endpoint.
 */
export function requireDestinationServerUuid(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const uuid = locatorValue(ctx.getNodeParameter('serverUuid', itemIndex, '')).trim();

	if (!uuid) {
		throw new NodeOperationError(ctx.getNode(), `Server UUID is required to ${purpose}`, {
			itemIndex,
		});
	}

	return encodePathSegment(uuid);
}
