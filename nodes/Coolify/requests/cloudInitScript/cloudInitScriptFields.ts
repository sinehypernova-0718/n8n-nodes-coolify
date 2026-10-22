/**
 * The field contract of the cloud init script endpoints.
 *
 * All four mutating and reading endpoints of the resource share one flat
 * request body with the fields `name` and `script`; the list endpoint takes
 * no body at all. This module holds that contract once:
 *
 * - the fields the endpoints accept, so the editor renders them from here,
 * - the rules the request builders apply when they turn the editor values
 *   into the request body.
 *
 * The editor renders the fields from this module and the request builders
 * build the body from it, so a field can never be shown without being sent
 * or sent without being shown.
 *
 * The contract was verified against the official OpenAPI specification and
 * the `CloudInitScriptsController` implementation of the Coolify sources on
 * `master` (read on 2026-10-22). The endpoints reject every field but
 * `name` and `script` with HTTP 422, so the contract is exactly their set.
 */

import {
	type IDataObject,
	type IExecuteFunctions,
	type INodeProperties,
	NodeOperationError,
} from 'n8n-workflow';

/**
 * Longest name of a cloud init script the Coolify API accepts.
 *
 * The controller validates `name` with `string|max:255`.
 */
export const CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH = 255;

/**
 * The kind of the editor control of a cloud init script field.
 */
export type CloudInitScriptFieldType = 'string';

/**
 * The contract of a single field of a cloud init script request.
 */
export interface CloudInitScriptFieldSpec {
	/** The name of the field in the Coolify API, also the name of the editor parameter. */
	apiName: 'name' | 'script';
	/** The label of the field in the editor. */
	displayName: string;
	/** The kind of the editor control. */
	type: CloudInitScriptFieldType;
	/** The description of the field in the editor. */
	description: string;
	/** The number of rows of a multi-line text control. */
	rows?: number;
}

/**
 * The fields the cloud init script endpoints accept, keyed by the API name.
 *
 * The API name and the editor parameter name are the same, because the names
 * of this resource are already single words in camelCase.
 */
export const CLOUD_INIT_SCRIPT_FIELDS: Record<
	CloudInitScriptFieldSpec['apiName'],
	CloudInitScriptFieldSpec
> = {
	name: {
		apiName: 'name',
		displayName: 'Name',
		type: 'string',
		description: 'Name of the cloud init script, up to 255 characters',
	},
	script: {
		apiName: 'script',
		displayName: 'Script',
		type: 'string',
		description: 'Content of the script, a bash script starting with #! or cloud-config YAML',
		rows: 12,
	},
};

/**
 * The fields of the cloud init script endpoints, in the order the body sends them.
 */
export function cloudInitScriptFieldSpecs(): CloudInitScriptFieldSpec[] {
	return [CLOUD_INIT_SCRIPT_FIELDS.name, CLOUD_INIT_SCRIPT_FIELDS.script];
}

/**
 * The editor control of a cloud init script field.
 */
export function cloudInitScriptFieldProperty(spec: CloudInitScriptFieldSpec): INodeProperties {
	return {
		displayName: spec.displayName,
		name: spec.apiName,
		type: spec.type,
		default: '',
		description: spec.description,
		typeOptions: spec.rows ? { rows: spec.rows } : undefined,
	};
}

/**
 * Read and validate the name of a cloud init script.
 *
 * The Coolify API requires the name for a creation and trims it before it
 * stores it, so the same is done here. A name the user never set is returned
 * as an empty string, which the callers decide how to treat.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @param required Whether the API rejects the request without the name.
 * @returns The name, trimmed, or an empty string when the user did not set it.
 */
export function readCloudInitScriptName(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
	required: boolean,
): string {
	const name = (
		ctx.getNodeParameter(CLOUD_INIT_SCRIPT_FIELDS.name.apiName, itemIndex, '') as string
	).trim();

	if (name === '') {
		if (required) {
			throw new NodeOperationError(ctx.getNode(), `The name is required to ${purpose}`, {
				itemIndex,
			});
		}
		return '';
	}

	if (name.length > CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The name must not be longer than ${CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH} characters`,
			{ itemIndex },
		);
	}

	return name;
}

/**
 * Read and validate the content of a cloud init script.
 *
 * The Coolify API requires the script content for a creation and validates
 * the format itself, so only the presence is checked here.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @param required Whether the API rejects the request without the content.
 * @returns The content, trimmed, or an empty string when the user did not set it.
 */
export function readCloudInitScriptContent(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
	required: boolean,
): string {
	const script = (
		ctx.getNodeParameter(CLOUD_INIT_SCRIPT_FIELDS.script.apiName, itemIndex, '') as string
	).trim();

	if (script === '') {
		if (required) {
			throw new NodeOperationError(ctx.getNode(), `The script is required to ${purpose}`, {
				itemIndex,
			});
		}
		return '';
	}

	return script;
}

/**
 * Build the request body of the creation endpoint.
 *
 * The endpoint rejects every field but `name` and `script` with HTTP 422,
 * so the body carries exactly those two and nothing else.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The request body of the Coolify API.
 */
export function buildCreateCloudInitScriptBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): IDataObject {
	return {
		name: readCloudInitScriptName(ctx, itemIndex, purpose, true),
		script: readCloudInitScriptContent(ctx, itemIndex, purpose, true),
	};
}

/**
 * Build the request body of the update endpoint.
 *
 * The Coolify API updates a cloud init script with a partial update: it only
 * changes the fields of the request body and keeps every other field of the
 * script as it is. A field the user left empty keeps the current value of the
 * script, so an emptied field is not sent as an empty string.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The request body with only the fields the user set.
 */
export function buildUpdateCloudInitScriptBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
): IDataObject {
	const body: IDataObject = {};

	const name = readCloudInitScriptName(ctx, itemIndex, purpose, false);
	if (name !== '') {
		body.name = name;
	}

	const script = readCloudInitScriptContent(ctx, itemIndex, purpose, false);
	if (script !== '') {
		body.script = script;
	}

	return body;
}
