import type { INodeProperties } from 'n8n-workflow';

import {
	cloudInitScriptFieldProperty,
	cloudInitScriptFieldSpecs,
} from '../../requests/cloudInitScript/cloudInitScriptFields';

/**
 * Description of the Coolify cloud init script resource.
 *
 * The operation selector lists the cloud init script operations this node
 * supports. An operation is only listed here once its request builder
 * exists, so the editor never offers an operation that the node cannot
 * execute.
 */
export const cloudInitScriptFields: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'list',
		displayOptions: {
			show: {
				resource: ['cloudInitScript'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description:
					'Create a new cloud init script for the team. The content has to be a bash script starting with #! or cloud-config YAML. Only team admins and owners can create scripts, a token without that access is expected to receive HTTP 403.',
				action: 'Create a cloud init script',
			},
			{
				name: 'Delete',
				value: 'delete',
				description:
					'Delete a cloud init script by UUID. The deletion is permanent, the content of the script cannot be restored through the API afterwards. Only team admins and owners can delete scripts, a token without that access is expected to receive HTTP 403.',
				action: 'Delete a cloud init script',
			},
			{
				name: 'Get',
				value: 'get',
				description:
					'Get a cloud init script by UUID. Only team admins and owners can retrieve scripts, a token without that access is expected to receive HTTP 403. The content of the script is returned only for tokens with the read:sensitive or the root ability.',
				action: 'Get a cloud init script',
			},
			{
				name: 'List',
				value: 'list',
				description:
					'List the cloud init scripts of the team, newest first. Only team admins and owners can list scripts, a token without that access is expected to receive HTTP 403. The content of the scripts is returned only for tokens with the read:sensitive or the root ability.',
				action: 'List cloud init scripts',
			},
			{
				name: 'Update',
				value: 'update',
				description:
					'Update a cloud init script by UUID. Only the fields that are filled in are changed, every other field keeps its current value. Only team admins and owners can update scripts, a token without that access is expected to receive HTTP 403.',
				action: 'Update a cloud init script',
			},
		],
	},

	// ----------------------------------
	//     cloudInitScript:create
	// ----------------------------------
	...cloudInitScriptOperationFields(['create'], true),

	// ----------------------------------
	//     cloudInitScript:delete
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
				resource: ['cloudInitScript'],
				operation: ['delete'],
			},
		},
		description:
			'Deleting the script removes it together with its content. That cannot be undone from the API.',
	},
	{
		displayName: 'Cloud Init Script UUID',
		name: 'cloudInitScriptUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudInitScript'],
				operation: ['delete'],
			},
		},
		description: 'UUID of the cloud init script to delete',
	},

	// ----------------------------------
	//     cloudInitScript:get
	// ----------------------------------
	{
		displayName: 'Cloud Init Script UUID',
		name: 'cloudInitScriptUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudInitScript'],
				operation: ['get'],
			},
		},
		description: 'UUID of the cloud init script to retrieve',
	},

	// ----------------------------------
	//     cloudInitScript:list
	// ----------------------------------
	// The list endpoint of the Coolify API takes no parameter of this node, so
	// it is configured entirely through the operation selector.

	// ----------------------------------
	//    cloudInitScript:update
	// ----------------------------------
	{
		displayName: 'Cloud Init Script UUID',
		name: 'cloudInitScriptUuid',
		type: 'string',
		default: '',
		required: true,
		displayOptions: {
			show: {
				resource: ['cloudInitScript'],
				operation: ['update'],
			},
		},
		description: 'UUID of the cloud init script to update',
	},
	...cloudInitScriptOperationFields(['update'], false),
];

/**
 * The name and the script controls of an operation.
 *
 * The fields are rendered from the field contract in
 * `nodes/Coolify/requests/cloudInitScript/cloudInitScriptFields.ts`, so the
 * editor and the request body can never disagree about a field. The
 * duplication is explicitly desired: a required field of the creation
 * endpoint and an optional field of the update endpoint carry the same
 * parameter name, and only one of them is visible at a time, because
 * `displayOptions.show.operation` keeps them mutually exclusive.
 *
 * @param operations The operations the fields are shown for.
 * @param required Whether the fields are required in the operation.
 * @returns The editor fields of the given operations.
 */
function cloudInitScriptOperationFields(
	operations: string[],
	required: boolean,
): INodeProperties[] {
	return cloudInitScriptFieldSpecs().map((spec) => ({
		...cloudInitScriptFieldProperty(spec),
		...(required ? { required: true } : {}),
		displayOptions: {
			show: {
				resource: ['cloudInitScript'],
				operation: operations,
			},
		},
	}));
}
