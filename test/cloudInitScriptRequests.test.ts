import { describe, expect, it } from 'vitest';
import { type IExecuteFunctions, type INode, NodeOperationError } from 'n8n-workflow';

import { CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH } from '../nodes/Coolify/requests/cloudInitScript/cloudInitScriptFields';
import {
	createCloudInitScriptRequest,
	deleteCloudInitScriptRequest,
	getCloudInitScriptRequest,
	listCloudInitScriptsRequest,
	updateCloudInitScriptRequest,
} from '../nodes/Coolify/requests';

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

describe('cloud init script request builders', () => {
	describe('list', () => {
		it('requests the scripts of the team without a query or a body', async () => {
			const request = await listCloudInitScriptsRequest.call(createContext(), 0);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('cloud-init-scripts');
			expect(request.qs).toBeUndefined();
			expect(request.body).toBeUndefined();
		});

		it('may be repeated automatically because reading the scripts is harmless', async () => {
			const request = await listCloudInitScriptsRequest.call(createContext(), 0);

			expect(request.retrySafety).toBeUndefined();
		});
	});

	describe('create', () => {
		it('sends the name and the script in the body', async () => {
			const request = await createCloudInitScriptRequest.call(
				createContext({ name: 'Docker First Boot', script: '#!/bin/sh\necho hello' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('cloud-init-scripts');
			expect(request.body).toEqual({ name: 'Docker First Boot', script: '#!/bin/sh\necho hello' });
			expect(request.qs).toBeUndefined();
		});

		it('is never repeated automatically because a repeat would create a second script', async () => {
			const request = await createCloudInitScriptRequest.call(
				createContext({ name: 'First Boot', script: '#cloud-config\nruncmd:' }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('sends the name trimmed and the script exactly as the user wrote it', async () => {
			// The content of a script is preserved byte for byte: the node does
			// not trim, normalize or reserialize it. The Coolify API server
			// trims every string of a request itself, so what is lost at the
			// edge is never the node's doing.
			const request = await createCloudInitScriptRequest.call(
				createContext({ name: '  First Boot  ', script: ' #cloud-config\nruncmd: []\n' }),
				0,
			);

			expect(request.body).toEqual({ name: 'First Boot', script: ' #cloud-config\nruncmd: []\n' });
		});

		it('preserves the leading and trailing newlines of a bash script', async () => {
			const script = '\n#!/bin/sh\nset -e\ndnf update -y\n';

			const request = await createCloudInitScriptRequest.call(
				createContext({ name: 'Docker First Boot', script }),
				0,
			);

			expect(request.body).toEqual({ name: 'Docker First Boot', script });
		});

		it('preserves the indentation and the blank lines of a cloud-config document', async () => {
			const script =
				'#cloud-config\n\npackages:\n  - docker\n\nwrite_files:\n    - path: /opt/hello.txt\n';

			const request = await createCloudInitScriptRequest.call(
				createContext({ name: 'Docker First Boot', script }),
				0,
			);

			expect(request.body).toEqual({ name: 'Docker First Boot', script });
		});

		it('sends nothing but the name and the script, because the API rejects other fields', async () => {
			const request = await createCloudInitScriptRequest.call(
				createContext({ name: 'First Boot', script: 'x' }),
				0,
			);

			expect(Object.keys(request.body ?? {})).toEqual(['name', 'script']);
		});

		it('fails when the name is missing', async () => {
			await expect(
				createCloudInitScriptRequest.call(createContext({ script: 'x' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the script is missing', async () => {
			await expect(
				createCloudInitScriptRequest.call(createContext({ name: 'First Boot' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the script is blank', async () => {
			await expect(
				createCloudInitScriptRequest.call(
					createContext({ name: 'First Boot', script: '   \n\t ' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the name exceeds the length the API accepts', async () => {
			await expect(
				createCloudInitScriptRequest.call(
					createContext({ name: 'a'.repeat(CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH + 1), script: 'x' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('accepts a name of the length the API accepts', async () => {
			const request = await createCloudInitScriptRequest.call(
				createContext({ name: 'a'.repeat(CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH), script: 'x' }),
				0,
			);

			expect(request.body).toEqual({
				name: 'a'.repeat(CLOUD_INIT_SCRIPT_NAME_MAX_LENGTH),
				script: 'x',
			});
		});
	});

	describe('get', () => {
		it('requests the script by its uuid', async () => {
			const request = await getCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: ' abc123 ' }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('cloud-init-scripts/abc123');
			expect(request.qs).toBeUndefined();
			expect(request.body).toBeUndefined();
		});

		it('may be repeated automatically because reading the script is harmless', async () => {
			const request = await getCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123' }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('fails when the uuid is missing', async () => {
			await expect(getCloudInitScriptRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('update', () => {
		it('sends the fields the user set, and no others', async () => {
			const request = await updateCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123', name: 'Renamed', script: '#!/bin/sh' }),
				0,
			);

			expect(request.method).toBe('PATCH');
			expect(request.path).toBe('cloud-init-scripts/abc123');
			expect(request.body).toEqual({ name: 'Renamed', script: '#!/bin/sh' });
		});

		it('omits the name when it is empty, so the script keeps its current name', async () => {
			const request = await updateCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123', script: '#!/bin/sh' }),
				0,
			);

			expect(request.body).toEqual({ script: '#!/bin/sh' });
		});

		it('omits the script when it is empty, so the script keeps its content', async () => {
			const request = await updateCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123', name: 'Renamed' }),
				0,
			);

			expect(request.body).toEqual({ name: 'Renamed' });
		});

		it('sends a nonblank script exactly as the user wrote it', async () => {
			// The Coolify API server trims every string itself, so the node
			// does not trim the content; the exact value reaches the body.
			const script = '\n\n#cloud-config\n\npackages:\n  - docker\n\n';

			const request = await updateCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123', script }),
				0,
			);

			expect(request.body).toEqual({ script });
		});

		it('never sends a blank field, because the API would reject it with HTTP 422', async () => {
			// The upstream middleware turns the blank string into null and the
			// string rules of the endpoint are not nullable, so a blank field
			// in the body is rejected; and the n8n editor cannot distinguish a
			// cleared field from an untouched one either. A blank field is
			// therefore omitted, and the value it omits keeps the current value.
			const request = await updateCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123', name: '   ', script: '#!/bin/sh' }),
				0,
			);

			expect(request.body).toEqual({ script: '#!/bin/sh' });
		});

		it('treats blank fields like untouched ones, so an update with nothing but blanks is refused', async () => {
			await expect(
				updateCloudInitScriptRequest.call(
					createContext({ cloudInitScriptUuid: 'abc123', name: '   ', script: '   ' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('refuses a request that would not change anything', async () => {
			await expect(
				updateCloudInitScriptRequest.call(createContext({ cloudInitScriptUuid: 'abc123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('is never repeated automatically because the partial update is not harmless to repeat', async () => {
			const request = await updateCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123', name: 'Renamed' }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('fails when the uuid is missing', async () => {
			await expect(
				updateCloudInitScriptRequest.call(createContext({ name: 'Renamed' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the name exceeds the length the API accepts', async () => {
			await expect(
				updateCloudInitScriptRequest.call(
					createContext({ cloudInitScriptUuid: 'abc123', name: 'a'.repeat(256) }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('delete', () => {
		it('requests the deletion by the uuid without a query or a body', async () => {
			const request = await deleteCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123' }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('cloud-init-scripts/abc123');
			expect(request.qs).toBeUndefined();
			expect(request.body).toBeUndefined();
		});

		it('is never repeated automatically because the deletion is permanent', async () => {
			const request = await deleteCloudInitScriptRequest.call(
				createContext({ cloudInitScriptUuid: 'abc123' }),
				0,
			);

			expect(request.retrySafety).toBe('unsafe');
		});

		it('fails when the uuid is missing', async () => {
			await expect(deleteCloudInitScriptRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});
});
