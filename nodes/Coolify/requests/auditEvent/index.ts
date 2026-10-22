import { listAuditEventsRequest } from './listAuditEvents';
import type { CoolifyRequestBuilder } from '../types';

/**
 * The request builder of every audit event operation.
 *
 * The map is the single place that maps an operation to its endpoint, so the
 * description of an operation and its request can never drift apart.
 */
export const auditEventRequestBuilders: Record<string, CoolifyRequestBuilder> = {
	list: listAuditEventsRequest,
};

export { listAuditEventsRequest } from './listAuditEvents';
