import { createClickhouseDatabaseRequest } from './createClickhouse';
import { createDragonflyDatabaseRequest } from './createDragonfly';
import { createKeydbDatabaseRequest } from './createKeydb';
import { createMariadbDatabaseRequest } from './createMariadb';
import { createMongodbDatabaseRequest } from './createMongodb';
import { createMysqlDatabaseRequest } from './createMysql';
import { createPostgresqlDatabaseRequest } from './createPostgresql';
import { createRedisDatabaseRequest } from './createRedis';
import { createSqliteDatabaseRequest } from './createSqlite';
import { deleteDatabaseRequest } from './delete';
import { getDatabaseRequest } from './get';
import { getDatabaseLogsRequest } from './getLogs';
import { listDatabasesRequest } from './list';
import { restartDatabaseRequest } from './restart';
import { startDatabaseRequest } from './start';
import { stopDatabaseRequest } from './stop';
import { updateDatabaseRequest } from './update';
import type { CoolifyRequestBuilder } from '../types';

/**
 * The request builder of every database operation.
 *
 * The map is the single place that maps an operation to its endpoint, so the
 * description of an operation and its request can never drift apart.
 */
export const databaseRequestBuilders: Record<string, CoolifyRequestBuilder> = {
	createClickhouse: createClickhouseDatabaseRequest,
	createDragonfly: createDragonflyDatabaseRequest,
	createKeydb: createKeydbDatabaseRequest,
	createMariadb: createMariadbDatabaseRequest,
	createMongodb: createMongodbDatabaseRequest,
	createMysql: createMysqlDatabaseRequest,
	createPostgresql: createPostgresqlDatabaseRequest,
	createRedis: createRedisDatabaseRequest,
	createSqlite: createSqliteDatabaseRequest,
	delete: deleteDatabaseRequest,
	get: getDatabaseRequest,
	getLogs: getDatabaseLogsRequest,
	list: listDatabasesRequest,
	restart: restartDatabaseRequest,
	start: startDatabaseRequest,
	stop: stopDatabaseRequest,
	update: updateDatabaseRequest,
};

export {
	buildCreateDatabaseBody,
	databaseCreateFieldSpecs,
	databaseFieldUiName,
	DATABASE_CREATE_SHARED_FIELDS,
	DATABASE_ENGINE_FIELDS,
	DATABASE_ENGINES,
	DATABASE_LIMIT_FIELDS,
	DATABASE_PUBLIC_ACCESS_FIELDS,
	PUBLIC_PORT_MAX,
	PUBLIC_PORT_MIN,
	type DatabaseEngine,
	type DatabaseFieldSpec,
	type DatabaseFieldType,
} from './databaseFields';
export {
	buildUpdateDatabaseBody,
	DATABASE_UPDATE_BOOLEAN_OPTIONS,
	DATABASE_UPDATE_UNCHANGED,
	databaseUpdateCollections,
	databaseUpdateTopLevelSpecs,
	type DatabaseUpdateCollection,
} from './databaseUpdateFields';
export { deleteDatabaseRequest } from './delete';
export { getDatabaseRequest } from './get';
export { getDatabaseLogsRequest, readDatabaseLogLines } from './getLogs';
export { listDatabasesRequest } from './list';
export { requireDatabaseUuid } from './parameters';
export { restartDatabaseRequest } from './restart';
export { startDatabaseRequest } from './start';
export { stopDatabaseRequest } from './stop';
export { updateDatabaseRequest } from './update';
export { createPostgresqlDatabaseRequest } from './createPostgresql';
export { createMysqlDatabaseRequest } from './createMysql';
export { createMariadbDatabaseRequest } from './createMariadb';
export { createMongodbDatabaseRequest } from './createMongodb';
export { createRedisDatabaseRequest } from './createRedis';
export { createClickhouseDatabaseRequest } from './createClickhouse';
export { createDragonflyDatabaseRequest } from './createDragonfly';
export { createKeydbDatabaseRequest } from './createKeydb';
export { createSqliteDatabaseRequest } from './createSqlite';
