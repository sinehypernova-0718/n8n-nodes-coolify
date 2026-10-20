import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class CoolifyApi implements ICredentialType {
	name = 'coolifyApi';

	displayName = 'Coolify API';

	// Themed icon form: n8n expects a light and a dark variant. The package
	// ships a single theme-neutral asset, so both variants point at it.
	// The path is relative to this file (credentials/).
	icon: Icon = { light: 'file:../icons/coolify.svg', dark: 'file:../icons/coolify.svg' };

	documentationUrl = 'https://coolify.io/docs/api/authorization';

	properties: INodeProperties[] = [
		{
			displayName: 'Host',
			name: 'host',
			type: 'string',
			default: 'https://app.coolify.io/api/v1',
			placeholder: 'https://app.coolify.io/api/v1',
			description:
				'Base URL of the Coolify API, without a trailing slash. Keep the default for Coolify Cloud, or use the URL of your own instance (for example https://coolify.example.com/api/v1).',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'API token created in Coolify under "Keys & Tokens". It is sent as a Bearer token.',
			required: true,
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.accessToken}}',
				Accept: 'application/json',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.host}}',
			url: '/teams/current',
			method: 'GET',
		},
	};
}
