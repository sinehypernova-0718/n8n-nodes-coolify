/**
 * The field contract of the destination endpoints.
 *
 * A destination is the Docker network a Coolify server hosts its resources
 * on. The endpoints accept two fields, `network` and `name`, and they differ
 * in what they send:
 *
 * - Create requires `network` and accepts an optional `name`; the type of the
 *   destination is derived by the API from the server, so the request never
 *   carries a `type`;
 * - Update accepts exactly one field, the required `name`, and rejects every
 *   other field with HTTP 422. The network of a destination cannot be changed
 *   through the API;
 * - List, List by Server, Get and Delete send no body at all.
 *
 * This module holds that field contract once:
 *
 * - the fields the endpoints accept, so the editor renders them from here,
 * - the rules the request builders apply when they turn the editor values
 *   into a request body.
 *
 * The editor renders the fields from this module and the request builders
 * build the body from it, so a field can never be shown without being sent
 * or sent without being shown.
 *
 * The contract was verified against the official OpenAPI specification and
 * the `DestinationsController` implementation of the Coolify sources at the
 * `v4.4.6` tag: the OpenAPI publishes an optional `type` on the creation
 * endpoint, while the controller derives the expected type from the server
 * and answers a conflicting explicit type with HTTP 422, so the node omits
 * the field and lets the API infer it. The OpenAPI does not mark the `name`
 * of the update endpoint as required, while the controller validates it with
 * `required|string|max:255`, so the node requires it. The upstream middleware
 * trims every string with `TrimStrings` and turns an empty string into `null`
 * with `ConvertEmptyStringsToNull`, and the `string` rules of the endpoints
 * are not nullable, so a required field that is only whitespace is rejected
 * before the request is sent.
 */

import {
	type IDataObject,
	type IExecuteFunctions,
	type INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

/** Longest name of a destination the Coolify API accepts. */
export const DESTINATION_NAME_MAX_LENGTH = 255;

/** Longest name of a Docker network the Coolify API accepts. */
export const DESTINATION_NETWORK_MAX_LENGTH = 255;

/**
 * Pattern the Coolify API validates the network of a destination against.
 *
 * The controller validates the field with the same expression, so a value the
 * node rejects locally would also be rejected by the API with HTTP 422.
 */
export const DESTINATION_NETWORK_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/** The kind of the editor control of a destination field. */
export type DestinationFieldType = 'string';

/** The contract of a single field of a destination request. */
export interface DestinationFieldSpec {
	/** The name of the field in the Coolify API, also the name of the editor parameter. */
	apiName: 'name' | 'network';
	/** The label of the field in the editor. */
	displayName: string;
	/** The kind of the editor control. */
	type: DestinationFieldType;
	/** The description of the field in the editor. */
	description: string;
	/** Longest value the Coolify API accepts. */
	maxLength: number;
}

/**
 * The fields the destination endpoints accept, keyed by the API name.
 *
 * The API name and the editor parameter name are the same, because the names
 * of this resource are already single words in camelCase.
 */
export const DESTINATION_FIELDS: Record<DestinationFieldSpec['apiName'], DestinationFieldSpec> = {
	name: {
		apiName: 'name',
		displayName: 'Name',
		type: 'string',
		description: `Name of the destination, up to ${DESTINATION_NAME_MAX_LENGTH} characters`,
		maxLength: DESTINATION_NAME_MAX_LENGTH,
	},
	network: {
		apiName: 'network',
		displayName: 'Network',
		type: 'string',
		description: `Name of the Docker network, up to ${DESTINATION_NETWORK_MAX_LENGTH} characters. The name must start with a letter or a digit and may only contain letters, digits, dots, underscores and hyphens.`,
		maxLength: DESTINATION_NETWORK_MAX_LENGTH,
	},
};

/** The fields of the destination endpoints, in the order the body sends them. */
export function destinationFieldSpecs(): DestinationFieldSpec[] {
	return [DESTINATION_FIELDS.network, DESTINATION_FIELDS.name];
}

/** The editor control of a destination field. */
export function destinationFieldProperty(spec: DestinationFieldSpec): INodeProperties {
	return {
		displayName: spec.displayName,
		name: spec.apiName,
		type: spec.type,
		default: '',
		description: spec.description,
	};
}

/**
 * Read and validate the name of a destination.
 *
 * The Coolify API accepts a name of up to 255 characters and generates one
 * from the server and the network when a creation leaves it empty. The name
 * of an update is required by the API and is not nullable, so a caller that
 * requires it rejects a blank value instead of sending one.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @param required Whether the API rejects the request without the name.
 * @returns The name, trimmed, or an empty string when the user did not set it.
 */
export function readDestinationName(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
	required: boolean,
): string {
	const name = (
		ctx.getNodeParameter(DESTINATION_FIELDS.name.apiName, itemIndex, '') as string
	).trim();

	if (name === '') {
		if (required) {
			throw new NodeOperationError(ctx.getNode(), `The name is required to ${purpose}`, {
				itemIndex,
			});
		}
		return '';
	}

	if (name.length > DESTINATION_NAME_MAX_LENGTH) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The name must not be longer than ${DESTINATION_NAME_MAX_LENGTH} characters`,
			{ itemIndex },
		);
	}

	return name;
}

/**
 * Read and validate the network of a destination.
 *
 * The Coolify API requires the network of a creation and validates it against
 * a fixed pattern. The same pattern is checked here, so an invalid value is
 * reported with an actionable message instead of a generic HTTP 422.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The name of the network, trimmed.
 */
export function readDestinationNetwork(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): string {
	const network = (
		ctx.getNodeParameter(DESTINATION_FIELDS.network.apiName, itemIndex, '') as string
	).trim();

	if (network === '') {
		throw new NodeOperationError(ctx.getNode(), `The network is required to ${purpose}`, {
			itemIndex,
		});
	}

	if (network.length > DESTINATION_NETWORK_MAX_LENGTH) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The network must not be longer than ${DESTINATION_NETWORK_MAX_LENGTH} characters`,
			{ itemIndex },
		);
	}

	if (!DESTINATION_NETWORK_PATTERN.test(network)) {
		throw new NodeOperationError(
			ctx.getNode(),
			'The network must start with a letter or a digit and may only contain letters, digits, dots, underscores and hyphens',
			{ itemIndex },
		);
	}

	return network;
}

/**
 * Build the request body of the creation endpoint.
 *
 * The endpoint requires the network and accepts an optional name. The type of
 * the destination is derived by the API from the server, so the body never
 * carries a `type`. A name the user left empty is omitted, so the API
 * generates one from the server and the network.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The request body of the Coolify API.
 */
export function buildCreateDestinationBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): IDataObject {
	const body: IDataObject = {
		network: readDestinationNetwork(ctx, itemIndex, purpose),
	};

	const name = readDestinationName(ctx, itemIndex, purpose, false);
	if (name !== '') {
		body.name = name;
	}

	return body;
}

/**
 * Build the request body of the update endpoint.
 *
 * The endpoint accepts exactly one field, the required name, and rejects
 * every other field with HTTP 422. The network of a destination cannot be
 * changed through the API, so the body never carries it.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The request body of the Coolify API.
 */
export function buildUpdateDestinationBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): IDataObject {
	return {
		name: readDestinationName(ctx, itemIndex, purpose, true),
	};
}
