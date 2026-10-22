import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { encodePathSegment, requireApplicationUuid } from './parameters';

/**
 * Build the request that deletes a storage of an application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /applications/{uuid}/storages/{storage_uuid}`.
 */
export async function deleteStorageRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'delete a storage of an application',
	);

	const storageUuid = (this.getNodeParameter('storageUuid', itemIndex, '') as string).trim();
	if (!storageUuid) {
		throw new NodeOperationError(this.getNode(), 'Storage UUID is required to delete a storage', {
			itemIndex,
		});
	}

	return {
		method: 'DELETE',
		path: `applications/${applicationUuid}/storages/${encodePathSegment(storageUuid)}`,
	};
}
