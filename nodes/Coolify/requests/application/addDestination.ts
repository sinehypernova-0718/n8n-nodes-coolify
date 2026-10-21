import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that attaches an additional destination to an application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/destinations`.
 */
export async function addDestinationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'add a destination to an application',
	);

	const destinationUuid = (
		this.getNodeParameter('destinationUuid', itemIndex, '') as string
	).trim();
	if (!destinationUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'Destination UUID is required to add a destination',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/destinations`,
		body: { destination_uuid: destinationUuid },
	};
}
