import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that lists the tags of an application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /applications/{uuid}/tags`.
 */
export async function listTagsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'list the tags of an application',
	);

	return {
		method: 'GET',
		path: `applications/${applicationUuid}/tags`,
	};
}
