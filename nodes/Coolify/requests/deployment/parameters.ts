import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import { encodePathSegment } from '../../shared/pathSegment';
import { locatorValue } from '../../shared/locatorValue';

/**
 * Read the UUID of the deployment an operation works on.
 *
 * The Get and the Cancel endpoint address a deployment through its UUID, so
 * the parameter is required and is validated before a request is built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The UUID of the deployment, encoded for the path of the endpoint.
 */
export function requireDeploymentUuid(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const uuid = locatorValue(ctx.getNodeParameter('deploymentUuid', itemIndex, '')).trim();

	if (!uuid) {
		throw new NodeOperationError(ctx.getNode(), `Deployment UUID is required to ${purpose}`, {
			itemIndex,
		});
	}

	return encodePathSegment(uuid);
}

/**
 * Read the UUID of the application whose deployments are listed.
 *
 * The endpoint that lists the deployments of an application addresses the
 * application through its UUID, so the parameter is required and is validated
 * before a request is built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The UUID of the application, encoded for the path of the endpoint.
 */
export function requireDeploymentApplicationUuid(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const uuid = locatorValue(ctx.getNodeParameter('applicationUuid', itemIndex, '')).trim();

	if (!uuid) {
		throw new NodeOperationError(ctx.getNode(), `Application UUID is required to ${purpose}`, {
			itemIndex,
		});
	}

	return encodePathSegment(uuid);
}
