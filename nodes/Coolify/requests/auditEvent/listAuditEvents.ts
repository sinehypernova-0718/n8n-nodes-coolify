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
 * Lowest page size the Coolify API accepts.
 */
const MIN_PER_PAGE = 1;

/**
 * Highest page size the Coolify API accepts.
 */
const MAX_PER_PAGE = 100;

/**
 * Lowest page number the Coolify API accepts.
 */
const MIN_PAGE = 1;

/**
 * Build the request that lists a page of the audit events of the team.
 *
 * Coolify returns one page per request as a paginator object with the fields
 * `current_page`, `data`, `per_page`, `last_page` and `total`, so the response
 * is returned unchanged and no page is fetched automatically. Only the
 * filters the user configured are part of the query: an unset filter is
 * absent from the request, so the API applies its own behaviour.
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

	const perPage = this.getNodeParameter('perPage', itemIndex, null) as number | null;

	if (
		perPage !== null &&
		(!Number.isInteger(perPage) || perPage < MIN_PER_PAGE || perPage > MAX_PER_PAGE)
	) {
		throw new NodeOperationError(
			this.getNode(),
			`Items per page must be an integer between ${MIN_PER_PAGE} and ${MAX_PER_PAGE}`,
			{ itemIndex },
		);
	}

	const page = this.getNodeParameter('page', itemIndex, null) as number | null;

	if (page !== null && (!Number.isInteger(page) || page < MIN_PAGE)) {
		throw new NodeOperationError(
			this.getNode(),
			`Page must be an integer of ${MIN_PAGE} or higher`,
			{ itemIndex },
		);
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
	if (perPage !== null) {
		qs.per_page = perPage;
	}
	if (page !== null) {
		qs.page = page;
	}

	if (Object.keys(qs).length > 0) {
		request.qs = qs;
	}

	return request;
}
