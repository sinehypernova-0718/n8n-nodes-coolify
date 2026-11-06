import type { IDataObject, IExecuteFunctions } from 'n8n-workflow';

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
	const collection = ctx.getNodeParameter(collectionName, itemIndex, {}) as IDataObject;
	if (Object.prototype.hasOwnProperty.call(collection, fieldName)) return collection[fieldName];
	return ctx.getNodeParameter(legacyName, itemIndex, defaultValue);
}

/** Resolve operation collection fields before legacy flat fields during request construction. */
export function withOperationCollectionFallback(ctx: IExecuteFunctions): IExecuteFunctions {
	const getNodeParameter = ctx.getNodeParameter.bind(ctx);
	return new Proxy(ctx, {
		get(target, property) {
			if (property === 'getNodeParameter') {
				return (name: string, itemIndex: number, defaultValue?: unknown) => {
					const resource = getNodeParameter('resource', itemIndex, '') as string;
					if (!['application', 'database', 'cloudInitScript', 'auditEvent'].includes(resource)) {
						return getNodeParameter(name, itemIndex, defaultValue);
					}
					const operation = getNodeParameter('operation', itemIndex, '') as string;
					const collection = getNodeParameter(
						operationOptionsParameterName(resource, operation),
						itemIndex,
						{},
					) as IDataObject;
					if (Object.prototype.hasOwnProperty.call(collection, name)) return collection[name];
					return getNodeParameter(name, itemIndex, defaultValue);
				};
			}
			const value = Reflect.get(target, property, target) as unknown;
			return typeof value === 'function' ? value.bind(target) : value;
		},
	});
}
