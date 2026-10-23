import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildCreateCloudTokenBody } from './cloudTokenFields';

/**
 * Build the request that creates a cloud provider token.
 *
 * The Coolify API requires the provider, token and name, and rejects every
 * other body field with HTTP 422, so the body carries exactly those three.
 * The token is validated against the provider before being stored.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /cloud-tokens`.
 */
export async function createCloudTokenRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'POST',
		path: 'cloud-tokens',
		body: buildCreateCloudTokenBody(this, itemIndex),
	};
}
