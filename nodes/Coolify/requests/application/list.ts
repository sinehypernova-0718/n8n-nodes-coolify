import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { locatorValue } from '../../shared/locatorValue';

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
	const tag = locatorValue(this.getNodeParameter('tag', itemIndex, '')).trim();

	const request: CoolifyRequest = {
		method: 'GET',
		path: 'applications',
	};

	if (tag !== '') {
		request.qs = { tag };
	}

	return request;
}
