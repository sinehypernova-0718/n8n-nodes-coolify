import { describe, expect, it } from 'vitest';
import {
	NodeApiError,
	type IHttpRequestOptions,
	type IN8nHttpFullResponse,
	type INode,
	type JsonObject,
} from 'n8n-workflow';

import {
	COOLIFY_CREDENTIAL_TYPE,
	coolifyApiRequest,
	type CoolifyApiContext,
} from '../nodes/Coolify/shared/apiRequest';

const NOW = 1_700_000_000_000;

const node = {
	name: 'Coolify',
	type: 'coolify',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
} as unknown as INode;

/**
 * A response of the Coolify API, as the n8n runtime delivers it when the
 * request asks for the full response and does not reject failing statuses.
 */
interface HttpOutcome {
	status: number;
	headers?: Record<string, string>;
	body?: unknown;
}

/**
 * An outcome that never produced a response, e.g. a transport failure.
 */
interface ThrowingOutcome {
	throws: unknown;
}

/**
 * An outcome of a runtime that does not deliver the full response.
 */
interface RawOutcome {
	raw: unknown;
}

type Outcome = HttpOutcome | ThrowingOutcome | RawOutcome;

interface RecordedCall {
	credentialType: string;
	options: IHttpRequestOptions;
}

function isThrowing(outcome: Outcome): outcome is ThrowingOutcome {
	return 'throws' in outcome;
}

function isRaw(outcome: Outcome): outcome is RawOutcome {
	return 'raw' in outcome;
}

/**
 * A transport failure, as the n8n runtime reports it.
 *
 * `httpRequestWithAuthentication` catches the failure of the HTTP client and
 * throws `new NodeApiError(node, error)`. That wrapper overwrites the `cause`
 * of the original error, stores the transport error code in `httpCode`,
 * replaces the message with a generic description and keeps the original text
 * in the error messages. This helper reproduces that structure exactly, so the
 * tests exercise the same error shape as a real execution.
 */
function n8nTransportFailure(code: string, originalMessage: string): NodeApiError {
	const upstream = Object.assign(new Error(originalMessage), {
		code,
		isAxiosError: true,
	});
	return new NodeApiError(node, upstream as unknown as JsonObject);
}

function createContext(outcomes: Outcome[], options: { cancelSignal?: AbortSignal } = {}) {
	const calls: RecordedCall[] = [];
	const events: string[] = [];

	const ctx = {
		getCredentials: async () => ({ host: 'https://coolify.example.com/api/v1' }),
		getNode: () => node,
		getExecutionCancelSignal: () => options.cancelSignal,
		helpers: {
			httpRequestWithAuthentication: async (
				credentialType: string,
				options: IHttpRequestOptions,
			): Promise<IN8nHttpFullResponse> => {
				calls.push({ credentialType, options });
				events.push('start');
				const outcome = outcomes[Math.min(calls.length - 1, outcomes.length - 1)];
				if (isThrowing(outcome)) {
					events.push('end');
					throw outcome.throws;
				}
				if (isRaw(outcome)) {
					events.push('end');
					return outcome.raw as IN8nHttpFullResponse;
				}
				events.push('end');
				return {
					body: outcome.body,
					headers: outcome.headers ?? {},
					statusCode: outcome.status,
					statusMessage: 'OK',
				};
			},
		},
	};

	return { ctx: ctx as unknown as CoolifyApiContext, calls, events };
}

/**
 * A runtime that records the requested waits instead of performing them.
 */
function createRuntime() {
	const sleeps: number[] = [];
	return {
		sleeps,
		runtime: {
			sleep: async (ms: number) => {
				sleeps.push(ms);
			},
			now: () => NOW,
			random: () => 0.5,
		},
	};
}

async function catchError(promise: Promise<unknown>): Promise<NodeApiError> {
	const error = await promise.then(
		() => undefined,
		(caught: unknown) => caught,
	);
	expect(error).toBeInstanceOf(NodeApiError);
	return error as NodeApiError;
}

describe('coolifyApiRequest', () => {
	it('returns the response body unchanged', async () => {
		const { ctx, calls } = createContext([{ status: 200, body: { id: 1, name: 'team' } }]);

		const result = await coolifyApiRequest(ctx, 'GET', '/team');

		expect(result).toEqual({ id: 1, name: 'team' });
		expect(calls).toHaveLength(1);
		expect(calls[0].credentialType).toBe(COOLIFY_CREDENTIAL_TYPE);
		expect(calls[0].options.url).toBe('https://coolify.example.com/api/v1/team');
		expect(calls[0].options.method).toBe('GET');
	});

	it('asks the runtime for the full response so the rate-limit headers stay readable', async () => {
		const { ctx, calls } = createContext([{ status: 200, body: {} }]);

		await coolifyApiRequest(ctx, 'GET', '/team');

		expect(calls[0].options.returnFullResponse).toBe(true);
		expect(calls[0].options.ignoreHttpStatusErrors).toBe(true);
	});

	it('waits exactly as long as the server asked for', async () => {
		const { ctx, calls } = createContext([
			{ status: 429, headers: { 'retry-after': '30' } },
			{ status: 200, body: { ok: true } },
		]);
		const { sleeps, runtime } = createRuntime();

		const result = await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(result).toEqual({ ok: true });
		expect(calls).toHaveLength(2);
		expect(sleeps).toEqual([30_000]);
	});

	it('falls back to X-RateLimit-Reset when Retry-After is missing', async () => {
		const { ctx, calls } = createContext([
			{ status: 429, headers: { 'x-ratelimit-reset': String(Math.floor(NOW / 1000) + 45) } },
			{ status: 200, body: { ok: true } },
		]);
		const { sleeps, runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
		expect(sleeps).toEqual([45_000]);
	});

	it('falls back to a backoff with jitter when the server sends no hint', async () => {
		const { ctx, calls } = createContext([{ status: 429 }, { status: 200, body: { ok: true } }]);
		const { sleeps, runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
		expect(sleeps).toHaveLength(1);
		expect(sleeps[0]).toBeGreaterThanOrEqual(500);
		expect(sleeps[0]).toBeLessThan(1000);
	});

	it('fails without retrying when the requested wait exceeds the budget', async () => {
		const { ctx, calls } = createContext([{ status: 429, headers: { 'retry-after': '3600' } }]);
		const { sleeps, runtime } = createRuntime();

		const error = await catchError(coolifyApiRequest(ctx, 'GET', '/applications', { runtime }));

		expect(error.description).toMatch(/maximum wait of 60 s/);
		expect(calls).toHaveLength(1);
		expect(sleeps).toEqual([]);
	});

	it('gives up after the retry budget and reports the attempts', async () => {
		const { ctx, calls } = createContext([{ status: 429, headers: { 'retry-after': '0' } }]);
		const { runtime } = createRuntime();

		const error = await catchError(coolifyApiRequest(ctx, 'GET', '/applications', { runtime }));

		expect(error.description).toMatch(/retried 3 times/);
		expect(calls).toHaveLength(4);
	});

	it('retries a read on a transient server error', async () => {
		const { ctx, calls } = createContext([{ status: 503 }, { status: 200, body: { ok: true } }]);
		const { runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
	});

	it('retries a read on a transport failure', async () => {
		const { ctx, calls } = createContext([
			{ throws: Object.assign(new Error('socket failure'), { code: 'ECONNRESET' }) },
			{ status: 200, body: { ok: true } },
		]);
		const { runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
	});

	it('retries a read when the runtime reports a reset connection', async () => {
		const { ctx, calls } = createContext([
			{ throws: n8nTransportFailure('ECONNRESET', 'socket hang up') },
			{ status: 200, body: { ok: true } },
		]);
		const { runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
	});

	it('retries a read when the runtime reports a timeout', async () => {
		const { ctx, calls } = createContext([
			{ throws: n8nTransportFailure('ECONNABORTED', 'timeout of 30000ms exceeded') },
			{ status: 200, body: { ok: true } },
		]);
		const { runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
	});

	it('retries a read when the runtime reports an unreachable host', async () => {
		const { ctx, calls } = createContext([
			{
				throws: n8nTransportFailure('ENOTFOUND', 'getaddrinfo ENOTFOUND coolify.example.com'),
			},
			{ status: 200, body: { ok: true } },
		]);
		const { runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
	});

	it('reports the transport error code when a mutation fails on the network', async () => {
		const { ctx, calls } = createContext([
			{ throws: n8nTransportFailure('ECONNRESET', 'socket hang up') },
		]);
		const { runtime } = createRuntime();

		const error = await catchError(
			coolifyApiRequest(ctx, 'POST', '/deployments', { body: { uuid: 'abc' }, runtime }),
		);

		expect(calls).toHaveLength(1);
		expect(error.description).toMatch(/not retried automatically/);
		expect(error.description).toContain('ECONNRESET');
		// The n8n runtime replaces the message with its own description of the
		// error code and keeps the original message in the error messages.
		expect(error.message).toContain('connection to the server was closed unexpectedly');
		expect(error.messages).toContain('Coolify API request failed (ECONNRESET)');
	});

	it('retries a read when the runtime rejects a failing status itself', async () => {
		// A runtime without `ignoreHttpStatusErrors` support rejects the request
		// and wraps the status in a `NodeApiError`.
		const { ctx, calls } = createContext([
			{
				throws: new NodeApiError(node, {
					message: 'Rate limit exceeded.',
					httpCode: '429',
					response: { data: { message: 'Rate limit exceeded.' } },
				}),
			},
			{ status: 200, body: { ok: true } },
		]);
		const { runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(calls).toHaveLength(2);
	});

	it('keeps the Coolify body of a status the runtime rejected itself', async () => {
		const { ctx, calls } = createContext([
			{
				throws: new NodeApiError(node, {
					message: 'Domain already exists.',
					httpCode: '409',
					response: { data: { message: 'Domain already exists.' } },
				}),
			},
		]);
		const { runtime } = createRuntime();

		const error = await catchError(coolifyApiRequest(ctx, 'GET', '/applications', { runtime }));

		expect(calls).toHaveLength(1);
		expect(error.httpCode).toBe('409');
		expect(error.context.data).toEqual({ message: 'Domain already exists.' });
	});

	it('never retries a permanent failure and reports it like the n8n runtime', async () => {
		const { ctx, calls } = createContext([{ status: 404, body: { message: 'Not found.' } }]);
		const { runtime } = createRuntime();

		const error = await catchError(coolifyApiRequest(ctx, 'GET', '/applications/abc', { runtime }));

		expect(calls).toHaveLength(1);
		expect(error.httpCode).toBe('404');
		expect(error.description).toBe('Not found.');
		expect(error.context.data).toEqual({ message: 'Not found.' });
	});

	it('never retries a conflict', async () => {
		const { ctx, calls } = createContext([
			{ status: 409, body: { message: 'Domain already exists.' } },
		]);
		const { runtime } = createRuntime();

		const error = await catchError(coolifyApiRequest(ctx, 'GET', '/applications', { runtime }));

		expect(calls).toHaveLength(1);
		expect(error.httpCode).toBe('409');
	});

	it('rethrows a credential problem unchanged', async () => {
		const original = new NodeApiError(node, { message: 'credential problem' });
		const { ctx, calls } = createContext([{ throws: original }]);
		const { runtime } = createRuntime();

		await expect(coolifyApiRequest(ctx, 'GET', '/applications', { runtime })).rejects.toBe(
			original,
		);

		expect(calls).toHaveLength(1);
	});

	it('does not retry a mutation that is answered with 429', async () => {
		const { ctx, calls } = createContext([{ status: 429, headers: { 'retry-after': '30' } }]);
		const { sleeps, runtime } = createRuntime();

		const error = await catchError(
			coolifyApiRequest(ctx, 'POST', '/deployments', { body: { uuid: 'abc' }, runtime }),
		);

		expect(error.description).toMatch(/not retried automatically/);
		expect(error.description).toMatch(/30 s/);
		expect(calls).toHaveLength(1);
		expect(sleeps).toEqual([]);
	});

	it('does not retry a mutation that fails with a transient server error', async () => {
		const { ctx, calls } = createContext([{ status: 503 }]);
		const { runtime } = createRuntime();

		const error = await catchError(
			coolifyApiRequest(ctx, 'POST', '/deployments', { body: { uuid: 'abc' }, runtime }),
		);

		expect(error.description).toMatch(/not retried automatically/);
		expect(calls).toHaveLength(1);
	});

	it('does not retry a mutation that fails with a transport failure', async () => {
		const { ctx, calls } = createContext([
			{ throws: Object.assign(new Error('socket failure'), { code: 'ECONNRESET' }) },
		]);
		const { runtime } = createRuntime();

		const error = await catchError(
			coolifyApiRequest(ctx, 'DELETE', '/applications/abc', { runtime }),
		);

		expect(error.description).toMatch(/not retried automatically/);
		expect(calls).toHaveLength(1);
	});

	it('retries a mutation that the caller marks as safe to repeat', async () => {
		const { ctx, calls } = createContext([
			{ status: 429, headers: { 'retry-after': '5' } },
			{ status: 200, body: { queued: true } },
		]);
		const { sleeps, runtime } = createRuntime();

		const result = await coolifyApiRequest(ctx, 'POST', '/applications/abc/stop', {
			retrySafety: 'safe',
			runtime,
		});

		expect(result).toEqual({ queued: true });
		expect(calls).toHaveLength(2);
		expect(sleeps).toEqual([5000]);
	});

	it('keeps the Coolify status code and response body on the surfaced error', async () => {
		const { ctx } = createContext([
			{
				status: 429,
				headers: { 'retry-after': '30' },
				body: { message: 'Rate limit exceeded.' },
			},
		]);
		const { runtime } = createRuntime();

		const error = await catchError(coolifyApiRequest(ctx, 'POST', '/deployments', { runtime }));

		expect(error.httpCode).toBe('429');
		expect(error.context.data).toEqual({ message: 'Rate limit exceeded.' });
		expect(error.messages).toContain('Rate limit exceeded.');
		expect(error.description).toContain('not retried automatically');
	});

	it('never runs retries in parallel', async () => {
		const { ctx, events } = createContext([
			{ status: 429, headers: { 'retry-after': '0' } },
			{ status: 429, headers: { 'retry-after': '0' } },
			{ status: 200, body: { ok: true } },
		]);
		const { runtime } = createRuntime();

		await coolifyApiRequest(ctx, 'GET', '/applications', { runtime });

		expect(events).toEqual(['start', 'end', 'start', 'end', 'start', 'end']);
	});

	it('stops waiting for the next attempt when the execution is cancelled', async () => {
		const controller = new AbortController();
		controller.abort();
		const { ctx, calls } = createContext([{ status: 429, headers: { 'retry-after': '30' } }], {
			cancelSignal: controller.signal,
		});

		// No runtime seam here, so the real wait is used and the cancellation
		// signal of the execution is honoured.
		const error = await coolifyApiRequest(ctx, 'GET', '/applications').then(
			() => undefined,
			(caught: unknown) => caught,
		);

		expect((error as Error).name).toBe('ManualExecutionCancelledError');
		expect(calls).toHaveLength(1);
	});

	it('sends the configured base URL without a duplicated slash', async () => {
		const { ctx, calls } = createContext([{ status: 200, body: { ok: true } }]);

		await coolifyApiRequest(ctx, 'GET', '/team');

		expect(calls[0].options.url).toBe('https://coolify.example.com/api/v1/team');
	});

	it('returns the body of a runtime that does not deliver the full response', async () => {
		const { ctx } = createContext([{ raw: { id: 1 } }]);

		const result = await coolifyApiRequest(ctx, 'GET', '/team');

		expect(result).toEqual({ id: 1 });
	});
});
