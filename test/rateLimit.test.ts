import { describe, expect, it } from 'vitest';

import {
	BASE_BACKOFF_MS,
	MAX_BACKOFF_MS,
	MAX_RETRIES,
	MAX_RETRY_AFTER_MS,
	classifyFailure,
	computeRetryDelay,
	defaultRetrySafety,
	getHeaderValue,
	parseRateLimitResetMs,
	parseRetryAfterMs,
} from '../nodes/Coolify/shared/rateLimit';

const NOW = 1_700_000_000_000;

describe('getHeaderValue', () => {
	it('reads a header regardless of its case', () => {
		expect(getHeaderValue({ 'X-RateLimit-Reset': '1700000000' }, 'x-ratelimit-reset')).toBe(
			'1700000000',
		);
		expect(getHeaderValue({ 'x-ratelimit-reset': '1700000000' }, 'X-RateLimit-Reset')).toBe(
			'1700000000',
		);
	});

	it('reads the first entry of an array header', () => {
		expect(getHeaderValue({ 'retry-after': ['30', '60'] }, 'retry-after')).toBe('30');
	});

	it('supports Headers-like accessors', () => {
		const headers = { get: (name: string) => (name === 'retry-after' ? '15' : null) };
		expect(getHeaderValue(headers, 'retry-after')).toBe('15');
	});

	it('returns undefined for a missing header or a missing map', () => {
		expect(getHeaderValue({ 'content-type': 'application/json' }, 'retry-after')).toBeUndefined();
		expect(getHeaderValue(undefined, 'retry-after')).toBeUndefined();
	});
});

describe('parseRetryAfterMs', () => {
	it('reads the documented delay-seconds form', () => {
		expect(parseRetryAfterMs({ 'retry-after': '30' }, NOW)).toBe(30_000);
	});

	it('accepts a zero delay', () => {
		expect(parseRetryAfterMs({ 'retry-after': '0' }, NOW)).toBe(0);
	});

	it('returns undefined when the header is missing', () => {
		expect(parseRetryAfterMs({}, NOW)).toBeUndefined();
	});

	it('returns undefined for a malformed value', () => {
		expect(parseRetryAfterMs({ 'retry-after': 'soon' }, NOW)).toBeUndefined();
		expect(parseRetryAfterMs({ 'retry-after': '1.5.2' }, NOW)).toBeUndefined();
		expect(parseRetryAfterMs({ 'retry-after': '' }, NOW)).toBeUndefined();
	});

	it('returns undefined for a negative value', () => {
		expect(parseRetryAfterMs({ 'retry-after': '-5' }, NOW)).toBeUndefined();
	});

	it('accepts the HTTP-date form', () => {
		const now = Date.parse('Wed, 15 Nov 2023 00:00:00 GMT');
		expect(parseRetryAfterMs({ 'retry-after': 'Wed, 15 Nov 2023 00:00:30 GMT' }, now)).toBe(30_000);
	});

	it('never returns a negative delay for an HTTP-date in the past', () => {
		const now = Date.parse('Wed, 15 Nov 2023 00:01:00 GMT');
		expect(parseRetryAfterMs({ 'retry-after': 'Wed, 15 Nov 2023 00:00:30 GMT' }, now)).toBe(0);
	});
});

describe('parseRateLimitResetMs', () => {
	it('turns the documented unix timestamp into a delay', () => {
		const reset = Math.floor(NOW / 1000) + 45;
		expect(parseRateLimitResetMs({ 'x-ratelimit-reset': String(reset) }, NOW)).toBe(45_000);
	});

	it('returns zero for a timestamp in the past', () => {
		const reset = Math.floor(NOW / 1000) - 10;
		expect(parseRateLimitResetMs({ 'x-ratelimit-reset': String(reset) }, NOW)).toBe(0);
	});

	it('returns undefined for a missing or malformed value', () => {
		expect(parseRateLimitResetMs({}, NOW)).toBeUndefined();
		expect(parseRateLimitResetMs({ 'x-ratelimit-reset': 'later' }, NOW)).toBeUndefined();
	});
});

describe('computeRetryDelay', () => {
	it('prefers Retry-After over every other source', () => {
		const delay = computeRetryDelay({
			attempt: 0,
			headers: { 'retry-after': '30', 'x-ratelimit-reset': String(Math.floor(NOW / 1000) + 90) },
			nowMs: NOW,
			random: () => 0.5,
		});
		expect(delay.source).toBe('retry-after');
		expect(delay.delayMs).toBe(30_000);
		expect(delay.exceedsBudget).toBe(false);
	});

	it('falls back to X-RateLimit-Reset when Retry-After is missing', () => {
		const delay = computeRetryDelay({
			attempt: 0,
			headers: { 'x-ratelimit-reset': String(Math.floor(NOW / 1000) + 20) },
			nowMs: NOW,
			random: () => 0.5,
		});
		expect(delay.source).toBe('rate-limit-reset');
		expect(delay.delayMs).toBe(20_000);
	});

	it('falls back to X-RateLimit-Reset when Retry-After is malformed', () => {
		const delay = computeRetryDelay({
			attempt: 0,
			headers: { 'retry-after': 'soon', 'x-ratelimit-reset': String(Math.floor(NOW / 1000) + 20) },
			nowMs: NOW,
			random: () => 0.5,
		});
		expect(delay.source).toBe('rate-limit-reset');
		expect(delay.delayMs).toBe(20_000);
	});

	it('falls back to an exponential backoff with jitter', () => {
		const low = computeRetryDelay({ attempt: 0, headers: {}, nowMs: NOW, random: () => 0 });
		const high = computeRetryDelay({ attempt: 0, headers: {}, nowMs: NOW, random: () => 0.999 });

		expect(low.source).toBe('backoff');
		expect(low.delayMs).toBe(BASE_BACKOFF_MS);
		expect(high.delayMs).toBeGreaterThan(low.delayMs);
		expect(high.delayMs).toBeLessThanOrEqual(BASE_BACKOFF_MS * 2);
	});

	it('grows the backoff exponentially and caps it', () => {
		const delay = computeRetryDelay({ attempt: 5, headers: {}, nowMs: NOW, random: () => 0.5 });
		expect(delay.delayMs).toBeLessThanOrEqual(MAX_BACKOFF_MS);
		expect(delay.exceedsBudget).toBe(false);
	});

	it('reports a server requested wait that exceeds the budget', () => {
		const delay = computeRetryDelay({
			attempt: 0,
			headers: { 'retry-after': '3600' },
			nowMs: NOW,
			random: () => 0.5,
		});
		expect(delay.source).toBe('retry-after');
		expect(delay.exceedsBudget).toBe(true);
		expect(delay.delayMs).toBe(3_600_000);
	});

	it('reports a reset timestamp beyond the budget', () => {
		const delay = computeRetryDelay({
			attempt: 0,
			headers: { 'x-ratelimit-reset': String(Math.floor(NOW / 1000) + 3600) },
			nowMs: NOW,
			random: () => 0.5,
		});
		expect(delay.source).toBe('rate-limit-reset');
		expect(delay.exceedsBudget).toBe(true);
	});

	it('accepts a server requested wait that is exactly the budget', () => {
		const delay = computeRetryDelay({
			attempt: 0,
			headers: { 'retry-after': String(MAX_RETRY_AFTER_MS / 1000) },
			nowMs: NOW,
			random: () => 0.5,
		});
		expect(delay.exceedsBudget).toBe(false);
	});
});

describe('defaultRetrySafety', () => {
	it('treats reads as safe', () => {
		expect(defaultRetrySafety('GET')).toBe('safe');
		expect(defaultRetrySafety('HEAD')).toBe('safe');
		expect(defaultRetrySafety('OPTIONS')).toBe('safe');
		expect(defaultRetrySafety('get')).toBe('safe');
	});

	it('treats every write as unsafe', () => {
		expect(defaultRetrySafety('POST')).toBe('unsafe');
		expect(defaultRetrySafety('PUT')).toBe('unsafe');
		expect(defaultRetrySafety('PATCH')).toBe('unsafe');
		expect(defaultRetrySafety('DELETE')).toBe('unsafe');
	});
});

describe('classifyFailure', () => {
	it('classifies a 429 as a transient, retryable failure', () => {
		const failure = classifyFailure({ response: { status: 429 } });
		expect(failure.status).toBe(429);
		expect(failure.transient).toBe(true);
		expect(failure.retryable).toBe(true);
	});

	it('classifies transient server errors as retryable', () => {
		for (const status of [408, 500, 502, 503, 504]) {
			const failure = classifyFailure({ response: { status } });
			expect(failure.retryable).toBe(true);
		}
	});

	it('classifies permanent errors as not retryable', () => {
		for (const status of [400, 401, 403, 404, 409, 422, 501]) {
			const failure = classifyFailure({ response: { status } });
			expect(failure.retryable).toBe(false);
		}
	});

	it('classifies transport failures as retryable', () => {
		const failure = classifyFailure(
			Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' }),
		);
		expect(failure.network).toBe(true);
		expect(failure.networkCode).toBe('ECONNRESET');
		expect(failure.retryable).toBe(true);
	});

	it('reads the status, headers and body through the error chain', () => {
		const upstream = {
			response: {
				status: 429,
				headers: { 'retry-after': '30' },
				data: { message: 'Rate limit exceeded.' },
			},
		};
		const failure = classifyFailure({ cause: upstream });
		expect(failure.status).toBe(429);
		expect(failure.headers?.['retry-after']).toBe('30');
		expect(failure.bodyMessage).toBe('Rate limit exceeded.');
		expect(failure.retryable).toBe(true);
	});
});

describe('policy constants', () => {
	it('keeps the retry budget small and internal', () => {
		expect(MAX_RETRIES).toBe(3);
	});
});
