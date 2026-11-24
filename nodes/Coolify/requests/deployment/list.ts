import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';

/**
 * Build the request that lists the deployments of the team.
 *
 * Coolify returns the deployments that are currently queued or in progress as
 * a plain array, oldest first. A finished, failed or cancelled deployment is
 * not part of the list; it is read by UUID instead. The endpoint takes no
 * query parameters and no body.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /deployments`.
 */
export async function listDeploymentsRequest(
	this: IExecuteFunctions,
	// The list endpoint takes no parameter of this node, so the item index is
	// not read to build the request. A request builder keeps it in its
	// signature nevertheless, see `CoolifyRequestBuilder`.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'GET',
		path: 'deployments',
	};
}
