/**
 * The field contract of the storage backup schedule operation.
 *
 * The operation replaces the whole schedule of a storage, so every value of
 * the schedule travels with every request. The editor groups the values in
 * collections, because a flat list of fourteen fields hides the structure of
 * the schedule. The contract holds the grouping, the names of the fields and
 * the defaults of the API, so the editor and the request body can never
 * disagree about a field.
 *
 * The contract was verified against the `VolumeBackupsController` of the
 * Coolify release v4.4.6: the endpoint accepts exactly the fourteen fields of
 * this contract, and the defaults the contract carries are the defaults the
 * endpoint applies.
 */

import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

/**
 * The names of the collections of the schedule.
 */
export const STORAGE_BACKUP_SCHEDULE_COLLECTIONS = {
	options: 'backupOptions',
	localRetention: 'localRetention',
	s3Retention: 's3Retention',
	notifications: 'notifications',
} as const;

/**
 * The name of a collection of the schedule.
 */
export type StorageBackupScheduleCollection =
	(typeof STORAGE_BACKUP_SCHEDULE_COLLECTIONS)[keyof typeof STORAGE_BACKUP_SCHEDULE_COLLECTIONS];

/**
 * The kind of the editor control of a field.
 */
export type StorageBackupScheduleFieldType = 'boolean' | 'number' | 'string';

/**
 * The contract of a single field of the schedule.
 */
export interface StorageBackupScheduleFieldSpec {
	/** The name of the field in the editor. */
	uiName: string;
	/**
	 * The name of the collection the field belongs to.
	 *
	 * A field the editor shows at the top level does not belong to a
	 * collection.
	 */
	collection?: StorageBackupScheduleCollection;
	/** The name of the field in the Coolify API. */
	apiName: string;
	/** The label of the field in the editor. */
	displayName: string;
	/** The kind of the editor control. */
	type: StorageBackupScheduleFieldType;
	/** The description of the field. */
	description: string;
	/** The default of the field, the default the API applies. */
	default: string | number | boolean;
	/** The smallest value the API accepts. */
	minValue?: number;
	/** The largest value the API accepts. */
	maxValue?: number;
	/** The number of decimal places of a number. */
	numberPrecision?: number;
	/**
	 * The field of the same collection that has to be switched on for the
	 * editor to show the field.
	 */
	showWhen?: { field: string; value: boolean };
}

/**
 * The switch of the schedule.
 *
 * The API applies the default of the field, so the field carries that default
 * in the editor and is sent with every request, which lets the user switch
 * the schedule off.
 */
export const STORAGE_BACKUP_SCHEDULE_ENABLED: StorageBackupScheduleFieldSpec = {
	uiName: 'enabled',
	apiName: 'enabled',
	displayName: 'Enabled',
	type: 'boolean',
	description: 'Whether the backup schedule is enabled',
	default: true,
};

/**
 * Every field of the schedule that belongs to a collection, in the order the
 * editor shows the fields.
 */
export const STORAGE_BACKUP_SCHEDULE_FIELDS: StorageBackupScheduleFieldSpec[] = [
	{
		uiName: 'saveS3',
		collection: 'backupOptions',
		apiName: 'save_s3',
		displayName: 'Save To S3',
		type: 'boolean',
		description: 'Whether the backups are also stored in an S3 storage',
		default: false,
	},
	{
		uiName: 's3StorageUuid',
		collection: 'backupOptions',
		apiName: 's3_storage_uuid',
		displayName: 'S3 Storage UUID',
		type: 'string',
		description: 'UUID of the S3 storage the backups are written to',
		default: '',
		showWhen: { field: 'saveS3', value: true },
	},
	{
		uiName: 'disableLocalBackup',
		collection: 'backupOptions',
		apiName: 'disable_local_backup',
		displayName: 'Disable Local Backup',
		type: 'boolean',
		description:
			'Whether the local backups are skipped when the backups are stored in an S3 storage',
		default: false,
		showWhen: { field: 'saveS3', value: true },
	},
	{
		uiName: 'stopDuringBackup',
		collection: 'backupOptions',
		apiName: 'stop_during_backup',
		displayName: 'Stop During Backup',
		type: 'boolean',
		description:
			'Whether the containers of the application are stopped during the backup. Needs a token with the deploy ability.',
		default: false,
	},
	{
		uiName: 'retentionAmountLocally',
		collection: 'localRetention',
		apiName: 'retention_amount_locally',
		displayName: 'Retention Amount Locally',
		type: 'number',
		description: 'Number of local backups that are kept',
		default: 7,
		minValue: 0,
		maxValue: 10_000,
	},
	{
		uiName: 'retentionDaysLocally',
		collection: 'localRetention',
		apiName: 'retention_days_locally',
		displayName: 'Retention Days Locally',
		type: 'number',
		description: 'Number of days a local backup is kept',
		default: 0,
		minValue: 0,
		maxValue: 2_147_483_647,
	},
	{
		uiName: 'retentionMaxStorageLocally',
		collection: 'localRetention',
		apiName: 'retention_max_storage_locally',
		displayName: 'Retention Max Storage Locally',
		type: 'number',
		description: 'Maximum size of the local backups in bytes, zero means no limit',
		default: 0,
		minValue: 0,
		maxValue: 9_999_999_999,
		numberPrecision: 2,
	},
	{
		uiName: 'retentionAmountS3',
		collection: 's3Retention',
		apiName: 'retention_amount_s3',
		displayName: 'Retention Amount S3',
		type: 'number',
		description: 'Number of S3 backups that are kept',
		default: 7,
		minValue: 0,
		maxValue: 10_000,
	},
	{
		uiName: 'retentionDaysS3',
		collection: 's3Retention',
		apiName: 'retention_days_s3',
		displayName: 'Retention Days S3',
		type: 'number',
		description: 'Number of days an S3 backup is kept',
		default: 0,
		minValue: 0,
		maxValue: 2_147_483_647,
	},
	{
		uiName: 'retentionMaxStorageS3',
		collection: 's3Retention',
		apiName: 'retention_max_storage_s3',
		displayName: 'Retention Max Storage S3',
		type: 'number',
		description: 'Maximum size of the S3 backups in bytes, zero means no limit',
		default: 0,
		minValue: 0,
		maxValue: 9_999_999_999,
		numberPrecision: 2,
	},
	{
		uiName: 'timeout',
		collection: 'notifications',
		apiName: 'timeout',
		displayName: 'Timeout',
		type: 'number',
		description:
			'Time in seconds after which a running backup is stopped. The value is always sent, so it is set to the value shown here on every request.',
		default: 36_000,
		minValue: 60,
		maxValue: 36_000,
	},
	{
		uiName: 'missingBackupNotificationDays',
		collection: 'notifications',
		apiName: 'missing_backup_notification_days',
		displayName: 'Missing Backup Notification Days',
		type: 'number',
		description:
			'Number of days without a backup before an alert is raised, zero disables the alert. The value is always sent, so it is set to the value shown here on every request.',
		default: 0,
		minValue: 0,
		maxValue: 365,
	},
];

/**
 * The contract of a field of the schedule, by the name of the field.
 */
const FIELDS_BY_NAME = new Map(
	STORAGE_BACKUP_SCHEDULE_FIELDS.map((field) => [field.uiName, field]),
);

/**
 * The contract of a field of the schedule.
 *
 * @param name The name of the field in the editor.
 * @returns The contract of the field.
 */
export function storageBackupScheduleField(name: string): StorageBackupScheduleFieldSpec {
	const spec = FIELDS_BY_NAME.get(name);

	if (!spec) {
		throw new Error(`The storage backup schedule has no field "${name}"`);
	}

	return spec;
}

/**
 * The fields of a collection of the schedule, in the order the editor shows
 * them.
 *
 * @param collection The name of the collection.
 * @returns The contracts of the fields of the collection.
 */
export function storageBackupScheduleCollectionFields(
	collection: StorageBackupScheduleCollection,
): StorageBackupScheduleFieldSpec[] {
	return STORAGE_BACKUP_SCHEDULE_FIELDS.filter((field) => field.collection === collection);
}

/**
 * The value of a field of the schedule.
 *
 * The value of the collection wins over the value of the parameter of the flat
 * layout a workflow of an earlier version of the node can carry. A field the
 * collection does not hold falls back to that parameter and then to the
 * default of the API, so a workflow that was saved before the fields were
 * grouped keeps the values it was saved with.
 *
 * A value the collection holds is used as it is, so a `false` and a `0` are
 * values and not missing values.
 *
 * @param itemIndex Index of the input item the request belongs to.
 * @param collection The values of the collection the field belongs to.
 * @param spec The contract of the field.
 * @returns The value of the field.
 */
export function storageBackupScheduleFieldValue(
	this: IExecuteFunctions,
	itemIndex: number,
	collection: IDataObject,
	spec: StorageBackupScheduleFieldSpec,
): string | number | boolean {
	const value = collection[spec.uiName];

	if (value !== undefined && value !== null) {
		return value as string | number | boolean;
	}

	return this.getNodeParameter(spec.uiName, itemIndex, spec.default) as string | number | boolean;
}

/**
 * The value of a boolean field of the schedule.
 *
 * @param itemIndex Index of the input item the request belongs to.
 * @param collection The values of the collection the field belongs to.
 * @param spec The contract of the field.
 * @returns The value of the field.
 */
export function storageBackupScheduleBoolean(
	this: IExecuteFunctions,
	itemIndex: number,
	collection: IDataObject,
	spec: StorageBackupScheduleFieldSpec,
): boolean {
	return storageBackupScheduleFieldValue.call(this, itemIndex, collection, spec) === true;
}

/**
 * The value of a number field of the schedule.
 *
 * @param itemIndex Index of the input item the request belongs to.
 * @param collection The values of the collection the field belongs to.
 * @param spec The contract of the field.
 * @returns The value of the field.
 */
export function storageBackupScheduleNumber(
	this: IExecuteFunctions,
	itemIndex: number,
	collection: IDataObject,
	spec: StorageBackupScheduleFieldSpec,
): number {
	const value = storageBackupScheduleFieldValue.call(this, itemIndex, collection, spec);

	return typeof value === 'number' && Number.isFinite(value) ? value : (spec.default as number);
}

/**
 * The value of a text field of the schedule.
 *
 * @param itemIndex Index of the input item the request belongs to.
 * @param collection The values of the collection the field belongs to.
 * @param spec The contract of the field.
 * @returns The value of the field.
 */
export function storageBackupScheduleText(
	this: IExecuteFunctions,
	itemIndex: number,
	collection: IDataObject,
	spec: StorageBackupScheduleFieldSpec,
): string {
	const value = storageBackupScheduleFieldValue.call(this, itemIndex, collection, spec);

	return typeof value === 'string' ? value : (spec.default as string);
}
