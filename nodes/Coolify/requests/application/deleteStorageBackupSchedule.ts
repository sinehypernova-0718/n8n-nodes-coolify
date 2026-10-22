import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { encodePathSegment, requireApplicationUuid } from './parameters';

/**
 * Build the request that deletes the backup schedule of a storage.
 *
 * The Coolify API deletes the local and the S3 archives of the storage with
 * the schedule and rejects the request while a backup or a recovery is still
 * running.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /applications/{uuid}/storages/{storage_uuid}/backups`.
 */
export async function deleteStorageBackupScheduleRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'delete the backup schedule of a storage',
	);

	const storageUuid = (this.getNodeParameter('storageUuid', itemIndex, '') as string).trim();
	if (!storageUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'Storage UUID is required to delete a backup schedule',
			{ itemIndex },
		);
	}

	return {
		method: 'DELETE',
		path: `applications/${applicationUuid}/storages/${encodePathSegment(storageUuid)}/backups`,
	};
}
