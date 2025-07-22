import { has_child, is_element } from "../shares/helpers.js";
import type {
	JsonMLElement,
	JsonMLNode,
	JsonMLNodes,
	JsonMLRoot,
	JsonMLVisitor,
} from "../shares/types.js";

/**
 * Walks a JSON-ML tree and calls methods on a visitor object for each node.
 *
 * @param tree - The JSON-ML tree to traverse
 * @param visitor - Visitor object with `visitText` and/or `visitElement`
 *                  methods that will be called for each node in the tree
 * @returns Nothing, but the visitor functions will be called for each node
 */
export default function walk(tree: JsonMLRoot, visitor: JsonMLVisitor) {
	const traverse = (node: JsonMLNode) => {
		const idx = tree.indexOf(node);
		if (typeof node === "string" && visitor.visitText) {
			visitor.visitText(node, idx, tree);
		}
		if (
			typeof node !== "string" &&
			Array.isArray(node) &&
			is_element(node) &&
			visitor.visitElement
		) {
			visitor.visitElement(node, idx, tree);
			if (has_child(node)) {
				const childs = node.filter((n) => is_element(n as JsonMLNode));
				childs.forEach((child) => {
					const _idx = childs.indexOf(child);
					if (visitor.visitElement) {
						visitor.visitElement(
							child as JsonMLElement,
							_idx,
							childs as JsonMLNodes,
						);
					}
				});
			}
		}
	};
	tree.forEach(traverse);
}
