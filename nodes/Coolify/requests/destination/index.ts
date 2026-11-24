import { createDestinationRequest } from './create';
import { deleteDestinationRequest } from './delete';
import { getDestinationRequest } from './get';
import { listDestinationsByServerRequest } from './listByServer';
import { listTeamDestinationsRequest } from './list';
import { updateDestinationRequest } from './update';
import type { CoolifyRequestBuilder } from '../types';

/**
 * The request builder of every destination operation.
 *
 * The map is the single place that maps an operation to its endpoint, so the
 * description of an operation and its request can never drift apart.
 */
export const destinationRequestBuilders: Record<string, CoolifyRequestBuilder> = {
	create: createDestinationRequest,
	delete: deleteDestinationRequest,
	get: getDestinationRequest,
	list: listTeamDestinationsRequest,
	listByServer: listDestinationsByServerRequest,
	update: updateDestinationRequest,
};

export { createDestinationRequest } from './create';
export { deleteDestinationRequest } from './delete';
export {
	buildCreateDestinationBody,
	buildUpdateDestinationBody,
	destinationFieldProperty,
	destinationFieldSpecs,
	readDestinationName,
	readDestinationNetwork,
	DESTINATION_FIELDS,
	DESTINATION_NAME_MAX_LENGTH,
	DESTINATION_NETWORK_MAX_LENGTH,
	DESTINATION_NETWORK_PATTERN,
	type DestinationFieldSpec,
} from './destinationFields';
export { getDestinationRequest } from './get';
export { listDestinationsByServerRequest } from './listByServer';
export { listTeamDestinationsRequest } from './list';
export { requireDestinationServerUuid, requireDestinationUuid } from './parameters';
export { updateDestinationRequest } from './update';
