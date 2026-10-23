import type { INodeProperties } from 'n8n-workflow';

import {
	cloudTokenFieldProperty,
	cloudTokenFieldSpecs,
} from '../../requests/cloudToken/cloudTokenFields';

/**
 * Description of the Coolify cloud token resource.
 *
 * The operation selector lists the cloud token operations this node supports.
 * An operation is only listed here once its request builder exists, so the
 * editor never offers an operation that the node cannot execute.
 */
export const cloudTokenFields: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'list',
		displayOptions: {
			show: {
				resource: ['cloudToken'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description:
					'Create a new cloud provider token. The token will be validated against the provider before being stored. Only team admins and owners can create tokens, a token without that access is expected to receive HTTP 403.',
				action: 'Create a cloud provider token',
			},
			{
				name: 'Delete',
				value: 'delete',
				description:
					'Delete a cloud provider token by UUID. The deletion is permanent and cannot be undone. Cannot delete if the token is used by any servers. Only team admins and owners can delete tokens, a token without that access is expected to receive HTTP 403.',
				action: 'Delete a cloud provider token',
			},
			{
				name: 'Get',
				value: 'get',
				description:
					'Get a cloud provider token by UUID. Only team admins and owners can retrieve tokens, a token without that access is expected to receive HTTP 403.',
				action: 'Get a cloud provider token',
			},
			{
				name: 'List',
				value: 'list',
				description:
					'List all cloud provider tokens for the authenticated team. Only team admins and owners can list tokens, a token without that access is expected to receive HTTP 403.',
				action: 'List cloud provider tokens',
			},
			{
				name: 'Update',
				value: 'update',
				description:
					'Update a cloud provider token by UUID. Only the name can be updated; the token value itself cannot be changed. The new name is required. Only team admins and owners can update tokens, a token without that access is expected to receive HTTP 403.',
				action: 'Update a cloud provider token',
			},
			{
				name: 'Validate',
				value: 'validate',
				description:
					'Validate a cloud provider token against the provider API. This is a read-only check that verifies the token is still valid. Only team admins and owners can validate tokens, a token without that access is expected to receive HTTP 403.',
				action: 'Validate a cloud provider token',
			},
		],
	},

	// ----------------------------------
	//     cloudToken:create
	// ----------------------------------
	...cloudTokenOperationFields(['create'], true),

	// ----------------------------------
	//     cloudToken:delete
	// ----------------------------------
	{
		displayName: 'Warning',
		name: 'deleteWarning',
		type: 'notice',
		typeOptions: {
			width: 400,
		},
		default: '',
		displayOptions: {
			show: {
				resource: ['cloudToken'],
				operation: ['delete'],
			},
		},
		description:
			'Deleting the cloud provider token removes it permanently. This cannot be undone. Note: tokens that are used by any servers cannot be deleted.',
	},
	{
		displayName: 'Cloud Token UUID',
		name: 'uuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudToken'],
				operation: ['delete'],
			},
		},
		description: 'UUID of the cloud provider token to delete',
	},

	// ----------------------------------
	//     cloudToken:get
	// ----------------------------------
	{
		displayName: 'Cloud Token UUID',
		name: 'uuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudToken'],
				operation: ['get'],
			},
		},
		description: 'UUID of the cloud provider token to retrieve',
	},

	// ----------------------------------
	//     cloudToken:list
	// ----------------------------------
	// The list endpoint takes no parameters.

	// ----------------------------------
	//     cloudToken:update
	// ----------------------------------
	{
		displayName: 'Cloud Token UUID',
		name: 'uuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudToken'],
				operation: ['update'],
			},
		},
		description: 'UUID of the cloud provider token to update',
	},
	// For update, only the name field is accepted and it is required.
	// The provider and token fields are not part of the update contract.
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudToken'],
				operation: ['update'],
			},
		},
		description: 'New name for the cloud provider token',
	},

	// ----------------------------------
	//     cloudToken:validate
	// ----------------------------------
	{
		displayName: 'Cloud Token UUID',
		name: 'uuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudToken'],
				operation: ['validate'],
			},
		},
		description: 'UUID of the cloud provider token to validate',
	},
];

/**
 * The fields of a cloud token operation.
 *
 * @param operations The operations the fields are shown for.
 * @param required Whether the fields are required in the operation.
 * @returns The editor fields of the given operations.
 */
function cloudTokenOperationFields(operations: string[], required: boolean): INodeProperties[] {
	return cloudTokenFieldSpecs().map((spec) => ({
		...cloudTokenFieldProperty(spec),
		...(required ? { required: true } : {}),
		displayOptions: {
			show: {
				resource: ['cloudToken'],
				operation: operations,
			},
		},
	}));
}
