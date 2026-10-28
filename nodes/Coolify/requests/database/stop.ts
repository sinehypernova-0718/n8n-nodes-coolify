import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDatabaseUuid } from './parameters';

/**
 * Build the request that stops a database.
 *
 * The Docker cleanup of the Coolify API defaults to `true`, so the flag is
 * always sent explicitly: the user can switch it off to stop the cleanup.
 * Stopping a database queues the operation on the server, so the request is
 * never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /databases/{uuid}/stop`.
 */
export async function stopDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const databaseUuid = requireDatabaseUuid(this, itemIndex, 'stop a database');

	return {
		method: 'POST',
		path: `databases/${databaseUuid}/stop`,
		qs: {
			docker_cleanup: this.getNodeParameter('dockerCleanup', itemIndex, true) === true,
		},
	};
}
