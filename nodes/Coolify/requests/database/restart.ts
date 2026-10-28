import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDatabaseUuid } from './parameters';

/**
 * Build the request that restarts a database.
 *
 * Restarting a database queues the operation on the server; the API only
 * accepts the request and does not wait for the database to restart. The
 * request is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /databases/{uuid}/restart`.
 */
export async function restartDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const databaseUuid = requireDatabaseUuid(this, itemIndex, 'restart a database');

	return {
		method: 'POST',
		path: `databases/${databaseUuid}/restart`,
	};
}
