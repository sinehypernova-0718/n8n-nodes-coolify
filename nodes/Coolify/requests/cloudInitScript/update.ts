import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildUpdateCloudInitScriptBody } from './cloudInitScriptFields';
import { requireCloudInitScriptUuid } from './parameters';

/**
 * Build the request that updates a cloud init script.
 *
 * The Coolify API updates a cloud init script with a partial update: it only
 * changes the fields of the request body and keeps every other field of the
 * script as it is. The node therefore only sends the fields the user set,
 * and it refuses to send a request that would not change anything, because
 * the API answers an empty body with HTTP 400 instead of the documented 422
 * for a request without fields.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /cloud-init-scripts/{uuid}`.
 */
export async function updateCloudInitScriptRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireCloudInitScriptUuid(this, itemIndex, 'update a cloud init script');

	const body = buildUpdateCloudInitScriptBody(this, itemIndex, 'update a cloud init script');

	if (Object.keys(body).length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'Select at least one setting to update the cloud init script',
			{ itemIndex },
		);
	}

	return {
		method: 'PATCH',
		path: `cloud-init-scripts/${uuid}`,
		body,
	};
}
