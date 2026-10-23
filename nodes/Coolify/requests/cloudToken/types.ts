/**
 * The cloud provider options accepted by the Coolify API.
 */
export const CLOUD_PROVIDER_OPTIONS = ['hetzner', 'digitalocean', 'vultr', 'hostinger'] as const;

/**
 * The cloud provider type.
 */
export type CloudProvider = (typeof CLOUD_PROVIDER_OPTIONS)[number];
