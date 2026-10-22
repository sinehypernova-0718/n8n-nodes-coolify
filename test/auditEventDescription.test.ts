import { describe, expect, it } from 'vitest';
import { NodeHelpers, type INodeParameters, type INodeProperties } from 'n8n-workflow';

import { Coolify } from '../nodes/Coolify/Coolify.node';
import { auditEventRequestBuilders } from '../nodes/Coolify/requests';

const properties = new Coolify().description.properties;

/**
 * The parameters the description declares for the audit event resource.
 *
 * The audit event operation selector belongs to them through its display
 * options, so the lookup cannot pick the selector of the application
 * resource. The resource selector belongs to every resource, so it is part of
 * this group as well.
 */
function auditParameters(): INodeProperties[] {
	return properties.filter(
		(parameter) =>
			parameter.name === 'resource' ||
			((parameter.displayOptions?.show?.resource as string[] | undefined)?.includes('auditEvent') ??
				false),
	);
}

/**
 * One parameter of the audit event resource.
 *
 * The operation selector of the audit event resource is the only one whose
 * display options show the resource `auditEvent`, so the lookup cannot pick
 * the selector of the application resource.
 *
 * @param name The name of the parameter.
 * @returns The parameter.
 */
function auditParameter(name: string): INodeProperties {
	const parameter = auditParameters().find((entry) => entry.name === name);
	if (!parameter) {
		throw new Error(`The node has no Audit Event parameter "${name}"`);
	}
	return parameter;
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

describe('Coolify node description of the audit event resource', () => {
	it('offers the Audit Event resource with its own description', () => {
		const resources = properties.filter((entry) => entry.name === 'resource');
		const option = (resources[0].options ?? []).find((entry) => entry.value === 'auditEvent');

		expect(option?.name).toBe('Audit Event');
		expect(option?.description).toBeTruthy();
	});

	it('offers only the operations that have a request builder', () => {
		const operation = auditParameter('operation');
		const values = (operation.options ?? []).map((option) => String(option.value));

		expect(values.sort()).toEqual(Object.keys(auditEventRequestBuilders).sort());
	});

	it('offers exactly the implemented audit event operations', () => {
		const operation = auditParameter('operation');
		const values = (operation.options ?? []).map((option) => String(option.value));

		expect(values).toEqual(['list']);
	});

	it('describes the list operation with a name, a value, a description and an action', () => {
		const operation = auditParameter('operation');

		for (const option of operation.options ?? []) {
			expect(option.name).toBeTruthy();
			expect(option.value).toBeTruthy();
			expect(option.description).toBeTruthy();
			expect(option.action).toBeTruthy();
		}
	});

	it('limits the audit events of the team to admins and owners in the description', () => {
		const description = String(
			(auditParameter('operation').options ?? []).find((option) => option.value === 'list')
				?.description,
		);

		expect(description).toMatch(/admins and owners/);
		expect(description).toMatch(/403/);
		expect(description).toMatch(/read:sensitive/);
	});

	it('gives every parameter a default', () => {
		for (const parameter of auditParameters()) {
			expect(parameter.default).toBeDefined();
		}
	});

	it('shows every field of the resource only once', () => {
		const state = editorState('auditEvent', 'list');
		const names = visibleFieldNames(state);

		expect(new Set(names).size).toBe(names.length);
	});

	it('shows exactly the fields the editor needs for the list operation', () => {
		const names = visibleFieldNames(editorState('auditEvent', 'list'));

		expect(names.sort()).toEqual(
			['resource', 'operation', 'perPage', 'page', 'search', 'action', 'source'].sort(),
		);
	});

	it('shows the fields of the audit event only for the audit event list', () => {
		const applicationState = visibleFieldNames(editorState('application', 'list'));

		for (const name of ['perPage', 'page', 'search', 'action', 'source']) {
			expect(
				applicationState,
				`the application list shows the audit event field ${name}`,
			).not.toContain(name);
		}
	});

	it('constrains the optional numbers to the ranges of the API', () => {
		const perPage = auditParameter('perPage');

		expect(perPage.type).toBe('number');
		expect(perPage.typeOptions?.minValue).toBe(1);
		expect(perPage.typeOptions?.maxValue).toBe(100);
		expect(perPage.default).toBeNull();

		const page = auditParameter('page');

		expect(page.type).toBe('number');
		expect(page.typeOptions?.minValue).toBe(1);
		expect(page.default).toBeNull();
	});

	it('offers the unset option and every documented value for the source filter', () => {
		const source = auditParameter('source');

		expect(source.type).toBe('options');
		expect((source.options ?? []).map((option) => String(option.value))).toEqual([
			'all',
			'',
			'api',
			'mcp',
			'scheduler',
			'system',
			'ui',
			'webhook',
		]);
		expect(source.default).toBe('');
		// The unset option and the explicit `all` value both exist, so a filter
		// sent to the API is always the one the user picked explicitly.
	});

	it('keeps the text filters optional', () => {
		for (const name of ['search', 'action']) {
			const parameter = auditParameter(name);

			expect(parameter.type).toBe('string');
			expect(parameter.default).toBe('');
			expect(parameter.required).toBeUndefined();
		}
	});
});
