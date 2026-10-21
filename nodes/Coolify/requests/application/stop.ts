import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that stops an application.
 *
 * The Docker cleanup of the Coolify API defaults to `true`, so the flag is
 * always sent explicitly: the user can switch it off to stop the cleanup.
 * Stopping an application that is already stopped is free of side effects,
 * so the request may be repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/stop`.
 */
export async function stopApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'stop an application');

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/stop`,
		qs: {
			docker_cleanup: this.getNodeParameter('dockerCleanup', itemIndex, true) === true,
		},
		retrySafety: 'safe',
	};
}
