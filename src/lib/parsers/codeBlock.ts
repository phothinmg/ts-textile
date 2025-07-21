// entry of all parsers
import type { StateABlockNode } from "../preProcess/types.js";
import type { TextileNode, ElementNode } from "../types.js";

export const codeBlock = (tree: StateABlockNode[]) => {
  const newTree: (TextileNode | StateABlockNode)[] = [];
  for (const node of tree) {
    if (node.type === "codeBlock") {
      let newNode: ElementNode = {
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
