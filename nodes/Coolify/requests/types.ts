import type { IDataObject, IHttpRequestMethods } from 'n8n-workflow';

import type { RetrySafety } from '../shared/rateLimit';

/**
 * A Coolify API request, as the request builders describe it.
 *
 * The path is relative to the base URL of the credential, so it never
 * contains the API prefix. The request is sent through the shared transport
 * `coolifyApiRequest`, which owns authentication, the retry policy and the
 * error surface.
 */
export interface CoolifyRequest {
	/** HTTP method of the request */
	method: IHttpRequestMethods;
	/** Path of the endpoint, relative to the configured base URL */
	path: string;
	/** Query parameters, omitted entirely when the endpoint takes none */
	qs?: IDataObject;
	/** JSON request body, omitted entirely when the endpoint takes none */
	body?: IDataObject;
	/**
	 * Whether repeating the request is free of side effects.
	 *
	 * Defaults to the retry safety of the HTTP method, so a write is never
	 * repeated unless the endpoint declares that a repeat is harmless.
	 */
	retrySafety?: RetrySafety;
}
