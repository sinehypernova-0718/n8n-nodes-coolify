import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildCreateCloudInitScriptBody } from './cloudInitScriptFields';

/**
 * Build the request that creates a cloud init script.
 *
 * The Coolify API requires the name and the content of the script and
 * rejects every other body field with HTTP 422, so the body carries exactly
 * those two. It creates the script and returns it with its UUID.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /cloud-init-scripts`.
 */
export async function createCloudInitScriptRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const body = buildCreateCloudInitScriptBody(this, itemIndex, 'create a cloud init script');

	return {
		method: 'POST',
		path: 'cloud-init-scripts',
		body,
	};
}
