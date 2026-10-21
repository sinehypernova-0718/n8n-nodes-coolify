import { type IExecuteFunctions } from 'n8n-workflow';

import { addDestinationRequest } from './addDestination';
import { cloneApplicationRequest } from './clone';
import { createDockerfileApplicationRequest } from './createDockerfile';
import { createDockerImageApplicationRequest } from './createDockerImage';
import { createEnvRequest } from './createEnv';
import { createPreviewDeploymentRequest } from './createPreviewDeployment';
import { createPrivateDeployKeyApplicationRequest } from './createPrivateDeployKey';
import { createPrivateGithubAppApplicationRequest } from './createPrivateGithubApp';
import { createPublicApplicationRequest } from './createPublic';
import { createStorageRequest } from './createStorage';
import { createTagRequest } from './createTag';
import { deleteApplicationRequest } from './delete';
import { deleteEnvRequest } from './deleteEnv';
import { deletePreviewDeploymentRequest } from './deletePreviewDeployment';
import { deleteStorageBackupScheduleRequest } from './deleteStorageBackupSchedule';
import { deleteStorageRequest } from './deleteStorage';
import { deleteTagRequest } from './deleteTag';
import { getApplicationRequest } from './get';
import { getLogsRequest } from './getLogs';
import { getPreviewDeploymentRequest } from './getPreviewDeployment';
import { getPreviewLogsRequest } from './getPreviewLogs';
import { listApplicationsRequest } from './list';
import { listDestinationsRequest } from './listDestinations';
import { listEnvsRequest } from './listEnvs';
import { listPreviewDeploymentsRequest } from './listPreviewDeployments';
import { listRollbackImagesRequest } from './listRollbackImages';
import { listStoragesRequest } from './listStorages';
import { listTagsRequest } from './listTags';
import { migrateApplicationRequest } from './migrate';
import { moveApplicationRequest } from './move';
import { removeDestinationRequest } from './removeDestination';
import { restartApplicationRequest } from './restart';
import { rollbackApplicationRequest } from './rollback';
import { runStorageBackupRequest } from './runStorageBackup';
import { setStorageBackupScheduleRequest } from './setStorageBackupSchedule';
import { startApplicationRequest } from './start';
import { stopApplicationRequest } from './stop';
import { updateApplicationRequest } from './update';
import { updateEnvsBulkRequest } from './updateEnvsBulk';
import { updateEnvRequest } from './updateEnv';
import { updatePreviewDomainsRequest } from './updatePreviewDomains';
import { updateStorageRequest } from './updateStorage';
import type { CoolifyRequest } from '../types';

/**
 * The request builder of every application operation.
 *
 * The map is the single place that maps an operation to its endpoint, so the
 * description of an operation and its request can never drift apart.
 */
export const applicationRequestBuilders: Record<
	string,
	(this: IExecuteFunctions, itemIndex: number) => Promise<CoolifyRequest>
> = {
	addDestination: addDestinationRequest,
	clone: cloneApplicationRequest,
	createDockerfile: createDockerfileApplicationRequest,
	createDockerImage: createDockerImageApplicationRequest,
	createEnv: createEnvRequest,
	createPreviewDeployment: createPreviewDeploymentRequest,
	createPrivateDeployKey: createPrivateDeployKeyApplicationRequest,
	createPrivateGithubApp: createPrivateGithubAppApplicationRequest,
	createPublic: createPublicApplicationRequest,
	createStorage: createStorageRequest,
	createTag: createTagRequest,
	delete: deleteApplicationRequest,
	deleteEnv: deleteEnvRequest,
	deletePreviewDeployment: deletePreviewDeploymentRequest,
	deleteStorage: deleteStorageRequest,
	deleteStorageBackupSchedule: deleteStorageBackupScheduleRequest,
	deleteTag: deleteTagRequest,
	get: getApplicationRequest,
	getLogs: getLogsRequest,
	getPreviewDeployment: getPreviewDeploymentRequest,
	getPreviewLogs: getPreviewLogsRequest,
	list: listApplicationsRequest,
	listDestinations: listDestinationsRequest,
	listEnvs: listEnvsRequest,
	listPreviewDeployments: listPreviewDeploymentsRequest,
	listRollbackImages: listRollbackImagesRequest,
	listStorages: listStoragesRequest,
	listTags: listTagsRequest,
	migrate: migrateApplicationRequest,
	move: moveApplicationRequest,
	removeDestination: removeDestinationRequest,
	restart: restartApplicationRequest,
	rollback: rollbackApplicationRequest,
	runStorageBackup: runStorageBackupRequest,
	setStorageBackupSchedule: setStorageBackupScheduleRequest,
	start: startApplicationRequest,
	stop: stopApplicationRequest,
	update: updateApplicationRequest,
	updateEnv: updateEnvRequest,
	updateEnvsBulk: updateEnvsBulkRequest,
	updatePreviewDomains: updatePreviewDomainsRequest,
	updateStorage: updateStorageRequest,
};

export { addDestinationRequest } from './addDestination';
export { cloneApplicationRequest } from './clone';
export { createDockerfileApplicationRequest } from './createDockerfile';
export { createDockerImageApplicationRequest } from './createDockerImage';
export { createEnvRequest } from './createEnv';
export { createPreviewDeploymentRequest } from './createPreviewDeployment';
export { createPrivateDeployKeyApplicationRequest } from './createPrivateDeployKey';
export { createPrivateGithubAppApplicationRequest } from './createPrivateGithubApp';
export { createPublicApplicationRequest } from './createPublic';
export { createStorageRequest } from './createStorage';
export { createTagRequest } from './createTag';
export { deleteApplicationRequest } from './delete';
export { deleteEnvRequest } from './deleteEnv';
export { deletePreviewDeploymentRequest } from './deletePreviewDeployment';
export { deleteStorageBackupScheduleRequest } from './deleteStorageBackupSchedule';
export { deleteStorageRequest } from './deleteStorage';
export { deleteTagRequest } from './deleteTag';
export { getApplicationRequest } from './get';
export { getLogsRequest } from './getLogs';
export { getPreviewDeploymentRequest } from './getPreviewDeployment';
export { getPreviewLogsRequest } from './getPreviewLogs';
export { listApplicationsRequest } from './list';
export { listDestinationsRequest } from './listDestinations';
export { listEnvsRequest } from './listEnvs';
export { listPreviewDeploymentsRequest } from './listPreviewDeployments';
export { listRollbackImagesRequest } from './listRollbackImages';
export { listStoragesRequest } from './listStorages';
export { listTagsRequest } from './listTags';
export { migrateApplicationRequest } from './migrate';
export { moveApplicationRequest } from './move';
export { requireApplicationUuid, requireEnvironmentVariableKey } from './parameters';
export { removeDestinationRequest } from './removeDestination';
export { restartApplicationRequest } from './restart';
export { rollbackApplicationRequest } from './rollback';
export { runStorageBackupRequest } from './runStorageBackup';
export { setStorageBackupScheduleRequest } from './setStorageBackupSchedule';
export { startApplicationRequest } from './start';
export { stopApplicationRequest } from './stop';
export { updateApplicationRequest } from './update';
export { updateEnvsBulkRequest } from './updateEnvsBulk';
export { updateEnvRequest } from './updateEnv';
export { updatePreviewDomainsRequest } from './updatePreviewDomains';
export { updateStorageRequest } from './updateStorage';
