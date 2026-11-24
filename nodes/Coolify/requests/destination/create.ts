import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildCreateDestinationBody } from './destinationFields';
import { requireDestinationServerUuid } from './parameters';

/**
 * Build the request that creates a destination on a server.
 *
 * The Coolify API creates the destination on the server of the path, derives
 * its type from that server (standalone for a standalone server, swarm for a
 * swarm server) and requires the network. The answer is the created
 * destination with its UUID.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /servers/{server_uuid}/destinations`.
 */
export async function createDestinationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const serverUuid = requireDestinationServerUuid(this, itemIndex, 'create a destination');

	const body = buildCreateDestinationBody(this, itemIndex, 'create a destination');

	return {
		method: 'POST',
		path: `servers/${serverUuid}/destinations`,
		body,
	};
}
