import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid } from './parameters';

/**
 * Build the request that restarts an application.
 *
 * The endpoint takes no query parameters. The restart queues a deployment, so
 * the request is never repeated automatically.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/restart`.
 */
export async function restartApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const applicationUuid = requireApplicationUuid(this, itemIndex, 'restart an application');

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/restart`,
	};
}
