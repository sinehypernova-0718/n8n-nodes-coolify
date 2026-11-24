import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';

/**
 * Build the request that lists the destinations of the team.
 *
 * Coolify returns every destination of the team as a plain array: the
 * standalone destinations first, then the swarm destinations. The endpoint
 * takes no query parameters and no body, and it is not paginated, so no page
 * is fetched automatically and no `returnAll` / `limit` option is offered.
 *
 * The builder is named for the team-wide list to keep it apart from the
 * `listDestinationsRequest` that lists the destinations of one application.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /destinations`.
 */
export async function listTeamDestinationsRequest(
	this: IExecuteFunctions,
	// The list endpoint takes no parameter of this node, so the item index is
	// not read to build the request. A request builder keeps it in its
	// signature nevertheless, see `CoolifyRequestBuilder`.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'GET',
		path: 'destinations',
	};
}
