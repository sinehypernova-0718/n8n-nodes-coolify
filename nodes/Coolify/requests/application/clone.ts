import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that clones an application.
 *
 * The Coolify API clones the application into a destination of the team and
 * answers with the UUID of the clone. The name of the clone is optional, the
 * API keeps the name of the source when it is not given. The volumes are only
 * copied when the user asks for it, the API defaults them to `false`.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/clone`.
 */
export async function cloneApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'clone an application');

	const destinationUuid = (
		this.getNodeParameter('destinationUuid', itemIndex, '') as string
	).trim();
	if (!destinationUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'The destination UUID is required to clone an application',
			{ itemIndex },
		);
	}

	const body: CoolifyRequest['body'] = { destination_uuid: destinationUuid };

	const name = (this.getNodeParameter('name', itemIndex, '') as string).trim();
	if (name !== '') {
		body.name = name;
	}

	if (this.getNodeParameter('cloneVolumes', itemIndex, false) === true) {
		body.clone_volumes = true;
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/clone`,
		body,
	};
}
