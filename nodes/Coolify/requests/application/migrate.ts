import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that migrates an application to another destination.
 *
 * The Coolify API stops the application, transfers the volume data when both
 * servers are managed by Coolify and updates the records of the application.
 * The volumes are transferred by default, so the flag is always sent and the
 * user can switch the transfer off.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/migrate`.
 */
export async function migrateApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'migrate an application');

	const destinationUuid = (
		this.getNodeParameter('destinationUuid', itemIndex, '') as string
	).trim();
	if (!destinationUuid) {
		throw new NodeOperationError(
			this.getNode(),
			'The destination UUID is required to migrate an application',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/migrate`,
		body: {
			destination_uuid: destinationUuid,
			migrate_volumes: this.getNodeParameter('migrateVolumes', itemIndex, true) === true,
		},
	};
}
