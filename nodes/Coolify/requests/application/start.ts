import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that starts an application.
 *
 * Both query parameters of the Coolify API default to `false`, so they are
 * only sent when the user switched them on. Starting an application queues a
 * deployment, so the request is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/start`.
 */
export async function startApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'start an application');

	const request: CoolifyRequest = {
		method: 'POST',
		path: `applications/${applicationUuid}/start`,
	};

	const qs: CoolifyRequest['qs'] = {};

	if (this.getNodeParameter('force', itemIndex, false) === true) {
		qs.force = true;
	}
	if (this.getNodeParameter('instantDeploy', itemIndex, false) === true) {
		qs.instant_deploy = true;
	}

	if (Object.keys(qs).length > 0) {
		request.qs = qs;
	}

	return request;
}
