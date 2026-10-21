import { type IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireApplicationUuid, requireEnvironmentVariableKey } from './parameters';

/**
 * Build the request that updates an environment variable of an application.
 *
 * The Coolify API matches the environment variable by its key, so the key and
 * the new value are always sent. The flags of the API default to `false` when
 * they are not part of the request, so a flag is only sent when it is
 * switched on.
 *
 * The endpoint does not support a partial update that preserves the flags:
 * `is_preview`, `is_literal`, `is_multiline` and `is_shown_once` are written
 * from the request on every call, so a flag that is not part of the request is
 * reset. Only the fields the API guards with a presence check, the runtime and
 * build time flags and the comment, survive an update, and they are not part
 * of the published contract, so they are not exposed.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `PATCH /applications/{uuid}/envs`.
 */
export async function updateEnvRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const purpose = 'update an environment variable of an application';
	const applicationUuid = requireApplicationUuid(this, itemIndex, purpose);
	const key = requireEnvironmentVariableKey(this, itemIndex, purpose);

	const body: CoolifyRequest['body'] = {
		key,
		value: this.getNodeParameter('value', itemIndex, '') as string,
	};

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
		method: 'PATCH',
		path: `applications/${applicationUuid}/envs`,
		body,
	};
}
