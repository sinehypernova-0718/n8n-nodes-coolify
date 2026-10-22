import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { encodePathSegment, requireApplicationUuid } from './parameters';

/**
 * Build the request that removes a tag from an application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /applications/{uuid}/tags/{tag_uuid}`.
 */
export async function deleteTagRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'remove a tag from an application',
	);

	const tagUuid = (this.getNodeParameter('tagUuid', itemIndex, '') as string).trim();
	if (!tagUuid) {
		throw new NodeOperationError(this.getNode(), 'Tag UUID is required to remove a tag', {
			itemIndex,
		});
	}

	return {
		method: 'DELETE',
		path: `applications/${applicationUuid}/tags/${encodePathSegment(tagUuid)}`,
	};
}
