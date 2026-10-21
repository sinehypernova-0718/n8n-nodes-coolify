import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that lists the preview deployments of an application.
 *
 * The preview endpoints of the Coolify API require version 4.4.0 or newer.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /applications/{uuid}/previews`.
 */
export async function listPreviewDeploymentsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(
		this,
		itemIndex,
		'list the preview deployments of an application',
	);

	return {
		method: 'GET',
		path: `applications/${applicationUuid}/previews`,
	};
}
