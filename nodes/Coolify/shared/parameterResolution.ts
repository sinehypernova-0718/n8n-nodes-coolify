import type { IDataObject, IExecuteFunctions, INodeProperties } from 'n8n-workflow';

/** Name a collection by both resource and operation to avoid serialized-path collisions. */
export function operationOptionsParameterName(resource: string, operation: string): string {
	return `${resource}${operation.charAt(0).toUpperCase()}${operation.slice(1)}Options`;
}

/** Prefer an explicitly present collection field, preserving all falsy values, then read its legacy root field. */
export function getCollectionParameter(
	ctx: IExecuteFunctions,
	itemIndex: number,
	collectionName: string,
	fieldName: string,
	legacyName: string,
	defaultValue: unknown,
): unknown {
	if (ctx.getNode().typeVersion === 1) {
		return ctx.getNodeParameter(legacyName, itemIndex, defaultValue);
	}
	const collection = ctx.getNodeParameter(collectionName, itemIndex, {}) as IDataObject;
	if (Object.prototype.hasOwnProperty.call(collection, fieldName)) return collection[fieldName];
	return defaultValue;
}

/**
 * The UI names of the fields of the optional collection of an operation.
 *
 * The collection carries the optional fields that moved out of the node root.
 * A name outside that set is a root parameter (an identifier, a required field
 * or a field that is not grouped), and must be read from the node root.
 *
 * @param properties The properties of the node.
 * @param resource The selected resource.
 * @param operation The selected operation.
 * @returns The field names of the operation collection, or `undefined` when the
 * operation has no optional collection.
 */
function operationCollectionFieldNames(
	properties: INodeProperties[],
	resource: string,
	operation: string,
): Set<string> | undefined {
	const collectionName = operationOptionsParameterName(resource, operation);
	const collection = properties.find((property) => property.name === collectionName);
	if (!collection || !Array.isArray(collection.options)) return undefined;

	const names = new Set<string>();
	for (const option of collection.options) {
		if (option && typeof option === 'object' && 'name' in option) {
			names.add(option.name);
		}
	}
	return names;
}

/**
 * Resolve operation collection fields before the root parameters during request
 * construction.
 *
 * A field of the operation collection is read from the collection (or falls back
 * to its default, so a legacy root value is never resurrected). Every other name
 * is a root parameter and is read from the node root, so the identifiers and the
 * required fields of an operation stay reachable.
 *
 * @param ctx The execution context of the node.
 * @param properties The properties of the node, used to tell the collection
 * fields from the root parameters.
 * @returns The execution context that resolves the collection fields.
 */
export function withOperationCollectionFallback(
	ctx: IExecuteFunctions,
	properties: INodeProperties[],
): IExecuteFunctions {
	const getNodeParameter = ctx.getNodeParameter.bind(ctx);
	return new Proxy(ctx, {
		get(target, property) {
			if (property === 'getNodeParameter') {
				return (name: string, itemIndex: number, defaultValue?: unknown) => {
					if (ctx.getNode().typeVersion === 1) {
						return getNodeParameter(name, itemIndex, defaultValue);
					}
					const resource = getNodeParameter('resource', itemIndex, '') as string;
					if (!['application', 'database', 'cloudInitScript'].includes(resource)) {
						return getNodeParameter(name, itemIndex, defaultValue);
					}
					const operation = getNodeParameter('operation', itemIndex, '') as string;
					const collectionFields = operationCollectionFieldNames(properties, resource, operation);
					if (collectionFields?.has(name)) {
						const collection = getNodeParameter(
							operationOptionsParameterName(resource, operation),
							itemIndex,
							{},
						) as IDataObject;
						if (Object.prototype.hasOwnProperty.call(collection, name)) {
							return collection[name];
						}
						return defaultValue;
					}
					return getNodeParameter(name, itemIndex, defaultValue);
				};
			}
			const value = Reflect.get(target, property, target) as unknown;
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}
