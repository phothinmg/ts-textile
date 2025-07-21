import elements from "./elements.js";
import type { JsonMLNode, JsonMLNodes } from "./types.js";

export const is_element = (node: JsonMLNode) =>
	Array.isArray(node) && elements.includes(node[0]);
export const has_child = (node: JsonMLNode) =>
	Array.isArray(node) && node.some(is_element);
/**
 * Checks if `input` is a valid attribute object.
 *
 * @param input - Any value to check.
 * @returns `true` if `input` is a valid attribute object, `false` otherwise.
 *
 * A valid attribute object is an object that is not:
 * - `null`
 * - An array
 * - An empty object
 */
export const isAttr = (input: any): boolean =>
	typeof input === "object" &&
	!Array.isArray(input) &&
	input !== null &&
	Object.keys(input).length > 0;
/**
 * Checks if a JsonML node represents a code block.
 *
 * @param node - The node to check.
 * @returns `true` if `node` is a code block, `false` otherwise.
 *
 * A code block is a JsonML node that has a tag name of `"pre"` and an attribute
 * object, and contains at least one child node with a tag name of `"code"`.
 */
export const isCodeBlock = (node: JsonMLNode): boolean =>
	Array.isArray(node) &&
	node[0] === "pre" &&
	isAttr(node[1]) &&
	node.some((i) => Array.isArray(i) && i[0] === "code");
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
