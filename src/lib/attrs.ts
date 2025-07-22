import type { BlocksSignature } from "./pre-process/types.js";

const reAlign = /^(<>|<|>|=|~|\^|-)/;
const reClassId = /^\(([^()\n]+)\)/;
const reStyle = /^\{([^}]*)\}/;
const reLang = /^\[([^[\]\n]+)\]/;
const reCss = /^\s*([^:\s]+)\s*:\s*(.+)\s*$/;
const reLeftIndent = /^(\(+)\.\.*/;
const reRightIndent = /^(\)+>)\.*/;

const stateAAlignAttrMap = {
	"<": "text-align: left",
	">": "text-align: right",
	"=": "text-align: center",
	"<>": "text-align: justify",
	"^": "vertical-align: top",
	"-": "vertical-align: middle",
	"~": "vertical-align: bottom",
};

export const parseAttrs = (str: string, blockTag?: BlocksSignature) => {
	if (str === "") return {};
	const obj: Record<string, any> = {
		className: <string[]>[],
		styles: <string[]>[],
		lang: <string | undefined>undefined,
		id: <string | undefined>undefined,
		highlightLang: <string | undefined>undefined,
	};
	let remain = str;
	let m: RegExpExecArray | null = null;
	do {
		// right indent
		if ((m = reRightIndent.exec(remain))) {
			const num = m[1].slice(0, -1).length;
			obj.styles!.push("text-align: right");
			obj.styles!.push(`padding-right: ${num}em`);
			remain = remain.slice(m[1].length);
			continue;
		}
		// left indent
		if ((m = reLeftIndent.exec(remain))) {
			const num = m[1].length;
			obj.styles!.push(`padding-left: ${num}em`);
			remain = remain.slice(m[1].length);
			continue;
		}
		// attrs align
		if ((m = reAlign.exec(remain))) {
			obj.styles!.push(stateAAlignAttrMap[m[1]]);
			remain = remain.slice(m[0].length);
			continue;
		}
		// class and id
		if ((m = reClassId.exec(remain))) {
			// split the string by one or more spaces
			const dd = m[1].split(/\s+/);
			if (dd.length) {
				dd.forEach((d) => {
					if (d.startsWith("#")) {
						obj.id = d.slice(1);
					} else if (d.startsWith("*")) {
						obj.className!.push(`language-${d.slice(1)}`);
						if (blockTag === "bc") {
							obj.highlightLang = d.slice(1);
						}
					} else {
						obj.className!.push(d);
					}
				});
			}
			remain = remain.slice(m[0].length);
			continue;
		}
		// styles
		if ((m = reStyle.exec(remain))) {
			const ss = m[1].split(";");
			if (ss.length) {
				ss.forEach((s) => {
					if (reCss.test(s)) {
						obj.styles!.push(s);
					}
				});
			}
			remain = remain.slice(m[0].length);
			continue;
		}
		// lang
		if ((m = reLang.exec(remain))) {
			obj.lang = m[1];
			remain = remain.slice(m[0].length);
		}
	} while (m);
	return obj;
};
