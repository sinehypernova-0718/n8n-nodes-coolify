import { NodeOperationError, type IDataObject, type ILoadOptionsFunctions } from 'n8n-workflow';

import { coolifyApiRequest } from '../shared/apiRequest';
import { locatorValue } from '../shared/locatorValue';
import { operationOptionsParameterName } from '../shared/parameterResolution';

type LocatorOption = { name: string; value: string };

function object(value: unknown): value is IDataObject {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function records(
	ctx: ILoadOptionsFunctions,
	path: string,
	filter: string,
): Promise<LocatorOption[]> {
	const response = await coolifyApiRequest(ctx, 'GET', path);
	if (!Array.isArray(response)) {
		throw new NodeOperationError(ctx.getNode(), `Coolify returned an invalid ${path} list`);
	}

	const results: LocatorOption[] = [];
	for (const entry of response) {
		if (!object(entry) || typeof entry.uuid !== 'string' || typeof entry.name !== 'string') {
			throw new NodeOperationError(ctx.getNode(), `Coolify returned an invalid entry in ${path}`);
		}
		if (filter && !entry.name.toLowerCase().includes(filter.toLowerCase())) continue;
		results.push({ name: entry.name, value: entry.uuid });
	}
	return results;
}

export async function searchApplications(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	return { results: await records(this, 'applications', filter ?? '') };
}

export async function searchDatabases(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	return { results: await records(this, 'databases', filter ?? '') };
}

export async function searchProjects(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	return { results: await records(this, 'projects', filter ?? '') };
}

export async function searchServers(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	return { results: await records(this, 'servers', filter ?? '') };
}

export async function searchTags(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	const response = await coolifyApiRequest(this, 'GET', 'tags');
	if (!Array.isArray(response)) {
		throw new NodeOperationError(this.getNode(), 'Coolify returned an invalid tags list');
	}
	const needle = (filter ?? '').toLowerCase();
	return {
		results: response
			.map((entry) => {
				if (!object(entry) || typeof entry.uuid !== 'string' || typeof entry.name !== 'string') {
					throw new NodeOperationError(this.getNode(), 'Coolify returned an invalid tag entry');
				}
				return { name: entry.name, value: entry.name };
			})
			.filter((entry) => !needle || entry.name.toLowerCase().includes(needle)),
	};
}

export async function getTagNames(
	this: ILoadOptionsFunctions,
): Promise<Array<{ name: string; value: string }>> {
	const result = await searchTags.call(this);
	return result.results;
}

export async function searchCloudInitScripts(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	return { results: await records(this, 'cloud-init-scripts', filter ?? '') };
}

export async function searchDestinations(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	const operation = this.getCurrentNodeParameter('operation');
	const options =
		typeof operation === 'string'
			? (this.getCurrentNodeParameter(operationOptionsParameterName('application', operation)) ??
				this.getCurrentNodeParameter(operationOptionsParameterName('database', operation)))
			: undefined;
	const server =
		object(options) && options.serverUuid !== undefined
			? options.serverUuid
			: this.getCurrentNodeParameter('serverUuid');
	const serverUuid = locatorValue(server).trim();
	if (!serverUuid) return { results: [] };
	return {
		results: await records(
			this,
			`servers/${encodeURIComponent(serverUuid)}/destinations`,
			filter ?? '',
		),
	};
}

export async function getEnvironments(
	this: ILoadOptionsFunctions,
): Promise<Array<{ name: string; value: string }>> {
	const project = this.getCurrentNodeParameter('projectUuid');
	const projectUuid = locatorValue(project).trim();
	if (!projectUuid) return [];
	const response = await coolifyApiRequest(
		this,
		'GET',
		`projects/${encodeURIComponent(projectUuid)}/environments`,
	);
	if (!Array.isArray(response)) {
		throw new NodeOperationError(this.getNode(), 'Coolify returned an invalid environments list');
	}
	return response.map((entry) => {
		if (!object(entry) || typeof entry.name !== 'string') {
			throw new NodeOperationError(this.getNode(), 'Coolify returned an invalid environment entry');
		}
		return { name: entry.name, value: entry.name };
	});
}

/**
 * List the environments of the selected project for a resource locator.
 *
 * The Coolify API publishes no UUID for an environment in the project list, so
 * the value of the option is the name. The `environment_uuid` field is served
 * by the "By UUID" mode of the locator instead.
 */
export async function searchEnvironments(
	this: ILoadOptionsFunctions,
	filter?: string,
): Promise<{ results: LocatorOption[] }> {
	const projectUuid = locatorValue(this.getCurrentNodeParameter('projectUuid')).trim();
	if (!projectUuid) return { results: [] };

	const response = await coolifyApiRequest(
		this,
		'GET',
		`projects/${encodeURIComponent(projectUuid)}/environments`,
	);
	if (!Array.isArray(response)) {
		throw new NodeOperationError(this.getNode(), 'Coolify returned an invalid environments list');
	}

	const needle = (filter ?? '').toLowerCase();
	return {
		results: response
			.map((entry) => {
				if (!object(entry) || typeof entry.name !== 'string') {
					throw new NodeOperationError(
						this.getNode(),
						'Coolify returned an invalid environment entry',
					);
				}
				return { name: entry.name, value: entry.name };
			})
			.filter((entry) => !needle || entry.name.toLowerCase().includes(needle)),
	};
}
