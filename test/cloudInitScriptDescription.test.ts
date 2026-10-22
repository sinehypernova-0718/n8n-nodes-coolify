import { describe, expect, it } from 'vitest';
import { NodeHelpers, type INodeParameters, type INodeProperties } from 'n8n-workflow';

import { Coolify } from '../nodes/Coolify/Coolify.node';
import { cloudInitScriptRequestBuilders } from '../nodes/Coolify/requests';

const properties = new Coolify().description.properties;

/**
 * The parameters the description declares for the cloud init script resource.
 *
 * The cloud init script operation selector belongs to them through its
 * display options, so the lookup cannot pick a selector of another resource.
 * The resource selector belongs to every resource, so it is part of this
 * group as well.
 */
function cloudInitScriptParameters(): INodeProperties[] {
	return properties.filter(
		(parameter) =>
			parameter.name === 'resource' ||
			((parameter.displayOptions?.show?.resource as string[] | undefined)?.includes(
				'cloudInitScript',
			) ??
				false),
	);
}

/**
 * One parameter of the cloud init script resource.
 *
 * @param name The name of the parameter.
 * @returns The parameter.
 */
function cloudInitScriptParameter(name: string): INodeProperties {
	const parameter = cloudInitScriptParameters().find((entry) => entry.name === name);
	if (!parameter) {
		throw new Error(`The node has no Cloud Init Script parameter "${name}"`);
	}
	return parameter;
}

/**
 * The names of a parameter, once for every operation it is declared in.
 *
 * The fields of an operation are rendered once per operation, so the same
 * parameter name occurs several times in the description. The copies are
 * mutually exclusive through their display options.
 *
 * @param name The name of the parameter.
 * @returns The values of the update operation of the parameter.
 */
function cloudInitScriptParameterVariants(name: string): INodeProperties[] {
	return cloudInitScriptParameters().filter((entry) => entry.name === name);
}

/**
 * The parameters of the node in a state of the editor.
 *
 * @param resource The selected resource.
 * @param operation The selected operation.
 * @returns The parameters of the node.
 */
function editorState(resource: string, operation?: string): INodeParameters {
	return { resource, ...(operation === undefined ? {} : { operation }) } as INodeParameters;
}

/**
 * The fields the editor shows in a state of the editor.
 *
 * The test uses the display logic of n8n itself, so it sees the fields the
 * editor shows and not the fields the description declares.
 *
 * @param state The parameters of the node.
 * @returns The names of the visible fields.
 */
function visibleFieldNames(state: INodeParameters): string[] {
	return properties
		.filter((parameter) => NodeHelpers.displayParameter(state, parameter, null, null, state))
		.map((parameter) => parameter.name);
}

describe('Coolify node description of the cloud init script resource', () => {
	it('offers the Cloud Init Script resource with its own description', () => {
		const resources = properties.filter((entry) => entry.name === 'resource');
		const option = (resources[0].options ?? []).find((entry) => entry.value === 'cloudInitScript');

		expect(option?.name).toBe('Cloud Init Script');
		expect(option?.description).toBeTruthy();
	});

	it('offers only the operations that have a request builder', () => {
		const operation = cloudInitScriptParameter('operation');
		const values = (operation.options ?? []).map((option) => String(option.value));

		expect(values.sort()).toEqual(Object.keys(cloudInitScriptRequestBuilders).sort());
	});

	it('offers exactly the implemented cloud init script operations, in the documented order', () => {
		const operation = cloudInitScriptParameter('operation');
		const values = (operation.options ?? []).map((option) => String(option.value));

		expect(values).toEqual(['create', 'delete', 'get', 'list', 'update']);
	});

	it('describes every operation with a name, a value, a description and an action', () => {
		const operation = cloudInitScriptParameter('operation');

		for (const option of operation.options ?? []) {
			expect(option.name).toBeTruthy();
			expect(option.value).toBeTruthy();
			expect(option.description).toBeTruthy();
			expect(option.action).toBeTruthy();
		}
	});

	it('mentions the permission and the sensitive content in every operation description', () => {
		const operation = cloudInitScriptParameter('operation');

		for (const option of operation.options ?? []) {
			const description = String(option.description);

			// Every operation of the resource is restricted to team admins and
			// owners; the content of a script is returned only to tokens that
			// may read sensitive data, and only the operations that answer
			// with content carry that note.
			expect(description).toMatch(/403/);
			if (option.value === 'get' || option.value === 'list') {
				expect(description).toMatch(/read:sensitive/);
			}
		}
	});

	it('warns in the editor before a script is deleted', () => {
		const warning = cloudInitScriptParameter('deleteWarning');

		expect(warning.type).toBe('notice');
		expect(warning.displayOptions?.show?.operation).toEqual(['delete']);
	});

	it('gives every parameter a default', () => {
		for (const parameter of cloudInitScriptParameters()) {
			expect(parameter.default).toBeDefined();
		}
	});

	it('declares the script identifier as a required text in every single script operation', () => {
		const uuids = cloudInitScriptParameterVariants('cloudInitScriptUuid');
		const operations = uuids.flatMap((uuid) => uuid.displayOptions?.show?.operation ?? []);

		expect(operations.sort()).toEqual(['delete', 'get', 'update']);

		for (const uuid of uuids) {
			expect(uuid.type).toBe('string');
			expect(uuid.default).toBe('');
			expect(uuid.required).toBe(true);
		}
	});

	it('requires the name and the script for the creation only', () => {
		const name = cloudInitScriptParameterVariants('name');
		const required = name.filter((parameter) => parameter.required === true);

		expect(required).toHaveLength(1);
		expect(required[0].displayOptions?.show?.operation).toEqual(['create']);

		const script = cloudInitScriptParameterVariants('script');
		expect(script.filter((parameter) => parameter.required === true)).toHaveLength(1);
	});

	it('renders the script as a multi-line text control', () => {
		const script = cloudInitScriptParameter('script');

		expect(script.type).toBe('string');
		expect(script.typeOptions?.rows).toBeGreaterThan(1);
	});

	it('shows every field of the resource only once, for every operation', () => {
		for (const operation of ['create', 'delete', 'get', 'list', 'update']) {
			const names = visibleFieldNames(editorState('cloudInitScript', operation));

			expect(new Set(names).size, `operation ${operation}`).toBe(names.length);
		}
	});

	it('shows exactly the fields the editor needs for every operation', () => {
		expect(visibleFieldNames(editorState('cloudInitScript', 'create')).sort()).toEqual(
			['operation', 'name', 'resource', 'script'].sort(),
		);
		expect(visibleFieldNames(editorState('cloudInitScript', 'delete')).sort()).toEqual(
			['cloudInitScriptUuid', 'deleteWarning', 'operation', 'resource'].sort(),
		);
		expect(visibleFieldNames(editorState('cloudInitScript', 'get')).sort()).toEqual(
			['cloudInitScriptUuid', 'operation', 'resource'].sort(),
		);
		expect(visibleFieldNames(editorState('cloudInitScript', 'list')).sort()).toEqual(
			['operation', 'resource'].sort(),
		);
		expect(visibleFieldNames(editorState('cloudInitScript', 'update')).sort()).toEqual(
			['cloudInitScriptUuid', 'name', 'operation', 'resource', 'script'].sort(),
		);
	});

	it('shows the fields of the cloud init script only for the cloud init script', () => {
		for (const resource of ['application', 'auditEvent']) {
			const state = visibleFieldNames(editorState(resource, 'list'));

			// The name field is shared with the application creation, so only
			// the fields of this resource are checked.
			for (const name of ['cloudInitScriptUuid', 'script', 'deleteWarning']) {
				expect(
					state,
					`the ${resource} list shows the cloud init script field ${name}`,
				).not.toContain(name);
			}
		}
	});
});
