import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import {
	APPLICATION_CREATE_PATHS,
	buildCreateApplicationBody,
	validateCreateApplicationFields,
} from './applicationFields';

/**
 * Build the request that creates an application from a Dockerfile.
 *
 * The Coolify API expects the Dockerfile base64 encoded, so the node encodes
 * the content of the editor before it sends it. The API fixes the build pack
 * of the application to Dockerfile and generates a name when the request does
 * not carry one.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/dockerfile`.
 */
export async function createDockerfileApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const body = buildCreateApplicationBody(this, itemIndex, 'dockerfile');
	validateCreateApplicationFields(this, itemIndex, body);

	if (typeof body.dockerfile !== 'string' || body.dockerfile === '') {
		throw new NodeOperationError(
			this.getNode(),
			'The content of the Dockerfile is required to create an application from a Dockerfile',
			{ itemIndex },
		);
	}

	body.dockerfile = Buffer.from(body.dockerfile, 'utf8').toString('base64');

	return {
		method: 'POST',
		path: APPLICATION_CREATE_PATHS.dockerfile,
		body,
	};
}
