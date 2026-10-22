import { createCloudInitScriptRequest } from './create';
import { deleteCloudInitScriptRequest } from './delete';
import { getCloudInitScriptRequest } from './get';
import { listCloudInitScriptsRequest } from './list';
import { updateCloudInitScriptRequest } from './update';
import type { CoolifyRequestBuilder } from '../types';

/**
 * The request builder of every cloud init script operation.
 *
 * The map is the single place that maps an operation to its endpoint, so the
 * description of an operation and its request can never drift apart.
 */
export const cloudInitScriptRequestBuilders: Record<string, CoolifyRequestBuilder> = {
	create: createCloudInitScriptRequest,
	delete: deleteCloudInitScriptRequest,
	get: getCloudInitScriptRequest,
	list: listCloudInitScriptsRequest,
	update: updateCloudInitScriptRequest,
};

export { createCloudInitScriptRequest } from './create';
export { deleteCloudInitScriptRequest } from './delete';
export {
	cloudInitScriptFieldProperty,
	cloudInitScriptFieldSpecs,
	buildCreateCloudInitScriptBody,
	buildUpdateCloudInitScriptBody,
	readCloudInitScriptContent,
	readCloudInitScriptName,
	CLOUD_INIT_SCRIPT_FIELDS,
	CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH,
	type CloudInitScriptFieldSpec,
} from './cloudInitScriptFields';
export { getCloudInitScriptRequest } from './get';
export { listCloudInitScriptsRequest } from './list';
export { requireCloudInitScriptUuid } from './parameters';
export { updateCloudInitScriptRequest } from './update';
