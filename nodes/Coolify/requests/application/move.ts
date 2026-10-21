import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that moves an application to another environment.
 *
 * The Coolify API moves the application to the environment and answers with
 * the UUID of the application, of the project and of the new environment. The
 * move is a purely organizational change, the running containers are not
 * affected.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/move`.
 */
export async function moveApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'move an application');

	const environmentUuid = (
		this.getNodeParameter('environmentUuid', itemIndex, '') as string
	).trim();
	if (!environmentUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'The environment UUID is required to move an application',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/move`,
		body: { environment_uuid: environmentUuid },
	};
}
