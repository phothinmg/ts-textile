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

export function hast2html(root: RootNode) {
  const traverse = (node: TextileNode): string => {
    if (node.type === "Text") {
      return escapeHTML(node.value as string);
    }

    if (node.type === "Element") {
      const tag = node.tagName;
      const attributes = node.properties;
      const attr = Object.entries(attributes)
        .map(([key, value]) =>
          value == null
            ? ` ${key}`
            : ` ${key}="${escapeHTML(String(value), true)}"`
        )
        .join("");

      const content = node.children?.map(traverse).join("") || "";

      if (VOID_TAGS.has(tag) || (tag.indexOf(":") > -1 && !content)) {
        return `<${tag}${attr} />`;
      } else {
        return `<${tag}${attr}>${content}</${tag}>`;
      }
    }

    return "";
  };

  return root.children.map(traverse).join("");
}

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
