import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildCreateDatabaseBody } from './databaseFields';

/**
 * Build the request that creates a MongoDB database.
 *
 * The published creation schema of MongoDB carries the root username only.
 * The root password and the initial database are published by the update
 * schema, so they are set through the update operation.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /databases/mongodb`.
 */
export async function createMongodbDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'POST',
		path: 'databases/mongodb',
		body: buildCreateDatabaseBody(this, itemIndex, 'mongodb'),
	};
}
