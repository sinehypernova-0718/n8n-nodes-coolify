import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Shortest tag name the Coolify API accepts.
 */
const MIN_TAG_NAME_LENGTH = 2;

/**
 * Build the request that adds tags to an application.
 *
 * The Coolify API accepts either a single `tag_name` or a list of `tag_names`,
 * but never both, and it rejects a tag that is shorter than two characters.
 *
 * The length check below is the same rule the API applies, but the API also
 * normalizes a tag name before it stores it, so the check only rejects names
 * that are too short. Whether a tag is accepted is decided by Coolify.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/tags`.
 */
export async function createTagRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'add a tag to an application');

	const tagName = (this.getNodeParameter('tagName', itemIndex, '') as string).trim();
	const tagNames = (this.getNodeParameter('tagNames', itemIndex, []) as string[])
		.map((name) => name.trim())
		.filter((name) => name !== '');

	if (tagName !== '' && tagNames.length > 0) {
		throw new NodeOperationError(this.getNode(), 'Provide either Tag Name or Tag Names, not both', {
			itemIndex,
		});
	}

	const body: CoolifyRequest['body'] = {};

	if (tagName !== '') {
		if (tagName.length < MIN_TAG_NAME_LENGTH) {
			throw new NodeOperationError(
				this.getNode(),
				`Each tag name must be at least ${MIN_TAG_NAME_LENGTH} characters`,
				{ itemIndex },
			);
		}
		body.tag_name = tagName;
	} else if (tagNames.length > 0) {
		const tooShort = tagNames.some((name) => name.length < MIN_TAG_NAME_LENGTH);
		if (tooShort) {
			throw new NodeOperationError(
				this.getNode(),
				`Each tag name must be at least ${MIN_TAG_NAME_LENGTH} characters`,
				{ itemIndex },
			);
		}
		body.tag_names = tagNames;
	} else {
		throw new NodeOperationError(
			this.getNode(),
			'Either Tag Name or Tag Names is required to add a tag to an application',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/tags`,
		body,
	};
}
