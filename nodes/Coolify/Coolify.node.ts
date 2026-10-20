import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';

export class Coolify implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Coolify',
		name: 'coolify',
		// Themed icon form: n8n expects a light and a dark variant. The package
		// ships a single theme-neutral asset, so both variants point at it.
		// The path is relative to this file (nodes/Coolify/).
		icon: { light: 'file:../../icons/coolify.svg', dark: 'file:../../icons/coolify.svg' },
		group: ['input'],
		version: 1,
		subtitle: 'Coolify',
		description:
			'Manage Coolify applications, services, databases, servers and deployments from your n8n workflows.',
		defaults: {
			name: 'Coolify',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'coolifyApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Notice',
				name: 'notice',
				type: 'notice',
				typeOptions: {
					width: 400,
				},
				default: '',
				description:
					'This node is a bootstrap: the Coolify API operations are not implemented yet. See the repository README for the planned operation list.',
			},
		],
	};
}
