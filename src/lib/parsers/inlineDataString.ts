import type { ElementNode, TextNode, TextileNode } from "../types.js";
import { parseAttrs } from "./attrs.js";
import { parseHtmlAttrs } from "./htmlAttr.js";

// ====================================================
const inlineRegexp = {
  code: /@([^@]+)@/g,
  codeHtml: /<code\s*(.*)?>(.*)<\/code>/g,
  strong: /\\*([^*]+)\\*/g,
};

export const inlineDataStringParser = (str: string, nodes: TextileNode[]) => {
  const txt = normalizeTrim(str);
  let m: RegExpExecArray | null = null;
  let rm = txt;
  do {
    // `@code@` inline code
    if ((m = inlineRegexp.code.exec(txt))) {
      const idx = rm.indexOf(m[0]);
      const str = sliceText(rm, idx - 1);
      nodes.push(inlineText(str));
      nodes.push(inlineCode(m[1]));
      rm = sliceNormalizeTrim(rm, idx + m[0].length);
    } // end
    // `<code>Hello</code>` inline code
    if ((m = inlineRegexp.codeHtml.exec(txt))) {
      const idx = rm.indexOf(m[0]);
      const str = sliceText(rm, idx - 1);
      nodes.push(inlineText(str));
      if (m[1]) {
        nodes.push(inlineCode(m[2], parseHtmlAttrs(m[1])));
      } else {
        nodes.push(inlineCode(m[2]));
      }
      rm = sliceNormalizeTrim(rm, idx + m[0].length);
    } // end
  } while (m);
  if (rm.length) {
    nodes.push(inlineText(rm));
  }
};

// =================================================================================
const normalizeTrim = (str: string) => str.replace(/\s+/g, " ").trim();
const sliceNormalizeTrim = (str: string, chars: number) =>
  str.slice(chars).replace(/\s+/g, " ").trim();
const sliceText = (str: string, chars: number) => str.slice(0, chars);

// =================================================================================
const inlineStrong = (str: string, props = <Record<string, any>>{}) => {
  let node: ElementNode = {
    type: "Element",
    tagName: "strong",
    properties: props,
    children: [{ type: "Text", value: str }],
  };
  return node;
};
const inlineCode = (str: string, props = <Record<string, any>>{}) => {
  let node: ElementNode = {
    type: "Element",
    tagName: "code",
    properties: props,
    children: [{ type: "Text", value: str }],
  };
  return node;
};
const inlineText = (str: string) => {
  let node: TextNode = {
    type: "Text",
    value: str,
  };
  return node;
};
