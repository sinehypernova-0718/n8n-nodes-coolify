import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDeploymentUuid } from './parameters';

/**
 * Build the request that cancels a deployment.
 *
 * Only a deployment that is queued or in progress can be cancelled. The
 * cancellation changes the state of the deployment and is not free of side
 * effects when it is repeated, so the request is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /deployments/{uuid}/cancel`.
 */
export async function cancelDeploymentRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireDeploymentUuid(this, itemIndex, 'cancel a deployment');

	return {
		method: 'POST',
		path: `deployments/${uuid}/cancel`,
		retrySafety: 'unsafe',
	};
}
