import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDeploymentUuid } from './parameters';

/**
 * Build the request that reads a single deployment.
 *
 * The deployment log is returned only for tokens with the `read:sensitive` or
 * the `root` ability, so the response may omit it.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /deployments/{uuid}`.
 */
export async function getDeploymentRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireDeploymentUuid(this, itemIndex, 'get a deployment');

	return {
		method: 'GET',
		path: `deployments/${uuid}`,
	};
}
