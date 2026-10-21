import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid, requireEnvironmentVariableKey } from './parameters';

/**
 * Build the request that creates an environment variable on an application.
 *
 * The flags of the Coolify API default to `false` for a new environment
 * variable, so a flag is only sent when it is switched on. The value is only
 * sent when the user supplied one.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/{uuid}/envs`.
 */
export async function createEnvRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const purpose = 'create an environment variable on an application';
	const applicationUuid = requireApplicationUuid(this, itemIndex, purpose);
	const key = requireEnvironmentVariableKey(this, itemIndex, purpose);

	const body: CoolifyRequest['body'] = { key };

	const value = this.getNodeParameter('value', itemIndex, '') as string;
	if (value !== '') {
		body.value = value;
	}

	if (this.getNodeParameter('isPreview', itemIndex, false) === true) {
		body.is_preview = true;
	}
	if (this.getNodeParameter('isLiteral', itemIndex, false) === true) {
		body.is_literal = true;
	}
	if (this.getNodeParameter('isMultiline', itemIndex, false) === true) {
		body.is_multiline = true;
	}
	if (this.getNodeParameter('isShownOnce', itemIndex, false) === true) {
		body.is_shown_once = true;
	}

	return {
		method: 'POST',
		path: `applications/${applicationUuid}/envs`,
		body,
	};
}
