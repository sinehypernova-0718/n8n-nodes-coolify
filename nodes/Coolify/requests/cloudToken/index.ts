import { createCloudTokenRequest } from './create';
import { deleteCloudTokenRequest } from './delete';
import { getCloudTokenRequest } from './get';
import { listCloudTokensRequest } from './list';
import { updateCloudTokenRequest } from './update';
import { validateCloudTokenRequest } from './validate';
import type { CoolifyRequestBuilder } from '../types';

/**
 * The request builder of every cloud token operation.
 *
 * The map is the single place that maps an operation to its endpoint, so the
 * description of an operation and its request can never drift apart.
 */
export const cloudTokenRequestBuilders: Record<string, CoolifyRequestBuilder> = {
	create: createCloudTokenRequest,
	delete: deleteCloudTokenRequest,
	get: getCloudTokenRequest,
	list: listCloudTokensRequest,
	update: updateCloudTokenRequest,
	validate: validateCloudTokenRequest,
};

export { createCloudTokenRequest } from './create';
export { deleteCloudTokenRequest } from './delete';
export { getCloudTokenRequest } from './get';
export { listCloudTokensRequest } from './list';
export { updateCloudTokenRequest } from './update';
export { validateCloudTokenRequest } from './validate';
export {
	buildCreateCloudTokenBody,
	buildUpdateCloudTokenBody,
	cloudTokenFieldProperty,
	cloudTokenFieldSpecs,
	CLOUD_TOKEN_FIELDS,
	type CloudTokenFieldSpec,
} from './cloudTokenFields';
export { requireCloudTokenUuid } from './parameters';
export type { CloudProvider } from './types';
export { CLOUD_PROVIDER_OPTIONS } from './types';
