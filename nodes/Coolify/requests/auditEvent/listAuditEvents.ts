import { NodeOperationError, type IDataObject, type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';

/**
 * Longest text a filter of the audit event list accepts.
 *
 * The Coolify API caps the search text and the action filter at 255
 * characters each.
 */
const MAX_FILTER_LENGTH = 255;

/**
 * Build the filtered request used to list the audit events of the team.
 *
 * Pagination is handled by the node execution path. Only configured filters
 * are included here, leaving the API's pagination parameters to that path.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /audit-events`.
 */
export async function listAuditEventsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const search = (this.getNodeParameter('search', itemIndex, '') as string).trim();
	const action = (this.getNodeParameter('action', itemIndex, '') as string).trim();

	for (const [apiParameter, value] of [['search', search] as const, ['action', action] as const]) {
		if (value.length > MAX_FILTER_LENGTH) {
			throw new NodeOperationError(
				this.getNode(),
				`The ${apiParameter} filter must not be longer than ${MAX_FILTER_LENGTH} characters`,
				{ itemIndex },
			);
		}
	}

	const source = this.getNodeParameter('source', itemIndex, '') as string;

	const request: CoolifyRequest = {
		method: 'GET',
		path: 'audit-events',
	};

	const qs: IDataObject = {};
	if (search !== '') {
		qs.search = search;
	}
	if (action !== '') {
		qs.action = action;
	}
	if (source !== '') {
		qs.source = source;
	}
	if (Object.keys(qs).length > 0) {
		request.qs = qs;
	}

	return request;
}
