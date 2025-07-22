// entry of all parsers
import type { StateABlockNode } from "../pre-process/types.js";
import type { ElementNode, TextileNode } from "../types.js";

export const codeBlock = (tree: StateABlockNode[]) => {
	const newTree: (TextileNode | StateABlockNode)[] = [];
	for (const node of tree) {
		if (node.type === "codeBlock") {
			const newNode: ElementNode = {
				type: "Element",
				tagName: "pre",
				properties: { ...node?.attributes },
				children: [
					{
						type: "Element",
						tagName: "code",
						properties: { ...node?.attributes },
						children: [{ type: "Text", value: node.dataString }],
					},
				],
			};
			newTree.push(newNode);
		} else {
			newTree.push(node);
		}
	}
	return newTree;
};
