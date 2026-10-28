import type { IExecuteFunctions } from 'n8n-workflow';

import type { CoolifyRequest } from '../types';
import { buildCreateDatabaseBody } from './databaseFields';

/**
 * Build the request that creates a SQLite database.
 *
 * SQLite publishes neither a public access field nor a password, so the
 * request carries the identity fields, the database file names and the
 * resource limits only. SQLite creation is available from Coolify v4.4.0.
 *
 * @param this The execution context of the node.
 * @param itemIndex Index of the input item the request belongs to.
 * @returns The request for `POST /databases/sqlite`.
 */
export async function createSqliteDatabaseRequest(
	this: IExecuteFunctions,
	itemIndex: number,
): Promise<CoolifyRequest> {
	return {
		method: 'POST',
		path: 'databases/sqlite',
		body: buildCreateDatabaseBody(this, itemIndex, 'sqlite'),
	};
}
