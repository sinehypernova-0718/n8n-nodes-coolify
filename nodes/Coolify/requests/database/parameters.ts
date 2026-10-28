import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import { encodePathSegment } from '../../shared/pathSegment';

/**
 * Read the UUID of the database an operation works on.
 *
 * Every database endpoint but the list addresses the database through its
 * UUID, so the parameter is required and is validated before a request is
 * built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The UUID of the database, encoded for the path of the endpoint.
 */
export function requireDatabaseUuid(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const databaseUuid = (ctx.getNodeParameter('databaseUuid', itemIndex, '') as string).trim();

	if (!databaseUuid) {
		throw new NodeOperationError(ctx.getNode(), `Database UUID is required to ${purpose}`, {
			itemIndex,
		});
	}

	return encodePathSegment(databaseUuid);
}
