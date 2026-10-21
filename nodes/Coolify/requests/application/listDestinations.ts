import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that lists the destinations of an application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /applications/{uuid}/destinations`.
 */
export async function listDestinationsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'list the destinations of an application',
	);

	return {
		method: 'GET',
		path: `applications/${applicationUuid}/destinations`,
	};
}
