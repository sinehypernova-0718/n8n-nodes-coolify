/**
 * The field contract of the cloud init script endpoints.
 *
 * The resource accepts exactly two fields, `name` and `script`; the list
 * endpoint takes neither a query nor a body at all. This module holds that
 * field contract once:
 *
 * - the fields the endpoints accept, so the editor renders them from here,
 * - the rules the request builders apply when they turn the editor values
 *   into a request body.
 *
 * The endpoints differ in what they send:
 *
 * - Create sends both fields, `name` and `script`, in a JSON body,
 * - Update sends only the fields the user filled in, in a JSON body,
 * - List, Get and Delete send no body at all.
 *
 * The editor renders the fields from this module and the request builders
 * build the body from it, so a field can never be shown without being sent
 * or sent without being shown.
 *
 * The contract was verified against the official OpenAPI specification and
 * the `CloudInitScriptsController` implementation of the Coolify sources on
 * `master` (read on 2026-10-22). The endpoints reject every field but
 * `name` and `script` with HTTP 422. The global middleware of the upstream
 * also trims every string of a request with `TrimStrings` and turns an
 * empty string into `null` with `ConvertEmptyStringsToNull`, and the
 * `string` rules of the endpoints are not nullable, so a blank field in a
 * request body is rejected with HTTP 422 instead of clearing the stored
 * value. The node therefore omits a blank value, and the value it omits
 * keeps the value the script has.
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
 * The Coolify API requires the name for a creation and trims every string
 * with `TrimStrings` before it processes it, so the same is done here. A
 * name the user never set is returned as an empty string, which the callers
 * decide how to treat.
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
 * The value is returned exactly as the user wrote it. The Coolify API server
 * trims every string of a request itself (`TrimStrings` in the global
 * middleware of `app/Http/Kernel.php`), so the node must not remove the
 * leading or trailing whitespace a user typed either, and the content of the
 * script is what reaches the request body.
 *
 * The trimmed value is read only to decide whether the user provided content
 * at all, which decides the required-field error.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @param required Whether the API rejects the request without the content.
 * @returns The content, exactly as the user wrote it, or an empty string when
 *   the user only entered whitespace.
 */
export function readCloudInitScriptContent(
	ctx: IExecuteFunctions,
	itemIndex: number,
	purpose: string,
	required: boolean,
): string {
	const script = ctx.getNodeParameter(
		CLOUD_INIT_SCRIPT_FIELDS.script.apiName,
		itemIndex,
		'',
	) as string;

	if (script.trim() === '') {
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
 * script as it is (`CloudInitScriptsController::update` sends
 * `$request->only(['name', 'script'])` to the model). A blank value is not a
 * request to clear a field either: the upstream middleware turns an empty
 * string into `null` (`ConvertEmptyStringsToNull`) and the `string` rules of
 * the endpoint are not nullable, so a blank field in the body is rejected
 * with HTTP 422. The node therefore omits a blank value, and the script
 * keeps the value it has.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @param purpose What the operation does, used in the error message.
 * @returns The request body with only the fields the user filled in.
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
