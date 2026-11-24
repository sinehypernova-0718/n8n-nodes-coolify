import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDestinationUuid } from './parameters';

/**
 * Build the request that deletes a destination.
 *
 * The deletion is permanent. For a standalone destination the API also
 * disconnects and removes the Docker network from the server before it
 * deletes the record. A destination that still has applications, databases or
 * services attached is answered with HTTP 409 instead of being deleted; the
 * transport surfaces that error unchanged, so the node never reports a
 * deletion that did not happen.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /destinations/{uuid}`.
 */
export async function deleteDestinationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireDestinationUuid(this, itemIndex, 'delete a destination');

	return {
		method: 'DELETE',
		path: `destinations/${uuid}`,
		retrySafety: 'unsafe',
	};
}
