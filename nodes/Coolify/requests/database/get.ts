import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDatabaseUuid } from './parameters';

/**
 * Build the request that gets a database by UUID.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /databases/{uuid}`.
 */
export async function getDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const databaseUuid = requireDatabaseUuid(this, itemIndex, 'get a database');

	return {
		method: 'GET',
		path: `databases/${databaseUuid}`,
	};
}
