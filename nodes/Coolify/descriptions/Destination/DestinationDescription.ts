import type { INodeProperties } from 'n8n-workflow';
import { groupOptionalParameters } from '../parameterCollections';

import {
	DESTINATION_FIELDS,
	destinationFieldProperty,
} from '../../requests/destination/destinationFields';

/**
 * Description of the Coolify destination resource.
 *
 * A destination is the Docker network a Coolify server hosts its resources
 * on. The operation selector lists the destination operations this node
 * supports. An operation is only listed here once its request builder exists,
 * so the editor never offers an operation that the node cannot execute.
 */
const destinationProperties: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		default: 'list',
		displayOptions: {
			show: {
				resource: ['destination'],
			},
		},
		options: [
			{
				name: 'Create',
				value: 'create',
				description:
					'Create a destination on a server. Coolify derives the type of the destination from the server, a standalone destination on a standalone server and a swarm destination on a swarm server. The network has to be unique on the server, a network that already exists is answered with HTTP 409.',
				action: 'Create a destination',
			},
			{
				name: 'Delete',
				value: 'delete',
				description:
					'Delete a destination by UUID. The deletion is permanent and also removes the Docker network of a standalone destination from its server. A destination that still has resources attached is answered with HTTP 409, detach them first.',
				action: 'Delete a destination',
			},
			{
				name: 'Get',
				value: 'get',
				description:
					'Get a destination by UUID. The response carries its name, its Docker network, its type and the UUID of its server.',
				action: 'Get a destination',
			},
			{
				name: 'List',
				value: 'list',
				description:
					'List every destination of the team, the standalone destinations first and the swarm destinations after them. The endpoint is not paginated, it returns every destination in one array.',
				action: 'List destinations',
			},
			{
				name: 'List by Server',
				value: 'listByServer',
				description:
					'List the destinations attached to a server, the standalone destinations first and the swarm destinations after them. A server that does not belong to the team is answered with HTTP 404.',
				action: 'List the destinations of a server',
			},
			{
				name: 'Update',
				value: 'update',
				description:
					'Rename a destination by UUID. The name is required and only the name is changed, the network of a destination cannot be changed through the API.',
				action: 'Update a destination',
			},
		],
	},

	// ----------------------------------
	//        destination:create
	// ----------------------------------
	{
		displayName: 'Server UUID',
		name: 'serverUuid',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchServers', searchable: true },
			},
			{ displayName: 'By UUID', name: 'id', type: 'string' },
		],
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['create'],
			},
		},
		description: 'Server the destination is created on',
	},
	{
		...destinationFieldProperty(DESTINATION_FIELDS.network),
		required: true,
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['create'],
			},
		},
	},
	{
		...destinationFieldProperty(DESTINATION_FIELDS.name),
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['create'],
			},
		},
	},

	// ----------------------------------
	//        destination:delete
	// ----------------------------------
	{
		displayName: 'Destination UUID',
		name: 'destinationUuid',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchGlobalDestinations', searchable: true },
			},
			{ displayName: 'By UUID', name: 'id', type: 'string' },
		],
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['delete'],
			},
		},
		description: 'UUID of the destination to delete',
	},

	// ----------------------------------
	//        destination:get
	// ----------------------------------
	{
		displayName: 'Destination UUID',
		name: 'destinationUuid',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchGlobalDestinations', searchable: true },
			},
			{ displayName: 'By UUID', name: 'id', type: 'string' },
		],
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['get'],
			},
		},
		description: 'UUID of the destination to retrieve',
	},

	// ----------------------------------
	//        destination:list
	// ----------------------------------
	// The list endpoint takes no parameter of this node, so it is configured
	// entirely through the operation selector.

	// ----------------------------------
	//    destination:listByServer
	// ----------------------------------
	{
		displayName: 'Server UUID',
		name: 'serverUuid',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchServers', searchable: true },
			},
			{ displayName: 'By UUID', name: 'id', type: 'string' },
		],
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['listByServer'],
			},
		},
		description: 'Server whose destinations are listed',
	},

	// ----------------------------------
	//        destination:update
	// ----------------------------------
	{
		displayName: 'Destination UUID',
		name: 'destinationUuid',
		type: 'resourceLocator',
		default: { mode: 'list', value: '' },
		required: true,
		modes: [
			{
				displayName: 'From List',
				name: 'list',
				type: 'list',
				typeOptions: { searchListMethod: 'searchGlobalDestinations', searchable: true },
			},
			{ displayName: 'By UUID', name: 'id', type: 'string' },
		],
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['update'],
			},
		},
		description: 'UUID of the destination to update',
	},
	{
		...destinationFieldProperty(DESTINATION_FIELDS.name),
		required: true,
		displayOptions: {
			show: {
				resource: ['destination'],
				operation: ['update'],
			},
		},
	},
];

export const destinationFields = groupOptionalParameters(destinationProperties, 'destination');
