import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireCloudTokenUuid } from './parameters';

/**
 * Build the request that gets a cloud provider token.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /cloud-tokens/{uuid}`.
 */
export async function getCloudTokenRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'GET',
		path: `cloud-tokens/${requireCloudTokenUuid(this, itemIndex)}`,
	};
}
