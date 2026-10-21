import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import {
	APPLICATION_CREATE_PATHS,
	buildCreateApplicationBody,
	validateCreateApplicationFields,
} from './applicationFields';

/**
 * Build the request that creates an application from a Docker image.
 *
 * The Coolify API needs the name of the image and accepts the tag separately.
 * It creates the application and returns its UUID, and it queues a deployment
 * when the request asks for it.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /applications/dockerimage`.
 */
export async function createDockerImageApplicationRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const body = buildCreateApplicationBody(this, itemIndex, 'dockerImage');
	validateCreateApplicationFields(this, itemIndex, body);

	if (!body.docker_registry_image_name) {
		throw new NodeOperationError(
			this.getNode(),
			'The name of the Docker image is required to create an application from a Docker image',
			{ itemIndex },
		);
	}

	return {
		method: 'POST',
		path: APPLICATION_CREATE_PATHS.dockerImage,
		body,
	};
}
