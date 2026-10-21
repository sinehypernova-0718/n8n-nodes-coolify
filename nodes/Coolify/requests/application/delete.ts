import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that deletes an application.
 *
 * All four query flags have `true` as their documented default in the Coolify
 * API, so the node always sends an explicit boolean for each of them: the
 * user can switch a flag off to send `false`, and an untouched flag sends the
 * documented default `true`. The deletion is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /applications/{uuid}`.
 */
export async function deleteApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'delete an application');

	const deleteConfigurations = this.getNodeParameter(
		'deleteConfigurations',
		itemIndex,
		true,
	) as boolean;
	const deleteVolumes = this.getNodeParameter('deleteVolumes', itemIndex, true) as boolean;
	const dockerCleanup = this.getNodeParameter('dockerCleanup', itemIndex, true) as boolean;
	const deleteConnectedNetworks = this.getNodeParameter(
		'deleteConnectedNetworks',
		itemIndex,
		true,
	) as boolean;

	return {
		method: 'DELETE',
		path: `applications/${applicationUuid}`,
		qs: {
			delete_configurations: deleteConfigurations,
			delete_volumes: deleteVolumes,
			docker_cleanup: dockerCleanup,
			delete_connected_networks: deleteConnectedNetworks,
		},
		retrySafety: 'unsafe',
	};
}
