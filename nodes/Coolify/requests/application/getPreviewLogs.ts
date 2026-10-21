import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { readLinesParameter } from './getLogs';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that reads the logs of a preview deployment.
 *
 * The Coolify API needs a token with the `read:sensitive` or the `root`
 * ability for the logs of an application, and it only serves the preview
 * deployments from version 4.4.0 on.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /applications/{uuid}/previews/{pull_request_id}/logs`.
 */
export async function getPreviewLogsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'read the logs of a preview deployment',
	);

	const pullRequestId = this.getNodeParameter('pullRequestId', itemIndex) as number;
	if (!Number.isInteger(pullRequestId) || pullRequestId < 1 || pullRequestId > 2_147_483_647) {
		throw new NodeOperationError(
			this.getNode(),
			'Pull Request ID must be an integer between 1 and 2147483647',
			{ itemIndex },
		);
	}

	const request: CoolifyRequest = {
		method: 'GET',
		path: `applications/${applicationUuid}/previews/${pullRequestId}/logs`,
	};

	const qs: IDataObject = {};

	const lines = readLinesParameter(this, itemIndex);
	if (lines !== undefined) {
		qs.lines = lines;
	}

	if (this.getNodeParameter('showTimestamps', itemIndex, false) === true) {
		qs.show_timestamps = true;
	}

	const serviceName = (this.getNodeParameter('serviceName', itemIndex, '') as string).trim();
	if (serviceName !== '') {
		qs.service_name = serviceName;
	}

	if (Object.keys(qs).length > 0) {
		request.qs = qs;
	}

	return request;
}
