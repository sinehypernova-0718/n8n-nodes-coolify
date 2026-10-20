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
			displayName: 'Base URL',
			name: 'host',
			type: 'string',
			default: 'https://app.coolify.io/api/v1',
			placeholder: 'https://app.coolify.io/api/v1',
			description:
				'Base URL of the Coolify API, including the "/api/v1" path. Keep the default for Coolify Cloud, or use the URL of your own instance (for example https://coolify.example.com/api/v1). A trailing slash is tolerated, but the "/api/v1" suffix is required.',
			required: true,
		},
		{
			displayName: 'Access Token',
			name: 'accessToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'API token created in Coolify under "Keys & Tokens". It is sent as a Bearer token and needs the "read" permission.',
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
			// `GET /team` is the canonical endpoint for "the team bound to this token"
			// (Coolify OpenAPI: operationId `get-token-team`). The older
			// `/teams/current` path is a deprecated alias of the same handler.
			url: '/team',
			method: 'GET',
		},
		rules: [
			{
				type: 'responseCode',
				properties: {
					value: 400,
					message:
						'Coolify rejected the request (HTTP 400). Verify the base URL and that the API token was copied in full.',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 401,
					message:
						'Coolify rejected the token (HTTP 401). It is missing, invalid, expired, revoked, or its owner is no longer a member of the token\'s team.',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 403,
					message:
						'Coolify denied access (HTTP 403). The token needs the "read" permission, API access must be enabled on the instance, and the calling IP must be allowlisted.',
				},
			},
			{
				type: 'responseCode',
				properties: {
					value: 404,
					message:
						'Coolify returned HTTP 404 for GET /team. Verify that the base URL includes /api/v1 and that the Coolify instance supports this endpoint (Coolify 4.3.0 or newer).',
				},
			},
		],
	};
}
