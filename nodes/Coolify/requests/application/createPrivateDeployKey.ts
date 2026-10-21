import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import {
	APPLICATION_CREATE_PATHS,
	buildCreateApplicationBody,
	validateCreateApplicationFields,
} from './applicationFields';

/**
 * Build the request that creates an application from a private Git repository
 * that a deploy key gives access to.
 *
 * The Coolify API needs the URL of the repository, the branch, the build pack
 * and the UUID of the private key. The private key has to belong to the team
 * of the token, otherwise the API answers 404.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/private-deploy-key`.
 */
export async function createPrivateDeployKeyApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const body = buildCreateApplicationBody(this, itemIndex, 'privateRepository');
	validateCreateApplicationFields(this, itemIndex, body);

	if (!body.git_repository) {
		throw new NodeOperationError(
			this.getNode(),
			'The Git repository is required to create an application from a private repository',
			{ itemIndex },
		);
	}
	if (!body.git_branch) {
		throw new NodeOperationError(
			this.getNode(),
			'The Git branch is required to create an application from a private repository',
			{ itemIndex },
		);
	}
	if (!body.build_pack) {
		throw new NodeOperationError(
			this.getNode(),
			'The build pack is required to create an application from a private repository',
			{ itemIndex },
		);
	}
	if (!body.private_key_uuid) {
		throw new NodeOperationError(
			this.getNode(),
			'The private key UUID is required to create an application from a private repository',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: APPLICATION_CREATE_PATHS.privateRepository,
		body,
	};
}
