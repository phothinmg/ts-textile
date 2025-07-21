//import { stateAAttributes } from "./attributes.js";
import { parseAttrs } from "../parsers/attrs.js";
import { stateABlockCode } from "./blockCode.js";
import { StateARegexp } from "./regexp.js";
import type {
  BlocksSignature,
  StateABlockNode,
  StateABlockTypes,
} from "./types.js";
export const stateABlocksMap: Record<BlocksSignature, StateABlockTypes> = {
  p: "paragraph",
  h1: "heading",
  h2: "heading",
  h3: "heading",
  h4: "heading",
  h5: "heading",
  h6: "heading",
  pre: "preBlock",
  bc: "codeBlock",
  bq: "blockquote",
  "###": "comment",
  notextile: "override",
};

export function stateABlockNodes(input: string): StateABlockNode[] {
  const temp = stateABlockCode(input);
  const lines = temp.newLines;
  const tempLines = temp.tempLines;
  const oriLines = temp.oriLines;
  const createNode = (str: string, idx: number) => {
    const obj: StateABlockNode = {
      lineIndex: idx,
      linkRef: {
        name: "",
        link: "",
      },
      footNoteRef: {
        num: 0,
        refId: "",
        hrefId: "",
      },
    };
    let m: RegExpExecArray | null = null;
    if ((m = StateARegexp.blocks.exec(str))) {
      obj.type = stateABlocksMap[m[1]];
      obj.signature = m[1] as BlocksSignature;
      obj.attributes = parseAttrs(m[2], m[1] as BlocksSignature);
      obj.dotNotationCount = m[3].length;
      if (m[1] === "bc" && m[3].length > 1) {
        obj.dataString = m.input.split(m[3])[1];
        const found = oriLines.find((i) => i.id === idx);
        if (found) {
          obj.rawString = found.line;
        }
      } else {
        obj.dataString = m[4];
        obj.rawString = m.input;
      }
    } else if ((m = StateARegexp.links.reference.exec(str))) {
      obj.type = "linkRef";
      obj.linkRef.name = m[1];
      obj.linkRef.link = m[2];
    } else if ((m = /^%bc%$/.exec(str))) {
      const found = tempLines.find((i) => i.id === idx);
      if (found) {
        obj.type = "%bc%";
        obj.dataString = str;
        obj.rawString = found.line;
      }
    } else if ((m = /^..bc$/.exec(str))) {
      obj.type = "..bc";
      obj.rawString = str;
      obj.dataString = str;
    } else if (
      (m = StateARegexp.html.tag.exec(str)) ||
      (m = StateARegexp.html.endTag.exec(str))
    ) {
      obj.type = "html";
      obj.blockTag = m[1];
      obj.dataString = str;
      obj.rawString = str;
    } else if ((m = StateARegexp.links.image.exec(str))) {
      obj.type = "imageLink";
      obj.dataString = str;
      obj.rawString = str;
    } else if ((m = StateARegexp.definitionList.dt.exec(str))) {
      obj.type = "def-dt";
      obj.dataString = str;
      obj.rawString = str;
    } else if ((m = StateARegexp.definitionList.dd.exec(str))) {
      obj.type = "def-dd";
      obj.dataString = str;
      obj.rawString = str;
    } else if ((m = StateARegexp.footNote.def.exec(str))) {
      const _sym = m[2] ? { symbol: m[2] } : {};
      obj.type = "footnoteDef";
      obj.dataString = m[3];
      obj.rawString = m.input;
      obj.footNoteRef = {
        num: Number(m[1]),
        refId: `fn${Buffer.from(`lineIndex${idx}`).toString("hex")}-${m[1]}`,
        hrefId: `#fn${Buffer.from(`lineIndex${idx}`).toString("hex")}-${m[1]}`,
        ..._sym,
      };
    } else {
      obj.type = "text";
      obj.rawString = str;
      obj.dataString = str;
    }
    return obj;
  };
  return lines.map(createNode);
}
