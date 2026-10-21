import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that queues an immediate backup of a storage.
 *
 * The Coolify API only queues a backup for a storage that already has a
 * backup schedule, so the request is rejected when the storage has none.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/storages/{storage_uuid}/backups/run`.
 */
export async function runStorageBackupRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'run a backup of a storage');

	const storageUuid = (this.getNodeParameter('storageUuid', itemIndex, '') as string).trim();
	if (!storageUuid) {
		throw new NodeOperationError(this.getNode(), 'Storage UUID is required to run a backup', {
			itemIndex,
		});
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/storages/${storageUuid}/backups/run`,
	};
}
