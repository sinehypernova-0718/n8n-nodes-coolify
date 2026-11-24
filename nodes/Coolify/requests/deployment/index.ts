import { cancelDeploymentRequest } from './cancel';
import { deployRequest } from './deploy';
import { getDeploymentRequest } from './get';
import { listApplicationDeploymentsRequest } from './listApplicationDeployments';
import { listDeploymentsRequest } from './list';
import type { CoolifyRequestBuilder } from '../types';

/**
 * The request builder of every deployment operation.
 *
 * The map is the single place that maps an operation to its endpoint, so the
 * description of an operation and its request can never drift apart.
 */
export const deploymentRequestBuilders: Record<string, CoolifyRequestBuilder> = {
	cancel: cancelDeploymentRequest,
	deploy: deployRequest,
	get: getDeploymentRequest,
	list: listDeploymentsRequest,
	listApplicationDeployments: listApplicationDeploymentsRequest,
};

export { cancelDeploymentRequest } from './cancel';
export { deployRequest } from './deploy';
export { getDeploymentRequest } from './get';
export { listApplicationDeploymentsRequest } from './listApplicationDeployments';
export { listDeploymentsRequest } from './list';
export { requireDeploymentApplicationUuid, requireDeploymentUuid } from './parameters';
