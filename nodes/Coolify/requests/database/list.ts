import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';

/**
 * Build the request that lists the databases of the team.
 *
 * The endpoint takes no parameter and returns every standalone database of
 * the team in one array, so the request is configured entirely through the
 * operation selector.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /databases`.
 */
export async function listDatabasesRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	void itemIndex;

	return {
		method: 'GET',
		path: 'databases',
	};
}
