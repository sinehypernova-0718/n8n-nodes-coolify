import { describe, expect, it } from 'vitest';
import { type IExecuteFunctions, type INode, NodeOperationError } from 'n8n-workflow';

import { listAuditEventsRequest } from '../nodes/Coolify/requests';

const node = {
	name: 'Coolify',
	type: 'coolify',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
} as unknown as INode;

/**
 * A fake execution context that answers parameter lookups from a map.
 *
 * A parameter that is not in the map falls back to the default the request
 * builder passes, which is how the runtime reports a parameter the user never
 * touched.
 */
function createContext(parameters: Record<string, unknown> = {}) {
	const ctx = {
		getNode: () => node,
		getNodeParameter: (name: string, _itemIndex: number, defaultValue?: unknown) => {
			const value = parameters[name];
			return value === undefined ? defaultValue : value;
		},
	};

	return ctx as unknown as IExecuteFunctions;
}

describe('audit event request builders', () => {
	describe('list', () => {
		it('requests the audit events without query parameters when no filter is set', async () => {
			const request = await listAuditEventsRequest.call(createContext(), 0);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('audit-events');
			expect(request.qs).toBeUndefined();
			expect(request.body).toBeUndefined();
		});

		it('may be repeated automatically because reading audit events is harmless', async () => {
			const request = await listAuditEventsRequest.call(createContext(), 0);

			expect(request.retrySafety).toBeUndefined();
		});

		it('filters the audit events by search text when a search is given', async () => {
			const request = await listAuditEventsRequest.call(createContext({ search: 'deploy' }), 0);

			expect(request.qs).toEqual({ search: 'deploy' });
		});

		it('omits the search when the value is only whitespace', async () => {
			const request = await listAuditEventsRequest.call(createContext({ search: '   ' }), 0);

			expect(request.qs).toBeUndefined();
		});

		it('filters the audit events by action when an action is given', async () => {
			const request = await listAuditEventsRequest.call(createContext({ action: 'deploy' }), 0);

			expect(request.qs).toEqual({ action: 'deploy' });
		});

		it('sends the all action when it is chosen explicitly', async () => {
			const request = await listAuditEventsRequest.call(createContext({ action: 'all' }), 0);

			expect(request.qs).toEqual({ action: 'all' });
		});

		it('omits the source filter when the unset option is selected', async () => {
			const request = await listAuditEventsRequest.call(createContext({ source: '' }), 0);

			expect(request.qs).toBeUndefined();
		});

		it('sends the all source when it is chosen explicitly', async () => {
			const request = await listAuditEventsRequest.call(createContext({ source: 'all' }), 0);

			expect(request.qs).toEqual({ source: 'all' });
		});

		it('sends the source filter when a source is chosen', async () => {
			const request = await listAuditEventsRequest.call(createContext({ source: 'ui' }), 0);

			expect(request.qs).toEqual({ source: 'ui' });
		});

		it('limits the page size when the items per page are given', async () => {
			const request = await listAuditEventsRequest.call(createContext({ perPage: 50 }), 0);

			expect(request.qs).toEqual({ per_page: 50 });
		});

		it('selects the page when the page number is given', async () => {
			const request = await listAuditEventsRequest.call(createContext({ page: 3 }), 0);

			expect(request.qs).toEqual({ page: 3 });
		});

		it('accepts the boundaries of the page size', async () => {
			const first = await listAuditEventsRequest.call(createContext({ perPage: 1 }), 0);
			const last = await listAuditEventsRequest.call(createContext({ perPage: 100 }), 0);

			expect(first.qs).toEqual({ per_page: 1 });
			expect(last.qs).toEqual({ per_page: 100 });
		});

		it('sends every filter together exactly once', async () => {
			const request = await listAuditEventsRequest.call(
				createContext({ perPage: 10, page: 2, search: 'token', action: 'all', source: 'api' }),
				0,
			);

			expect(request.qs).toEqual({
				per_page: 10,
				page: 2,
				search: 'token',
				action: 'all',
				source: 'api',
			});
			expect(Object.keys(request.qs ?? {})).toHaveLength(5);
		});

		it('fails when the items per page are below the range of the API', async () => {
			await expect(
				listAuditEventsRequest.call(createContext({ perPage: 0 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the items per page exceed the range of the API', async () => {
			await expect(
				listAuditEventsRequest.call(createContext({ perPage: 101 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the items per page are not an integer', async () => {
			await expect(
				listAuditEventsRequest.call(createContext({ perPage: 2.5 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the page is below the range of the API', async () => {
			await expect(listAuditEventsRequest.call(createContext({ page: 0 }), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});

		it('fails when the page is not an integer', async () => {
			await expect(
				listAuditEventsRequest.call(createContext({ page: 1.5 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the search exceeds the length the API accepts', async () => {
			await expect(
				listAuditEventsRequest.call(createContext({ search: 'a'.repeat(256) }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('accepts a search of the length the API accepts', async () => {
			const request = await listAuditEventsRequest.call(
				createContext({ search: 'a'.repeat(255) }),
				0,
			);

			expect(request.qs).toEqual({ search: 'a'.repeat(255) });
		});

		it('fails when the action exceeds the length the API accepts', async () => {
			await expect(
				listAuditEventsRequest.call(createContext({ action: 'a'.repeat(256) }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});
});
