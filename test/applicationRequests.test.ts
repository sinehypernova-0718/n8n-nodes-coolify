import { describe, expect, it } from 'vitest';
import { type IExecuteFunctions, type INode, NodeOperationError } from 'n8n-workflow';

import {
	APPLICATION_CREATE_VARIANTS,
	APPLICATION_FIELD_COLLECTIONS,
	applicationFieldSpecs,
	applicationFieldUiName,
} from '../nodes/Coolify/requests/application/applicationFields';
import {
	addDestinationRequest,
	cloneApplicationRequest,
	createDockerfileApplicationRequest,
	createDockerImageApplicationRequest,
	createEnvRequest,
	createPreviewDeploymentRequest,
	createPrivateDeployKeyApplicationRequest,
	createPrivateGithubAppApplicationRequest,
	createPublicApplicationRequest,
	createStorageRequest,
	createTagRequest,
	deleteApplicationRequest,
	deleteEnvRequest,
	deletePreviewDeploymentRequest,
	deleteStorageBackupScheduleRequest,
	deleteStorageRequest,
	deleteTagRequest,
	getApplicationRequest,
	getLogsRequest,
	getPreviewDeploymentRequest,
	getPreviewLogsRequest,
	listApplicationsRequest,
	listDestinationsRequest,
	listEnvsRequest,
	listPreviewDeploymentsRequest,
	listRollbackImagesRequest,
	listStoragesRequest,
	listTagsRequest,
	migrateApplicationRequest,
	moveApplicationRequest,
	removeDestinationRequest,
	restartApplicationRequest,
	rollbackApplicationRequest,
	runStorageBackupRequest,
	setStorageBackupScheduleRequest,
	startApplicationRequest,
	stopApplicationRequest,
	updateApplicationRequest,
	updateEnvsBulkRequest,
	updateEnvRequest,
	updatePreviewDomainsRequest,
	updateStorageRequest,
	type CoolifyRequest,
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

describe('application request builders', () => {
	describe('list', () => {
		it('requests the applications without query parameters when no tag is given', async () => {
			const request = await listApplicationsRequest.call(createContext(), 0);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications');
			expect(request.qs).toBeUndefined();
			expect(request.body).toBeUndefined();
		});

		it('filters the applications by tag when a tag is given', async () => {
			const request = await listApplicationsRequest.call(createContext({ tag: 'production' }), 0);

			expect(request.qs).toEqual({ tag: 'production' });
		});

		it('omits the tag when the value is only whitespace', async () => {
			const request = await listApplicationsRequest.call(createContext({ tag: '   ' }), 0);

			expect(request.qs).toBeUndefined();
		});
	});

	describe('get', () => {
		it('requests the application by its uuid', async () => {
			const request = await getApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123');
			expect(request.qs).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(getApplicationRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('delete', () => {
		it('requests the deletion of the application by its uuid', async () => {
			const request = await deleteApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('applications/abc-123');
			expect(request.retrySafety).toBe('unsafe');
		});

		it('sends the documented default for every deletion flag', async () => {
			const request = await deleteApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.qs).toEqual({
				delete_configurations: true,
				delete_volumes: true,
				docker_cleanup: true,
				delete_connected_networks: true,
			});
		});

		it('sends exactly the query parameters of the API', async () => {
			const request = await deleteApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(Object.keys(request.qs ?? {}).sort()).toEqual([
				'delete_configurations',
				'delete_connected_networks',
				'delete_volumes',
				'docker_cleanup',
			]);
		});

		it('sends an explicit false for a deletion flag the user switched off', async () => {
			const request = await deleteApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', deleteVolumes: false }),
				0,
			);

			expect(request.qs).toEqual({
				delete_configurations: true,
				delete_volumes: false,
				docker_cleanup: true,
				delete_connected_networks: true,
			});
		});

		it('fails when the application uuid is missing', async () => {
			await expect(deleteApplicationRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('listEnvs', () => {
		it('requests the environment variables of the application', async () => {
			const request = await listEnvsRequest.call(createContext({ applicationUuid: 'abc-123' }), 0);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/envs');
			expect(request.qs).toBeUndefined();
			expect(request.body).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(listEnvsRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('listStorages', () => {
		it('requests the storages of the application', async () => {
			const request = await listStoragesRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/storages');
			expect(request.qs).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(listStoragesRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('listTags', () => {
		it('requests the tags of the application', async () => {
			const request = await listTagsRequest.call(createContext({ applicationUuid: 'abc-123' }), 0);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/tags');
			expect(request.qs).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(listTagsRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('listDestinations', () => {
		it('requests the destinations of the application', async () => {
			const request = await listDestinationsRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/destinations');
			expect(request.qs).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(listDestinationsRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('listRollbackImages', () => {
		it('requests the rollback images of the application', async () => {
			const request = await listRollbackImagesRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/rollback-images');
			expect(request.qs).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(listRollbackImagesRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('listPreviewDeployments', () => {
		it('requests the preview deployments of the application', async () => {
			const request = await listPreviewDeploymentsRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/previews');
			expect(request.qs).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(listPreviewDeploymentsRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('getPreviewDeployment', () => {
		it('requests the preview deployment by pull request ID', async () => {
			const request = await getPreviewDeploymentRequest.call(
				createContext({ applicationUuid: 'abc-123', pullRequestId: 42 }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/previews/42');
			expect(request.qs).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				getPreviewDeploymentRequest.call(createContext({ pullRequestId: 42 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the pull request ID is not a positive integer', async () => {
			await expect(
				getPreviewDeploymentRequest.call(
					createContext({ applicationUuid: 'abc-123', pullRequestId: 0 }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the pull request ID exceeds the range of the API', async () => {
			await expect(
				getPreviewDeploymentRequest.call(
					createContext({ applicationUuid: 'abc-123', pullRequestId: 2_147_483_648 }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('createTag', () => {
		it('requests the addition of a single tag', async () => {
			const request = await createTagRequest.call(
				createContext({ applicationUuid: 'abc-123', tagName: 'production' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/tags');
			expect(request.body).toEqual({ tag_name: 'production' });
			expect(request.qs).toBeUndefined();
		});

		it('requests the addition of several tags', async () => {
			const request = await createTagRequest.call(
				createContext({ applicationUuid: 'abc-123', tagNames: ['production', 'staging'] }),
				0,
			);

			expect(request.body).toEqual({ tag_names: ['production', 'staging'] });
		});

		it('fails when a tag name and a list of tag names are given', async () => {
			await expect(
				createTagRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						tagName: 'production',
						tagNames: ['staging'],
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when no tag name is given', async () => {
			await expect(
				createTagRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when a tag name is shorter than two characters', async () => {
			await expect(
				createTagRequest.call(createContext({ applicationUuid: 'abc-123', tagName: 'a' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(createTagRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('deleteTag', () => {
		it('requests the removal of the tag by uuid', async () => {
			const request = await deleteTagRequest.call(
				createContext({ applicationUuid: 'abc-123', tagUuid: 'tag-456' }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('applications/abc-123/tags/tag-456');
			expect(request.body).toBeUndefined();
		});

		it('fails when the tag uuid is missing', async () => {
			await expect(
				deleteTagRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(deleteTagRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('createEnv', () => {
		it('requests the creation of the environment variable', async () => {
			const request = await createEnvRequest.call(
				createContext({ applicationUuid: 'abc-123', key: 'APP_ENV', value: 'production' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/envs');
			expect(request.body).toEqual({ key: 'APP_ENV', value: 'production' });
		});

		it('omits the flags that are switched off', async () => {
			const request = await createEnvRequest.call(
				createContext({ applicationUuid: 'abc-123', key: 'APP_ENV' }),
				0,
			);

			expect(request.body).toEqual({ key: 'APP_ENV' });
		});

		it('sends the flags that are switched on', async () => {
			const request = await createEnvRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					key: 'APP_ENV',
					isPreview: true,
					isLiteral: true,
					isMultiline: true,
					isShownOnce: true,
				}),
				0,
			);

			expect(request.body).toEqual({
				key: 'APP_ENV',
				is_preview: true,
				is_literal: true,
				is_multiline: true,
				is_shown_once: true,
			});
		});

		it('fails when the key does not match the pattern of the API', async () => {
			await expect(
				createEnvRequest.call(createContext({ applicationUuid: 'abc-123', key: '1 ENV' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the key is missing', async () => {
			await expect(
				createEnvRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(createEnvRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('updateEnv', () => {
		it('requests the update of the environment variable by its key', async () => {
			const request = await updateEnvRequest.call(
				createContext({ applicationUuid: 'abc-123', key: 'APP_ENV', value: 'staging' }),
				0,
			);

			expect(request.method).toBe('PATCH');
			expect(request.path).toBe('applications/abc-123/envs');
			expect(request.body).toEqual({ key: 'APP_ENV', value: 'staging' });
		});

		it('omits the flags that are switched off', async () => {
			const request = await updateEnvRequest.call(
				createContext({ applicationUuid: 'abc-123', key: 'APP_ENV', value: 'staging' }),
				0,
			);

			expect(request.body).not.toHaveProperty('is_preview');
			expect(request.body).not.toHaveProperty('is_literal');
			expect(request.body).not.toHaveProperty('is_multiline');
			expect(request.body).not.toHaveProperty('is_shown_once');
		});

		it('never sends a flag as false, because the API resets a flag that is not part of the request', async () => {
			const request = await updateEnvRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					key: 'APP_ENV',
					value: 'staging',
					isPreview: false,
					isLiteral: false,
					isMultiline: false,
					isShownOnce: false,
				}),
				0,
			);

			expect(Object.keys(request.body ?? {}).sort()).toEqual(['key', 'value']);
		});

		it('fails when the key is missing', async () => {
			await expect(
				updateEnvRequest.call(createContext({ applicationUuid: 'abc-123', value: 'x' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(updateEnvRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('deleteEnv', () => {
		it('requests the deletion of the environment variable by uuid', async () => {
			const request = await deleteEnvRequest.call(
				createContext({ applicationUuid: 'abc-123', envUuid: 'env-456' }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('applications/abc-123/envs/env-456');
			expect(request.body).toBeUndefined();
		});

		it('fails when the environment variable uuid is missing', async () => {
			await expect(
				deleteEnvRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(deleteEnvRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('start', () => {
		it('requests the start without query parameters', async () => {
			const request = await startApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/start');
			expect(request.qs).toBeUndefined();
		});

		it('sends the query parameters that are switched on', async () => {
			const request = await startApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', force: true, instantDeploy: true }),
				0,
			);

			expect(request.qs).toEqual({ force: true, instant_deploy: true });
		});

		it('is not repeated automatically because it queues a deployment', async () => {
			const request = await startApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(startApplicationRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('stop', () => {
		it('requests the stop with the docker cleanup of the API', async () => {
			const request = await stopApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/stop');
			expect(request.qs).toEqual({ docker_cleanup: true });
		});

		it('sends the docker cleanup the user switched off', async () => {
			const request = await stopApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', dockerCleanup: false }),
				0,
			);

			expect(request.qs).toEqual({ docker_cleanup: false });
		});

		it('may be repeated because stopping a stopped application is harmless', async () => {
			const request = await stopApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.retrySafety).toBe('safe');
		});

		it('fails when the application uuid is missing', async () => {
			await expect(stopApplicationRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('updateEnvsBulk', () => {
		it('requests the update of every environment variable of the list', async () => {
			const request = await updateEnvsBulkRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					data: [{ key: 'APP_ENV', value: 'production' }],
				}),
				0,
			);

			expect(request.method).toBe('PATCH');
			expect(request.path).toBe('applications/abc-123/envs/bulk');
			expect(request.body).toEqual({ data: [{ key: 'APP_ENV', value: 'production' }] });
		});

		it('omits the flags that are switched off in every item', async () => {
			const request = await updateEnvsBulkRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					data: [
						{
							key: 'APP_ENV',
							value: 'production',
							isPreview: false,
							isLiteral: false,
							isMultiline: false,
							isShownOnce: false,
						},
					],
				}),
				0,
			);

			expect(request.body).toEqual({ data: [{ key: 'APP_ENV', value: 'production' }] });
		});

		it('sends the flags that are switched on', async () => {
			const request = await updateEnvsBulkRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					data: [{ key: 'APP_ENV', value: 'production', isPreview: true, isShownOnce: true }],
				}),
				0,
			);

			expect(request.body).toEqual({
				data: [{ key: 'APP_ENV', value: 'production', is_preview: true, is_shown_once: true }],
			});
		});

		it('fails when the list is empty', async () => {
			await expect(
				updateEnvsBulkRequest.call(createContext({ applicationUuid: 'abc-123', data: [] }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when an item has no key', async () => {
			await expect(
				updateEnvsBulkRequest.call(
					createContext({ applicationUuid: 'abc-123', data: [{ value: 'production' }] }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(updateEnvsBulkRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('createStorage', () => {
		it('requests a persistent storage with its volume name', async () => {
			const request = await createStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'persistent',
					mountPath: '/data',
					name: 'data',
				}),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/storages');
			expect(request.body).toEqual({ type: 'persistent', mount_path: '/data', name: 'data' });
		});

		it('does not send the fields of the other storage kind', async () => {
			const request = await createStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'persistent',
					mountPath: '/data',
					name: 'data',
					content: 'ignored',
					isDirectory: true,
					fsPath: '/host/data',
				}),
				0,
			);

			expect(request.body).toEqual({ type: 'persistent', mount_path: '/data', name: 'data' });
		});

		it('requests a file storage with its content', async () => {
			const request = await createStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'file',
					mountPath: '/etc/app/config.json',
					content: '{}',
				}),
				0,
			);

			expect(request.body).toEqual({
				type: 'file',
				mount_path: '/etc/app/config.json',
				content: '{}',
			});
		});

		it('requests a directory mount with its host path', async () => {
			const request = await createStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'file',
					mountPath: '/data',
					isDirectory: true,
					fsPath: '/host/data',
				}),
				0,
			);

			expect(request.body).toEqual({
				type: 'file',
				mount_path: '/data',
				is_directory: true,
				fs_path: '/host/data',
			});
		});

		it('fails when a persistent storage has no volume name', async () => {
			await expect(
				createStorageRequest.call(
					createContext({ applicationUuid: 'abc-123', type: 'persistent', mountPath: '/data' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when a directory mount has no host path', async () => {
			await expect(
				createStorageRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						type: 'file',
						mountPath: '/data',
						isDirectory: true,
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the mount path is missing', async () => {
			await expect(
				createStorageRequest.call(
					createContext({ applicationUuid: 'abc-123', type: 'persistent', name: 'data' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('updateStorage', () => {
		it('requests the update of the storage by its uuid', async () => {
			const request = await updateStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'persistent',
					storageUuid: 'storage-789',
					name: 'data',
					mountPath: '/data',
				}),
				0,
			);

			expect(request.method).toBe('PATCH');
			expect(request.path).toBe('applications/abc-123/storages');
			expect(request.body).toEqual({
				type: 'persistent',
				uuid: 'storage-789',
				name: 'data',
				mount_path: '/data',
			});
		});

		it('sends the preview suffix flag when it is switched on', async () => {
			const request = await updateStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'persistent',
					storageUuid: 'storage-789',
					isPreviewSuffixEnabled: true,
				}),
				0,
			);

			expect(request.body).toEqual({
				type: 'persistent',
				uuid: 'storage-789',
				is_preview_suffix_enabled: true,
			});
		});

		it('does not send the fields of the other storage kind', async () => {
			const request = await updateStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'file',
					storageUuid: 'storage-789',
					name: 'data',
					content: '{}',
				}),
				0,
			);

			expect(request.body).toEqual({ type: 'file', uuid: 'storage-789', content: '{}' });
		});

		it('sends the mount path for a file storage, which the API allows for both kinds', async () => {
			const request = await updateStorageRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					type: 'file',
					storageUuid: 'storage-789',
					mountPath: '/etc/app/config.json',
				}),
				0,
			);

			expect(request.body).toEqual({
				type: 'file',
				uuid: 'storage-789',
				mount_path: '/etc/app/config.json',
			});
		});

		it('fails when the storage uuid is missing', async () => {
			await expect(
				updateStorageRequest.call(
					createContext({ applicationUuid: 'abc-123', type: 'persistent' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(updateStorageRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('deleteStorage', () => {
		it('requests the deletion of the storage by its uuid', async () => {
			const request = await deleteStorageRequest.call(
				createContext({ applicationUuid: 'abc-123', storageUuid: 'storage-789' }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('applications/abc-123/storages/storage-789');
			expect(request.body).toBeUndefined();
		});

		it('fails when the storage uuid is missing', async () => {
			await expect(
				deleteStorageRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(deleteStorageRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('addDestination', () => {
		it('requests the attachment of the destination', async () => {
			const request = await addDestinationRequest.call(
				createContext({ applicationUuid: 'abc-123', destinationUuid: 'dest-456' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/destinations');
			expect(request.body).toEqual({ destination_uuid: 'dest-456' });
		});

		it('fails when the destination uuid is missing', async () => {
			await expect(
				addDestinationRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('removeDestination', () => {
		it('requests the detachment of the destination', async () => {
			const request = await removeDestinationRequest.call(
				createContext({ applicationUuid: 'abc-123', destinationUuid: 'dest-456' }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('applications/abc-123/destinations/dest-456');
			expect(request.body).toBeUndefined();
		});

		it('fails when the destination uuid is missing', async () => {
			await expect(
				removeDestinationRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('restart', () => {
		it('requests the restart of the application', async () => {
			const request = await restartApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/restart');
			expect(request.qs).toBeUndefined();
			expect(request.body).toBeUndefined();
		});

		it('is not repeated automatically because it queues a deployment', async () => {
			const request = await restartApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123' }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('fails when the application uuid is missing', async () => {
			await expect(restartApplicationRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('runStorageBackup', () => {
		it('requests the immediate backup of the storage', async () => {
			const request = await runStorageBackupRequest.call(
				createContext({ applicationUuid: 'abc-123', storageUuid: 'storage-789' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/storages/storage-789/backups/run');
			expect(request.body).toBeUndefined();
			expect(request.qs).toBeUndefined();
		});

		it('is not repeated automatically because it queues a backup', async () => {
			const request = await runStorageBackupRequest.call(
				createContext({ applicationUuid: 'abc-123', storageUuid: 'storage-789' }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('fails when the storage uuid is missing', async () => {
			await expect(
				runStorageBackupRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(runStorageBackupRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('setStorageBackupSchedule', () => {
		it('requests the schedule with the documented defaults', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
				}),
				0,
			);

			expect(request.method).toBe('PUT');
			expect(request.path).toBe('applications/abc-123/storages/storage-789/backups');
			expect(request.body).toEqual({
				frequency: '0 2 * * *',
				enabled: true,
				retention_amount_locally: 7,
				retention_days_locally: 0,
				retention_max_storage_locally: 0,
				retention_amount_s3: 7,
				retention_days_s3: 0,
				retention_max_storage_s3: 0,
				timeout: 36_000,
				missing_backup_notification_days: 0,
			});
		});

		it('requests the same schedule when the collections hold the defaults of the fields', async () => {
			const withoutCollections = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
				}),
				0,
			);

			const withCollections = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					backupOptions: {
						saveS3: false,
						s3StorageUuid: '',
						disableLocalBackup: false,
						stopDuringBackup: false,
					},
					localRetention: {
						retentionAmountLocally: 7,
						retentionDaysLocally: 0,
						retentionMaxStorageLocally: 0,
					},
					s3Retention: {
						retentionAmountS3: 7,
						retentionDaysS3: 0,
						retentionMaxStorageS3: 0,
					},
					notifications: { timeout: 36_000, missingBackupNotificationDays: 0 },
				}),
				0,
			);

			expect(withCollections.body).toEqual(withoutCollections.body);
		});

		it('requests the same schedule when the collections hold only the fields the user added', async () => {
			const withoutCollections = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
				}),
				0,
			);

			const withCollections = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					backupOptions: { saveS3: false },
					localRetention: { retentionAmountLocally: 7 },
				}),
				0,
			);

			expect(withCollections.body).toEqual(withoutCollections.body);
		});

		it('sends the values of the collections', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					backupOptions: {
						saveS3: true,
						s3StorageUuid: 's3-000',
						disableLocalBackup: true,
						stopDuringBackup: true,
					},
					localRetention: {
						retentionAmountLocally: 3,
						retentionDaysLocally: 5,
						retentionMaxStorageLocally: 1024,
					},
					s3Retention: {
						retentionAmountS3: 2,
						retentionDaysS3: 4,
						retentionMaxStorageS3: 2048,
					},
					notifications: { timeout: 120, missingBackupNotificationDays: 3 },
				}),
				0,
			);

			expect(request.body).toEqual({
				frequency: '0 2 * * *',
				enabled: true,
				retention_amount_locally: 3,
				retention_days_locally: 5,
				retention_max_storage_locally: 1024,
				retention_amount_s3: 2,
				retention_days_s3: 4,
				retention_max_storage_s3: 2048,
				timeout: 120,
				missing_backup_notification_days: 3,
				save_s3: true,
				disable_local_backup: true,
				stop_during_backup: true,
				s3_storage_uuid: 's3-000',
			});
			expect(Object.keys(request.body ?? {})).toHaveLength(14);
		});

		it('omits the flags of the collections that are switched off', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					backupOptions: {
						saveS3: false,
						s3StorageUuid: '',
						disableLocalBackup: false,
						stopDuringBackup: false,
					},
				}),
				0,
			);

			expect(request.body).not.toHaveProperty('save_s3');
			expect(request.body).not.toHaveProperty('disable_local_backup');
			expect(request.body).not.toHaveProperty('stop_during_backup');
			expect(request.body).not.toHaveProperty('s3_storage_uuid');
		});

		it('sends the uuid of the S3 storage even when the S3 backups are switched off', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					backupOptions: { saveS3: false, s3StorageUuid: 's3-000' },
				}),
				0,
			);

			expect(request.body).toMatchObject({ s3_storage_uuid: 's3-000' });
			expect(request.body).not.toHaveProperty('save_s3');
		});

		it('keeps the values of a workflow that was saved before the fields were grouped', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					retentionAmountLocally: 30,
					retentionDaysLocally: 9,
					timeout: 600,
					missingBackupNotificationDays: 14,
				}),
				0,
			);

			expect(request.body).toMatchObject({
				retention_amount_locally: 30,
				retention_days_locally: 9,
				timeout: 600,
				missing_backup_notification_days: 14,
			});
		});

		it('prefers the value of a collection over the value of the old parameter', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					retentionAmountLocally: 30,
					timeout: 600,
					localRetention: { retentionAmountLocally: 3 },
					notifications: { timeout: 120 },
				}),
				0,
			);

			expect(request.body).toMatchObject({
				retention_amount_locally: 3,
				timeout: 120,
			});
		});

		it('keeps a false and a zero of a collection instead of taking the old parameter', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					retentionAmountLocally: 30,
					retentionDaysLocally: 9,
					stopDuringBackup: true,
					localRetention: { retentionAmountLocally: 0, retentionDaysLocally: 0 },
					backupOptions: { stopDuringBackup: false },
				}),
				0,
			);

			expect(request.body).toMatchObject({
				retention_amount_locally: 0,
				retention_days_locally: 0,
			});
			expect(request.body).not.toHaveProperty('stop_during_backup');
		});

		it('omits the flags that default to false and are switched off', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
				}),
				0,
			);

			expect(request.body).not.toHaveProperty('save_s3');
			expect(request.body).not.toHaveProperty('disable_local_backup');
			expect(request.body).not.toHaveProperty('stop_during_backup');
		});

		it('sends the flags that are switched on', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					saveS3: true,
					disableLocalBackup: true,
					stopDuringBackup: true,
					s3StorageUuid: 's3-000',
				}),
				0,
			);

			expect(request.body).toMatchObject({
				save_s3: true,
				disable_local_backup: true,
				stop_during_backup: true,
				s3_storage_uuid: 's3-000',
			});
		});

		it('sends the enabled flag as false when the user switched it off', async () => {
			const request = await setStorageBackupScheduleRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					storageUuid: 'storage-789',
					frequency: '0 2 * * *',
					enabled: false,
				}),
				0,
			);

			expect(request.body).toMatchObject({ enabled: false });
		});

		it('fails when the local backups are disabled without S3 backups', async () => {
			await expect(
				setStorageBackupScheduleRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						storageUuid: 'storage-789',
						frequency: '0 2 * * *',
						disableLocalBackup: true,
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the S3 backups are enabled without an S3 storage', async () => {
			await expect(
				setStorageBackupScheduleRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						storageUuid: 'storage-789',
						frequency: '0 2 * * *',
						saveS3: true,
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the local backups of the collection are disabled without S3 backups', async () => {
			await expect(
				setStorageBackupScheduleRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						storageUuid: 'storage-789',
						frequency: '0 2 * * *',
						backupOptions: { disableLocalBackup: true },
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the S3 backups of the collection are enabled without an S3 storage', async () => {
			await expect(
				setStorageBackupScheduleRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						storageUuid: 'storage-789',
						frequency: '0 2 * * *',
						backupOptions: { saveS3: true },
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the frequency is missing', async () => {
			await expect(
				setStorageBackupScheduleRequest.call(
					createContext({ applicationUuid: 'abc-123', storageUuid: 'storage-789' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the storage uuid is missing', async () => {
			await expect(
				setStorageBackupScheduleRequest.call(
					createContext({ applicationUuid: 'abc-123', frequency: '0 2 * * *' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('deleteStorageBackupSchedule', () => {
		it('requests the deletion of the backup schedule', async () => {
			const request = await deleteStorageBackupScheduleRequest.call(
				createContext({ applicationUuid: 'abc-123', storageUuid: 'storage-789' }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('applications/abc-123/storages/storage-789/backups');
			expect(request.body).toBeUndefined();
		});

		it('is not repeated automatically because it deletes the archives', async () => {
			const request = await deleteStorageBackupScheduleRequest.call(
				createContext({ applicationUuid: 'abc-123', storageUuid: 'storage-789' }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('fails when the storage uuid is missing', async () => {
			await expect(
				deleteStorageBackupScheduleRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				deleteStorageBackupScheduleRequest.call(createContext(), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('createPreviewDeployment', () => {
		it('requests the preview deployment of the pull request', async () => {
			const request = await createPreviewDeploymentRequest.call(
				createContext({ applicationUuid: 'abc-123', pullRequestId: 42 }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/previews');
			expect(request.body).toEqual({ pull_request_id: 42, instant_deploy: true });
		});

		it('sends the git fields when the application has a git source', async () => {
			const request = await createPreviewDeploymentRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					gitType: 'github',
					commit: 'abc1234',
					pullRequestHtmlUrl: 'https://github.com/acme/app/pull/42',
				}),
				0,
			);

			expect(request.body).toEqual({
				pull_request_id: 42,
				instant_deploy: true,
				git_type: 'github',
				commit: 'abc1234',
				pull_request_html_url: 'https://github.com/acme/app/pull/42',
			});
		});

		it('sends the docker tag when the application is built from a docker image', async () => {
			const request = await createPreviewDeploymentRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					dockerTag: 'preview-42',
				}),
				0,
			);

			expect(request.body).toEqual({
				pull_request_id: 42,
				instant_deploy: true,
				docker_tag: 'preview-42',
			});
		});

		it('omits the force flag when it is switched off and sends it when it is on', async () => {
			const withoutForce = await createPreviewDeploymentRequest.call(
				createContext({ applicationUuid: 'abc-123', pullRequestId: 42 }),
				0,
			);
			expect(withoutForce.body).not.toHaveProperty('force');

			const withForce = await createPreviewDeploymentRequest.call(
				createContext({ applicationUuid: 'abc-123', pullRequestId: 42, force: true }),
				0,
			);
			expect(withForce.body).toMatchObject({ force: true });
		});

		it('sends the instant deploy flag as false when the user switched it off', async () => {
			const request = await createPreviewDeploymentRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					instantDeploy: false,
				}),
				0,
			);

			expect(request.body).toMatchObject({ instant_deploy: false });
		});

		it('fails when a git type and a docker tag are given', async () => {
			await expect(
				createPreviewDeploymentRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 42,
						gitType: 'github',
						dockerTag: 'preview-42',
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when a bitbucket pull request has no commit', async () => {
			await expect(
				createPreviewDeploymentRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 42,
						gitType: 'bitbucket',
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the commit is not a commit sha', async () => {
			await expect(
				createPreviewDeploymentRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 42,
						gitType: 'github',
						commit: 'not-a-sha',
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the pull request id is not a positive integer', async () => {
			await expect(
				createPreviewDeploymentRequest.call(
					createContext({ applicationUuid: 'abc-123', pullRequestId: 0 }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				createPreviewDeploymentRequest.call(createContext({ pullRequestId: 42 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('deletePreviewDeployment', () => {
		it('requests the deletion of the preview deployment by pull request id', async () => {
			const request = await deletePreviewDeploymentRequest.call(
				createContext({ applicationUuid: 'abc-123', pullRequestId: 42 }),
				0,
			);

			expect(request.method).toBe('DELETE');
			expect(request.path).toBe('applications/abc-123/previews/42');
			expect(request.body).toBeUndefined();
		});

		it('is not repeated automatically because it removes the preview', async () => {
			const request = await deletePreviewDeploymentRequest.call(
				createContext({ applicationUuid: 'abc-123', pullRequestId: 42 }),
				0,
			);

			expect(request.retrySafety).toBeUndefined();
		});

		it('fails when the pull request id is not a positive integer', async () => {
			await expect(
				deletePreviewDeploymentRequest.call(
					createContext({ applicationUuid: 'abc-123', pullRequestId: 2_147_483_648 }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				deletePreviewDeploymentRequest.call(createContext({ pullRequestId: 42 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('updatePreviewDomains', () => {
		it('requests the replacement of the domains of an application', async () => {
			const request = await updatePreviewDomainsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					mode: 'application',
					domains: 'https://preview.example.com',
				}),
				0,
			);

			expect(request.method).toBe('PATCH');
			expect(request.path).toBe('applications/abc-123/previews/42');
			expect(request.body).toEqual({ domains: 'https://preview.example.com' });
		});

		it('sends an empty domain list only when the removal is switched on', async () => {
			const request = await updatePreviewDomainsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					mode: 'application',
					domains: '',
					removeDomains: true,
				}),
				0,
			);

			expect(request.body).toEqual({ domains: '' });
		});

		it('fails when the domains are empty and the removal is not switched on', async () => {
			await expect(
				updatePreviewDomainsRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 42,
						mode: 'application',
						domains: '',
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('sends the docker compose domains in the docker compose mode', async () => {
			const request = await updatePreviewDomainsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					mode: 'dockerCompose',
					dockerComposeDomains: [
						{ name: 'app', domain: 'https://app.preview.example.com', redirect: 'both' },
					],
				}),
				0,
			);

			expect(request.body).toEqual({
				docker_compose_domains: [
					{ name: 'app', domain: 'https://app.preview.example.com', redirect: 'both' },
				],
			});
		});

		it('never sends the domains of the other mode', async () => {
			const compose = await updatePreviewDomainsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					mode: 'dockerCompose',
					domains: 'https://preview.example.com',
					dockerComposeDomains: [{ name: 'app', domain: 'https://app.preview.example.com' }],
				}),
				0,
			);

			expect(compose.body).not.toHaveProperty('domains');

			const application = await updatePreviewDomainsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					mode: 'application',
					domains: 'https://preview.example.com',
					dockerComposeDomains: [{ name: 'app', domain: 'https://app.preview.example.com' }],
				}),
				0,
			);

			expect(application.body).not.toHaveProperty('docker_compose_domains');
		});

		it('fails when the docker compose mode has no service domain', async () => {
			await expect(
				updatePreviewDomainsRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 42,
						mode: 'dockerCompose',
						dockerComposeDomains: [],
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when a docker compose service has no domain', async () => {
			await expect(
				updatePreviewDomainsRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 42,
						mode: 'dockerCompose',
						dockerComposeDomains: [{ name: 'app', domain: '' }],
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when a docker compose domain has no service name', async () => {
			await expect(
				updatePreviewDomainsRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 42,
						mode: 'dockerCompose',
						dockerComposeDomains: [{ name: '', domain: 'https://app.example.com' }],
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('sends the force domain override flag when it is switched on', async () => {
			const request = await updatePreviewDomainsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					mode: 'application',
					domains: 'https://preview.example.com',
					forceDomainOverride: true,
				}),
				0,
			);

			expect(request.body).toMatchObject({ force_domain_override: true });
		});

		it('fails when the pull request id is not a positive integer', async () => {
			await expect(
				updatePreviewDomainsRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						pullRequestId: 0,
						mode: 'application',
						domains: 'https://preview.example.com',
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				updatePreviewDomainsRequest.call(createContext({ pullRequestId: 42 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('createPublic', () => {
		const base = {
			projectUuid: 'project-1',
			serverUuid: 'server-1',
			environmentName: 'production',
			gitRepository: 'https://github.com/acme/app',
			gitBranch: 'main',
			buildPack: 'nixpacks',
		};

		it('requests the creation of the application', async () => {
			const request = await createPublicApplicationRequest.call(createContext(base), 0);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/public');
			expect(request.body).toEqual({
				project_uuid: 'project-1',
				server_uuid: 'server-1',
				environment_name: 'production',
				git_repository: 'https://github.com/acme/app',
				git_branch: 'main',
				build_pack: 'nixpacks',
			});
		});

		it('accepts the environment uuid instead of the environment name', async () => {
			const request = await createPublicApplicationRequest.call(
				createContext({ ...base, environmentName: '', environmentUuid: 'env-1' }),
				0,
			);

			expect(request.body).toMatchObject({ environment_uuid: 'env-1' });
			expect(request.body).not.toHaveProperty('environment_name');
		});

		it('fails when neither the environment name nor the environment uuid is given', async () => {
			await expect(
				createPublicApplicationRequest.call(createContext({ ...base, environmentName: '' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the git repository is missing', async () => {
			await expect(
				createPublicApplicationRequest.call(createContext({ ...base, gitRepository: '' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the git branch is missing', async () => {
			await expect(
				createPublicApplicationRequest.call(createContext({ ...base, gitBranch: '' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the build pack is missing', async () => {
			await expect(
				createPublicApplicationRequest.call(createContext({ ...base, buildPack: '' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the project uuid is missing', async () => {
			await expect(
				createPublicApplicationRequest.call(createContext({ ...base, projectUuid: '' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('omits the boolean fields that are switched off', async () => {
			const request = await createPublicApplicationRequest.call(createContext(base), 0);

			expect(request.body).not.toHaveProperty('instant_deploy');
			expect(request.body).not.toHaveProperty('is_static');
		});

		it('sends the boolean fields of the application settings the API defaults to true', async () => {
			const request = await createPublicApplicationRequest.call(
				createContext({ ...base, applicationSettings: { autogenerateDomain: true } }),
				0,
			);

			expect(request.body).toMatchObject({ autogenerate_domain: true });
		});

		it('sends a boolean of the application settings the user switched off', async () => {
			const request = await createPublicApplicationRequest.call(
				createContext({ ...base, applicationSettings: { autogenerateDomain: false } }),
				0,
			);

			expect(request.body).toMatchObject({ autogenerate_domain: false });
		});

		it('leaves the boolean fields of the application settings to the API default when the collection is untouched', async () => {
			const request = await createPublicApplicationRequest.call(createContext(base), 0);

			expect(request.body).not.toHaveProperty('autogenerate_domain');
		});

		it('sends a collection boolean the user switched off', async () => {
			const request = await createPublicApplicationRequest.call(
				createContext({ ...base, deploymentSettings: { isForceHttpsEnabled: false } }),
				0,
			);

			expect(request.body).toMatchObject({ is_force_https_enabled: false });
		});

		it('sends the fields of the optional collections', async () => {
			const request = await createPublicApplicationRequest.call(
				createContext({
					...base,
					deploymentSettings: { isPreviewDeploymentsEnabled: true, maxRestartCount: 3 },
					healthCheckSettings: { healthCheckEnabled: true, healthCheckPath: '/health' },
				}),
				0,
			);

			expect(request.body).toMatchObject({
				is_preview_deployments_enabled: true,
				max_restart_count: 3,
				health_check_enabled: true,
				health_check_path: '/health',
			});
		});

		it('fails when the exposed ports are not a list of ports', async () => {
			await expect(
				createPublicApplicationRequest.call(
					createContext({ ...base, applicationSettings: { portsExposes: 'http' } }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when a tag is shorter than two characters', async () => {
			await expect(
				createPublicApplicationRequest.call(
					createContext({ ...base, applicationSettings: { tags: ['a'] } }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('encodes the custom labels as base64', async () => {
			const request = await createPublicApplicationRequest.call(
				createContext({ ...base, dockerSettings: { customLabels: 'traefik.enable=true' } }),
				0,
			);

			expect(request.body?.custom_labels).toBe(
				Buffer.from('traefik.enable=true', 'utf8').toString('base64'),
			);
		});

		it('does not send the custom labels when they are empty', async () => {
			const request = await createPublicApplicationRequest.call(
				createContext({ ...base, dockerSettings: { customLabels: '' } }),
				0,
			);

			expect(request.body).not.toHaveProperty('custom_labels');
		});
	});

	describe('custom labels', () => {
		const identity = {
			projectUuid: 'project-1',
			serverUuid: 'server-1',
			environmentName: 'production',
		};
		const labels = 'traefik.enable=true';
		const encoded = Buffer.from(labels, 'utf8').toString('base64');

		const variants: {
			name: string;
			builder: (this: IExecuteFunctions, itemIndex: number) => Promise<CoolifyRequest>;
			parameters: Record<string, unknown>;
		}[] = [
			{
				name: 'createPublic',
				builder: createPublicApplicationRequest,
				parameters: {
					gitRepository: 'https://github.com/acme/app',
					gitBranch: 'main',
					buildPack: 'nixpacks',
				},
			},
			{
				name: 'createPrivateGithubApp',
				builder: createPrivateGithubAppApplicationRequest,
				parameters: {
					gitRepository: 'https://github.com/acme/app',
					gitBranch: 'main',
					buildPack: 'nixpacks',
					githubAppUuid: 'gh-1',
				},
			},
			{
				name: 'createPrivateDeployKey',
				builder: createPrivateDeployKeyApplicationRequest,
				parameters: {
					gitRepository: 'https://github.com/acme/app',
					gitBranch: 'main',
					buildPack: 'nixpacks',
					privateKeyUuid: 'key-1',
				},
			},
			{
				name: 'createDockerfile',
				builder: createDockerfileApplicationRequest,
				parameters: { dockerfile: 'FROM alpine' },
			},
			{
				name: 'createDockerImage',
				builder: createDockerImageApplicationRequest,
				parameters: { dockerRegistryImageName: 'acme/app' },
			},
		];

		for (const variant of variants) {
			it(`encodes the custom labels of a ${variant.name} request exactly once`, async () => {
				const request = await variant.builder.call(
					createContext({
						...identity,
						...variant.parameters,
						dockerSettings: { customLabels: labels },
					}),
					0,
				);

				expect(request.body?.custom_labels).toBe(encoded);
				expect(request.body?.custom_labels).not.toBe(
					Buffer.from(encoded, 'utf8').toString('base64'),
				);
			});
		}
	});

	describe('createPrivateGithubApp', () => {
		const base = {
			projectUuid: 'project-1',
			serverUuid: 'server-1',
			environmentName: 'production',
			gitRepository: 'acme/app',
			gitBranch: 'main',
			buildPack: 'nixpacks',
			githubAppUuid: 'app-1',
		};

		it('requests the creation of the application', async () => {
			const request = await createPrivateGithubAppApplicationRequest.call(createContext(base), 0);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/private-github-app');
			expect(request.body).toMatchObject({ github_app_uuid: 'app-1' });
		});

		it('fails when the GitHub App uuid is missing', async () => {
			await expect(
				createPrivateGithubAppApplicationRequest.call(
					createContext({ ...base, githubAppUuid: '' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('createPrivateDeployKey', () => {
		const base = {
			projectUuid: 'project-1',
			serverUuid: 'server-1',
			environmentName: 'production',
			gitRepository: 'https://github.com/acme/private',
			gitBranch: 'main',
			buildPack: 'nixpacks',
			privateKeyUuid: 'key-1',
		};

		it('requests the creation of the application', async () => {
			const request = await createPrivateDeployKeyApplicationRequest.call(createContext(base), 0);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/private-deploy-key');
			expect(request.body).toMatchObject({ private_key_uuid: 'key-1' });
		});

		it('fails when the private key uuid is missing', async () => {
			await expect(
				createPrivateDeployKeyApplicationRequest.call(
					createContext({ ...base, privateKeyUuid: '' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('createDockerfile', () => {
		const base = {
			projectUuid: 'project-1',
			serverUuid: 'server-1',
			environmentName: 'production',
			dockerfile: 'FROM alpine\nRUN echo hello',
		};

		it('requests the creation of the application with the base64 encoded Dockerfile', async () => {
			const request = await createDockerfileApplicationRequest.call(createContext(base), 0);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/dockerfile');
			expect(request.body).toMatchObject({
				dockerfile: Buffer.from('FROM alpine\nRUN echo hello', 'utf8').toString('base64'),
			});
		});

		it('fails when the Dockerfile is missing', async () => {
			await expect(
				createDockerfileApplicationRequest.call(createContext({ ...base, dockerfile: '' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('createDockerImage', () => {
		const base = {
			projectUuid: 'project-1',
			serverUuid: 'server-1',
			environmentName: 'production',
			dockerRegistryImageName: 'ghcr.io/acme/app',
			dockerRegistryImageTag: 'latest',
		};

		it('requests the creation of the application', async () => {
			const request = await createDockerImageApplicationRequest.call(createContext(base), 0);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/dockerimage');
			expect(request.body).toMatchObject({
				docker_registry_image_name: 'ghcr.io/acme/app',
				docker_registry_image_tag: 'latest',
			});
		});

		it('fails when the image name is missing', async () => {
			await expect(
				createDockerImageApplicationRequest.call(
					createContext({ ...base, dockerRegistryImageName: '' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('getLogs', () => {
		it('requests the logs without query parameters', async () => {
			const request = await getLogsRequest.call(createContext({ applicationUuid: 'abc-123' }), 0);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/logs');
			expect(request.qs).toBeUndefined();
		});

		it('sends the line count as a number', async () => {
			const request = await getLogsRequest.call(
				createContext({ applicationUuid: 'abc-123', lines: '250' }),
				0,
			);

			expect(request.qs).toEqual({ lines: 250 });
		});

		it('sends the line count all for the whole log', async () => {
			const request = await getLogsRequest.call(
				createContext({ applicationUuid: 'abc-123', lines: 'all' }),
				0,
			);

			expect(request.qs).toEqual({ lines: 'all' });
		});

		it('sends the timestamps and the service name when they are set', async () => {
			const request = await getLogsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					showTimestamps: true,
					serviceName: 'app',
				}),
				0,
			);

			expect(request.qs).toEqual({ show_timestamps: true, service_name: 'app' });
		});

		it('fails when the line count is out of the range of the API', async () => {
			await expect(
				getLogsRequest.call(createContext({ applicationUuid: 'abc-123', lines: '10001' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the line count is not a number', async () => {
			await expect(
				getLogsRequest.call(createContext({ applicationUuid: 'abc-123', lines: 'many' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(getLogsRequest.call(createContext(), 0)).rejects.toThrowError(
				NodeOperationError,
			);
		});
	});

	describe('getPreviewLogs', () => {
		it('requests the logs of the preview deployment', async () => {
			const request = await getPreviewLogsRequest.call(
				createContext({ applicationUuid: 'abc-123', pullRequestId: 42 }),
				0,
			);

			expect(request.method).toBe('GET');
			expect(request.path).toBe('applications/abc-123/previews/42/logs');
			expect(request.qs).toBeUndefined();
		});

		it('sends the query parameters that are set', async () => {
			const request = await getPreviewLogsRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					pullRequestId: 42,
					lines: 'all',
					showTimestamps: true,
					serviceName: 'app',
				}),
				0,
			);

			expect(request.qs).toEqual({
				lines: 'all',
				show_timestamps: true,
				service_name: 'app',
			});
		});

		it('fails when the pull request id is not a positive integer', async () => {
			await expect(
				getPreviewLogsRequest.call(
					createContext({ applicationUuid: 'abc-123', pullRequestId: 0 }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				getPreviewLogsRequest.call(createContext({ pullRequestId: 42 }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('update', () => {
		it('requests the update of the application by its uuid', async () => {
			const request = await updateApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', name: 'my-app' }),
				0,
			);

			expect(request.method).toBe('PATCH');
			expect(request.path).toBe('applications/abc-123');
			expect(request.body).toEqual({ name: 'my-app' });
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				updateApplicationRequest.call(createContext({ name: 'my-app' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when no setting is filled in', async () => {
			await expect(
				updateApplicationRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('sends a boolean setting that is switched on', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					updateDeploymentSettings: { isForceHttpsEnabled: 'enabled' },
				}),
				0,
			);

			expect(request.body).toEqual({ is_force_https_enabled: true });
		});

		it('sends a boolean setting that is switched off', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					updateDeploymentSettings: { isForceHttpsEnabled: 'disabled' },
				}),
				0,
			);

			expect(request.body).toEqual({ is_force_https_enabled: false });
		});

		it('keeps a boolean setting that is unchanged', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					name: 'my-app',
					updateDeploymentSettings: { isForceHttpsEnabled: 'unchanged' },
				}),
				0,
			);

			expect(request.body).toEqual({ name: 'my-app' });
		});

		it('sends a number setting as a number', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					updateDeploymentSettings: { stopGracePeriod: '45' },
				}),
				0,
			);

			expect(request.body).toEqual({ stop_grace_period: 45 });
		});

		it('fails when a number setting is not a number', async () => {
			await expect(
				updateApplicationRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						updateDeploymentSettings: { stopGracePeriod: 'soon' },
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('keeps the settings of the collections the user did not touch', async () => {
			const request = await updateApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', description: 'my app' }),
				0,
			);

			expect(request.body).toEqual({ description: 'my app' });
		});

		it('sends the text settings that are filled in', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					gitRepository: 'https://github.com/example/example.git',
					gitBranch: 'main',
				}),
				0,
			);

			expect(request.body).toEqual({
				git_repository: 'https://github.com/example/example.git',
				git_branch: 'main',
			});
		});

		it('keeps an enumeration that is unchanged', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					name: 'my-app',
					buildPack: 'unchanged',
				}),
				0,
			);

			expect(request.body).toEqual({ name: 'my-app' });
		});

		it('sends an enumeration that is changed', async () => {
			const request = await updateApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', buildPack: 'dockerfile' }),
				0,
			);

			expect(request.body).toEqual({ build_pack: 'dockerfile' });
		});

		it('encodes the custom labels as base64', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					updateDockerSettings: { customLabels: 'traefik.enable=true' },
				}),
				0,
			);

			expect(request.body?.custom_labels).toBe(
				Buffer.from('traefik.enable=true', 'utf8').toString('base64'),
			);
		});

		it('encodes the custom labels exactly once', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					updateDockerSettings: { customLabels: 'traefik.enable=true' },
				}),
				0,
			);

			const encoded = Buffer.from('traefik.enable=true', 'utf8').toString('base64');

			expect(request.body?.custom_labels).toBe(encoded);
			expect(request.body?.custom_labels).not.toBe(Buffer.from(encoded, 'utf8').toString('base64'));
		});

		it('does not send the custom labels when they are empty', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					name: 'my-app',
					updateDockerSettings: { customLabels: '' },
				}),
				0,
			);

			expect(request.body).not.toHaveProperty('custom_labels');
		});

		it('sends the domains that are entered', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					updateApplicationSettings: { domains: 'https://example.com' },
				}),
				0,
			);

			expect(request.body).toEqual({ domains: 'https://example.com' });
		});

		it('removes the domains when the switch is on', async () => {
			const request = await updateApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', removeDomains: true }),
				0,
			);

			expect(request.body).toEqual({ domains: '' });
		});

		it('fails when the exposed ports are not a list of ports', async () => {
			await expect(
				updateApplicationRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						updateApplicationSettings: { portsExposes: '80,https' },
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the commit sha holds forbidden characters', async () => {
			await expect(
				updateApplicationRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						updateGitBuildSettings: { gitCommitSha: 'abc def' },
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('keeps the Docker Compose domains when no service domain was added', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					name: 'my-app',
					updateGitBuildSettings: { dockerComposeDomains: [] },
				}),
				0,
			);

			expect(request.body).toEqual({ name: 'my-app' });
		});

		it('sends the Docker Compose domains of the services that were added', async () => {
			const request = await updateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					updateGitBuildSettings: {
						dockerComposeDomains: [{ name: 'app', domain: 'https://example.com' }],
					},
				}),
				0,
			);

			expect(request.body).toEqual({
				docker_compose_domains: [{ name: 'app', domain: 'https://example.com' }],
			});
		});

		it('fails when a Docker Compose domain has no service name', async () => {
			await expect(
				updateApplicationRequest.call(
					createContext({
						applicationUuid: 'abc-123',
						updateGitBuildSettings: {
							dockerComposeDomains: [{ name: '', domain: 'https://example.com' }],
						},
					}),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('clone', () => {
		it('requests the clone of the application into the destination', async () => {
			const request = await cloneApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', destinationUuid: 'dest-456' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/clone');
			expect(request.body).toEqual({ destination_uuid: 'dest-456' });
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				cloneApplicationRequest.call(createContext({ destinationUuid: 'dest-456' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the destination uuid is missing', async () => {
			await expect(
				cloneApplicationRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('sends the name of the clone when it is entered', async () => {
			const request = await cloneApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					destinationUuid: 'dest-456',
					name: 'my-clone',
				}),
				0,
			);

			expect(request.body).toEqual({ destination_uuid: 'dest-456', name: 'my-clone' });
		});

		it('keeps the name of the clone when it is empty', async () => {
			const request = await cloneApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', destinationUuid: 'dest-456', name: '' }),
				0,
			);

			expect(request.body).toEqual({ destination_uuid: 'dest-456' });
		});

		it('sends the volumes only when they are cloned', async () => {
			const request = await cloneApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					destinationUuid: 'dest-456',
					cloneVolumes: true,
				}),
				0,
			);

			expect(request.body).toEqual({ destination_uuid: 'dest-456', clone_volumes: true });
		});
	});

	describe('rollback', () => {
		it('requests the rollback of the application to the commit', async () => {
			const request = await rollbackApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', commit: 'v1.2.3' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/rollback');
			expect(request.body).toEqual({ commit: 'v1.2.3' });
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				rollbackApplicationRequest.call(createContext({ commit: 'v1.2.3' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the commit is missing', async () => {
			await expect(
				rollbackApplicationRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the commit holds forbidden characters', async () => {
			await expect(
				rollbackApplicationRequest.call(
					createContext({ applicationUuid: 'abc-123', commit: 'v1 2 3' }),
					0,
				),
			).rejects.toThrowError(NodeOperationError);
		});

		it('accepts the HEAD reference', async () => {
			const request = await rollbackApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', commit: 'HEAD' }),
				0,
			);

			expect(request.body).toEqual({ commit: 'HEAD' });
		});
	});

	describe('migrate', () => {
		it('requests the migration of the application into the destination', async () => {
			const request = await migrateApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', destinationUuid: 'dest-456' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/migrate');
			expect(request.body).toEqual({
				destination_uuid: 'dest-456',
				migrate_volumes: true,
			});
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				migrateApplicationRequest.call(createContext({ destinationUuid: 'dest-456' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the destination uuid is missing', async () => {
			await expect(
				migrateApplicationRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('sends the transfer of the volumes when it is switched off', async () => {
			const request = await migrateApplicationRequest.call(
				createContext({
					applicationUuid: 'abc-123',
					destinationUuid: 'dest-456',
					migrateVolumes: false,
				}),
				0,
			);

			expect(request.body).toEqual({
				destination_uuid: 'dest-456',
				migrate_volumes: false,
			});
		});
	});

	describe('move', () => {
		it('requests the move of the application into the environment', async () => {
			const request = await moveApplicationRequest.call(
				createContext({ applicationUuid: 'abc-123', environmentUuid: 'env-789' }),
				0,
			);

			expect(request.method).toBe('POST');
			expect(request.path).toBe('applications/abc-123/move');
			expect(request.body).toEqual({ environment_uuid: 'env-789' });
		});

		it('fails when the application uuid is missing', async () => {
			await expect(
				moveApplicationRequest.call(createContext({ environmentUuid: 'env-789' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});

		it('fails when the environment uuid is missing', async () => {
			await expect(
				moveApplicationRequest.call(createContext({ applicationUuid: 'abc-123' }), 0),
			).rejects.toThrowError(NodeOperationError);
		});
	});

	describe('the booleans whose API default is true', () => {
		const sourceValues: Record<string, unknown> = {
			gitRepository: 'https://github.com/acme/app',
			gitBranch: 'main',
			buildPack: 'nixpacks',
			dockerfile: 'FROM alpine',
			dockerRegistryImageName: 'nginx',
			dockerRegistryImageTag: 'latest',
			githubAppUuid: 'app-1',
			privateKeyUuid: 'key-1',
		};

		const builders: Record<
			string,
			(this: IExecuteFunctions, itemIndex: number) => Promise<CoolifyRequest>
		> = {
			public: createPublicApplicationRequest,
			githubApp: createPrivateGithubAppApplicationRequest,
			privateRepository: createPrivateDeployKeyApplicationRequest,
			dockerfile: createDockerfileApplicationRequest,
			dockerImage: createDockerImageApplicationRequest,
		};

		const base = {
			projectUuid: 'project-1',
			serverUuid: 'server-1',
			environmentName: 'production',
		};

		/**
		 * The parameters of a creation request of a variant.
		 *
		 * @param variant The creation variant.
		 * @returns The parameters the builder of the variant needs.
		 */
		function parametersOf(variant: string): Record<string, unknown> {
			const parameters: Record<string, unknown> = { ...base };

			for (const spec of applicationFieldSpecs(variant as never)) {
				if (spec.group !== 'source') {
					continue;
				}

				const name = applicationFieldUiName(spec.apiName);
				parameters[name] = spec.defaultValue ?? sourceValues[name];
			}

			return parameters;
		}

		it('sends the field as false when the user switched it off', async () => {
			for (const variant of APPLICATION_CREATE_VARIANTS) {
				for (const spec of applicationFieldSpecs(variant)) {
					if (spec.apiDefault !== true) {
						continue;
					}

					const collection =
						APPLICATION_FIELD_COLLECTIONS[spec.group as keyof typeof APPLICATION_FIELD_COLLECTIONS];
					const parameters = parametersOf(variant);
					parameters[collection] = { [applicationFieldUiName(spec.apiName)]: false };

					const request = await builders[variant].call(createContext(parameters), 0);

					expect(request.body, `the field ${spec.apiName} was not sent to the API`).toHaveProperty(
						spec.apiName,
						false,
					);
				}
			}
		});

		it('leaves the field to the default of the API when the user did not add it', async () => {
			for (const variant of APPLICATION_CREATE_VARIANTS) {
				for (const spec of applicationFieldSpecs(variant)) {
					if (spec.apiDefault !== true) {
						continue;
					}

					const request = await builders[variant].call(createContext(parametersOf(variant)), 0);

					expect(
						request.body,
						`the field ${spec.apiName} was sent although the user did not add it`,
					).not.toHaveProperty(spec.apiName);
				}
			}
		});
	});
});
