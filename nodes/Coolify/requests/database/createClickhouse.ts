import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildCreateDatabaseBody } from './databaseFields';

/**
 * Build the request that creates a Clickhouse database.
 *
 * The API creates the database and returns its UUID. A password it generates
 * is not part of the creation response, it is returned by the get endpoint
 * only for a token with the `read:sensitive` or the `root` ability.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /databases/clickhouse`.
 */
export async function createClickhouseDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'POST',
		path: 'databases/clickhouse',
		body: buildCreateDatabaseBody(this, itemIndex, 'clickhouse'),
	};
}
