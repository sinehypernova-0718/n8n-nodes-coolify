/**
 * The field contract of the cloud token endpoints.
 *
 * The resource accepts exactly three fields for creation: provider, token, name.
 * Update accepts only name. List and Get send no body.
 * The token field contains sensitive credentials and must be masked.
 */
import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import { CLOUD_PROVIDER_OPTIONS, type CloudProvider } from './types';

/**
 * The contract of a single field of a cloud token request.
 */
export interface CloudTokenFieldSpec {
	/** The name of the field in the Coolify API, also the name of the editor parameter. */
	apiName: 'provider' | 'token' | 'name';
	/** The label of the field in the editor. */
	displayName: string;
	/** The kind of the editor control. */
	type: 'string' | 'options';
	/** The description of the field in the editor. */
	description: string;
	/** For options type, the available values. */
	options?: readonly string[];
	/** Whether this is a secret field that should be masked. */
	secret?: boolean;
}

/**
 * The fields the cloud token endpoints accept, keyed by the API name.
 */
export const CLOUD_TOKEN_FIELDS: Record<CloudTokenFieldSpec['apiName'], CloudTokenFieldSpec> = {
	provider: {
		apiName: 'provider',
		displayName: 'Cloud Provider',
		type: 'options',
		description: 'The cloud provider this token is for',
		options: CLOUD_PROVIDER_OPTIONS,
	},
	token: {
		apiName: 'token',
		displayName: 'API Token',
		type: 'string',
		description:
			'The API token for the cloud provider. This is a sensitive secret and will not be returned by the API after creation.',
		secret: true,
	},
	name: {
		apiName: 'name',
		displayName: 'Name',
		type: 'string',
		description: 'Friendly name for the token',
	},
};

/**
 * The fields of the cloud token endpoints, in the order the body sends them.
 */
export function cloudTokenFieldSpecs(): CloudTokenFieldSpec[] {
	return [CLOUD_TOKEN_FIELDS.provider, CLOUD_TOKEN_FIELDS.token, CLOUD_TOKEN_FIELDS.name];
}

/**
 * The editor control of a cloud token field.
 */
export function cloudTokenFieldProperty(spec: CloudTokenFieldSpec): INodeProperties {
	const base: INodeProperties = {
		displayName: spec.displayName,
		name: spec.apiName,
		type: spec.type,
		default: spec.type === 'options' ? CLOUD_PROVIDER_OPTIONS[0] : '',
		description: spec.description,
	};

	const typeOptions: INodeProperties['typeOptions'] = {};

	if (spec.secret) {
		typeOptions.password = true;
	}
	if (spec.options) {
		typeOptions.options = spec.options;
	}

	if (Object.keys(typeOptions).length > 0) {
		base.typeOptions = typeOptions;
	}

	return base;
}

/**
 * Read and validate the cloud provider.
 */
export function readCloudProvider(ctx: IExecuteFunctions, itemIndex: number): CloudProvider {
	const provider = ctx.getNodeParameter(
		CLOUD_TOKEN_FIELDS.provider.apiName,
		itemIndex,
		CLOUD_PROVIDER_OPTIONS[0],
	) as string;

	if (!CLOUD_PROVIDER_OPTIONS.includes(provider as CloudProvider)) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The cloud provider must be one of: ${CLOUD_PROVIDER_OPTIONS.join(', ')}`,
			{ itemIndex },
		);
	}

	return provider as CloudProvider;
}

/**
 * Read and validate the token value.
 * Returns empty string if not set (for update, where token is not accepted).
 * Does not trim the value to avoid silently altering provider credentials;
 * the Coolify server applies TrimStrings middleware to all request fields.
 */
export function readTokenValue(
	ctx: IExecuteFunctions,
	itemIndex: number,
	required: boolean,
): string {
	const token = ctx.getNodeParameter(
		CLOUD_TOKEN_FIELDS.token.apiName,
		itemIndex,
		'',
	) as string;

	if (token === '') {
		if (required) {
			throw new NodeOperationError(
				ctx.getNode(),
				'The API token is required to create a cloud provider token',
				{ itemIndex },
			);
		}
		return '';
	}

	return token;
}

/**
 * Read and validate the name value.
 * Trims the value because the Coolify server applies TrimStrings middleware
 * to all request fields, and a display name with surrounding whitespace
 * is not useful.
 */
export function readTokenName(
	ctx: IExecuteFunctions,
	itemIndex: number,
	required: boolean,
): string {
	const name = (
		ctx.getNodeParameter(CLOUD_TOKEN_FIELDS.name.apiName, itemIndex, '') as string
	).trim();

	if (name === '') {
		if (required) {
			throw new NodeOperationError(ctx.getNode(), 'The name is required', { itemIndex });
		}
		return '';
	}

	return name;
}

/**
 * Build the request body for the creation endpoint.
 */
export function buildCreateCloudTokenBody(ctx: IExecuteFunctions, itemIndex: number): IDataObject {
	return {
		provider: readCloudProvider(ctx, itemIndex),
		token: readTokenValue(ctx, itemIndex, true),
		name: readTokenName(ctx, itemIndex, true),
	};
}

/**
 * Build the request body for the update endpoint.
 * The name is required; the API only accepts the name field for updates.
 */
export function buildUpdateCloudTokenBody(
	ctx: IExecuteFunctions,
	itemIndex: number,
): IDataObject {
	return {
		name: readTokenName(ctx, itemIndex, true),
	};
}
