import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireCloudInitScriptUuid } from './parameters';

/**
 * Build the request that reads a single cloud init script.
 *
 * The script content is returned only for tokens with the read:sensitive or
 * the root ability, so the response may omit it.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /cloud-init-scripts/{uuid}`.
 */
export async function getCloudInitScriptRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireCloudInitScriptUuid(this, itemIndex, 'get a cloud init script');

	return {
		method: 'GET',
		path: `cloud-init-scripts/${uuid}`,
	};
}
