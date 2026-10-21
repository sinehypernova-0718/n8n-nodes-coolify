import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';

/**
 * Build the request that lists the applications of the team.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /applications`.
 */
export async function listApplicationsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const tag = (this.getNodeParameter('tag', itemIndex, '') as string).trim();

	const request: CoolifyRequest = {
		method: 'GET',
		path: 'applications',
	};

	if (tag !== '') {
		request.qs = { tag };
	}

	return request;
}
