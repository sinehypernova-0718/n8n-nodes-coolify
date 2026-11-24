import { NodeOperationError, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { locatorValue } from '../../shared/locatorValue';

/**
 * Highest pull request ID the Coolify API accepts.
 *
 * The endpoint rejects an ID above this bound with HTTP 400.
 */
const MAX_PULL_REQUEST_ID = 2_147_483_647;

/**
 * Build the request that queues one or more deployments.
 *
 * The endpoint of the Coolify API deploys by resource UUID or by tag, never by
 * both, and the two identifiers accept a comma separated list. A pull request
 * ID selects a preview deployment instead of the main branch and cannot be
 * combined with a tag; the Docker tag belongs to a Docker Image preview and
 * requires the pull request ID. Every rule of the controller is validated here
 * before a request is built. Queuing a deployment is not free of side effects
 * when it is repeated, so the request is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /deploy`.
 */
export async function deployRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const resourceUuid = locatorValue(this.getNodeParameter('resourceUuid', itemIndex, '')).trim();
	const tag = locatorValue(this.getNodeParameter('tag', itemIndex, '')).trim();
	const force = this.getNodeParameter('force', itemIndex, false) === true;
	const pullRequestId = this.getNodeParameter('pullRequestId', itemIndex, 0) as number;
	const dockerTag = (this.getNodeParameter('dockerTag', itemIndex, '') as string).trim();

	if (resourceUuid === '' && tag === '') {
		throw new NodeOperationError(this.getNode(), 'A resource UUID or a tag is required to deploy', {
			itemIndex,
		});
	}
	if (resourceUuid !== '' && tag !== '') {
		throw new NodeOperationError(
			this.getNode(),
			'A resource UUID and a tag cannot be combined, provide only one of them',
			{ itemIndex },
		);
	}
	if (tag !== '' && pullRequestId !== 0) {
		throw new NodeOperationError(this.getNode(), 'A tag and a pull request ID cannot be combined', {
			itemIndex,
		});
	}
	if (dockerTag !== '' && pullRequestId === 0) {
		throw new NodeOperationError(this.getNode(), 'A Docker tag requires a pull request ID', {
			itemIndex,
		});
	}
	if (dockerTag !== '' && tag !== '') {
		throw new NodeOperationError(this.getNode(), 'A Docker tag and a tag cannot be combined', {
			itemIndex,
		});
	}
	if (
		pullRequestId !== 0 &&
		(!Number.isInteger(pullRequestId) || pullRequestId < 1 || pullRequestId > MAX_PULL_REQUEST_ID)
	) {
		throw new NodeOperationError(
			this.getNode(),
			`The pull request ID must be an integer between 1 and ${MAX_PULL_REQUEST_ID}`,
			{ itemIndex },
		);
	}

	const qs: IDataObject = {};

	if (tag !== '') {
		qs.tag = tag;
	} else if (resourceUuid !== '') {
		qs.uuid = resourceUuid;
	}
	if (force) {
		qs.force = true;
	}
	if (pullRequestId !== 0) {
		qs.pull_request_id = pullRequestId;
	}
	if (dockerTag !== '') {
		qs.docker_tag = dockerTag;
	}

	return {
		method: 'POST',
		path: 'deploy',
		qs,
		retrySafety: 'unsafe',
	};
}
