import { escapeHTML } from "../shares/helpers.js";
import type {
  ElementNode,
  JsonMLNode,
  JsonMLNodes,
  RootNode,
  TagName,
  TextileNode,
} from "../shares/types.js";
export interface TextileVisitor {
  visitElement?: (
    node: ElementNode,
    index?: number,
    parent?: TextileNode | TextileNode[]
  ) => void;
}

const VOID_TAGS = new Set([
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
const isAttr = (input: any) =>
  typeof input === "object" && !Array.isArray(input) && input !== null;

/**
 * ml2hast takes a JSON-ML tree and converts it to a hast-compatible tree.
 *
 * @param tree - the JSON-ML tree to be converted
 * @returns a hast-compatible tree
 */
export const ml2hast = (tree: JsonMLNodes) => {
  const root: RootNode = {
    type: "Root",
    children: [],
  };
  const traverse = (node: JsonMLNode) => {
    if (Array.isArray(node)) {
      const [tag, ...rest] = node;

      const elObj: ElementNode = {
        type: "Element",
        tagName: tag as TagName,
        properties: {},
        children: [],
      };
      const properties = rest[0] as Record<string, any>;
      let childrenRest: (string | JsonMLNode)[] = rest as (
        | string
        | JsonMLNode
      )[];
      if (isAttr(properties)) {
        elObj.properties = properties;
        childrenRest = rest.slice(1) as (string | JsonMLNode)[];
      }
      elObj.children = childrenRest.flatMap(
        (v: string | JsonMLNode): TextileNode[] => {
          if (typeof v === "string") {
            return [
              {
                type: "Text",
                value: v,
              } as TextileNode,
            ];
          }
          return traverse(v);
        }
      );
      return [elObj];
    } else if (typeof node === "string") {
      return [
        {
          type: "Text",
          value: node,
        } as TextileNode,
      ];
    }
    return [];
  };
  root.children = tree.flatMap(traverse);
  return root;
};

/**
 * hast2html takes a hast-compatible tree and converts it to an HTML string.
 *
 * @param root - the hast-compatible tree to be converted
 * @returns an HTML string
 *
 * This function traverses the hast-compatible tree and constructs an HTML
 * string by mapping each node to its HTML representation. It handles both
 * Element and Text nodes. If a node is an Element node, it constructs the
 * HTML representation by mapping its children to their HTML representation
 * and wrapping it with the tag. If the node is a Text node, it escapes the
 * text content and returns it as the HTML representation. It uses the
 * VOID_TAGS set to check if a tag should be self-closing or not.
 */
export function hast2html(root: RootNode) {
  const traverse = (node: TextileNode): string => {
    if (node.type === "Text") {
      return escapeHTML(node.value as string);
    }

    if (node.type === "Element") {
      const tag = node.tagName;
      const attributes = node.properties;
      const attr = Object.entries(attributes as Record<string, any>)
        .map(([key, value]) =>
          value == null
            ? ` ${key}`
            : ` ${key}="${escapeHTML(String(value), true)}"`
        )
        .join("");

      const content = node.children?.map(traverse).join("") || "";

      if (
        VOID_TAGS.has(tag as TagName) ||
        ((tag as TagName).indexOf(":") > -1 && !content)
      ) {
        return `<${tag}${attr} />`;
      } else {
        return `<${tag}${attr}>${content}</${tag}>`;
      }
    }

    return "";
  };

  return root.children.map(traverse).join("");
}

/**
 * Visits all Element nodes in a hast-compatible tree and calls the
 * visitElement method of the given visitor for each node. The
 * traverse function is used to recursively traverse the tree.
 *
 * @param tree - the hast-compatible tree to be traversed
 * @param visitor - the visitor object with the visitElement method
 */
export function visit(tree: RootNode, visitor: TextileVisitor) {
  const traverse = (
    node: TextileNode,
    idx: number,
    parent: TextileNode | TextileNode[] | undefined
  ) => {
    if (node.type === "Element" && visitor.visitElement) {
      visitor.visitElement(node, idx, parent);
      if (node.children) {
        node.children.forEach((v, i) => traverse(v, i, node));
      }
    }
  };
  tree.children.forEach((v, i, p) => traverse(v, i, p));
}
