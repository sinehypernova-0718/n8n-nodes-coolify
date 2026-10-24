import { type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import { encodePathSegment } from '../../shared/pathSegment';

/**
 * Pattern an environment variable key has to match in the Coolify API.
 */
const ENVIRONMENT_VARIABLE_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_.]*$/;

/**
 * Longest environment variable key the Coolify API accepts.
 */
const MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH = 255;

export { encodePathSegment };

/**
 * Read the UUID of the application an operation works on.
 *
 * Every application endpoint addresses the application through its UUID, so
 * the parameter is required and is validated before a request is built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The UUID of the application, encoded for the path of the endpoint.
 */
export function requireApplicationUuid(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const applicationUuid = (ctx.getNodeParameter('applicationUuid', itemIndex, '') as string).trim();

	if (!applicationUuid) {
		throw new NodeOperationError(ctx.getNode(), `Application UUID is required to ${purpose}`, {
			itemIndex,
		});
	}

	return encodePathSegment(applicationUuid);
}

/**
 * Read and validate the key of an environment variable.
 *
 * The Coolify API trims the key and then requires it to start with a letter
 * or an underscore and to be at most 255 characters long, so the same rules
 * are applied here before a request is built.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The key of the environment variable.
 */
export function requireEnvironmentVariableKey(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const key = (ctx.getNodeParameter('key', itemIndex, '') as string).trim();

	if (!key) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Environment variable key is required to ${purpose}`,
			{
				itemIndex,
			},
		);
	}

	if (key.length > MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Environment variable key must not be longer than ${MAX_ENVIRONMENT_VARIABLE_KEY_LENGTH} characters`,
			{ itemIndex },
		);
	}

	if (!ENVIRONMENT_VARIABLE_KEY_PATTERN.test(key)) {
		throw new NodeOperationError(
			ctx.getNode(),
			'Environment variable key must start with a letter or an underscore and may only contain letters, digits, underscores and dots',
			{ itemIndex },
		);
	}

	return key;
}
