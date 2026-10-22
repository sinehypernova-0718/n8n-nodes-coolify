/**
 * The editor description of the storage backup schedule operation.
 *
 * The fields are rendered from the field contract in
 * `nodes/Coolify/requests/application/storageBackupScheduleFields.ts`, so the
 * editor and the request body can never disagree about a field.
 */

import type { INodeProperties } from 'n8n-workflow';

import {
	STORAGE_BACKUP_SCHEDULE_COLLECTIONS,
	STORAGE_BACKUP_SCHEDULE_ENABLED,
	storageBackupScheduleCollectionFields,
	type StorageBackupScheduleCollection,
	type StorageBackupScheduleFieldSpec,
	type StorageBackupScheduleFieldType,
} from '../../requests/application/storageBackupScheduleFields';
import { showFor } from './applicationFieldProperties';

/**
 * The operation the description belongs to.
 */
const OPERATION = 'setStorageBackupSchedule';

/**
 * The label of every collection of the schedule.
 */
const COLLECTION_DISPLAY_NAMES: Record<StorageBackupScheduleCollection, string> = {
	backupOptions: 'Backup Options',
	localRetention: 'Local Retention',
	s3Retention: 'S3 Retention',
	notifications: 'Notifications',
};

/**
 * The description of every collection of the schedule.
 */
const COLLECTION_DESCRIPTIONS: Record<StorageBackupScheduleCollection, string> = {
	backupOptions:
		'Where the backups are stored and whether the application is stopped during a backup',
	localRetention: 'How many local backups are kept and how long they are kept',
	s3Retention: 'How many backups in the S3 storage are kept and how long they are kept',
	notifications: 'How long a backup may run and when a missing backup is reported',
};

/**
 * The default of a field of the schedule.
 *
 * @param spec The contract of the field.
 * @returns The default of the field.
 */
function defaultValue(spec: StorageBackupScheduleFieldSpec): string | number | boolean | string[] {
	return spec.default;
}

/**
 * The editor control of a kind of field.
 *
 * A list of strings is a text control that repeats its value.
 *
 * @param type The kind of the field.
 * @returns The type of the editor control.
 */
function controlType(type: StorageBackupScheduleFieldType): INodeProperties['type'] {
	return type === 'stringList' ? 'string' : type;
}

/**
 * The editor control of a field of the schedule.
 *
 * The control of a field that belongs to a collection carries the default of
 * the API, so an item the user adds without touching it holds the value the
 * API would use.
 *
 * @param spec The contract of the field.
 * @returns The editor control of the field.
 */
function fieldProperty(spec: StorageBackupScheduleFieldSpec): INodeProperties {
	const typeOptions: INodeProperties['typeOptions'] = {};

	if (spec.type === 'number') {
		if (spec.minValue !== undefined) {
			typeOptions.minValue = spec.minValue;
		}
		if (spec.maxValue !== undefined) {
			typeOptions.maxValue = spec.maxValue;
		}
		if (spec.numberPrecision !== undefined) {
			typeOptions.numberPrecision = spec.numberPrecision;
		}
	}
	if (spec.type === 'stringList') {
		typeOptions.multipleValues = true;
		typeOptions.multipleValueButtonText = 'Add Value';
	}

	return {
		displayName: spec.displayName,
		name: spec.uiName,
		type: controlType(spec.type),
		default: defaultValue(spec),
		description: spec.description,
		typeOptions: Object.keys(typeOptions).length > 0 ? typeOptions : undefined,
		displayOptions: spec.showWhen
			? { show: { [spec.showWhen.field]: [spec.showWhen.value] } }
			: undefined,
	};
}

/**
 * The description of the storage backup schedule operation.
 *
 * The values of the schedule are grouped in collections, because the API
 * replaces the whole schedule and a flat list of fourteen fields hides how
 * the values belong together.
 *
 * @returns The description of the operation.
 */
export function storageBackupScheduleDescription(): INodeProperties[] {
	const properties: INodeProperties[] = [
		{
			displayName: STORAGE_BACKUP_SCHEDULE_ENABLED.displayName,
			name: STORAGE_BACKUP_SCHEDULE_ENABLED.uiName,
			type: controlType(STORAGE_BACKUP_SCHEDULE_ENABLED.type),
			default: defaultValue(STORAGE_BACKUP_SCHEDULE_ENABLED),
			displayOptions: showFor([OPERATION]),
			description: STORAGE_BACKUP_SCHEDULE_ENABLED.description,
		},
	];

	for (const collection of Object.values(STORAGE_BACKUP_SCHEDULE_COLLECTIONS)) {
		properties.push({
			displayName: COLLECTION_DISPLAY_NAMES[collection],
			name: collection,
			type: 'collection',
			default: {},
			description: COLLECTION_DESCRIPTIONS[collection],
			displayOptions: showFor([OPERATION]),
			options: storageBackupScheduleCollectionFields(collection).map(fieldProperty),
		});
	}

	return properties;
}
