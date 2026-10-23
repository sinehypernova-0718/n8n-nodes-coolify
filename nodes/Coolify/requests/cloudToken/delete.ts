import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireCloudTokenUuid } from './parameters';

/**
 * Build the request that deletes a cloud provider token.
 *
 * Cannot delete if the token is used by any servers.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /cloud-tokens/{uuid}`.
 */
export async function deleteCloudTokenRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'DELETE',
		path: `cloud-tokens/${requireCloudTokenUuid(this, itemIndex)}`,
	};
}
