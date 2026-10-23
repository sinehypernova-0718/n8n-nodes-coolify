import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireCloudTokenUuid } from './parameters';

/**
 * Build the request that validates a cloud provider token.
 *
 * Validates the token against the provider API. This is a read-only check.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /cloud-tokens/{uuid}/validate`.
 */
export async function validateCloudTokenRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'POST',
		path: `cloud-tokens/${requireCloudTokenUuid(this, itemIndex)}/validate`,
	};
}
