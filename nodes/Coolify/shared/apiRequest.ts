/**
 * Shared authenticated transport for the Coolify API.
 *
 * Every Coolify API call of this node goes through {@link coolifyApiRequest},
 * so authentication, request shaping, the retry policy and the error surface
 * are implemented exactly once.
 *
 * Authentication stays in the credential (`credentials/CoolifyApi.credentials.ts`
 * sends `Authorization: Bearer <token>` and `Accept: application/json`), so the
 * transport never reads or rewrites the token itself.
 */

import {
	NodeApiError,
	sleep,
	sleepWithAbort,
	type IDataObject,
	type IExecuteFunctions,
	type IHttpRequestMethods,
	type IHttpRequestOptions,
	type ILoadOptionsFunctions,
	type IN8nHttpFullResponse,
	type INode,
	type JsonObject,
} from 'n8n-workflow';

import {
	MAX_RETRIES,
	MAX_RETRY_AFTER_MS,
	classifyFailure,
	classifyResponse,
	computeRetryDelay,
	defaultRetrySafety,
	getHeaderValue,
	type FailureInfo,
	type HeaderMap,
	type RetryDelay,
	type RetrySafety,
} from './rateLimit';

/**
 * Name of the credential that holds the Coolify base URL and the API token.
 */
export const COOLIFY_CREDENTIAL_TYPE = 'coolifyApi';

/**
 * Timeout of a single Coolify API request, in milliseconds.
 *
 * Client policy: internal constant, deliberately not configurable.
 */
export const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Execution contexts that can issue a Coolify API request. Node execution uses
 * `IExecuteFunctions`; in-editor pickers use `ILoadOptionsFunctions`. Both
 * expose the credential and request helpers this transport relies on.
 */
export type CoolifyApiContext = IExecuteFunctions | ILoadOptionsFunctions;

/**
 * Injection points for the tests. They keep the tests deterministic and fast
 * without exposing any user-facing option.
 *
 * @internal
 */
export interface CoolifyApiRuntime {
	/** Waits for the given number of milliseconds. */
	sleep?: (ms: number) => Promise<void>;
	/** Current time in milliseconds since the epoch. */
	now?: () => number;
	/** Source of randomness for the backoff jitter. */
	random?: () => number;
}

/**
 * Options of a single Coolify API request.
 */
export interface CoolifyApiRequestOptions {
	/** Query parameters. */
	qs?: IDataObject;
	/** JSON request body. */
	body?: IDataObject;
	/** Additional request headers. */
	headers?: IDataObject;
	/**
	 * Whether repeating the request is free of side effects.
	 *
	 * Defaults to {@link defaultRetrySafety} of the HTTP method, so every write
	 * is `unsafe` unless the caller states otherwise.
	 */
	retrySafety?: RetrySafety;
	/**
	 * Injection points for the tests.
	 *
	 * @internal
	 */
	runtime?: CoolifyApiRuntime;
}

/**
 * Wait before the next attempt.
 *
 * The wait is aborted when the execution is cancelled, so a workflow that is
 * stopped while the node waits for the rate-limit window does not keep the
 * executor busy.
 */
async function waitBeforeRetry(ctx: CoolifyApiContext, ms: number): Promise<void> {
	const signal = 'getExecutionCancelSignal' in ctx ? ctx.getExecutionCancelSignal() : undefined;

	if (signal) {
		await sleepWithAbort(ms, signal);
		return;
	}

	await sleep(ms);
}

/**
 * Build the absolute URL of a Coolify API path from the configured base URL.
 */
async function buildRequestUrl(ctx: CoolifyApiContext, path: string): Promise<string> {
	const credentials = await ctx.getCredentials(COOLIFY_CREDENTIAL_TYPE);
	const baseUrl = String(credentials.host ?? '')
		.trim()
		.replace(/\/+$/, '');

	if (!baseUrl) {
		throw new NodeApiError(
			ctx.getNode(),
			{ message: 'The Coolify API credential has no Base URL' },
			{
				message: 'The Coolify API credential is missing its Base URL',
				description:
					'Open the Coolify API credential and set the Base URL, for example https://app.coolify.io/api/v1, then reconnect the node.',
			},
		);
	}

	return `${baseUrl}/${path.replace(/^\/+/, '')}`;
}

/**
 * Build the n8n request options of a Coolify API call.
 *
 * `returnFullResponse` and `ignoreHttpStatusErrors` are both required: the
 * n8n runtime turns a failing status into an error that no longer exposes the
 * response headers, and the rate-limit headers are exactly what the retry
 * policy needs. Asking for the response instead keeps the status code, the
 * headers and the body available.
 */
function buildRequestOptions(
	method: IHttpRequestMethods,
	url: string,
	options: CoolifyApiRequestOptions,
): IHttpRequestOptions {
	const headers: IDataObject = { Accept: 'application/json' };
	if (options.body !== undefined) {
		headers['Content-Type'] = 'application/json';
	}
	Object.assign(headers, options.headers ?? {});

	const requestOptions: IHttpRequestOptions = {
		method,
		url,
		headers,
		json: true,
		timeout: REQUEST_TIMEOUT_MS,
		returnFullResponse: true,
		ignoreHttpStatusErrors: true,
	};

	if (options.qs && Object.keys(options.qs).length > 0) {
		requestOptions.qs = options.qs;
	}
	if (options.body !== undefined) {
		requestOptions.body = options.body;
	}

	return requestOptions;
}

/**
 * The wait a server asked for, exactly as it sent it, for the error message.
 */
function describeServerWait(failure: FailureInfo): string | undefined {
	const raw = getHeaderValue(failure.headers, 'retry-after');
	return raw === undefined ? undefined : raw.trim();
}

/**
 * A short title for a failed request.
 */
function failureTitle(failure: FailureInfo): string {
	if (failure.status === 429) {
		return 'Coolify API rate limit exceeded (HTTP 429)';
	}
	if (failure.status !== undefined) {
		return `Coolify API request failed (HTTP ${failure.status})`;
	}
	return `Coolify API request failed (${failure.networkCode ?? 'network error'})`;
}

/**
 * Attach the Coolify response body to an error, so the body stays visible in
 * the n8n error report.
 */
function attachBody(error: NodeApiError, failure: FailureInfo): NodeApiError {
	if (failure.body && typeof failure.body === 'object' && !Array.isArray(failure.body)) {
		error.context.data = failure.body;
	}
	return error;
}

/**
 * Build the error of a permanent failure.
 *
 * The result matches what the n8n runtime produces for a failed API call: the
 * generic status message as the error message, the Coolify message as the
 * description, the status code as `httpCode` and the response body as the
 * error context.
 */
function buildDefaultApiError(node: INode, failure: FailureInfo): NodeApiError {
	const errorResponse: JsonObject = {};
	if (failure.status !== undefined) {
		errorResponse.httpCode = String(failure.status);
	}
	if (failure.bodyMessage !== undefined) {
		errorResponse.message = failure.bodyMessage;
	}

	return attachBody(new NodeApiError(node, errorResponse), failure);
}

/**
 * Build an error that explains what the node did with a failed request.
 *
 * The Coolify response body, the HTTP status code and the original response
 * message are preserved: the body is attached as the error context data and
 * the body message is kept in the error's message list.
 */
function buildCoolifyApiError(
	node: INode,
	failure: FailureInfo,
	message: string,
	description: string,
): NodeApiError {
	const errorResponse: JsonObject = {};
	if (failure.status !== undefined) {
		errorResponse.httpCode = String(failure.status);
	}
	if (failure.bodyMessage !== undefined) {
		errorResponse.message = failure.bodyMessage;
	}

	const error = new NodeApiError(node, errorResponse, { message, description });
	return attachBody(error, failure);
}

/**
 * The error surfaced when the request may be retried but is not safe to repeat.
 */
function buildNotRetriedError(node: INode, failure: FailureInfo): NodeApiError {
	const details: string[] = [];

	if (failure.status === 429) {
		details.push(
			'Coolify or an upstream provider throttled the request (HTTP 429). The request was not retried automatically, because repeating a request that is not marked as safe to repeat could cause duplicate side effects.',
		);
	} else if (failure.status !== undefined) {
		details.push(
			`The request failed with a transient error (HTTP ${failure.status}). The request was not retried automatically, because repeating a request that is not marked as safe to repeat could cause duplicate side effects.`,
		);
	} else {
		details.push(
			`The request failed before the server answered${failure.networkCode ? ` (${failure.networkCode})` : ''}. The request was not retried automatically, because repeating a request that is not marked as safe to repeat could cause duplicate side effects.`,
		);
	}

	const wait = describeServerWait(failure);
	if (wait !== undefined) {
		details.push(`Coolify asked to wait ${wait} s before the next request.`);
	}

	return buildCoolifyApiError(node, failure, failureTitle(failure), details.join(' '));
}

/**
 * The error surfaced when every retry attempt failed.
 */
function buildExhaustedError(node: INode, failure: FailureInfo, attempts: number): NodeApiError {
	const wait = describeServerWait(failure);

	const details = [
		`The request was retried ${attempts} time${attempts === 1 ? '' : 's'} without success (${attempts + 1} attempts in total).`,
	];
	if (wait !== undefined) {
		details.push(`The last response asked to wait ${wait} s before the next request.`);
	}
	if (failure.status === 429) {
		details.push(
			'Consider raising the API rate limit of the instance (API_RATE_LIMIT) or reducing the number of requests this workflow makes.',
		);
	}

	return buildCoolifyApiError(node, failure, failureTitle(failure), details.join(' '));
}

/**
 * The error surfaced when the server asks for a wait that exceeds the budget.
 */
function buildBudgetExceededError(
	node: INode,
	failure: FailureInfo,
	delay: RetryDelay,
): NodeApiError {
	const requestedSeconds = Math.round(delay.delayMs / 1000);
	const budgetSeconds = Math.round(MAX_RETRY_AFTER_MS / 1000);

	return buildCoolifyApiError(
		node,
		failure,
		failureTitle(failure),
		`Coolify asked to wait ${requestedSeconds} s before the next request, which is longer than the maximum wait of ${budgetSeconds} s this node performs for a single retry. The request was not retried, so it was not repeated before the requested wait elapsed. Retry the workflow manually after the wait.`,
	);
}

/**
 * Read the response headers of a full n8n response.
 */
function responseHeaders(response: IN8nHttpFullResponse): HeaderMap | undefined {
	const headers = response.headers as HeaderMap | undefined;
	return headers && Object.keys(headers).length > 0 ? headers : undefined;
}

/**
 * Make an authenticated request against the Coolify API.
 *
 * The request is sent through the n8n runtime with the `coolifyApi`
 * credential, so the bearer token never passes through this module.
 *
 * Retries follow the policy in `./rateLimit`:
 *
 * - Only requests that are safe to repeat are retried. Reads are safe by
 *   default, writes are not: a `429` alone is no proof that a write can be
 *   repeated, because Coolify also answers `429` when a deployment queue or an
 *   upstream provider is busy. A write has to be marked as safe explicitly by
 *   the caller when the endpoint guarantees that a repeat is harmless.
 * - The wait before the next attempt comes from `Retry-After`, falls back to
 *   `X-RateLimit-Reset` and finally to an exponential backoff with jitter.
 * - A server-mandated wait that is longer than the internal maximum wait
 *   budget fails the request instead of retrying early.
 * - Permanent failures (for example `401`, `403`, `404` or `409`) are surfaced
 *   with the same shape the n8n runtime produces, without a retry.
 *
 * @param ctx Execution context of the node.
 * @param method HTTP method of the request.
 * @param path Path of the endpoint, relative to the configured base URL.
 * @param options Query parameters, body, headers and the retry safety.
 * @returns The parsed response body of the Coolify API.
 */
export async function coolifyApiRequest(
	ctx: CoolifyApiContext,
	method: IHttpRequestMethods,
	path: string,
	options: CoolifyApiRequestOptions = {},
): Promise<unknown> {
	const url = await buildRequestUrl(ctx, path);
	const requestOptions = buildRequestOptions(method, url, options);
	const retrySafety = options.retrySafety ?? defaultRetrySafety(method);
	const runtime = options.runtime ?? {};
	const sleepBeforeRetry = runtime.sleep ?? ((ms: number) => waitBeforeRetry(ctx, ms));
	const now = runtime.now ?? (() => Date.now());
	const random = runtime.random ?? Math.random;

	let attempt = 0;

	for (;;) {
		let failure: FailureInfo;

		try {
			const response = (await ctx.helpers.httpRequestWithAuthentication.call(
				ctx,
				COOLIFY_CREDENTIAL_TYPE,
				requestOptions,
			)) as IN8nHttpFullResponse;

			if (typeof response?.statusCode !== 'number') {
				// The runtime does not deliver the full response, so the value is
				// the response body and the status code is not available.
				return response;
			}

			if (response.statusCode >= 200 && response.statusCode < 300) {
				return response.body;
			}

			failure = classifyResponse(response.statusCode, responseHeaders(response), response.body);
		} catch (error) {
			// The request never produced an HTTP response: a transport or name
			// resolution failure, or a problem with the credential itself.
			failure = classifyFailure(error);
			if (!failure.retryable) {
				// Not a transient failure (for example a missing credential):
				// surface it as a node error, unchanged when the runtime already
				// produced one.
				throw error instanceof NodeApiError
					? error
					: new NodeApiError(ctx.getNode(), error as JsonObject);
			}
		}

		if (!failure.retryable) {
			// Permanent failure: surface it with the same shape the n8n runtime
			// produces, so the Coolify message, the status code and the response
			// body stay exactly as the API reported them.
			throw buildDefaultApiError(ctx.getNode(), failure);
		}

		if (retrySafety === 'unsafe') {
			throw buildNotRetriedError(ctx.getNode(), failure);
		}

		if (attempt >= MAX_RETRIES) {
			throw buildExhaustedError(ctx.getNode(), failure, attempt);
		}

		const delay = computeRetryDelay({
			attempt,
			headers: failure.headers,
			nowMs: now(),
			random,
		});

		if (delay.exceedsBudget) {
			throw buildBudgetExceededError(ctx.getNode(), failure, delay);
		}

		await sleepBeforeRetry(delay.delayMs);
		attempt += 1;
	}
}
