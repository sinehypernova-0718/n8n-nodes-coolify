import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that creates or replaces the backup schedule of a storage.
 *
 * The Coolify API replaces the whole schedule, so every value is sent. The
 * flags that default to `false` are only sent when they are switched on, the
 * flag that defaults to `true` is always sent so that it can be switched off.
 *
 * The frequency is a cron or a human expression. Only its length is checked
 * here, Coolify validates the expression itself.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PUT /applications/{uuid}/storages/{storage_uuid}/backups`.
 */
export async function setStorageBackupScheduleRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'set the backup schedule of a storage',
	);

	const storageUuid = (this.getNodeParameter('storageUuid', itemIndex, '') as string).trim();
	if (!storageUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'Storage UUID is required to set a backup schedule',
			{ itemIndex },
		);
	}

	const frequency = (this.getNodeParameter('frequency', itemIndex, '') as string).trim();
	if (!frequency) {
		throw new NodeOperationError(
			this.getNode(),
			'The frequency of the backup schedule is required',
			{ itemIndex },
		);
	}

	const saveS3 = this.getNodeParameter('saveS3', itemIndex, false) === true;
	const disableLocalBackup = this.getNodeParameter('disableLocalBackup', itemIndex, false) === true;

	if (disableLocalBackup && !saveS3) {
		throw new NodeOperationError(
			this.getNode(),
			'Local backups can only be disabled when S3 backups are enabled',
			{ itemIndex },
		);
	}

	const s3StorageUuid = (this.getNodeParameter('s3StorageUuid', itemIndex, '') as string).trim();
	if (saveS3 && !s3StorageUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'The UUID of the S3 storage is required when S3 backups are enabled',
			{ itemIndex },
		);
	}

	const body: CoolifyRequest['body'] = {
		frequency,
		enabled: this.getNodeParameter('enabled', itemIndex, true) === true,
		retention_amount_locally: this.getNodeParameter(
			'retentionAmountLocally',
			itemIndex,
			7,
		) as number,
		retention_days_locally: this.getNodeParameter('retentionDaysLocally', itemIndex, 0) as number,
		retention_max_storage_locally: this.getNodeParameter(
			'retentionMaxStorageLocally',
			itemIndex,
			0,
		) as number,
		retention_amount_s3: this.getNodeParameter('retentionAmountS3', itemIndex, 7) as number,
		retention_days_s3: this.getNodeParameter('retentionDaysS3', itemIndex, 0) as number,
		retention_max_storage_s3: this.getNodeParameter(
			'retentionMaxStorageS3',
			itemIndex,
			0,
		) as number,
		timeout: this.getNodeParameter('timeout', itemIndex, 36_000) as number,
		missing_backup_notification_days: this.getNodeParameter(
			'missingBackupNotificationDays',
			itemIndex,
			0,
		) as number,
	};

	if (saveS3) {
		body.save_s3 = true;
	}
	if (disableLocalBackup) {
		body.disable_local_backup = true;
	}
	if (this.getNodeParameter('stopDuringBackup', itemIndex, false) === true) {
		body.stop_during_backup = true;
	}
	if (s3StorageUuid !== '') {
		body.s3_storage_uuid = s3StorageUuid;
	}

	return {
		method: 'PUT',
		path: `applications/${applicationUuid}/storages/${storageUuid}/backups`,
		body,
	};
}
