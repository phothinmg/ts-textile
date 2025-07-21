export type StateABlockTypes =
  | "paragraph"
  | "heading"
  | "codeBlock"
  | "blockquote"
  | "comment"
  | "override"
  | "text"
  | "linkRef"
  | "preBlock"
  | "image"
  | "anchorTag"
  | "lists"
  | "definitionList"
  | "footnoteDef"
  | "noteList"
  | "table"
  | "break"
  | "%bc%"
  | "..bc"
  | "$rm$"
  | "imageLink"
  | "html"
  | "def-dd"
  | "def-dt"
  | "bulletedList"
  | "orderedList";

/**
 * Blocks signature of `Textile Syntax`
 *
 * {@see https://textile-lang.com/#:~:text=the%20Textile%20syntax-,Block%20formatting,-Textile%20processes%20text }
 */
export type BlocksSignature =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "pre"
  | "bc"
  | "bq"
  | "###"
  | "notextile";

export interface StateABlockNode {
  lineIndex: number;
  type?: StateABlockTypes;
  dataString?: string;
  rawString?: string;
  linkRef?: { name: string; link: string };
  dotNotationCount?: number;
  signature?: BlocksSignature;
  attributes?: Record<string, any>;
  blockTag?: string;
  footNoteRef?: { num: number; refId: string; hrefId: string; symbol?: string };
}
