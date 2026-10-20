/**
 * Coolify API rate-limit policy.
 *
 * This module owns *all* decisions about whether a failed Coolify API call may
 * be repeated and how long to wait before repeating it. It is deliberately free
 * of n8n runtime types so that the policy can be unit tested without an n8n
 * execution context.
 *
 * Documented behavior this policy relies on
 * (https://coolify.io/docs/api/rate-limits, https://coolify.io/docs/api/errors):
 *
 * - The general API limit is 200 requests per minute by default. Self-hosted
 *   instances can raise or lower it through the `API_RATE_LIMIT` environment
 *   variable, so the limit is *never* hardcoded here. The server's response
 *   headers are the only source of truth.
 * - A rate-limited response carries `Retry-After` (seconds to wait) and
 *   `X-RateLimit-Reset` (unix timestamp in seconds at which another request may
 *   be attempted). `X-RateLimit-Limit` and `X-RateLimit-Remaining` describe the
 *   current window.
 * - Some endpoints answer `429` because a deployment queue or an upstream cloud
 *   provider is busy. A `429` is therefore *not* necessarily the general
 *   request bucket, and the client must read the headers instead of counting
 *   requests itself.
 * - The documentation asks for exponential backoff with random jitter when
 *   repeated attempts keep failing, and explicitly forbids parallel retries for
 *   the same failed request.
 *
 * Client policy (not documented by Coolify) lives here as well, and is marked
 * as such in the individual constants below.
 */

/**
 * Maximum number of retries *after* the initial attempt, so a single logical
 * request is dispatched at most `MAX_RETRIES + 1` times.
 *
 * Client policy: matches the retry budget used by the n8n Discord and
 * Microsoft Dataverse nodes.
 */
export const MAX_RETRIES = 3;

/**
 * Base delay of the exponential backoff fallback, in milliseconds.
 *
 * Client policy: matches the n8n Microsoft Dataverse node.
 */
export const BASE_BACKOFF_MS = 500;

/**
 * Upper bound for a single computed backoff delay, in milliseconds.
 *
 * Client policy: matches the n8n Microsoft Dataverse node.
 */
export const MAX_BACKOFF_MS = 30_000;

/**
 * Upper bound for the random jitter added to a computed backoff delay, in
 * milliseconds.
 *
 * Client policy: matches the n8n Microsoft Dataverse node.
 */
export const JITTER_MS = 500;

/**
 * Maximum wait this node is willing to perform for a single retry, in
 * milliseconds.
 *
 * A server that asks for a longer wait is not retried: the workflow fails with
 * an explanation instead of blocking the execution for minutes. The value is
 * one full general rate-limit window (the documented default window is one
 * minute), so a server asking for "wait for the next window" is honoured
 * exactly.
 *
 * Client policy: internal constant, deliberately not configurable.
 */
export const MAX_RETRY_AFTER_MS = 60_000;

/**
 * Whether repeating a request is free of side effects.
 *
 * - `safe`: the request may be repeated automatically. True for reads, and for
 *   writes whose endpoint behavior makes a repeat harmless (for example
 *   stopping an application that is already stopped).
 * - `unsafe`: the request is never repeated automatically. A repeat could
 *   create a duplicate resource, queue a second deployment, or repeat a
 *   destructive operation.
 *
 * Note that a `429` alone is *not* treated as proof that a write can be
 * repeated: Coolify documents that `429` responses may also come from a
 * deployment queue or an upstream provider, so the safety of the endpoint has
 * to be declared by the caller.
 */
export type RetrySafety = 'safe' | 'unsafe';

/**
 * HTTP methods whose repetition cannot change server state.
 */
const SAFE_METHODS: ReadonlySet<string> = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * HTTP statuses that are treated as transient and therefore retryable for a
 * request that is safe to repeat.
 *
 * - `408` the server timed out waiting for the request
 * - `429` Coolify or an upstream provider throttled the request
 * - `500`, `502`, `503`, `504` transient server, gateway or service failures
 *
 * `501` (documented by the Coolify OpenAPI specification for some operations)
 * means "not implemented" and is therefore permanent.
 */
const TRANSIENT_STATUS_CODES: ReadonlySet<number> = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Error codes that indicate a transport or name-resolution failure, i.e. the
 * request never produced an HTTP response.
 *
 * Mirrors the failure codes the n8n core HTTP layer treats as transient.
 */
const TRANSPORT_FAILURE_CODES: ReadonlySet<string> = new Set([
	'ECONNRESET',
	'ETIMEDOUT',
	'ECONNABORTED',
	'ECONNREFUSED',
	'EPIPE',
	'EAI_AGAIN',
	'ENOTFOUND',
	'ENETUNREACH',
	'ENETDOWN',
	'EHOSTUNREACH',
	'EHOSTDOWN',
	'ERR_SOCKET_CONNECTION_TIMEOUT',
	'UND_ERR_BODY_TIMEOUT',
	'UND_ERR_CONNECT_TIMEOUT',
	'UND_ERR_HEADERS_TIMEOUT',
	'UND_ERR_SOCKET',
]);

/**
 * The default retry safety of a request, derived from its HTTP method.
 *
 * Reads are safe to repeat. Every write defaults to `unsafe` and has to be
 * opted in explicitly by the caller.
 */
export function defaultRetrySafety(method: string): RetrySafety {
	return SAFE_METHODS.has(method.toUpperCase()) ? 'safe' : 'unsafe';
}

/**
 * A response header map as delivered by the n8n HTTP layer.
 */
export type HeaderMap = Record<string, string | string[] | undefined>;

/**
 * What is known about a failed request.
 */
export interface FailureInfo {
	/** HTTP status code, when the request produced a response. */
	status?: number;
	/** Response headers, when the request produced a response. */
	headers?: HeaderMap;
	/** Parsed response body, when the request produced one. */
	body?: unknown;
	/** The `message` field of a JSON response body, when present. */
	bodyMessage?: string;
	/** Transport error code, when the request failed before a response. */
	networkCode?: string;
	/** Whether the failure is a transient HTTP failure. */
	transient: boolean;
	/** Whether the failure happened at the transport level. */
	network: boolean;
	/** Whether the failure may be retried for a request that is safe to repeat. */
	retryable: boolean;
}

interface ErrorLike {
	statusCode?: unknown;
	httpCode?: unknown;
	code?: unknown;
	message?: unknown;
	response?: {
		status?: unknown;
		statusCode?: unknown;
		headers?: unknown;
		data?: unknown;
	};
	headers?: unknown;
	cause?: unknown;
}

/**
 * Read a header from a response header map, ignoring the case of the header
 * name and tolerating both plain objects and `Headers`-style accessors.
 */
export function getHeaderValue(headers: unknown, name: string): string | undefined {
	if (!headers || typeof headers !== 'object') {
		return undefined;
	}

	const target = name.toLowerCase();
	const getter = (headers as { get?: unknown }).get;
	if (typeof getter === 'function') {
		const value = (getter as (key: string) => unknown).call(headers, target);
		if (typeof value === 'string') {
			return value;
		}
	}

	for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
		if (key.toLowerCase() !== target) {
			continue;
		}
		const first = Array.isArray(value) ? value[0] : value;
		if (typeof first === 'string') {
			return first;
		}
		if (typeof first === 'number') {
			return String(first);
		}
	}

	return undefined;
}

/**
 * The delay requested by a `Retry-After` header, in milliseconds.
 *
 * The Coolify documentation and OpenAPI specification define `Retry-After` as
 * a number of seconds. The HTTP-date form is accepted as well because it is
 * part of the HTTP specification, but it is never expected from Coolify.
 *
 * Returns `undefined` when the header is missing or malformed, so the caller
 * can fall back to `X-RateLimit-Reset` and then to the computed backoff.
 */
export function parseRetryAfterMs(headers: unknown, nowMs: number): number | undefined {
	const raw = getHeaderValue(headers, 'retry-after');
	if (raw === undefined) {
		return undefined;
	}

	const trimmed = raw.trim();
	if (trimmed === '') {
		return undefined;
	}

	// Delay-seconds form, the form Coolify documents.
	if (/^\d+$/.test(trimmed)) {
		const seconds = Number(trimmed);
		const ms = seconds * 1000;
		return Number.isSafeInteger(ms) ? ms : undefined;
	}

	// HTTP-date form. Dates contain letters, which also keeps `Date.parse` from
	// reading numeric garbage as a date.
	if (!/[a-z]/i.test(trimmed)) {
		return undefined;
	}
	const dateMs = Date.parse(trimmed);
	if (Number.isNaN(dateMs)) {
		return undefined;
	}
	return Math.max(0, dateMs - nowMs);
}

/**
 * The delay implied by an `X-RateLimit-Reset` header, in milliseconds.
 *
 * The Coolify documentation defines `X-RateLimit-Reset` as a unix timestamp in
 * seconds at which another request may be attempted — an absolute point in
 * time, not a number of seconds to wait. A timestamp in the past means the
 * window has already rolled over, so the delay is zero.
 *
 * Returns `undefined` when the header is missing or malformed.
 */
export function parseRateLimitResetMs(headers: unknown, nowMs: number): number | undefined {
	const raw = getHeaderValue(headers, 'x-ratelimit-reset');
	if (raw === undefined) {
		return undefined;
	}

	const trimmed = raw.trim();
	if (!/^\d+$/.test(trimmed)) {
		return undefined;
	}

	const resetMs = Number(trimmed) * 1000;
	if (!Number.isSafeInteger(resetMs)) {
		return undefined;
	}
	return Math.max(0, resetMs - nowMs);
}

/**
 * Where the delay before the next attempt comes from.
 */
export type RetryDelaySource = 'retry-after' | 'rate-limit-reset' | 'backoff';

/**
 * A computed delay before the next attempt.
 */
export interface RetryDelay {
	/** Delay to wait, in milliseconds. */
	delayMs: number;
	/** Which source the delay was derived from. */
	source: RetryDelaySource;
	/** Whether the requested delay exceeds {@link MAX_RETRY_AFTER_MS}. */
	exceedsBudget: boolean;
}

/**
 * Compute how long to wait before the next attempt.
 *
 * The order is deliberate:
 *
 * 1. `Retry-After` wins, because it is the delay the server explicitly asked
 *    for. It is honoured verbatim, without jitter and without shortening it.
 * 2. `X-RateLimit-Reset` is the fallback for a response that does not carry a
 *    usable `Retry-After`.
 * 3. The computed exponential backoff with random jitter is the last resort,
 *    and is the only path that adds jitter — the documentation asks for jitter
 *    when repeated attempts keep failing, not for a server-mandated wait.
 *
 * A server-requested delay that exceeds {@link MAX_RETRY_AFTER_MS} is reported
 * as `exceedsBudget` so the caller can fail instead of retrying early.
 */
export function computeRetryDelay(params: {
	/** Zero-based number of the attempt that just failed. */
	attempt: number;
	/** Headers of the failed response. */
	headers?: unknown;
	/** Current time, in milliseconds since the epoch. */
	nowMs: number;
	/** Source of randomness for the jitter. */
	random: () => number;
}): RetryDelay {
	const retryAfterMs = parseRetryAfterMs(params.headers, params.nowMs);
	if (retryAfterMs !== undefined) {
		return {
			delayMs: retryAfterMs,
			source: 'retry-after',
			exceedsBudget: retryAfterMs > MAX_RETRY_AFTER_MS,
		};
	}

	const resetMs = parseRateLimitResetMs(params.headers, params.nowMs);
	if (resetMs !== undefined) {
		return {
			delayMs: resetMs,
			source: 'rate-limit-reset',
			exceedsBudget: resetMs > MAX_RETRY_AFTER_MS,
		};
	}

	const exponential = BASE_BACKOFF_MS * 2 ** params.attempt;
	const jitter = Math.floor(params.random() * JITTER_MS);
	return {
		delayMs: Math.min(MAX_BACKOFF_MS, exponential + jitter),
		source: 'backoff',
		exceedsBudget: false,
	};
}

/**
 * Collect the error chain of a failed request, outermost error first.
 *
 * The n8n HTTP layer wraps an upstream failure in a `NodeApiError` and keeps
 * the original error as its `cause`, so the response headers and body live one
 * or two levels down the chain.
 */
function errorChain(error: unknown, maxDepth = 5): ErrorLike[] {
	const chain: ErrorLike[] = [];
	let current: unknown = error;

	for (let depth = 0; depth < maxDepth && current && typeof current === 'object'; depth++) {
		chain.push(current as ErrorLike);
		current = (current as ErrorLike).cause;
	}

	return chain;
}

/**
 * Read the HTTP status code from an error chain.
 */
function findStatus(chain: ErrorLike[]): number | undefined {
	let fallback: number | undefined;

	for (const level of chain) {
		const httpCode = toHttpStatus(level.httpCode);
		if (httpCode !== undefined) {
			return httpCode;
		}

		const response = level.response;
		fallback ??=
			toHttpStatus(response?.status) ??
			toHttpStatus(response?.statusCode) ??
			toHttpStatus(level.statusCode);
	}

	return fallback;
}

/**
 * Coerce a value to a valid HTTP status code, or `undefined`.
 */
function toHttpStatus(value: unknown): number | undefined {
	const status =
		typeof value === 'number'
			? value
			: typeof value === 'string' && /^\d+$/.test(value.trim())
				? Number(value.trim())
				: undefined;

	if (status === undefined || !Number.isInteger(status) || status < 100 || status > 599) {
		return undefined;
	}
	return status;
}

/**
 * Read the response headers from an error chain.
 */
function findHeaders(chain: ErrorLike[]): HeaderMap | undefined {
	for (const level of chain) {
		const headers = level.response?.headers ?? level.headers;
		if (headers && typeof headers === 'object') {
			return headers as HeaderMap;
		}
	}
	return undefined;
}

/**
 * Read the response body from an error chain.
 */
function findBody(chain: ErrorLike[]): unknown {
	for (const level of chain) {
		const data = level.response?.data;
		if (data !== undefined && data !== null && data !== '') {
			return data;
		}
	}
	return undefined;
}

/**
 * Read the `message` field of a JSON response body.
 */
function findBodyMessage(body: unknown): string | undefined {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return undefined;
	}
	const message = (body as Record<string, unknown>).message;
	return typeof message === 'string' ? message : undefined;
}

/**
 * Read the transport error code from an error chain.
 */
function findNetworkCode(chain: ErrorLike[]): string | undefined {
	for (const level of chain) {
		const code = level.code;
		if (typeof code === 'string' && code) {
			return code.toUpperCase();
		}
	}
	for (const level of chain) {
		const message = level.message;
		if (typeof message === 'string' && /socket hang up/i.test(message)) {
			return 'ECONNRESET';
		}
	}
	return undefined;
}

/**
 * Describe a failed request.
 *
 * The classification is deliberately transport agnostic: it inspects the error
 * chain for a status code, response headers and response body, so it works
 * with every HTTP client the n8n runtime may use.
 */
export function classifyFailure(error: unknown): FailureInfo {
	const chain = errorChain(error);
	const status = findStatus(chain);
	const headers = findHeaders(chain);
	const body = findBody(chain);
	const networkCode = findNetworkCode(chain);

	const transient = status !== undefined && TRANSIENT_STATUS_CODES.has(status);
	const network = networkCode !== undefined && TRANSPORT_FAILURE_CODES.has(networkCode);

	return {
		...(status !== undefined ? { status } : {}),
		...(headers !== undefined ? { headers } : {}),
		...(body !== undefined ? { body } : {}),
		...(findBodyMessage(body) !== undefined ? { bodyMessage: findBodyMessage(body) } : {}),
		...(networkCode !== undefined ? { networkCode } : {}),
		transient,
		network,
		retryable: transient || network,
	};
}

/**
 * Describe a response that carries a failing HTTP status.
 *
 * The n8n runtime hands a failed request to the node as an error that no
 * longer exposes the response headers, so the transport asks the HTTP client
 * for the response itself (`ignoreHttpStatusErrors` plus `returnFullResponse`)
 * and classifies it here, where the rate-limit headers are still readable.
 */
export function classifyResponse(status: number, headers?: HeaderMap, body?: unknown): FailureInfo {
	const transient = TRANSIENT_STATUS_CODES.has(status);
	const bodyMessage = findBodyMessage(body);

	return {
		status,
		...(headers !== undefined ? { headers } : {}),
		...(body !== undefined ? { body } : {}),
		...(bodyMessage !== undefined ? { bodyMessage } : {}),
		transient,
		network: false,
		retryable: transient,
	};
}
