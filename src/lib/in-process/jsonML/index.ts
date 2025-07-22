// cSpell:disable

import { merge, reIndent } from "../../helpers.js";
import type {
	CloseToken,
	JsonMLElement,
	JsonMLNode,
	JsonMLRoot,
	OpenToken,
	Options,
	SingleToken,
	TagName,
	Token,
} from "../../types.js";
import { Builder, Ribbon } from "./builder.js";
import { compile, escape_sc, regexp } from "./regexp/re.js";
import ReTests from "./regexp/retest.js";

// ===========================================================================================================//
const phraseConvert = {
	"*": "strong",
	"**": "b",
	"??": "cite",
	_: "em",
	__: "i",
	"-": "del",
	"%": "span",
	"+": "ins",
	"~": "sub",
	"^": "sup",
	"@": "code",
};
const singletons = {
	area: 1,
	base: 1,
	br: 1,
	col: 1,
	embed: 1,
	hr: 1,
	img: 1,
	input: 1,
	link: 1,
	meta: 1,
	option: 1,
	param: 1,
	wbr: 1,
};
const pbaAlignLookup = {
	"<": "left",
	"=": "center",
	">": "right",
	"<>": "justify",
};
const pbaVAlignLookup = { "~": "bottom", "^": "top", "-": "middle" };
const charToTag = {
	_: "thead",
	"~": "tfoot",
	"-": "tbody",
};
type CharToTag = keyof typeof charToTag;
/**
 * Copy attributes from an object to a new object, skipping any properties
 * present in `blacklist`.
 *
 * If `s` is falsy, returns `undefined`.
 *
 * @param s - source object
 * @param blacklist - object with keys to skip
 * @returns a new object with the attributes copied from `s`, excluding any
 * from `blacklist`
 */
export function copyAttr(
	s: { [x: string]: any },
	blacklist?: { [x: string]: any },
) {
	if (!s) {
		return undefined;
	}
	const d: { [x: string]: any } = {};
	for (const k in s) {
		if (k in s && (!blacklist || !(k in blacklist))) {
			d[k] = s[k];
		}
	}
	return d;
}
/**
 * Parse a string of attributes for a given element. Returns an object with the
 * parsed attributes.
 *
 * @param input - string of attributes
 * @param element - name of the element for which the attributes are being parsed
 * @param endToken - if present, the string of characters that marks the end of
 * the attributes
 * @returns an object with the parsed attributes, or `undefined` if `input` is
 * empty or if the attributes are not applicable to the given `element`
 */
export function parseAttr(input: string, element: TagName, endToken?: string) {
	if (element === "notextile") {
		return undefined;
	}
	let m: RegExpExecArray | null = null;
	const st = <Record<string, string>>{};
	const o = <Record<string, any>>{};
	let remaining = input;
	//
	const isBlock = ReTests.testBlock(element);
	const isImg = element === "img";
	const isList = element === "li";
	const isPhrase = !isBlock && !isImg && element !== "a";
	const reAlign = isImg ? regexp.reAlignImg : regexp.reAlignBlock;
	//
	do {
		if ((m = regexp.reStyles.exec(remaining))) {
			m[1]?.split(";").forEach((p) => {
				const d = p.match(regexp.reCSS);
				if (d) {
					//@ts-ignore
					st[d[1]] = d[2];
				}
			});
			remaining = remaining.slice(m[0].length);
			continue;
		}
		// --
		if ((m = regexp.reLang.exec(remaining))) {
			const rm = remaining.slice(m[0].length);
			if (
				(!rm && isPhrase) ||
				(endToken && endToken === rm.slice(0, endToken.length))
			) {
				m = null;
			} else {
				o.lang = m[1];
				remaining = remaining.slice(m[0].length);
			}
			continue;
		}
		// ---
		if ((m = regexp.reClassid.exec(remaining))) {
			const rm = remaining.slice(m[0].length);
			if (
				(!rm && isPhrase) ||
				(endToken &&
					(rm[0] === " " || endToken === rm.slice(0, endToken.length)))
			) {
				m = null;
			} else {
				//TODO lang in codeblock
				const bits = m[1]?.split("#");
				if (bits?.[0]) {
					o.class = bits[0].trimStart().trimEnd();
				}
				if (bits?.[1]) {
					o.id = bits[1];
				}
				remaining = rm;
			}
			continue;
		}
		//---
		if (isBlock || isList) {
			if ((m = regexp.rePaddingL.exec(remaining))) {
				st["padding-left"] = `${m[1]?.length}em`;
				remaining = remaining.slice(m[0].length);
				continue;
			}
			if ((m = regexp.rePaddingR.exec(remaining))) {
				st["padding-right"] = `${m[1]?.length}em`;
				remaining = remaining.slice(m[0].length);
				continue;
			}
		}
		// ---
		// only for blocks:
		if (isImg || isBlock || isList) {
			if ((m = reAlign.exec(remaining))) {
				const align = pbaAlignLookup[m[1] as keyof typeof pbaAlignLookup];
				if (isImg) {
					o.align = align;
				} else {
					st["text-align"] = align;
				}
				remaining = remaining.slice(m[0].length);
				continue;
			}
		}
		// only for table cells
		if (element === "td" || element === "tr") {
			if ((m = regexp.reVAlign.exec(remaining))) {
				st["vertical-align"] =
					pbaVAlignLookup[m[1] as keyof typeof pbaVAlignLookup];
				remaining = remaining.slice(m[0].length);
				continue;
			}
		}
		// ---
		if (element === "td") {
			if ((m = regexp.reColSpan.exec(remaining))) {
				o.colspan = m[1];
				remaining = remaining.slice(m[0].length);
				continue;
			}
			if ((m = regexp.reRowSpan.exec(remaining))) {
				o.rowspan = m[1];
				remaining = remaining.slice(m[0].length);
			}
		}
	} while (m);
	// collapse styles
	const s: string[] = [];
	for (const v in st) {
		s.push(`${v}:${st[v]}`);
	}
	if (s.length) {
		o.style = `${s.join(";")};`;
	}
	return remaining === input ? undefined : [input.length - remaining.length, o];
}
/**
 * Parses a string node and replaces certain textual patterns with their corresponding
 * HTML entity representations. The function handles various glyph replacements such as
 * arrows, dimension signs, ellipses, dashes, and trademark symbols. It also converts
 * double and single quotes, fractions, and degree symbols to their respective entities.
 * If the input is not a string, it is returned unchanged.
 *
 * @param node - The input node, expected to be a string representing text to be parsed.
 * @returns The modified string with glyphs replaced by HTML entities, or the original
 * node if it is not a string.
 */

function parseGlyph(node: JsonMLNode) {
	if (typeof node !== "string") {
		return node;
	}
	// order is important here ...
	return (
		node
			.replace(regexp.reArrow, "$1&#8594;")
			.replace(regexp.reDimsign, "$1&#215;$2")
			.replace(regexp.reEllipsis, "$1&#8230;")
			.replace(regexp.reEmdash, "$1&#8212;$2")
			.replace(regexp.reEndash, " &#8211; ")
			.replace(regexp.reTrademark, "$1&#8482;")
			.replace(regexp.reRegistered, "$1&#174;")
			.replace(regexp.reCopyright, "$1&#169;")
			// double quotes
			.replace(regexp.reDoublePrime, "$1&#8243;")
			.replace(regexp.reClosingDQuote, "$1&#8221;")
			.replace(regexp.reOpenDQuote, "&#8220;")
			// single quotes
			.replace(regexp.reSinglePrime, "$1&#8242;")
			.replace(regexp.reApostrophe, "$1&#8217;$2")
			.replace(regexp.reClosingSQuote, "$1&#8217;")
			.replace(regexp.reOpenSQuote, "&#8216;")
			// fractions and degrees
			.replace(/[([]1\/4[\])]/, "&#188;")
			.replace(/[([]1\/2[\])]/, "&#189;")
			.replace(/[([]3\/4[\])]/, "&#190;")
			.replace(/[([]o[\])]/, "&#176;")
			.replace(/[([]\+\/-[\])]/, "&#177;")
	);
}
/**
 * Parses a string of HTML attributes and returns an object with the parsed
 * attributes. The string is expected to be in the format of a space-separated
 * list of `name="value"` pairs. The returned object has the attribute names as
 * keys and the attribute values as values.
 * @param attrSrc - The string of HTML attributes to be parsed.
 * @returns An object with the parsed attributes.
 */
export function parseHtmlAttr(attrSrc: string) {
	// parse ATTR and add to element
	const attr = <Record<string, any>>{};
	let m: RegExpExecArray | null = null;
	while ((m = regexp.reAttr.exec(attrSrc))) {
		attr[(m as RegExpExecArray)[1] as string] =
			typeof m[2] === "string" ? m[2].replace(/^(["'])(.*)\1$/, "$2") : null;
		attrSrc = attrSrc.slice(m[0].length);
	}
	return attr;
}
/**
 * Tokenizes a string of HTML into an array of tokens. The tokens will be either
 * "COMMENT", "CLOSE", "OPEN", "SINGLE", or "TEXT" types. The `whitelistTags` option
 * can be used to limit the tags that are allowed to be parsed. If `lazy` is true,
 * parsing will stop when the nesting level reaches zero.
 * @param src - The string of HTML to be tokenized.
 * @param whitelistTags - An object where the keys are the allowed HTML tags.
 * @param lazy - If true, parsing will stop when the nesting level reaches zero.
 * @returns An array of tokens.
 */
export function tokenize(
	src: string,
	whitelistTags?: { [x: string]: any },
	lazy?: any,
) {
	const tokens: Token[] = [];
	let textMode: boolean | null | TagName = false;
	const oktag = (tag: TagName) => {
		if (textMode) {
			return tag === textMode;
		}
		if (whitelistTags) {
			return tag in whitelistTags;
		}
		return true;
	};
	let m: RegExpExecArray | null = null;
	const nesting = <Record<string, any>>{};
	let nestCount = 0;
	const ribbon = new Ribbon(src);
	do {
		// comment
		if ((m = ReTests.testComment(src)) && oktag("!")) {
			tokens.push({
				type: "COMMENT",
				data: m[1] as string,
				pos: ribbon.index(),
				src: m[0],
			});
			ribbon.advance(m[0]);
			src = ribbon.toString();
		}
		// end tag
		else if ((m = ReTests.testCloseTag(src)) && oktag(m[1] as TagName)) {
			const token: CloseToken = {
				type: "CLOSE",
				tag: m[1] as TagName,
				pos: ribbon.index(),
				src: m[0],
			};
			ribbon.advance(m[0]);
			tokens.push(token);
			nesting[token.tag]--;
			nestCount--;
			// console.log( '/' + token.tag, nestCount, nesting );
			if (
				lazy &&
				(!nestCount ||
					nesting[token.tag] >= 0 ||
					Number.isNaN(nesting[token.tag]))
			) {
				return tokens;
			}
			// if parse is in text mode then that ends here
			if (textMode) {
				textMode = null;
			}
			src = ribbon.toString();
		}
		// ---
		// open/void tag
		else if ((m = ReTests.testOpenTag(src)) && oktag(m[1] as TagName)) {
			const token: OpenToken | SingleToken = {
				type:
					m[3] || ((m as RegExpExecArray)[1] as string) in singletons
						? "SINGLE"
						: "OPEN",
				tag: m[1] as TagName,
				pos: ribbon.index(),
				src: m[0],
			};
			if (m[2]) {
				token.attr = parseHtmlAttr(m[2]);
			}
			// some elements can move parser into "text" mode
			if (m[1] === "script" || m[1] === "code" || m[1] === "style") {
				textMode = token.tag;
			}
			if (token.type === "OPEN") {
				nestCount++;
				nesting[token.tag] = (nesting[token.tag] || 0) + 1;
				// console.log( token.tag, nestCount, nesting );
			}
			tokens.push(token);
			ribbon.advance(m[0]);
			src = ribbon.toString();
		}
		// text content
		else {
			// no match, move by all "uninteresting" chars
			m = /([^<]+|[^\0])/.exec(src);
			if (m) {
				tokens.push({
					type: "TEXT",
					data: m[0],
					pos: ribbon.index(),
					src: m[0],
				});
			}
			ribbon.advance(m ? m[0].length || 1 : 1);
			src = ribbon.toString();
		}
	} while (ribbon.valueOf());
	return tokens;
}
/**
 * Parses a sequence of tokens into a JSON-ML structure representing HTML elements.
 *
 * @param tokens - An array of tokens representing parts of an HTML document.
 * @param lazy - An optional parameter that, if truthy, allows for early termination
 *               of parsing when no more stack elements remain.
 *
 * @returns A JSON-ML representation of the parsed HTML, with potential source length
 *          information if `lazy` parsing was triggered.
 *
 * The function processes each token based on its type (COMMENT, TEXT, WS, SINGLE, OPEN, CLOSE),
 * constructing a tree-like structure with nested elements. It maintains a stack to handle
 * nested structures and uses the `lazy` parameter to potentially stop parsing early.
 */

export function parseHtml(tokens: Token[], lazy?: any) {
	const root: any = [];
	const stack: any[] = [];
	let curr = root;
	let token = <Token>{};
	for (let i = 0; i < tokens.length; i++) {
		token = tokens[i] as Token;
		if (token.type === "COMMENT") {
			curr.push(["!", token.data]);
		} else if (token.type === "TEXT" || token.type === "WS") {
			curr.push(token.data);
		} else if (token.type === "SINGLE") {
			curr.push(token.attr ? [token.tag, token.attr] : [token.tag]);
		} else if (token.type === "OPEN") {
			// TODO: some things auto close other things: <td>, <li>, <p>, <table>
			// https://html.spec.whatwg.org/multipage/syntax.html#syntax-tag-omission
			const elm = token.attr ? [token.tag, token.attr] : [token.tag];
			curr.push(elm);
			stack.push(elm);
			curr = elm;
		} else if (token.type === "CLOSE") {
			if (stack.length) {
				for (let i = stack.length - 1; i >= 0; i--) {
					const head = stack[i];
					if (head?.[0] === token.tag) {
						stack.splice(i);
						curr = stack[stack.length - 1] || root;
						break;
					}
				}
			}
			if (!stack.length && lazy) {
				root.sourceLength = token.pos + token.src.length;
				return root;
			}
		}
	}
	root.sourceLength = token ? token.pos + token.src.length : 0;
	return root;
}
// -----------------------------------------------------------------------------------------------//
/**
 * Parses a given string of source text into a sequence of inline JSON-ML nodes,
 * handling various textile markup and HTML elements.
 *
 * @param src - The source string to be parsed, containing inline elements.
 * @param options - Optional parsing options that may influence processing,
 *                  such as enabling line breaks.
 *
 * @returns An array of JSON-ML nodes representing the parsed inline content.
 *
 * The function iterates over the source text, identifying and processing
 * different elements such as line breaks, inline notextile sections, phrases,
 * images, HTML comments, HTML tags, footnotes, capitalized text, and links.
 * It utilizes regular expressions to match specific patterns and constructs
 * corresponding JSON-ML nodes, which are collected and returned as the result.
 */
export function parseInline(src: string, options?: Options): JsonMLRoot {
	const ribbon = new Ribbon(src);
	const list = new Builder();
	let m: RegExpExecArray | null = null;
	let pba: any;
	do {
		ribbon.save();
		src = ribbon.toString();
		// linebreak -- having this first keeps it from messing to much with other phrases
		if (src.startsWith("\r\n")) {
			ribbon.advance(1); // skip cartridge returns
			ribbon.toString();
		}
		// ---
		if (src.startsWith("\n")) {
			ribbon.advance(1);
			if (src.startsWith(" ")) {
				ribbon.advance(1);
			} else if (options?.breaks) {
				list.add(["br"]);
			}
			list.add("\n");
			src = ribbon.toString();
			continue;
		}
		// inline notextile
		if ((m = /^==(.*?)==/.exec(src))) {
			ribbon.advance(m[0]);
			ribbon.toString();
			list.add((m as RegExpExecArray)[1] as JsonMLNode);
			continue;
		}
		// --
		// lookbehind => /([\s>.,"'?!;:])$/
		const behind = ribbon.lookbehind(1);
		const boundary = !behind || /^[\s<>.,"'?!;:()[\]%{}]$/.test(behind);
		// FIXME: need to test right boundary for phrases as well
		if ((m = regexp.rePhrase.exec(src)) && (boundary || m[1])) {
			ribbon.advance(m[0]);
			src = ribbon.toString();
			const tok = m[2];
			const fence = m[1];
			const phraseType = phraseConvert[tok as keyof typeof phraseConvert];
			const code = phraseType === "code";
			if ((pba = !code && parseAttr(src, phraseType as TagName, tok))) {
				ribbon.advance(pba[0]);
				src = ribbon.toString();
				pba = pba[1];
			}
			// FIXME: if we can't match the fence on the end, we should output fence-prefix as normal text
			// seek end
			let mMid: string;
			let mEnd: string;
			//const escapedTok = escape_sc(tok);
			if (fence === "[") {
				mMid = "^(.*?)";
				mEnd = "(?:])";
			} else if (fence === "{") {
				mMid = "^(.*?)";
				mEnd = "(?:})";
			} else {
				const t1 = escape_sc((tok as string).charAt(0));
				mMid = code
					? "^(\\S+|\\S+.*?\\S)"
					: `^([^\\s${t1}]+|[^\\s${t1}].*?\\S(${t1}*))`;
				mEnd = "(?=$|[\\s.,\"'!?;:()«»„“”‚‘’<>])";
			}
			const rx = compile(`${mMid}(${escape_sc(tok as string)})${mEnd}`);
			if ((m = rx.exec(src)) && m[1]) {
				ribbon.advance(m[0]);
				src = ribbon.toString();
				if (code) {
					list.add([phraseType, m[1]]);
				} else {
					list.add(
						[phraseType, pba].concat(parseInline(m[1], options)) as JsonMLNode,
					);
				}
				continue;
			}
			// else
			ribbon.load();
			src = ribbon.toString();
		}
		// ===
		// image
		if (
			(m = regexp.reImage.exec(src)) ||
			(m = regexp.reImageFenced.exec(src))
		) {
			ribbon.advance(m[0]);
			src = ribbon.toString();
			pba = m[1] && parseAttr(m[1], "img");
			const attr = pba ? pba[1] : { src: "" };
			let img: JsonMLNode = ["img", attr];
			attr.src = m[2];
			attr.alt = m[3] ? (attr.title = m[3]) : "";

			if (m[4]) {
				// +cite causes image to be wraped with a link (or link_ref)?
				// TODO: support link_ref for image cite
				img = ["a", { href: m[4] }, img];
			}
			list.add(img);
			continue;
		}
		// html comment
		if ((m = ReTests.testComment(src))) {
			ribbon.advance(m[0]);
			src = ribbon.toString();
			list.add(["!", m[1] as JsonMLNode]);
			continue;
		}
		// html tag
		// TODO: this seems to have a lot of overlap with block tags... DRY?
		if ((m = ReTests.testOpenTag(src))) {
			ribbon.advance(m[0]);
			src = ribbon.toString();
			const tag = m[1] as TagName;
			const single =
				m[3] || ((m as RegExpExecArray)[1] as string) in singletons;
			let element = [tag];
			if (m[2]) {
				element.push(parseHtmlAttr(m[2]) as any);
			}
			if (single) {
				// single tag
				list.add(element as JsonMLElement).add(ribbon.skipWS());
				continue;
			} else {
				// need terminator
				// gulp up the rest of this block...
				const reEndTag = compile(`^(.*?)(</${tag}\\s*>)`, "s");
				if ((m = reEndTag.exec(src))) {
					ribbon.advance(m[0]);
					src = ribbon.toString();
					if (tag === "code") {
						element.push(m[1] as any);
					} else if (tag === "notextile") {
						// HTML is still parsed, even though textile is not
						list.merge(parseHtml(tokenize(m?.[1] as string)));
						continue;
					} else {
						element = element.concat(
							parseInline(m?.[1] as string, options) as any,
						);
					}
					list.add(element as JsonMLElement);
					continue;
				}
				// end tag is missing, treat tag as normal text...
			}
			ribbon.load();
			src = ribbon.toString();
		}
		// footnote
		if ((m = regexp.reFootnote.exec(src)) && /\S/.test(behind)) {
			ribbon.advance(m[0]);
			src = ribbon.toString();
			list.add([
				"sup",
				{ class: "footnote", id: `fnr${m[1]}` },
				m[2] === "!"
					? m[1] // "!" suppresses the link
					: ["a", { href: `#fn${m[1]}` }, m[1]],
			] as any);
			continue;
		}
		// caps / abbr
		if ((m = regexp.reCaps.exec(src))) {
			ribbon.advance(m[0]);
			src = ribbon.toString();
			let caps = [
				"span" as TagName,
				{ class: "caps" } as Record<string, any>,
				m[1] as string,
			];
			if (m[2]) {
				// FIXME: use <abbr>, not acronym!
				caps = ["acronym", { title: m[2] }, caps];
			}
			list.add(caps as JsonMLElement);
			continue;
		}
		// links
		if (
			(boundary && (m = regexp.reLink.exec(src))) ||
			(m = regexp.reLinkFenced.exec(src))
		) {
			ribbon.advance(m[0]);
			src = ribbon.toString();
			let title: RegExpMatchArray | null | string = (m?.[1] as string).match(
				regexp.reLinkTitle,
			);
			let inner = title
				? (m?.[1] as string).slice(
						0,
						(m?.[1] as string).length - title[0].length,
					)
				: m[1];
			if ((pba = parseAttr(inner as string, "a"))) {
				inner = (inner as string).slice(pba[0]);
				pba = pba[1];
			} else {
				pba = {};
			}
			if (title && !inner) {
				inner = title[0];
				title = "";
			}
			pba.href = m[2];
			if (title) {
				pba.title = title[1];
			}
			// links may self-reference their url via $
			if (inner === "$") {
				inner = pba.href.replace(/^(https?:\/\/|ftps?:\/\/|mailto:)/, "");
			}
			list.add(
				["a", pba].concat(
					parseInline((inner as string).replace(/^(\.?\s*)/, ""), options),
				) as JsonMLNode,
			);
			continue;
		}
		// no match, move by all "uninteresting" chars
		m = /([a-zA-Z0-9,.':]+|[ \f\r\t\v\xA0\u2028\u2029]+|[^\0])/.exec(src);
		if (m) {
			list.add(m[0]);
		}
		ribbon.advance(m ? m[0].length || 1 : 1);
		src = ribbon.toString();
	} while (ribbon.valueOf());
	return list.get().map(parseGlyph);
}
/**
 * Parse a string of colon-delimited colgroup attributes, returning a colgroup JSON-ML node.
 *
 * @param src - The string to parse, which must be a sequence of colon-delimited
 *              terms, each of which is a colgroup attribute. The terms are parsed
 *              sequentially, with the first term being the span, the second being
 *              a block of attributes, and the third being the width.
 *
 * @returns A JSON-ML representation of the parsed colgroup.
 */
export function parseColgroup(src: string) {
	const colgroup = ["colgroup", {}];
	src.split("|").forEach((s, isCol) => {
		const col: Record<string, any> = isCol ? {} : (colgroup[1] ?? {});
		let d = s.trim();
		let m;
		if (d) {
			if ((m = /^\\(\d+)/.exec(d))) {
				col.span = +(m?.[1] as any);
				d = d.slice(m[0].length);
			}
			if ((m = parseAttr(d, "col"))) {
				merge(col, m[1] as Record<string, any>);
				d = d.slice(m[0] as any);
			}
			if ((m = /\b\d+\b/.exec(d))) {
				col.width = +m[0];
			}
		}
		if (isCol) {
			colgroup.push("\n\t\t", ["col", col]);
		}
	});
	return colgroup.concat(["\n\t"]);
}
// Types for table structure
type TableRow = ["tr", Record<string, any>?, ...any[]];
type RowGroup = ["tbody" | "thead" | "tfoot", Record<string, any>?, ...any[]];
type Caption = ["caption", Record<string, any>?, string?];
type ColGroup = any; // Could be refined if parseColgroup is typed
type Table = ["table", Record<string, any>, ...any[]];

/**
 * Parse a given string of source text into a sequence of table rows,
 * handling various textile markup and HTML elements.
 *
 * @param src - The source string to be parsed, containing table rows.
 * @param options - Optional parsing options that may influence processing,
 *                  such as enabling line breaks.
 *
 * @returns An array of JSON-ML nodes representing the parsed table rows.
 *
 * The function iterates over the source text, identifying and processing
 * different elements such as table captions, colgroups, rowgroups, and rows.
 * It utilizes regular expressions to match specific patterns and constructs
 * corresponding JSON-ML nodes, which are collected and returned as the result.
 */
export function parseTable(src: string, options?: any): Table {
	const _src = new Ribbon(src.trim());
	const rowgroups: RowGroup[] = [];
	let colgroup: ColGroup | undefined;
	let caption: Caption | null = null;
	const tAttr: Record<string, any> = {};
	let tCurr: RowGroup | undefined;
	let row: TableRow;
	let inner: Ribbon;
	let pba: any;
	let more: boolean;
	let m: RegExpExecArray | null;
	let extended = 0;

	// Loosen types for TableCell and Table to allow array concat
	type AnyTableCell = any[];
	type AnyTable = any[];

	const setRowGroup = (type: "tbody" | "thead" | "tfoot", pba?: Attr) => {
		tCurr = [type, pba || {}];
		rowgroups.push(tCurr);
	};

	if ((m = regexp.reHead.exec(_src.valueOf()))) {
		_src.advance(m[0]);
		pba = parseAttr(m?.[2] as string, "table");
		if (pba) {
			merge(tAttr, pba[1]);
		}
		if (m[3]) {
			tAttr.summary = m[3];
		}
	}

	// caption
	if ((m = regexp.reCaption.exec(_src.valueOf()))) {
		caption = ["caption"];
		if ((pba = parseAttr(m?.[1] as string, "caption"))) {
			caption.push(pba[1]);
			m[1] = (m?.[1] as string).slice(pba[0]);
		}
		if (/\./.test(m?.[1] as string)) {
			caption.push(
				(m?.[1] as string)
					.slice(1)
					.replace(/\|\s*$/, "")
					.trim(),
			);
			extended++;
			_src.advance(m[0]);
		} else {
			caption = null;
		}
	}

	do {
		// colgroup
		if ((m = regexp.reColgroup.exec(_src.valueOf()))) {
			colgroup = parseColgroup(m?.[1] as string);
			extended++;
		}
		// "rowgroup" (tbody, thead, tfoot)
		else if ((m = regexp.reRowgroup.exec(_src.valueOf()))) {
			const tag =
				(charToTag[m[1] as CharToTag] as "tbody" | "thead" | "tfoot") ||
				"tbody";
			pba = parseAttr(`${m[2]} `, tag);
			setRowGroup(tag, pba?.[1]);
			extended++;
		}
		// row
		else if ((m = regexp.reRow.exec(_src.valueOf()))) {
			if (!tCurr) {
				setRowGroup("tbody");
			}
			row = ["tr"];
			if (m[2] && (pba = parseAttr(m[2], "tr"))) {
				row.push(pba[1]);
			}
			tCurr?.push("\n\t\t", row);
			inner = new Ribbon(m?.[3] as string);
			do {
				inner.save();
				const th = inner.startsWith("_");
				let cell: AnyTableCell = [th ? "th" : "td"];
				if (th) {
					inner.advance(1);
				}
				pba = parseAttr(inner.valueOf(), "td");
				if (pba) {
					inner.advance(pba[0]);
					cell.push(pba[1]);
				}
				if (pba || th) {
					const p = /^\.\s*/.exec(inner.valueOf());
					if (p) {
						inner.advance(p[0]);
					} else {
						cell = ["td"];
						inner.load();
					}
				}
				const mx = /^(==.*?==|[^|])*/.exec(inner.valueOf())!;
				cell = cell.concat(parseInline(mx[0], options));
				row.push("\n\t\t\t", cell);
				more = (inner.valueOf() as string).charAt(mx[0].length) === "|";
				inner.advance(mx[0].length + 1);
			} while (more);
			row.push("\n\t\t");
		}
		if (m) {
			_src.advance(m[0]);
		}
	} while (m);

	// assemble table
	let table: AnyTable = ["table", tAttr];
	if (extended) {
		if (caption) {
			table.push("\n\t", caption);
		}
		if (colgroup) {
			table.push("\n\t", colgroup);
		}
		rowgroups.forEach((tbody) => {
			table.push("\n\t", tbody.concat(["\n\t"]));
		});
	} else {
		table = table.concat(reIndent((rowgroups?.[0] as RowGroup).slice(2), -1));
	}
	table.push("\n");
	return table as Table;
}
