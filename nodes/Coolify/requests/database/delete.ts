import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDatabaseUuid } from './parameters';
import { getCollectionParameter } from '../../shared/parameterResolution';

/**
 * Build the request that deletes a database.
 *
 * All four query flags have `true` as their documented default in the Coolify
 * API, so the node always sends an explicit boolean for each of them: the
 * user can switch a flag off to send `false`, and an untouched flag sends the
 * documented default `true`. The deletion is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /databases/{uuid}`.
 */
export async function deleteDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const databaseUuid = requireDatabaseUuid(this, itemIndex, 'delete a database');
	const readFlag = (name: string) =>
		getCollectionParameter(this, itemIndex, 'databaseDeleteOptions', name, name, true) === true;

	return {
		method: 'DELETE',
		path: `databases/${databaseUuid}`,
		qs: {
			delete_configurations: readFlag('deleteConfigurations'),
			delete_volumes: readFlag('deleteVolumes'),
			docker_cleanup: readFlag('dockerCleanup'),
			delete_connected_networks: readFlag('deleteConnectedNetworks'),
		},
	};
}
