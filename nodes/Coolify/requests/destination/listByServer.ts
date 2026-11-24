import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDestinationServerUuid } from './parameters';

/**
 * Build the request that lists the destinations of a server.
 *
 * Coolify returns every destination attached to the server as a plain array.
 * The endpoint takes no query parameters and no body, and it is not
 * paginated, so no page is fetched automatically and no `returnAll` / `limit`
 * option is offered. A server of another team is answered with HTTP 404.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /servers/{server_uuid}/destinations`.
 */
export async function listDestinationsByServerRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const serverUuid = requireDestinationServerUuid(
		this,
		itemIndex,
		'list the destinations of a server',
	);

	return {
		method: 'GET',
		path: `servers/${serverUuid}/destinations`,
	};
}
