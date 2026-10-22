import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { encodePathSegment, requireApplicationUuid } from './parameters';

/**
 * Build the request that detaches a destination from an application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /applications/{uuid}/destinations/{destination_uuid}`.
 */
export async function removeDestinationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'remove a destination from an application',
	);

	const destinationUuid = (
		this.getNodeParameter('destinationUuid', itemIndex, '') as string
	).trim();
	if (!destinationUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'Destination UUID is required to remove a destination',
			{ itemIndex },
		);
	}

	return {
		method: 'DELETE',
		path: `applications/${applicationUuid}/destinations/${encodePathSegment(destinationUuid)}`,
	};
}
