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
 * Split a comma separated identifier list into its entries.
 *
 * The Coolify API splits the value on the comma and drops the empty entries
 * before it looks any of them up, so a value such as `",,"` carries no
 * identifier at all. The entries are trimmed as well: the API does not trim
 * them itself, so a leading space would keep a valid UUID or tag from being
 * found.
 *
 * @param value The comma separated value of the field, already trimmed.
 * @returns The entries of the list, without the empty ones.
 */
function splitIdentifierList(value: string): string[] {
	return value
		.split(',')
		.map((entry) => entry.trim())
		.filter((entry) => entry !== '');
}

/**
 * Build the request that queues one or more deployments.
 *
 * The endpoint of the Coolify API deploys by resource UUID or by tag, never by
 * both, and the two identifiers accept a comma separated list. A pull request
 * ID selects a preview deployment instead of the main branch and cannot be
 * combined with a tag; the Docker tag belongs to a Docker Image preview and
 * requires the pull request ID. Every rule of the controller is validated here
 * before a request is built, including an identifier whose list carries no
 * entry at all. Queuing a deployment is not free of side effects when it is
 * repeated, so the request is never repeated automatically.
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

	const resourceUuids = splitIdentifierList(resourceUuid);
	const tags = splitIdentifierList(tag);

	if (resourceUuid !== '' && resourceUuids.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'The resource UUID list has no entry, provide at least one UUID',
			{ itemIndex },
		);
	}
	if (tag !== '' && tags.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'The tag list has no entry, provide at least one tag name',
			{ itemIndex },
		);
	}

	const qs: IDataObject = {};

	if (tags.length > 0) {
		qs.tag = tags.join(',');
	} else if (resourceUuids.length > 0) {
		qs.uuid = resourceUuids.join(',');
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
