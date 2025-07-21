import { isPlainObject } from "../helpers.js";
//import type { StateAAttributes } from "./attributes.js";
import { stateABlockNodes } from "./blockNodes.js";
import { stateADefineNodeType } from "./defineNodeTypes.js";
import { parseLinks } from "./parseLinks.js";
import type { StateABlockNode } from "./types.js";

type PreProcessHook = (...args: any[]) => any;
export const createTokenTree = (
  input: string,
  hooks?: PreProcessHook[]
): StateABlockNode[] => {
  let tree = createStateANodeTree(input);
  if (hooks?.length) {
    hooks.forEach((fn) => {
      tree = fn();
    });
  }
  return tree.filter(
    (i) => i.type !== "$rm$" && i.type !== "%bc%" && i.type !== "..bc"
  );
};
/**
 * Given a string of textile, creates a StateA Node Tree.
 *
 * The order of the steps to create the tree is important:
 * 1. Create the nodes with `stateABlockNodes`
 * 2. Define the type of each node with `stateADefineNodeType`
 * 3. Restructure the nodes with `reStructureNode`
 * 4. Merge the paragraph nodes with `mergeParagraph`
 * 5. Merge the list nodes with `mergeLists`
 * 6. Merge the definition list nodes with `mergeDefList`
 * 7. Merge the table nodes with `mergeTable`
 * 8. Parse the links with `parseLinks`
 *
 * @param input the string of textile
 * @returns the StateA Node Tree
 */
export const createStateANodeTree = (input: string): StateABlockNode[] => {
  // Order is important here
  const nodes = stateABlockNodes(input);
  let tree = stateADefineNodeType(nodes);
  tree = tree.map(reStructureNode);
  tree = mergeParagraph(tree);
  tree = mergeLists(tree);
  tree = mergeDefList(tree);
  tree = mergeTable(tree);
  tree = parseLinks(tree);
  return tree;
};

function reStructureNode(node: StateABlockNode) {
  const typeObj = node.type ? { type: node.type } : {};
  const dso = node.dataString ? { dataString: node.dataString } : {};
  const sigObject = node.signature ? { signature: node.signature } : {};
  const attr = node.attributes ? reStructureAttr(node.attributes) : {};
  const lfo = node.linkRef ? { linkRef: node.linkRef } : {};
  const rso = node.rawString ? { rawString: node.rawString } : {};
  const dnc = node.dotNotationCount
    ? { dotNotationCount: node.dotNotationCount }
    : {};
  const fnDef =
    node.type === "footnoteDef" ? { footNoteRef: node.footNoteRef } : {};
  const newNode: StateABlockNode = {
    lineIndex: node.lineIndex,
    ...typeObj,
    ...sigObject,
    ...attr,
    ...dso,
    ...rso,
    ...lfo,
    ...fnDef,
    ...dnc,
  };
  return newNode;
}

function reStructureAttr(attr: Record<string,any>) {
  const { className, styles, ...rest } = attr;
  const _cn = className;
  const _st = styles;
  const cob = attr.className?.length ? { className: attr.className } : {};
  const sto = attr.styles?.length ? { styles: attr.styles } : {};
  const attrObj: Record<string,any> = {
    ...cob,
    ...sto,
    ...rest,
  };
  return !isPlainObject(attrObj) ? { attributes: attrObj } : {};
}

function mergeParagraph(tree: StateABlockNode[]) {
  const nodes = tree.filter((i) => i.type === "paragraph" || i.type === "text");
  const merged: StateABlockNode[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type === "paragraph") {
      // Start with the paragraph node
      const mergedNode = { ...node };
      let lastLineIndex = node.lineIndex;
      let j = i + 1;
      // Merge all consecutive text nodes by lineIndex
      while (
        j < nodes.length &&
        nodes[j].type === "text" &&
        nodes[j].lineIndex === lastLineIndex + 1
      ) {
        (mergedNode.dataString as string) += `%br%${nodes[j].dataString}`;
        (mergedNode.rawString as string) += nodes[j].rawString;
        lastLineIndex = nodes[j].lineIndex;
        j++;
      }
      merged.push(mergedNode);
      // For each merged text node, substitute with its lineIndex
      let k = i + 1;
      while (
        k < nodes.length &&
        nodes[k].type === "text" &&
        nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
      ) {
        merged.push({
          lineIndex: nodes[k].lineIndex,
          type: "$rm$",
        });
        k++;
      }
      i = j;
    } else {
      // Not a paragraph, just push as is
      merged.push(node);
      i++;
    }
  }
  merged.forEach((v) => {
    tree.splice(v.lineIndex, 1, v);
  });
  return tree;
}

function mergeLists(tree: StateABlockNode[]) {
  const nodes = tree.filter((i) => i.type === "lists");

  const merged: StateABlockNode[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type === "lists") {
      // Start with the paragraph node
      const mergedNode = { ...node };
      let lastLineIndex = node.lineIndex;
      let j = i + 1;
      // Merge all consecutive text nodes by lineIndex
      while (j < nodes.length && nodes[j].lineIndex === lastLineIndex + 1) {
        mergedNode.dataString += `\n${nodes[j].dataString}`;
        (mergedNode.rawString as string) += nodes[j].rawString;
        lastLineIndex = nodes[j].lineIndex;
        j++;
      }
      merged.push(mergedNode);
      // For each merged text node, substitute with its lineIndex
      let k = i + 1;
      while (
        k < nodes.length &&
        nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
      ) {
        merged.push({ lineIndex: nodes[k].lineIndex, type: "$rm$" });
        k++;
      }
      i = j;
    } else {
      merged.push(node);
      i++;
    }
  }
  merged.forEach((v) => {
    tree.splice(v.lineIndex, 1, v);
  });
  return tree;
}

function mergeDefList(tree: StateABlockNode[]) {
  const nodes = tree.filter((i) => i.type === "definitionList");

  const merged: StateABlockNode[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type === "definitionList") {
      const mergedNode = { ...node };
      mergedNode.dataString =
        typeof mergedNode.dataString === "string" ? mergedNode.dataString : "";
      mergedNode.rawString =
        typeof mergedNode.rawString === "string" ? mergedNode.rawString : "";
      let lastLineIndex = node.lineIndex;
      let j = i + 1;
      // Only merge consecutive definitionList nodes
      while (
        j < nodes.length &&
        nodes[j].type === "definitionList" &&
        nodes[j].lineIndex === lastLineIndex + 1
      ) {
        mergedNode.dataString += `\n${nodes[j].dataString ?? ""}`;
        mergedNode.rawString += nodes[j].rawString ?? "";
        lastLineIndex = nodes[j].lineIndex;
        j++;
      }
      merged.push(mergedNode);
      let k = i + 1;
      while (
        k < nodes.length &&
        nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
      ) {
        merged.push({ lineIndex: nodes[k].lineIndex, type: "$rm$" });
        k++;
      }
      i = j;
    } else {
      merged.push(node);
      i++;
    }
  }
  merged.forEach((v) => {
    tree.splice(v.lineIndex, 1, v);
  });
  return tree;
}
function mergeTable(tree: StateABlockNode[]) {
  const nodes = tree.filter((i) => i.type === "table");

  const merged: StateABlockNode[] = [];
  let i = 0;

  while (i < nodes.length) {
    const node = nodes[i];
    if (node.type === "table") {
      const mergedNode = { ...node };
      mergedNode.dataString =
        typeof mergedNode.dataString === "string" ? mergedNode.dataString : "";
      mergedNode.rawString =
        typeof mergedNode.rawString === "string" ? mergedNode.rawString : "";
      let lastLineIndex = node.lineIndex;
      let j = i + 1;
      // Only merge consecutive definitionList nodes
      while (
        j < nodes.length &&
        nodes[j].type === "table" &&
        nodes[j].lineIndex === lastLineIndex + 1
      ) {
        mergedNode.dataString += `\n${nodes[j].dataString ?? ""}`;
        mergedNode.rawString += nodes[j].rawString ?? "";
        lastLineIndex = nodes[j].lineIndex;
        j++;
      }
      merged.push(mergedNode);
      let k = i + 1;
      while (
        k < nodes.length &&
        nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
      ) {
        merged.push({ lineIndex: nodes[k].lineIndex, type: "$rm$" });
        k++;
      }
      i = j;
    } else {
      merged.push(node);
      i++;
    }
  }
  merged.forEach((v) => {
    tree.splice(v.lineIndex, 1, v);
  });

  return tree;
}
