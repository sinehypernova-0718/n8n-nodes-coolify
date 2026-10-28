import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildUpdateDatabaseBody } from './databaseUpdateFields';
import { requireDatabaseUuid } from './parameters';

/**
 * Build the request that updates a database.
 *
 * The Coolify API updates a database with a partial update: it only changes
 * the fields of the request body and keeps every other field as it is. The
 * node therefore only sends the settings the user changed, and it refuses to
 * send a request that would not change anything.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /databases/{uuid}`.
 */
export async function updateDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const databaseUuid = requireDatabaseUuid(this, itemIndex, 'update a database');
	const body = buildUpdateDatabaseBody(this, itemIndex);

	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Select at least one setting to update the database',
			{
				itemIndex,
			},
		);
	}

	return {
		method: 'PATCH',
		path: `databases/${databaseUuid}`,
		body,
	};
}
