/** Read the selected value from an n8n resource locator or a legacy text field. */
export function locatorValue(value: unknown): string {
	if (typeof value === 'string') return value;
	if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		const selected = (value as { value?: unknown }).value;
		return typeof selected === 'string' ? selected : '';
	}
	return '';
}

/** Read the mode of an n8n resource locator, or an empty string for a legacy text value. */
export function locatorMode(value: unknown): string {
	if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
		const mode = (value as { mode?: unknown }).mode;
		return typeof mode === 'string' ? mode : '';
	}
	return '';
}
