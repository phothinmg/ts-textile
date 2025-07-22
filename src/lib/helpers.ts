import type { JsonMLNodes } from "./types.js";
export const isObject = (input: any) =>
	input !== null && typeof input === "object" && !Array.isArray(input);

export const isPlainObject = (input: any) =>
	isObject(input) && Object.keys(input).length === 0;

/**
 * Escapes a string for HTML safety.
 *
 * @param text - The string to be escaped.
 * @param escapeQuotes - Optional flag indicating whether to escape double and single quotes.
 * @returns The escaped string.
 */
export function escapeHTML(text: string, escapeQuotes?: boolean) {
	return text
		.replace(
			/&(?!(#\d{2,}|#x[\da-fA-F]{2,}|[a-zA-Z][a-zA-Z1-4]{1,6});)/g,
			"&amp;",
		)
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, escapeQuotes ? "&quot;" : '"')
		.replace(/'/g, escapeQuotes ? "&#39;" : "'");
}

export const normalizeTrim = (str: string) => str.replace(/\s+/g, " ").trim();
export const sliceNormalizeTrim = (str: string, chars: number) =>
	str.slice(chars).replace(/\s+/g, " ").trim();
export const sliceText = (str: string, chars: number) => str.slice(0, chars);

/**
 * Merges properties from object `b` into object `a`.
 * If `b` is provided, each key-value pair in `b` will overwrite
 * any existing key-value pair in `a` with the same key.
 *
 * @param a - The target object to merge properties into.
 * @param b - The source object containing properties to merge.
 * @returns The target object `a` with merged properties.
 */

export function merge(
	a: Record<string, any>,
	b?: Record<string, any>,
): Record<string, any> {
	if (b) {
		for (const k in b) {
			a[k] = b[k];
		}
	}
	return a;
}

// drop or add tab levels to JsonML tree
export function reIndent(ml: any[], shiftBy: any): JsonMLNodes {
	// a bit obsessive, but there we are...
	if (!shiftBy) {
		return ml;
	}
	return ml.map((s) => {
		if (/^\n\t+/.test(s)) {
			if (shiftBy < 0) {
				s = s.slice(0, shiftBy);
			} else {
				for (let i = 0; i < shiftBy; i++) {
					s += "\t";
				}
			}
		} else if (Array.isArray(s)) {
			return reIndent(s, shiftBy);
		}
		return s;
	});
}

export const VOID_TAGS = new Set([
	"area",
	"base",
	"br",
	"col",
	"embed",
	"hr",
	"img",
	"input",
	"link",
	"meta",
	"param",
	"source",
	"track",
	"wbr",
]);
