import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireCloudInitScriptUuid } from './parameters';

/**
 * Build the request that deletes a cloud init script.
 *
 * The deletion is permanent and removes the stored content of the script, so
 * it is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `DELETE /cloud-init-scripts/{uuid}`.
 */
export async function deleteCloudInitScriptRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const uuid = requireCloudInitScriptUuid(this, itemIndex, 'delete a cloud init script');

	return {
		method: 'DELETE',
		path: `cloud-init-scripts/${uuid}`,
		retrySafety: 'unsafe',
	};
}
