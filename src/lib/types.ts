export interface Options {
	breaks?: boolean;
}
/**
 * Member of Element Node
 */
type MLPosOne = Record<string, any> | string | JsonMLElement;
/**
 * Type definition for `JsonMLElement`
 *
 * Attributes must be 2nd place of element node if it present
 */
export type JsonMLElement =
	| [TagName, ...MLPosOne[]]
	| [TagName, MLPosOne, ...MLPosOne[]];

export type JsonMLNode = string | JsonMLElement;

export type JsonMLNodes = Array<string | JsonMLElement>;
export type JsonMLRoot = [...JsonMLNodes];
// ||---------------||
// ||  HAST Types   ||
// || --------------||
export type TextileNode = TextNode | CommentNode | ElementNode;
export interface TextNode {
	type: "Text";
	value: string;
}
export interface CommentNode {
	type: "Comment";
	value: string;
}
export interface ElementNode {
	type: "Element";
	tagName?: TagName | "";
	properties?: Record<string, any>;
	children?: TextileNode[];
}
export interface RootNode {
	type: "Root";
	children: TextileNode[];
}

export type TagName =
	| "a"
	| "abbr"
	| "address"
	| "area"
	| "article"
	| "aside"
	| "audio"
	| "b"
	| "bdi"
	| "bdo"
	| "blockquote"
	| "body"
	| "br"
	| "button"
	| "canvas"
	| "caption"
	| "cite"
	| "code"
	| "col"
	| "colgroup"
	| "data"
	| "datalist"
	| "dd"
	| "del"
	| "details"
	| "dfn"
	| "dialog"
	| "div"
	| "dl"
	| "dt"
	| "em"
	| "embed"
	| "fieldset"
	| "figcaption"
	| "figure"
	| "footer"
	| "form"
	| "h1"
	| "h2"
	| "h3"
	| "h4"
	| "h5"
	| "h6"
	| "header"
	| "hgroup"
	| "hr"
	| "i"
	| "iframe"
	| "img"
	| "input"
	| "ins"
	| "kbd"
	| "label"
	| "legend"
	| "li"
	| "main"
	| "map"
	| "mark"
	| "menu"
	| "meter"
	| "nav"
	| "noscript"
	| "object"
	| "ol"
	| "optgroup"
	| "option"
	| "output"
	| "p"
	| "picture"
	| "pre"
	| "progress"
	| "q"
	| "rp"
	| "rt"
	| "ruby"
	| "s"
	| "samp"
	| "search"
	| "section"
	| "select"
	| "slot"
	| "small"
	| "source"
	| "span"
	| "strong"
	| "sub"
	| "summary"
	| "sup"
	| "table"
	| "tbody"
	| "td"
	| "template"
	| "textarea"
	| "tfoot"
	| "th"
	| "thead"
	| "time"
	| "tr"
	| "track"
	| "u"
	| "ul"
	| "var"
	| "video"
	| "wbr"
	| "###"
	| "notextile"
	| "!"
	| "bc"
	| "bq"
	| "script"
	| "style";
// --------------------------------------------------------------------------------------------------//
export type TokenType = "OPEN" | "CLOSE" | "SINGLE" | "TEXT" | "COMMENT" | "WS";
export type Token =
	| CommentToken
	| TextToken
	| WsToken
	| CloseToken
	| OpenToken
	| SingleToken;
export interface CommentToken {
	type: "COMMENT";
	data: string;
	pos: number;
	src: string;
}
export interface TextToken {
	type: "TEXT";
	data: string;
	pos: number;
	src: string;
}
export interface WsToken {
	type: "WS";
	data: string;
	pos: number;
	src: string;
}
export interface CloseToken {
	type: "CLOSE";
	tag: TagName;
	pos: number;
	src: string;
}
export interface OpenToken {
	type: "OPEN";
	tag: TagName;
	pos: number;
	src: string;
	attr?: Record<string, any>;
}
export interface SingleToken {
	type: "SINGLE";
	tag: TagName;
	pos: number;
	src: string;
	attr?: Record<string, any>;
}
// --------------------
