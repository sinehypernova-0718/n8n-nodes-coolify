import { describe, expect, it } from 'vitest';
import type { INodeProperties } from 'n8n-workflow';

import { Coolify } from '../nodes/Coolify/Coolify.node';
import { applicationRequestBuilders } from '../nodes/Coolify/requests';

const properties = new Coolify().description.properties;

function findParameter(name: string): INodeProperties {
	const parameter = properties.find((entry) => entry.name === name);
	if (!parameter) {
		throw new Error(`The node has no parameter "${name}"`);
	}
	return parameter;
}

function operationValues(): string[] {
	const operation = findParameter('operation');
	return (operation.options ?? []).map((option) => String(option.value));
}

describe('Coolify node description', () => {
	it('exposes exactly one resource', () => {
		const resources = properties.filter((entry) => entry.name === 'resource');

		expect(resources).toHaveLength(1);
		expect(resources[0].options).toHaveLength(1);
	});

	it('offers only the operations that have a request builder', () => {
		expect(operationValues().sort()).toEqual(Object.keys(applicationRequestBuilders).sort());
	});

	it('offers exactly the implemented application operations', () => {
		expect([...operationValues()].sort()).toEqual([
			'addDestination',
			'createDockerImage',
			'createDockerfile',
			'createEnv',
			'createPreviewDeployment',
			'createPrivateDeployKey',
			'createPrivateGithubApp',
			'createPublic',
			'createStorage',
			'createTag',
			'delete',
			'deleteEnv',
			'deletePreviewDeployment',
			'deleteStorage',
			'deleteStorageBackupSchedule',
			'deleteTag',
			'get',
			'getLogs',
			'getPreviewDeployment',
			'getPreviewLogs',
			'list',
			'listDestinations',
			'listEnvs',
			'listPreviewDeployments',
			'listRollbackImages',
			'listStorages',
			'listTags',
			'removeDestination',
			'restart',
			'runStorageBackup',
			'setStorageBackupSchedule',
			'start',
			'stop',
			'updateEnv',
			'updateEnvsBulk',
			'updatePreviewDomains',
			'updateStorage',
		]);
	});

	it('gives every operation a unique value', () => {
		const values = operationValues();

		expect(new Set(values).size).toBe(values.length);
	});

	it('gives every operation a request builder that resolves the same operation', () => {
		for (const value of operationValues()) {
			expect(typeof applicationRequestBuilders[value]).toBe('function');
		}
	});

	it('describes every operation with a name, a value, a description and an action', () => {
		const operation = findParameter('operation');

		for (const option of operation.options ?? []) {
			expect(option.name).toBeTruthy();
			expect(option.value).toBeTruthy();
			expect(option.description).toBeTruthy();
			expect(option.action).toBeTruthy();
		}
	});

	it('shows every operation field only for the operations it belongs to', () => {
		const knownParameters = new Set(properties.map((entry) => entry.name));

		for (const parameter of properties) {
			const shown = parameter.displayOptions?.show;
			if (!shown) {
				continue;
			}

			for (const key of Object.keys(shown)) {
				if (key.startsWith('@')) {
					continue;
				}
				expect(knownParameters.has(key)).toBe(true);
			}
		}
	});

	it('gives every parameter a default', () => {
		for (const parameter of properties) {
			expect(parameter.default).toBeDefined();
		}
	});

	it('shows the source fields of every creation operation', () => {
		const required: Record<string, string[]> = {
			createPublic: ['gitRepository', 'gitBranch', 'buildPack'],
			createPrivateGithubApp: ['gitRepository', 'gitBranch', 'buildPack', 'githubAppUuid'],
			createPrivateDeployKey: ['gitRepository', 'gitBranch', 'buildPack', 'privateKeyUuid'],
			createDockerfile: ['dockerfile'],
			createDockerImage: ['dockerRegistryImageName'],
		};

		for (const [operation, names] of Object.entries(required)) {
			const shown = properties
				.filter((parameter) =>
					(parameter.displayOptions?.show?.operation as string[] | undefined)?.includes(operation),
				)
				.map((parameter) => parameter.name);

			for (const name of names) {
				expect(shown).toContain(name);
			}
		}
	});

	it('shows the identity fields for every creation operation', () => {
		const creationOperations = [
			'createPublic',
			'createPrivateGithubApp',
			'createPrivateDeployKey',
			'createDockerfile',
			'createDockerImage',
		];

		for (const operation of creationOperations) {
			const shown = properties
				.filter((parameter) =>
					(parameter.displayOptions?.show?.operation as string[] | undefined)?.includes(operation),
				)
				.map((parameter) => parameter.name);

			expect(shown).toContain('projectUuid');
			expect(shown).toContain('serverUuid');
			expect(shown).toContain('environmentName');
			expect(shown).toContain('environmentUuid');
		}
	});
});
