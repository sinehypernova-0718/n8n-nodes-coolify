import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';

/**
 * Build the request that lists the cloud init scripts of the team.
 *
 * Coolify returns every script of the team as a plain array, newest script
 * first, so the response is returned unchanged and no page is fetched
 * automatically. The endpoint takes no query parameters and no body.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /cloud-init-scripts`.
 */
export async function listCloudInitScriptsRequest(
	this: IExecuteFunctions,
	// The list endpoint takes no parameter of this node, so the item index is
	// not read to build the request. A request builder keeps it in its
	// signature nevertheless, see `CoolifyRequestBuilder`.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'GET',
		path: 'cloud-init-scripts',
	};
}
