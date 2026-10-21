import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that deletes a preview deployment.
 *
 * The Coolify API deletes the preview and queues the cleanup of the preview
 * deployment, which cancels the running deployments, stops the containers and
 * removes the volumes and the networks of the preview. The deletion is never
 * repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /applications/{uuid}/previews/{pull_request_id}`.
 */
export async function deletePreviewDeploymentRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'delete a preview deployment of an application',
	);

	const pullRequestId = this.getNodeParameter('pullRequestId', itemIndex) as number;
	if (!Number.isInteger(pullRequestId) || pullRequestId < 1 || pullRequestId > 2_147_483_647) {
		throw new NodeOperationError(
			this.getNode(),
			'Pull Request ID must be an integer between 1 and 2147483647',
			{ itemIndex },
		);
	}

	return {
		method: 'DELETE',
		path: `applications/${applicationUuid}/previews/${pullRequestId}`,
	};
}
