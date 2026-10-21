import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Lowest pull request ID the Coolify API accepts.
 */
const MIN_PULL_REQUEST_ID = 1;

/**
 * Highest pull request ID the Coolify API accepts.
 */
const MAX_PULL_REQUEST_ID = 2_147_483_647;

/**
 * Build the request that reads a single preview deployment.
 *
 * The preview endpoints of the Coolify API require version 4.4.0 or newer.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /applications/{uuid}/previews/{pull_request_id}`.
 */
export async function getPreviewDeploymentRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'get a preview deployment of an application',
	);

	const pullRequestId = this.getNodeParameter('pullRequestId', itemIndex) as number;

	if (
		!Number.isInteger(pullRequestId) ||
		pullRequestId < MIN_PULL_REQUEST_ID ||
		pullRequestId > MAX_PULL_REQUEST_ID
	) {
		throw new NodeOperationError(
			this.getNode(),
			`Pull Request ID must be an integer between ${MIN_PULL_REQUEST_ID} and ${MAX_PULL_REQUEST_ID}`,
			{ itemIndex },
		);
	}

	return {
		method: 'GET',
		path: `applications/${applicationUuid}/previews/${pullRequestId}`,
	};
}
