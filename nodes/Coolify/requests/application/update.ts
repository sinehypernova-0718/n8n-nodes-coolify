import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import {
	buildUpdateApplicationBody,
	validateUpdateApplicationFields,
} from './applicationUpdateFields';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that updates an application.
 *
 * The Coolify API updates an application with a partial update: it only
 * changes the fields of the request body and keeps every other field as it
 * is. The node therefore only sends the settings the user changed, and it
 * refuses to send a request that would not change anything.
 *
 * The custom labels are the one field the API expects base64 encoded. The
 * field contract of the update encodes them, so the body carries the encoded
 * labels exactly once.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /applications/{uuid}`.
 */
export async function updateApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'update an application');

	const body = buildUpdateApplicationBody(this, itemIndex);

	// The domains are replaced by the domains of the request, so removing them
	// is an explicit act.
	if (this.getNodeParameter('removeDomains', itemIndex, false) === true) {
		body.domains = '';
	}

	validateUpdateApplicationFields(this, itemIndex, body);

	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Select at least one setting to update the application',
			{ itemIndex },
		);
	}

	return {
		method: 'PATCH',
		path: `applications/${applicationUuid}`,
		body,
	};
}
