import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { COMMIT_SHA_PATTERN } from './applicationFields';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that rolls an application back to a previous image.
 *
 * The Coolify API queues a rollback deployment and answers with the UUID of
 * the deployment. It needs a token with the deploy ability, and the commit is
 * a Git reference, so it may only contain the characters a Git reference
 * allows.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/rollback`.
 */
export async function rollbackApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'roll back an application');

	const commit = (this.getNodeParameter('commit', itemIndex, '') as string).trim();
	if (!commit) {
		throw new NodeOperationError(
			this.getNode(),
			'The commit is required to roll back an application',
			{ itemIndex },
		);
	}
	if (commit !== 'HEAD' && !COMMIT_SHA_PATTERN.test(commit)) {
		throw new NodeOperationError(
			this.getNode(),
			'The commit may only contain letters, digits, dots, underscores, hyphens and slashes',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/rollback`,
		body: { commit },
	};
}
