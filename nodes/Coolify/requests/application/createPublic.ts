import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import {
	APPLICATION_CREATE_PATHS,
	buildCreateApplicationBody,
	validateCreateApplicationFields,
} from './applicationFields';

/**
 * Build the request that creates an application from a public Git repository.
 *
 * The Coolify API needs the URL of the repository, the branch and the build
 * pack. It creates the application and returns its UUID, and it queues a
 * deployment when the request asks for it.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/public`.
 */
export async function createPublicApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const body = buildCreateApplicationBody(this, itemIndex, 'public');
	validateCreateApplicationFields(this, itemIndex, body);

	if (!body.git_repository) {
		throw new NodeOperationError(
			this.getNode(),
			'The Git repository is required to create an application from a public repository',
			{ itemIndex },
		);
	}
	if (!body.git_branch) {
		throw new NodeOperationError(
			this.getNode(),
			'The Git branch is required to create an application from a public repository',
			{ itemIndex },
		);
	}
	if (!body.build_pack) {
		throw new NodeOperationError(
			this.getNode(),
			'The build pack is required to create an application from a public repository',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: APPLICATION_CREATE_PATHS.public,
		body,
	};
}
