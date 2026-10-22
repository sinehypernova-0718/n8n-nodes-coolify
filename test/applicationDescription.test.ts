import { describe, expect, it } from 'vitest';
import { NodeHelpers, type INodeParameters, type INodeProperties } from 'n8n-workflow';

import { Coolify } from '../nodes/Coolify/Coolify.node';
import { applicationRequestBuilders } from '../nodes/Coolify/requests';
import {
	APPLICATION_CREATE_VARIANTS,
	APPLICATION_FIELD_COLLECTIONS,
	applicationCollectionGroups,
	applicationFieldSpecs,
	applicationFieldUiName,
} from '../nodes/Coolify/requests/application/applicationFields';
import {
	APPLICATION_UPDATE_COLLECTIONS,
	applicationUpdateFieldSpecs,
} from '../nodes/Coolify/requests/application/applicationUpdateFields';
import { APPLICATION_CREATE_OPERATIONS } from '../nodes/Coolify/descriptions/Application';
import {
	STORAGE_BACKUP_SCHEDULE_COLLECTIONS,
	STORAGE_BACKUP_SCHEDULE_ENABLED,
	STORAGE_BACKUP_SCHEDULE_FIELDS,
	storageBackupScheduleCollectionFields,
} from '../nodes/Coolify/requests/application/storageBackupScheduleFields';

const properties = new Coolify().description.properties;

/**
 * The names of the collections of the creation and of the update operation.
 */
const collectionNames = new Set([
	...Object.values(APPLICATION_FIELD_COLLECTIONS),
	...Object.values(APPLICATION_UPDATE_COLLECTIONS),
	...Object.values(STORAGE_BACKUP_SCHEDULE_COLLECTIONS),
]);

/**
 * The values of the parameters that decide which fields the editor shows, on
 * top of the selected resource and operation.
 *
 * The storage type, the mode of the preview domains, the S3 switch and the
 * switch that removes the domains are the parameters the description of the
 * other operations uses to show a field.
 */
const auxiliaryStates: Record<string, unknown[]> = {
	type: ['persistent', 'file'],
	mode: ['application', 'dockerCompose'],
	saveS3: [true, false],
	removeDomains: [true, false],
};

/**
 * The parameters of the node in a state of the editor.
 *
 * @param operation The selected operation.
 * @param values The values of the parameters that decide the visible fields.
 * @returns The parameters of the node.
 */
function editorState(operation: string, values: Record<string, unknown> = {}): INodeParameters {
	return { resource: 'application', operation, ...values } as INodeParameters;
}

/**
 * Every state an operation of the editor can be in.
 *
 * @param operation The selected operation.
 * @returns The states of the editor.
 */
function editorStates(operation: string): INodeParameters[] {
	let states: INodeParameters[] = [editorState(operation)];

	for (const key of Object.keys(auxiliaryStates)) {
		states = states.flatMap((state) =>
			auxiliaryStates[key].map((value) => editorState(operation, { ...state, [key]: value })),
		);
	}

	return states;
}

/**
 * The fields the editor shows in a state of the editor.
 *
 * The test uses the display logic of n8n itself, so it sees the fields the
 * editor shows and not the fields the description declares.
 *
 * @param state The parameters of the node.
 * @returns The visible fields.
 */
function visibleProperties(state: INodeParameters): INodeProperties[] {
	return properties.filter((parameter) =>
		NodeHelpers.displayParameter(state, parameter, null, null, state),
	);
}

/**
 * The names of the fields the editor shows, the collections included.
 *
 * @param state The parameters of the node.
 * @returns The names of the visible fields.
 */
function visibleFieldNames(state: INodeParameters): string[] {
	const names: string[] = [];

	for (const parameter of visibleProperties(state)) {
		if (parameter.type === 'collection' && collectionNames.has(parameter.name)) {
			for (const option of parameter.options ?? []) {
				names.push(option.name);
			}
			continue;
		}

		names.push(parameter.name);
	}

	return names.filter((name) => name !== 'resource' && name !== 'operation');
}

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
	it('exposes exactly the resources Application and Audit Event', () => {
		const resources = properties.filter((entry) => entry.name === 'resource');

		expect(resources).toHaveLength(1);
		expect((resources[0].options ?? []).map((option) => String(option.value))).toEqual([
			'application',
			'auditEvent',
		]);
	});

	it('offers only the operations that have a request builder', () => {
		expect(operationValues().sort()).toEqual(Object.keys(applicationRequestBuilders).sort());
	});

	it('offers exactly the implemented application operations', () => {
		expect([...operationValues()].sort()).toEqual([
			'addDestination',
			'clone',
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
			'migrate',
			'move',
			'removeDestination',
			'restart',
			'rollback',
			'runStorageBackup',
			'setStorageBackupSchedule',
			'start',
			'stop',
			'update',
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

	it('gives every operation an action of its own', () => {
		const operation = findParameter('operation');
		const actions = (operation.options ?? []).map((option) => option.action ?? '');

		expect(new Set(actions).size, 'two operations share an action').toBe(actions.length);
	});

	it('tells the creation operations apart in their action', () => {
		const operation = findParameter('operation');
		const creation = (operation.options ?? []).filter((option) =>
			option.value?.toString().startsWith('create'),
		);

		const actions = creation.map((option) => option.action);

		expect(creation.length).toBeGreaterThan(1);
		expect(new Set(actions).size).toBe(actions.length);
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

	it('shows exactly the fields of the update contract for the update operation', () => {
		const contract = applicationUpdateFieldSpecs()
			.map((spec) => applicationFieldUiName(spec.apiName))
			.sort();

		const shown = properties
			.filter((parameter) =>
				(parameter.displayOptions?.show?.operation as string[] | undefined)?.includes('update'),
			)
			.flatMap((parameter) =>
				parameter.type === 'collection'
					? (parameter.options ?? []).map((item) => item.name)
					: [parameter.name],
			)
			.filter((name) => !['applicationUuid', 'removeDomains', 'updateNotice'].includes(name))
			.sort();

		expect(shown).toEqual(contract);
	});

	it('offers the fields the update endpoint of the Coolify API publishes', () => {
		const names = applicationUpdateFieldSpecs().map((spec) => spec.apiName);

		expect(names).toHaveLength(89);
		expect(new Set(names).size).toBe(names.length);
	});

	it('does not offer the fields the update endpoint of the Coolify API rejects', () => {
		const names = applicationUpdateFieldSpecs().map((spec) => spec.apiName);

		for (const rejected of [
			'project_uuid',
			'server_uuid',
			'environment_name',
			'github_app_uuid',
			'destination_uuid',
			'dockerfile',
		]) {
			expect(names).not.toContain(rejected);
		}
	});

	it('shows every field of an operation only once', () => {
		for (const operation of operationValues()) {
			for (const state of editorStates(operation)) {
				const names = visibleProperties(state).map((parameter) => parameter.name);

				expect(new Set(names).size, `the operation ${operation} shows a field twice`).toBe(
					names.length,
				);
			}
		}
	});

	it('shows every field of a collection only once', () => {
		for (const operation of operationValues()) {
			for (const state of editorStates(operation)) {
				const visible = visibleProperties(state);
				const names = visible.map((parameter) => parameter.name);

				for (const parameter of visible) {
					if (parameter.type !== 'collection' || !parameter.options) {
						continue;
					}

					const items = parameter.options.map((option) => option.name);

					expect(new Set(items).size, `the collection ${parameter.name} shows a field twice`).toBe(
						items.length,
					);

					for (const item of items) {
						expect(
							names,
							`the field ${item} of the collection ${parameter.name} is a field of the operation as well`,
						).not.toContain(item);
					}
				}
			}
		}
	});

	it('shows the fields of a creation variant only', () => {
		for (const variant of APPLICATION_CREATE_VARIANTS) {
			const operation = APPLICATION_CREATE_OPERATIONS[variant];
			const visible = visibleProperties(editorState(operation));

			const expected = applicationFieldSpecs(variant)
				.filter((spec) => spec.group === 'identity' || spec.group === 'source')
				.map((spec) => applicationFieldUiName(spec.apiName));

			const shown = visible
				.filter(
					(parameter) =>
						!collectionNames.has(parameter.name) &&
						parameter.name !== 'operation' &&
						parameter.name !== 'resource',
				)
				.map((parameter) => parameter.name);

			expect(shown.sort()).toEqual([...expected].sort());

			const expectedCollections = applicationCollectionGroups(variant).map(
				(group) => APPLICATION_FIELD_COLLECTIONS[group.group],
			);

			const shownCollections = visible
				.filter((parameter) => collectionNames.has(parameter.name))
				.map((parameter) => parameter.name);

			expect(shownCollections.sort()).toEqual([...expectedCollections].sort());
		}
	});

	it('shows the fields that belong to another creation variant never', () => {
		for (const variant of APPLICATION_CREATE_VARIANTS) {
			const operation = APPLICATION_CREATE_OPERATIONS[variant];
			const shown = visibleFieldNames(editorState(operation));

			const own = new Set(
				applicationFieldSpecs(variant).map((spec) => applicationFieldUiName(spec.apiName)),
			);

			for (const other of APPLICATION_CREATE_VARIANTS) {
				if (other === variant) {
					continue;
				}

				for (const spec of applicationFieldSpecs(other)) {
					if (spec.group !== 'source') {
						continue;
					}

					const name = applicationFieldUiName(spec.apiName);
					if (own.has(name)) {
						continue;
					}

					expect(
						shown,
						`the operation ${operation} shows the field ${name} of the variant ${other}`,
					).not.toContain(name);
				}
			}
		}
	});

	it('shows the optional fields of a creation operation in the application settings', () => {
		const optional = [
			'domains',
			'noindexDomains',
			'portsExposes',
			'portsMappings',
			'instantDeploy',
			'tags',
			'autogenerateDomain',
			'forceDomainOverride',
			'redirect',
		];

		for (const variant of APPLICATION_CREATE_VARIANTS) {
			const operation = APPLICATION_CREATE_OPERATIONS[variant];
			const visible = visibleProperties(editorState(operation));
			const names = visible.map((parameter) => parameter.name);

			for (const name of optional) {
				expect(
					names,
					`the operation ${operation} shows the optional field ${name} at the top level`,
				).not.toContain(name);
			}

			const settings = visible.find(
				(parameter) => parameter.name === APPLICATION_FIELD_COLLECTIONS.common,
			);

			expect(settings, `the operation ${operation} has no application settings`).toBeDefined();
			expect((settings?.options ?? []).map((option) => option.name).sort()).toEqual(
				[...optional].sort(),
			);
		}
	});

	it('shows the optional fields of the update operation in the application settings', () => {
		const visible = visibleProperties(editorState('update'));
		const names = visible.map((parameter) => parameter.name);

		for (const name of [
			'domains',
			'noindexDomains',
			'portsExposes',
			'portsMappings',
			'instantDeploy',
			'forceDomainOverride',
			'redirect',
		]) {
			expect(names, `the update shows the optional field ${name} at the top level`).not.toContain(
				name,
			);
		}

		const settings = visible.find(
			(parameter) => parameter.name === APPLICATION_UPDATE_COLLECTIONS.common,
		);

		expect(settings, 'the update has no application settings').toBeDefined();
		expect((settings?.options ?? []).map((option) => option.name).sort()).toEqual([
			'domains',
			'forceDomainOverride',
			'instantDeploy',
			'noindexDomains',
			'portsExposes',
			'portsMappings',
			'redirect',
		]);
	});

	it('gives every boolean whose API default is true that default in the editor', () => {
		for (const variant of APPLICATION_CREATE_VARIANTS) {
			for (const spec of applicationFieldSpecs(variant)) {
				if (spec.apiDefault !== true) {
					continue;
				}

				expect(
					spec.defaultValue,
					`the field ${spec.apiName} does not carry the default of the API`,
				).toBe(true);
			}
		}
	});

	it('renders every boolean whose API default is true with that default', () => {
		const apiDefaults = new Set(
			APPLICATION_CREATE_VARIANTS.flatMap((variant) =>
				applicationFieldSpecs(variant)
					.filter((spec) => spec.apiDefault === true)
					.map((spec) => applicationFieldUiName(spec.apiName)),
			),
		);
		const createCollections = new Set(Object.values(APPLICATION_FIELD_COLLECTIONS));

		for (const parameter of properties) {
			if (parameter.type !== 'collection' || !createCollections.has(parameter.name)) {
				continue;
			}

			for (const option of parameter.options ?? []) {
				if (!apiDefaults.has(option.name)) {
					continue;
				}

				expect(
					option.default,
					`the field ${option.name} of the collection ${parameter.name} does not carry the default of the API`,
				).toBe(true);
			}
		}
	});

	it('shows the shared fields of every creation variant exactly once', () => {
		const shared = ['projectUuid', 'serverUuid', 'environmentName', 'environmentUuid'];

		for (const variant of APPLICATION_CREATE_VARIANTS) {
			const visible = visibleProperties(editorState(APPLICATION_CREATE_OPERATIONS[variant]));

			for (const name of shared) {
				expect(
					visible.filter((parameter) => parameter.name === name),
					`the operation ${APPLICATION_CREATE_OPERATIONS[variant]} shows the field ${name} more than once`,
				).toHaveLength(1);
			}
		}
	});

	it('declares a source field of the creation variants once per variant', () => {
		const creationOperations = new Set(Object.values(APPLICATION_CREATE_OPERATIONS));

		const declaredFor = (name: string): INodeProperties[] =>
			properties.filter((parameter) => {
				if (parameter.name !== name) {
					return false;
				}

				const operations = parameter.displayOptions?.show?.operation as string[] | undefined;

				return (
					operations !== undefined &&
					operations.every((operation) => creationOperations.has(operation))
				);
			});

		for (const variant of APPLICATION_CREATE_VARIANTS) {
			for (const spec of applicationFieldSpecs(variant)) {
				if (spec.group !== 'source') {
					continue;
				}

				const name = applicationFieldUiName(spec.apiName);

				const variants = APPLICATION_CREATE_VARIANTS.filter((other) =>
					applicationFieldSpecs(other).some(
						(candidate) =>
							candidate.group === 'source' && applicationFieldUiName(candidate.apiName) === name,
					),
				).length;

				expect(
					declaredFor(name),
					`the field ${name} is not declared once per variant`,
				).toHaveLength(variants);
			}
		}
	});

	it('shows exactly the fields a creation request sends', () => {
		for (const variant of APPLICATION_CREATE_VARIANTS) {
			const shown = visibleFieldNames(editorState(APPLICATION_CREATE_OPERATIONS[variant]));

			const sent = applicationFieldSpecs(variant).map((spec) =>
				applicationFieldUiName(spec.apiName),
			);

			expect(shown.sort()).toEqual([...sent].sort());
		}
	});

	it('shows exactly the fields an update request sends', () => {
		const shown = visibleFieldNames(editorState('update')).filter(
			(name) => !['applicationUuid', 'removeDomains', 'updateNotice'].includes(name),
		);

		const sent = applicationUpdateFieldSpecs().map((spec) => applicationFieldUiName(spec.apiName));

		expect(shown.sort()).toEqual([...sent].sort());
	});

	it('groups the values of the storage backup schedule in collections', () => {
		const names = visibleProperties(editorState('setStorageBackupSchedule')).map(
			(parameter) => parameter.name,
		);

		for (const collection of Object.values(STORAGE_BACKUP_SCHEDULE_COLLECTIONS)) {
			expect(names, `the operation shows no collection ${collection}`).toContain(collection);
		}

		for (const field of STORAGE_BACKUP_SCHEDULE_FIELDS) {
			expect(names, `the operation shows the field ${field.uiName} at the top level`).not.toContain(
				field.uiName,
			);
		}
	});

	it('shows the fields of a collection of the storage backup schedule', () => {
		const visible = visibleProperties(editorState('setStorageBackupSchedule'));

		for (const collection of Object.values(STORAGE_BACKUP_SCHEDULE_COLLECTIONS)) {
			const parameter = visible.find((entry) => entry.name === collection);
			const items = (parameter?.options ?? []).map((option) => option.name);
			const expected = storageBackupScheduleCollectionFields(collection).map(
				(field) => field.uiName,
			);

			expect(items, `the collection ${collection} shows other fields`).toEqual(expected);
		}
	});

	it('shows the S3 fields of the storage backup schedule only when the S3 backups are switched on', () => {
		const collection = STORAGE_BACKUP_SCHEDULE_COLLECTIONS.options;
		const parameter = properties.find((entry) => entry.name === collection);
		const items = parameter?.options ?? [];

		expect(items.length).toBeGreaterThan(0);

		for (const saveS3 of [true, false]) {
			const state = editorState('setStorageBackupSchedule', {
				[collection]: { saveS3 },
			});

			for (const item of items) {
				const shown = NodeHelpers.displayParameterPath(state, item, collection, null, null);
				const expected = item.name === 'saveS3' || item.name === 'stopDuringBackup' || saveS3;

				expect(shown, `the field ${item.name} is not shown for saveS3 ${saveS3}`).toBe(expected);
			}
		}
	});

	it('shows exactly the fields the storage backup schedule request sends', () => {
		const shown = visibleFieldNames(editorState('setStorageBackupSchedule')).filter(
			(name) =>
				!['applicationUuid', 'storageUuid', 'setStorageBackupScheduleWarning'].includes(name),
		);

		const sent = [
			'frequency',
			STORAGE_BACKUP_SCHEDULE_ENABLED.uiName,
			...STORAGE_BACKUP_SCHEDULE_FIELDS.map((field) => field.uiName),
		];

		expect(shown.sort()).toEqual([...sent].sort());
	});
});
