import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';
import {
	STORAGE_BACKUP_SCHEDULE_COLLECTIONS,
	STORAGE_BACKUP_SCHEDULE_ENABLED,
	storageBackupScheduleBoolean,
	storageBackupScheduleField,
	storageBackupScheduleNumber,
	storageBackupScheduleText,
} from './storageBackupScheduleFields';

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

	// The values of the schedule live in collections. A collection the user
	// never touched is absent, and a field the collection does not hold falls
	// back to the parameter of the flat layout of an earlier version of the
	// node and then to the default of the API.
	const options = this.getNodeParameter(
		STORAGE_BACKUP_SCHEDULE_COLLECTIONS.options,
		itemIndex,
		{},
	) as IDataObject;
	const localRetention = this.getNodeParameter(
		STORAGE_BACKUP_SCHEDULE_COLLECTIONS.localRetention,
		itemIndex,
		{},
	) as IDataObject;
	const s3Retention = this.getNodeParameter(
		STORAGE_BACKUP_SCHEDULE_COLLECTIONS.s3Retention,
		itemIndex,
		{},
	) as IDataObject;
	const notifications = this.getNodeParameter(
		STORAGE_BACKUP_SCHEDULE_COLLECTIONS.notifications,
		itemIndex,
		{},
	) as IDataObject;

	const saveS3 = storageBackupScheduleBoolean.call(
		this,
		itemIndex,
		options,
		storageBackupScheduleField('saveS3'),
	);
	const disableLocalBackup = storageBackupScheduleBoolean.call(
		this,
		itemIndex,
		options,
		storageBackupScheduleField('disableLocalBackup'),
	);
	const stopDuringBackup = storageBackupScheduleBoolean.call(
		this,
		itemIndex,
		options,
		storageBackupScheduleField('stopDuringBackup'),
	);
	const s3StorageUuid = storageBackupScheduleText
		.call(this, itemIndex, options, storageBackupScheduleField('s3StorageUuid'))
		.trim();

	if (disableLocalBackup && !saveS3) {
		throw new NodeOperationError(
			this.getNode(),
			'Local backups can only be disabled when S3 backups are enabled',
			{ itemIndex },
		);
	}

	if (saveS3 && !s3StorageUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'The UUID of the S3 storage is required when S3 backups are enabled',
			{ itemIndex },
		);
	}

	const body: CoolifyRequest['body'] = {
		frequency,
		enabled:
			this.getNodeParameter(
				STORAGE_BACKUP_SCHEDULE_ENABLED.uiName,
				itemIndex,
				STORAGE_BACKUP_SCHEDULE_ENABLED.default,
			) === true,
		retention_amount_locally: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			localRetention,
			storageBackupScheduleField('retentionAmountLocally'),
		),
		retention_days_locally: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			localRetention,
			storageBackupScheduleField('retentionDaysLocally'),
		),
		retention_max_storage_locally: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			localRetention,
			storageBackupScheduleField('retentionMaxStorageLocally'),
		),
		retention_amount_s3: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			s3Retention,
			storageBackupScheduleField('retentionAmountS3'),
		),
		retention_days_s3: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			s3Retention,
			storageBackupScheduleField('retentionDaysS3'),
		),
		retention_max_storage_s3: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			s3Retention,
			storageBackupScheduleField('retentionMaxStorageS3'),
		),
		timeout: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			notifications,
			storageBackupScheduleField('timeout'),
		),
		missing_backup_notification_days: storageBackupScheduleNumber.call(
			this,
			itemIndex,
			notifications,
			storageBackupScheduleField('missingBackupNotificationDays'),
		),
	};

	if (saveS3) {
		body.save_s3 = true;
	}
	if (disableLocalBackup) {
		body.disable_local_backup = true;
	}
	if (stopDuringBackup) {
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
