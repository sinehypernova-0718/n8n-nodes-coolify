import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildUpdateCloudTokenBody } from './cloudTokenFields';
import { requireCloudTokenUuid } from './parameters';

/**
 * Build the request that updates a cloud provider token.
 *
 * Only the name can be updated; the token value itself cannot be changed.
 * The name is required for an update.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /cloud-tokens/{uuid}`.
 */
export async function updateCloudTokenRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireCloudTokenUuid(this, itemIndex);
	const body = buildUpdateCloudTokenBody(this, itemIndex);

	return {
		method: 'PATCH',
		path: `cloud-tokens/${uuid}`,
		body,
	};
}
