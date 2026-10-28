import { type IDataObject, type IExecuteFunctions, NodeOperationError } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { requireDatabaseUuid } from './parameters';

/**
 * Value of the line count that asks the API for the whole log.
 */
const ALL_LINES = 'all';

/**
 * Lowest line count the Coolify API accepts, `-1` is an alias for the default.
 */
const MIN_LINES = -1;

/**
 * Highest line count the Coolify API accepts.
 */
const MAX_LINES = 10_000;

/**
 * Read the line count of a database log request.
 *
 * The Coolify API accepts a number of lines or the value `all`, and it uses
 * 100 lines when the parameter is not part of the request.
 *
 * @param ctx The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The line count, or undefined when the parameter was not set.
 */
export function readDatabaseLogLines(
	ctx: IExecuteFunctions,
	itemIndex: number,
): number | string | undefined {
	const lines = (ctx.getNodeParameter('lines', itemIndex, '') as string).trim();

	if (lines === '') {
		return undefined;
	}

	if (lines.toLowerCase() === ALL_LINES) {
		return ALL_LINES;
	}

	const parsed = Number(lines);

	if (!Number.isInteger(parsed) || parsed < MIN_LINES || parsed > MAX_LINES) {
		throw new NodeOperationError(
			ctx.getNode(),
			`The number of lines must be an integer between ${MIN_LINES} and ${MAX_LINES}, or ${ALL_LINES}`,
			{ itemIndex },
		);
	}

	return parsed;
}

/**
 * Build the request that reads the logs of a database.
 *
 * The Coolify API needs a token with the `read:sensitive` or the `root`
 * ability for the logs of a database.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `GET /databases/{uuid}/logs`.
 */
export async function getDatabaseLogsRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	const databaseUuid = requireDatabaseUuid(this, itemIndex, 'read the logs of a database');

	const request: CoolifyRequest = {
		method: 'GET',
		path: `databases/${databaseUuid}/logs`,
	};

	const qs: IDataObject = {};

	const lines = readDatabaseLogLines(this, itemIndex);
	if (lines !== undefined) {
		qs.lines = lines;
	}

	if (this.getNodeParameter('showTimestamps', itemIndex, false) === true) {
		qs.show_timestamps = true;
	}

	if (Object.keys(qs).length > 0) {
		request.qs = qs;
	}

	return request;
}
