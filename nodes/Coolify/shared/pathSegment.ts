/**
 * Encoding of a single path segment of a Coolify API endpoint.
 *
 * The request builders interpolate user-provided identifiers into the path of
 * an endpoint, so the identifier has to be encoded as one path segment and
 * never as part of the path structure. Every resource therefore encodes its
 * identifiers through this helper, so the same value is handled the same way
 * no matter which resource addresses it.
 */

/**
 * Encode a value that becomes one segment of the path of an endpoint.
 *
 * Only the segment is encoded, never the separators of the path itself, so the
 * value the user entered reaches the endpoint as a path segment instead of
 * changing the shape of the path. The characters of a UUID are not reserved, so
 * an ordinary identifier is sent exactly as it was before.
 *
 * @param value The value of the path segment.
 * @returns The value in the form the path of the endpoint needs.
 */
export function encodePathSegment(value: string): string {
	return encodeURIComponent(value);
}
