// cSpell:disable
const txblocks = "(?:b[qc]|div|notextile|pre|h[1-6]|fn\\d+|p|###)";

const ucaps =
	"A-Z" +
	// Latin extended À-Þ
	"\u00c0-\u00d6\u00d8-\u00de" +
	// Latin caps with embellishments and ligatures...
	"\u0100\u0102\u0104\u0106\u0108\u010a\u010c\u010e\u0110\u0112\u0114\u0116\u0118\u011a\u011c\u011e\u0120\u0122\u0124\u0126\u0128\u012a\u012c\u012e\u0130\u0132\u0134\u0136\u0139\u013b\u013d\u013f" +
	"\u0141\u0143\u0145\u0147\u014a\u014c\u014e\u0150\u0152\u0154\u0156\u0158\u015a\u015c\u015e\u0160\u0162\u0164\u0166\u0168\u016a\u016c\u016e\u0170\u0172\u0174\u0176\u0178\u0179\u017b\u017d" +
	"\u0181\u0182\u0184\u0186\u0187\u0189-\u018b\u018e-\u0191\u0193\u0194\u0196-\u0198\u019c\u019d\u019f\u01a0\u01a2\u01a4\u01a6\u01a7\u01a9\u01ac\u01ae\u01af\u01b1-\u01b3\u01b5\u01b7\u01b8\u01bc" +
	"\u01c4\u01c7\u01ca\u01cd\u01cf\u01d1\u01d3\u01d5\u01d7\u01d9\u01db\u01de\u01e0\u01e2\u01e4\u01e6\u01e8\u01ea\u01ec\u01ee\u01f1\u01f4\u01f6-\u01f8\u01fa\u01fc\u01fe" +
	"\u0200\u0202\u0204\u0206\u0208\u020a\u020c\u020e\u0210\u0212\u0214\u0216\u0218\u021a\u021c\u021e\u0220\u0222\u0224\u0226\u0228\u022a\u022c\u022e\u0230\u0232\u023a\u023b\u023d\u023e" +
	"\u0241\u0243-\u0246\u0248\u024a\u024c\u024e" +
	"\u1e00\u1e02\u1e04\u1e06\u1e08\u1e0a\u1e0c\u1e0e\u1e10\u1e12\u1e14\u1e16\u1e18\u1e1a\u1e1c\u1e1e\u1e20\u1e22\u1e24\u1e26\u1e28\u1e2a\u1e2c\u1e2e\u1e30\u1e32\u1e34\u1e36\u1e38\u1e3a\u1e3c\u1e3e\u1e40" +
	"\u1e42\u1e44\u1e46\u1e48\u1e4a\u1e4c\u1e4e\u1e50\u1e52\u1e54\u1e56\u1e58\u1e5a\u1e5c\u1e5e\u1e60\u1e62\u1e64\u1e66\u1e68\u1e6a\u1e6c\u1e6e\u1e70\u1e72\u1e74\u1e76\u1e78\u1e7a\u1e7c\u1e7e" +
	"\u1e80\u1e82\u1e84\u1e86\u1e88\u1e8a\u1e8c\u1e8e\u1e90\u1e92\u1e94\u1e9e\u1ea0\u1ea2\u1ea4\u1ea6\u1ea8\u1eaa\u1eac\u1eae\u1eb0\u1eb2\u1eb4\u1eb6\u1eb8\u1eba\u1ebc\u1ebe" +
	"\u1ec0\u1ec2\u1ec4\u1ec6\u1ec8\u1eca\u1ecc\u1ece\u1ed0\u1ed2\u1ed4\u1ed6\u1ed8\u1eda\u1edc\u1ede\u1ee0\u1ee2\u1ee4\u1ee6\u1ee8\u1eea\u1eec\u1eee\u1ef0\u1ef2\u1ef4\u1ef6\u1ef8\u1efa\u1efc\u1efe" +
	"\u2c60\u2c62-\u2c64\u2c67\u2c69\u2c6b\u2c6d-\u2c70\u2c72\u2c75\u2c7e\u2c7f" +
	"\ua722\ua724\ua726\ua728\ua72a\ua72c\ua72e\ua732\ua734\ua736\ua738\ua73a\ua73c\ua73e" +
	"\ua740\ua742\ua744\ua746\ua748\ua74a\ua74c\ua74e\ua750\ua752\ua754\ua756\ua758\ua75a\ua75c\ua75e\ua760\ua762\ua764\ua766\ua768\ua76a\ua76c\ua76e\ua779\ua77b\ua77d\ua77e" +
	"\ua780\ua782\ua784\ua786\ua78b\ua78d\ua790\ua792\ua7a0\ua7a2\ua7a4\ua7a6\ua7a8\ua7aa";

const txcite =
	":((?:[^\\s()]|\\([^\\s()]+\\)|[()])+?)(?=[!-\\.:-@\\[\\\\\\]-`{-~]+(?:$|\\s)|$|\\s)";

const attr_class = "\\([^\\)]+\\)";
const attr_style = "\\{[^\\}]+\\}";
const attr_lang = "\\[[^\\[\\]]+\\]";
const attr_align = "(?:<>|<|>|=)";
const attr_pad = "[\\(\\)]+";

const txattr = `(?:${attr_class}|${attr_style}|${attr_lang}|${attr_align}|${attr_pad})*`;

const txlisthd = `[\\t ]*(\\*|\\#(?:_|\\d+)?)${txattr}(?: +\\S|\\.\\s*(?=\\S|\\n))`;
const txlisthd2 = `[\\t ]*[\\#\\*]*(\\*|\\#(?:_|\\d+)?)${txattr}(?: +\\S|\\.\\s*(?=\\S|\\n))`;

const _cache = <Record<string, any>>{};
//
const pattern = {
	punct: "[!-/:-@\\[\\\\\\]-`{-~]",
	space: "\\s",
	txblocks: txblocks,
	txlisthd: txlisthd,
	txlisthd2: txlisthd2,
	txattr: txattr,
	html_id: "[a-zA-Z][a-zA-Z\\d:]*",
	html_attr: "(?:\"[^\"]+\"|'[^']+'|[^>\\s]+)",
	txcite: txcite,
	ucaps: ucaps,
};
/**
 * Escape special characters in a string so it can be inserted into a regular
 * expression without being interpreted as such.
 *
 * @param src The string to escape.
 *
 * @returns A new string with special characters escaped.
 */
export function escape_sc(src: string) {
	return src.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
function collapse(src: string) {
	return src.replace(/(?:#.*?(?:\n|$))/g, "").replace(/\s+/g, "");
}
function expandPatterns(src: string): string {
	// TODO: provide escape for patterns: \[:pattern:] ?
	return src.replace(/\[:\s*(\w+)\s*:\]/g, (m, k) => {
		const ex = pattern[k as keyof typeof pattern];
		if (ex) {
			return expandPatterns(ex);
		} else {
			throw new Error(`Pattern ${m} not found in ${src}`);
		}
	});
}
function isRegExp(r: any) {
	return Object.prototype.toString.call(r) === "[object RegExp]";
}
export function compile(src: string | RegExp, ...args: any[]) {
	let flags = args[0];
	if (isRegExp(src) && src instanceof RegExp) {
		if (args.length === 0) {
			// no flags arg provided, use the RegExp one
			flags =
				(src.global ? "g" : "") +
				(src.ignoreCase ? "i" : "") +
				(src.multiline ? "m" : "");
		}
		src = src.source;
	}
	// don't do the same thing twice
	const ckey = src + (flags || "");
	if (ckey in _cache) {
		return _cache[ckey];
	}
	// allow classes
	let rx = expandPatterns(src as string);
	// allow verbose expressions
	if (flags && /x/.test(flags)) {
		rx = collapse(rx);
	}
	// allow dotall expressions
	if (flags && /s/.test(flags)) {
		rx = rx.replace(/([^\\])\./g, "$1[^\\0]");
	}
	// TODO: test if MSIE and add replace \s with [\s\u00a0] if it is?
	// clean flags and output new regexp
	flags = (flags || "").replace(/[^gim]/g, "");
	return (_cache[ckey] = new RegExp(rx, flags));
}

export const regexp = {
	// == attrs
	reClassid: /^\(([^()\n]+)\)/,
	rePaddingL: /^(\(+)/,
	rePaddingR: /^(\)+)/,
	reAlignBlock: /^(<>|<|>|=)/,
	reAlignImg: /^(<|>|=)/,
	reVAlign: /^(~|\^|-)/,
	reColSpan: /^\\(\d+)/,
	reRowSpan: /^\/(\d+)/,
	reStyles: /^\{([^}]*)\}/,
	reCSS: /^\s*([^:\s]+)\s*:\s*(.+)\s*$/,
	reLang: /^\[([^[\]\n]+)\]/,
	// ======
	reDeflist:
		/^((?:- (?:[^\n]\n?)+?)+:=(?: *\n[^\0]+?=:(?:\n|$)|(?:[^\0]+?(?:$|\n(?=\n|- )))))+/,
	reItem_DefList:
		/^((?:- (?:[^\n]\n?)+?)+):=( *\n[^\0]+?=:\s*(?:\n|$)|(?:[^\0]+?(?:$|\n(?=\n|- ))))/,
	//===
	reBlock: compile(/^([:txblocks:])/) as RegExp,
	reBlockNormal: compile(
		/^(.*?)($|\r?\n(?=[:txlisthd:])|\r?\n(?:\s*\n|$)+)/,
		"s",
	),
	reBlockExtended: compile(
		/^(.*?)($|\r?\n(?=[:txlisthd:])|\r?\n+(?=[:txblocks:][:txattr:]\.))/,
		"s",
	),
	reBlockNormalPre: compile(/^(.*?)($|\r?\n(?:\s*\n|$)+)/, "s"),
	reBlockExtendedPre: compile(
		/^(.*?)($|\r?\n+(?=[:txblocks:][:txattr:]\.))/,
		"s",
	),

	reRuler: /^(---+|\*\*\*+|___+)(\r?\n\s+|$)/,
	reLinkRef: compile(
		/^\[([^\]]+)\]((?:https?:\/\/|\/)\S+)(?:\s*\n|$)/,
	) as RegExp,
	reFootnoteDef: /^fn\d+$/,
	// Glyph
	reApostrophe: /(\w)'(\w)/g,
	reArrow: /([^-]|^)->/,
	reClosingDQuote: compile(/([^\s[(])"(?=$|\s|[:punct:])/g) as RegExp,
	reClosingSQuote: compile(/([^\s[(])'(?=$|\s|[:punct:])/g) as RegExp,
	reCopyright: /(\b ?|\s|^)(?:\(C\)|\[C\])/gi,
	reDimsign: /([\d.,]+['"]? ?)x( ?)(?=[\d.,]['"]?)/g,
	reDoublePrime: compile(/(\d*[.,]?\d+)"(?=\s|$|[:punct:])/g) as RegExp,
	reEllipsis: /([^.]?)\.{3}/g,
	reEmdash: /(^|[\s\w])--([\s\w]|$)/g,
	reEndash: / - /g,
	reOpenDQuote: /"/g,
	reOpenSQuote: /'/g,
	reRegistered: /(\b ?|\s|^)(?:\(R\)|\[R\])/gi,
	reSinglePrime: compile(/(\d*[.,]?\d+)'(?=\s|$|[:punct:])/g) as RegExp,
	reTrademark: /(\b ?|\s|^)(?:\((?:TM|tm)\)|\[(?:TM|tm)\])/g,
	// html
	reAttr: compile(
		/^\s*([^=\s]+)(?:\s*=\s*("[^"]+"|'[^']+'|[^>\s]+))?/,
	) as RegExp,
	reComment: compile(/^<!--([\s\S]*?)-->/, "s") as RegExp,
	reEndTag: compile(/^<\/([:html_id:])([^>]*)>/) as RegExp,
	reTag: compile(
		/^<([:html_id:])((?:\s[^=\s/]+(?:\s*=\s*[:html_attr:])?)+)?\s*(\/?)>/,
	) as RegExp,
	reHtmlTagBlock: compile(
		/^\s*<([:html_id:](?::[a-zA-Z\d]+)*)((?:\s[^=\s/]+(?:\s*=\s*[:html_attr:])?)+)?\s*(\/?)>/,
	) as RegExp,
	//list
	reList: compile(
		/^((?:[:txlisthd:][^\r\n\0]*\r?\n|[:txlisthd:][^\r\n\0]*$)+)(\s*\n|$)/,
		"s",
	) as RegExp,
	reItem: compile(/^([#*]+)([^\0]+?)(\n(?=[:txlisthd2:])|$)/, "s") as RegExp,
	// inline
	rePhrase: /^([[{]?)(__?|\*\*?|\?\?|[-+^~@%])/,
	reImage: compile(
		/^!(?!\s)([:txattr:](?:\.[^\n\S]|\.(?:[^./]))?)([^!\s]+?) ?(?:\(((?:[^()]|\([^()]+\))+)\))?!(?::([^\s]+?(?=[!-.:-@[\\\]-`{-~](?:$|\s)|\s|$)))?/,
	) as RegExp,
	reImageFenced: compile(
		/^\[!(?!\s)([:txattr:](?:\.[^\n\S]|\.(?:[^./]))?)([^!\s]+?) ?(?:\(((?:[^()]|\([^()]+\))+)\))?!(?::([^\s]+?(?=[!-.:-@[\\\]-`{-~](?:$|\s)|\s|$)))?\]/,
	) as RegExp,
	// NB: there is an exception in here to prevent matching "TM)"
	reCaps: compile(
		/^((?!TM\)|tm\))[[:ucaps:]](?:[[:ucaps:]\d]{1,}(?=\()|[[:ucaps:]\d]{2,}))(?:\((.*?)\))?(?=\W|$)/,
	) as RegExp,
	reLink: compile(
		/^"(?!\s)((?:[^"]|"(?![\s:])[^\n"]+"(?!:))+)"[:txcite:]/,
	) as RegExp,
	reLinkFenced: /^\["([^\n]+?)":((?:\[[a-z0-9]*\]|[^\]])+)\]/,
	reLinkTitle: /\s*\(((?:\([^()]*\)|[^()])+)\)$/,
	reFootnote: /^\[(\d+)(!?)\]/,
	//table
	reTable: compile(
		/^((?:table[:txattr:]\.(?:\s(.+?))\s*\n)?(?:(?:[:txattr:]\.[^\n\S]*)?\|.*?\|[^\n\S]*(?:\n|$))+)([^\n\S]*\n+)?/,
		"s",
	) as RegExp,
	reHead: /^table(_?)([^\n]*?)\.(?:[ \t](.+?))?\s*\n/,
	reRow: compile(
		/^(?:\|([~^-][:txattr:])\.\s*\n)?([:txattr:]\.[^\n\S]*)?\|(.*?)\|[^\n\S]*(\n|$)/,
		"s",
	) as RegExp,
	reCaption: /^\|=([^\n+]*)\n/,
	reColgroup: /^\|:([^\n+]*)\|[\r\t ]*\n/,
	reRowgroup: /^\|([\^\-~])([^\n+]*)\.[ \t\r]*\n/,
};
