import Constants from "../shares/constants.js";
import { escapeHTML } from "../shares/helpers.js";
import type {
	JsonMLAttributes,
	JsonMLElement,
	JsonMLNode,
	JsonMLNodes,
	JsonMLRoot,
} from "../shares/types.js";

// ==============================================================================//
/**
 * Flattens nested arrays in JSONML children.
 */
function flattenChildren(
	children: (string | JsonMLElement | JsonMLAttributes)[],
): (string | JsonMLElement | JsonMLAttributes)[] {
	return children.flatMap((child) =>
		Array.isArray(child) && typeof child[0] !== "string"
			? flattenChildren(child)
			: [child],
	);
}
/**
 * jmlNode2Html takes a single node in a JSON-ML tree and converts it to an HTML
 * string.
 *
 * @param node - the node to be converted
 * @returns an HTML string
 */
const jmlNode2Html = (jsonml: JsonMLNode) => {
	if (typeof jsonml === "string") return escapeHTML(jsonml);
	if (!Array.isArray(jsonml) || typeof jsonml[0] !== "string") return "";
	const [tag, ...rest] = jsonml;
	let attrs = "";
	let children: any = rest;
	if (rest[0] && typeof rest[0] === "object" && !Array.isArray(rest[0])) {
		attrs = Object.entries(rest[0] as JsonMLAttributes)
			.map(([k, v]) => ` ${k}="${String(v).replace(/"/g, "&quot;")}"`)
			.join("");
		children = rest.slice(1);
	}
	if (Constants.voidTag.has(tag)) {
		return `<${tag}${attrs}>`;
	}
	// Flatten children arrays to handle deeply nested nodes
	const flatChildren = flattenChildren(children);
	const validChildren = flatChildren.filter(
		(child) => typeof child === "string" || Array.isArray(child),
	) as JsonMLNodes;
	const inner = validChildren.map(jmlNode2Html).join("");
	return `<${tag}${attrs}>${inner}</${tag}>`;
};

/**
 * jml2html takes a JSON-ML tree and converts it to an HTML string.
 *
 * @param tree - the JSON-ML tree to be converted
 * @returns an HTML string
 */
export const jml2html = (tree: JsonMLRoot) => {
	return tree.map(jmlNode2Html).join("");
};
