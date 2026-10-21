import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Pattern a volume name has to match in the Coolify API.
 */
const VOLUME_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/**
 * Build the request that updates a storage of an application.
 *
 * The Coolify API identifies the storage by its UUID, falls back to the
 * deprecated numeric ID and only accepts the fields of the selected storage
 * kind, so only those fields are sent.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /applications/{uuid}/storages`.
 */
export async function updateStorageRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'update a storage of an application',
	);

	const type = this.getNodeParameter('type', itemIndex) as string;
	const storageUuid = (this.getNodeParameter('storageUuid', itemIndex, '') as string).trim();

	if (!storageUuid) {
		throw new NodeOperationError(this.getNode(), 'Storage UUID is required to update a storage', {
			itemIndex,
		});
	}

	const body: IDataObject = { type, uuid: storageUuid };

	if (this.getNodeParameter('isPreviewSuffixEnabled', itemIndex, false) === true) {
		body.is_preview_suffix_enabled = true;
	}

	const mountPath = (this.getNodeParameter('mountPath', itemIndex, '') as string).trim();
	if (mountPath !== '') {
		body.mount_path = mountPath;
	}

	if (type === 'persistent') {
		const name = (this.getNodeParameter('name', itemIndex, '') as string).trim();

		if (name !== '') {
			if (!VOLUME_NAME_PATTERN.test(name)) {
				throw new NodeOperationError(
					this.getNode(),
					'The name of the volume must start with a letter or a digit and may only contain letters, digits, dots, underscores and hyphens',
					{ itemIndex },
				);
			}
			body.name = name;
		}
	} else {
		const content = this.getNodeParameter('content', itemIndex, '') as string;
		if (content !== '') {
			body.content = content;
		}
	}

	return {
		method: 'PATCH',
		path: `applications/${applicationUuid}/storages`,
		body,
	};
}
