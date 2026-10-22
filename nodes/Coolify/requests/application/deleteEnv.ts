import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { encodePathSegment, requireApplicationUuid } from './parameters';

/**
 * Build the request that deletes an environment variable of an application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /applications/{uuid}/envs/{env_uuid}`.
 */
export async function deleteEnvRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'delete an environment variable of an application',
	);

	const envUuid = (this.getNodeParameter('envUuid', itemIndex, '') as string).trim();
	if (!envUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'Environment variable UUID is required to delete an environment variable',
			{ itemIndex },
		);
	}

	return {
		method: 'DELETE',
		path: `applications/${applicationUuid}/envs/${encodePathSegment(envUuid)}`,
	};
}
