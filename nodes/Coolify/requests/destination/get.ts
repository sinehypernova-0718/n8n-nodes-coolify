import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDestinationUuid } from './parameters';

/**
 * Build the request that reads a single destination.
 *
 * The endpoint resolves the destination of the calling team through the
 * global `destinations` path, so a destination of another team is not
 * reachable.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /destinations/{uuid}`.
 */
export async function getDestinationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireDestinationUuid(this, itemIndex, 'get a destination');

	return {
		method: 'GET',
		path: `destinations/${uuid}`,
	};
}
