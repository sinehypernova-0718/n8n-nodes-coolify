import { NodeOperationError, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDeploymentApplicationUuid } from './parameters';

/**
 * Default number of deployments the Coolify API skips when none is requested.
 */
const DEFAULT_SKIP = 0;

/**
 * Default number of deployments the Coolify API returns when none is requested.
 */
const DEFAULT_TAKE = 10;

/**
 * Build the request that lists the deployments of an application.
 *
 * Coolify returns the deployments of the application, newest first, together
 * with the total number of its deployments (`{count, deployments}`). The
 * `skip` and `take` parameters are sent explicitly: both carry the default of
 * the API, so an untouched control leaves the pagination unchanged.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /deployments/applications/{uuid}`.
 */
export async function listApplicationDeploymentsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireDeploymentApplicationUuid(
		this,
		itemIndex,
		'list the deployments of an application',
	);

	const skip = this.getNodeParameter('skip', itemIndex, DEFAULT_SKIP) as number;
	const take = this.getNodeParameter('take', itemIndex, DEFAULT_TAKE) as number;

	if (!Number.isInteger(skip) || skip < 0) {
		throw new NodeOperationError(this.getNode(), 'Skip must be an integer of 0 or more', {
			itemIndex,
		});
	}
	if (!Number.isInteger(take) || take < 1) {
		throw new NodeOperationError(this.getNode(), 'Take must be an integer of 1 or more', {
			itemIndex,
		});
	}

	const qs: IDataObject = { skip, take };

	return {
		method: 'GET',
		path: `deployments/applications/${applicationUuid}`,
		qs,
	};
}
