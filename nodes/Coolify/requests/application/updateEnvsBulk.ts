import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that updates several environment variables at once.
 *
 * The Coolify API updates an existing environment variable when the key is
 * already known and creates it otherwise. Every item of the list carries the
 * same flags as a single update, and the flags that are switched off are not
 * sent.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /applications/{uuid}/envs/bulk`.
 */
export async function updateEnvsBulkRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'update environment variables of an application',
	);

	const items = this.getNodeParameter('data', itemIndex, []) as IDataObject[];

	if (!Array.isArray(items) || items.length === 0) {
		throw new NodeOperationError(
			this.getNode(),
			'At least one environment variable is required to update environment variables',
			{ itemIndex },
		);
	}

	const data = items.map((item) => {
		const key = typeof item.key === 'string' ? item.key.trim() : '';

		if (!key) {
			throw new NodeOperationError(this.getNode(), 'Every environment variable needs a key', {
				itemIndex,
			});
		}

		const entry: IDataObject = { key };

		if (typeof item.value === 'string' && item.value !== '') {
			entry.value = item.value;
		}
		if (item.isPreview === true) {
			entry.is_preview = true;
		}
		if (item.isLiteral === true) {
			entry.is_literal = true;
		}
		if (item.isMultiline === true) {
			entry.is_multiline = true;
		}
		if (item.isShownOnce === true) {
			entry.is_shown_once = true;
		}

		return entry;
	});

	return {
		method: 'PATCH',
		path: `applications/${applicationUuid}/envs/bulk`,
		body: { data },
	};
}
