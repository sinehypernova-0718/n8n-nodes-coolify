import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Pattern a volume name has to match in the Coolify API.
 */
const VOLUME_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/**
 * Build the request that creates a storage for an application.
 *
 * The Coolify API distinguishes two kinds of storage. A persistent storage is
 * a volume and only takes a name and a mount path. A file storage mounts a
 * file or a directory and takes the file content, the directory flag and the
 * host path. The API rejects the fields of the other kind, so only the fields
 * of the selected kind are sent.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/storages`.
 */
export async function createStorageRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'create a storage for an application',
	);

	const type = this.getNodeParameter('type', itemIndex) as string;
	const mountPath = (this.getNodeParameter('mountPath', itemIndex, '') as string).trim();

	if (!mountPath) {
		throw new NodeOperationError(this.getNode(), 'Mount path is required to create a storage', {
			itemIndex,
		});
	}

	const body: IDataObject = { type, mount_path: mountPath };

	if (type === 'persistent') {
		const name = (this.getNodeParameter('name', itemIndex, '') as string).trim();

		if (!name) {
			throw new NodeOperationError(
				this.getNode(),
				'The name of the volume is required for a persistent storage',
				{ itemIndex },
			);
		}

		if (!VOLUME_NAME_PATTERN.test(name)) {
			throw new NodeOperationError(
				this.getNode(),
				'The name of the volume must start with a letter or a digit and may only contain letters, digits, dots, underscores and hyphens',
				{ itemIndex },
			);
		}

		body.name = name;
	} else {
		const content = this.getNodeParameter('content', itemIndex, '') as string;
		if (content !== '') {
			body.content = content;
		}

		const isDirectory = this.getNodeParameter('isDirectory', itemIndex, false) === true;
		if (isDirectory) {
			body.is_directory = true;

			const fsPath = (this.getNodeParameter('fsPath', itemIndex, '') as string).trim();
			if (!fsPath) {
				throw new NodeOperationError(
					this.getNode(),
					'The host path is required for a directory mount',
					{ itemIndex },
				);
			}
			body.fs_path = fsPath;
		}
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/storages`,
		body,
	};
}
