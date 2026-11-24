import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildUpdateDestinationBody } from './destinationFields';
import { requireDestinationUuid } from './parameters';

/**
 * Build the request that updates a destination.
 *
 * The only field the endpoint accepts is the required name; it rejects every
 * other field with HTTP 422, and the network of a destination cannot be
 * changed through the API. The name is validated before the request is sent,
 * so a blank value is never transmitted.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /destinations/{uuid}`.
 */
export async function updateDestinationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireDestinationUuid(this, itemIndex, 'update a destination');

	const body = buildUpdateDestinationBody(this, itemIndex, 'update a destination');

	return {
		method: 'PATCH',
		path: `destinations/${uuid}`,
		body,
	};
}
