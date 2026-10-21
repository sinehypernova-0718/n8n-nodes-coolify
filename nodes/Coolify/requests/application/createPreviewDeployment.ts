import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Pattern a commit SHA has to match in the Coolify API.
 */
const COMMIT_PATTERN = /^[0-9a-fA-F]{7,40}$/;

/**
 * Pattern a Docker image tag has to match in the Coolify API.
 */
const DOCKER_IMAGE_TAG_PATTERN = /^[A-Za-z0-9_][A-Za-z0-9_.-]{0,127}$/;

/**
 * Build the request that opens a preview deployment for a pull request.
 *
 * The Coolify API only creates a preview for a Git based application or for an
 * application that is built from a Docker image, and it needs different fields
 * for the two kinds. The node cannot read the kind of the application, so the
 * fields of the two kinds are mutually exclusive and the API rejects a
 * request that carries the fields of the wrong kind.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/previews`.
 */
export async function createPreviewDeploymentRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'create a preview deployment of an application',
	);

	const pullRequestId = this.getNodeParameter('pullRequestId', itemIndex) as number;
	if (!Number.isInteger(pullRequestId) || pullRequestId < 1 || pullRequestId > 2_147_483_647) {
		throw new NodeOperationError(
			this.getNode(),
			'Pull Request ID must be an integer between 1 and 2147483647',
			{ itemIndex },
		);
	}

	const gitType = (this.getNodeParameter('gitType', itemIndex, '') as string).trim();
	const commit = (this.getNodeParameter('commit', itemIndex, '') as string).trim();
	const dockerTag = (this.getNodeParameter('dockerTag', itemIndex, '') as string).trim();

	if (gitType !== '' && dockerTag !== '') {
		throw new NodeOperationError(
			this.getNode(),
			'Provide either Git Type or Docker Tag, not both. They belong to different kinds of application',
			{ itemIndex },
		);
	}

	if (gitType === 'bitbucket' && commit === '') {
		throw new NodeOperationError(
			this.getNode(),
			'A commit is required for a preview deployment of a Bitbucket pull request',
			{ itemIndex },
		);
	}

	if (commit !== '' && !COMMIT_PATTERN.test(commit)) {
		throw new NodeOperationError(
			this.getNode(),
			'The commit must be a commit SHA of 7 to 40 hexadecimal characters',
			{ itemIndex },
		);
	}

	if (dockerTag !== '' && !DOCKER_IMAGE_TAG_PATTERN.test(dockerTag)) {
		throw new NodeOperationError(
			this.getNode(),
			'The Docker tag must start with a letter, a digit or an underscore and may only contain letters, digits, underscores, dots and hyphens',
			{ itemIndex },
		);
	}

	const body: IDataObject = { pull_request_id: pullRequestId };

	const pullRequestHtmlUrl = (
		this.getNodeParameter('pullRequestHtmlUrl', itemIndex, '') as string
	).trim();
	if (pullRequestHtmlUrl !== '') {
		body.pull_request_html_url = pullRequestHtmlUrl;
	}
	if (gitType !== '') {
		body.git_type = gitType;
	}
	if (commit !== '') {
		body.commit = commit;
	}
	if (dockerTag !== '') {
		body.docker_tag = dockerTag;
	}
	if (this.getNodeParameter('force', itemIndex, false) === true) {
		body.force = true;
	}

	body.instant_deploy = this.getNodeParameter('instantDeploy', itemIndex, true) === true;

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/previews`,
		body,
	};
}
