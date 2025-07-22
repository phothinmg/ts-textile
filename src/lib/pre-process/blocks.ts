import { parseAttrs } from "../attrs.js";
import { parseHtmlAttrs } from "../htmlAttr.js";
import { StateARegexp } from "./regexp.js";
import type {
	BlocksSignature,
	StateABlockNode,
	StateABlockTypes,
} from "./types.js";
// ===============================================================================//
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
	const lines = stateAHtmlBlock(temp.newLines);
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
		}
		// HTML Blocks
		else if ((m = StateARegexp.html.tag.exec(str))) {
			obj.type = "html";
			obj.blockTag = m[1];
			obj.attributes = parseHtmlAttrs(m[2]);
			obj.dataString = m[4];
			obj.rawString = str;
		} else if ((m = StateARegexp.html.endTag.exec(str))) {
			obj.type = "htmlEnd";
			obj.dataString = str;
			obj.rawString = str;
		} else if (str === "%html%") {
			obj.type = "htmlMid";
			obj.dataString = str;
			obj.rawString = str;
		} // HTML Blocks
		else if ((m = StateARegexp.links.image.exec(str))) {
			obj.type = "imageLink";
			obj.dataString = str;
			obj.rawString = str;
		} else if ((m = StateARegexp.definitionList.dt.exec(str))) {
			obj.type = "defWiki";
			obj.dataString = str;
			obj.rawString = str;
		} else if ((m = StateARegexp.definitionList.dd.exec(str))) {
			obj.type = "defWiki-dd";
			obj.dataString = str;
			obj.rawString = str;
		}
		// Foot Note Definitions
		else if ((m = StateARegexp.footNote.def.exec(str))) {
			const _sym = m[2] ? { symbol: m[2] } : {};
			obj.type = "footnoteDef";
			obj.dataString = m[3];
			obj.rawString = m.input;
			//TODO check for `rev`
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

// --
/**
 * For long blocks of code with blank lines in between, use the extended block directive `bc..`
 * and end the block with `..bc`.
 *
 * @example
 *
 * ```text
 * bc(*js)..
 * const foo = (bar)=>{
 *  return bar
 * }
 * ..bc
 * ```
 *
 */
const stateABlockCode = (input: string) => {
	const lines = input.split(/\r?\n/);
	const bcOpenRe = /^bc([^.]*)(\.\.)/;
	const bcCloseRe = /^..bc$/; // $ for make sure the line has only `..bc`

	let cbContent = false;
	let cbIndex = 0;
	let line = "";
	let lineIndex: number | null = null;
	const newLines: string[] = [];
	const temp: { id: number; line: string }[] = [];
	const tempLines: { id: number; line: string }[] = [];
	const oriLines: { id: number; line: string }[] = [];
	const preStart = (text: string, id: number) => {
		const s = bcOpenRe.test(text);
		const e = bcCloseRe.test(text);

		if (s && !e) {
			cbIndex++;
			cbContent = true;
			lineIndex = id;
		}
	};
	const preEnd = (text: string) => {
		const _s = bcOpenRe.test(text);
		const e = bcCloseRe.test(text);

		if (cbIndex && e) {
			cbIndex--;
			cbContent = false;
			lineIndex = null;
		}
	};

	for (let i = 0; i < lines.length; i++) {
		line = lines[i];
		preStart(line, i);
		if (!cbIndex) {
			newLines.push(line);
		} else {
			preEnd(line);
			if (cbContent) {
				if (lineIndex) {
					temp.push({ id: lineIndex, line });
				}
				newLines.push("%bc%");
				tempLines.push({ id: i, line });
			} else {
				newLines.push(line);
			}
			cbContent = true;
		}
	}

	const group = temp.reduce<Record<number, { id: number; line: string }[]>>(
		(acc, current) => {
			if (!acc[current.id]) {
				acc[current.id] = [];
			}
			acc[current.id].push(current);
			return acc;
		},
		{},
	);

	const result = Object.keys(group).map((v) => {
		const arr: { id: number; line: string }[] = group[Number(v)];
		return arr.reduce(
			(pre, cur) => ({
				id: pre.id,
				line: `${pre.line}${cur.line}`,
			}),
			{ id: arr[0].id, line: "" },
		);
	});

	result.forEach((r) => {
		newLines.splice(r.id, 1, r.line);
		oriLines.push({ id: r.id, line: lines[r.id] });
	});
	return {
		newLines,
		tempLines,
		oriLines,
	};
};

// ---

const stateAHtmlBlock = (lines: string[]) => {
	const htmlOpenRe =
		/^<([a-zA-Z][a-zA-Z\d:]*)((?:\s[^=\s/]+(?:\s*=\s*(?:"[^"]+"|'[^']+'|[^>\s]+))?)+)?\s*(\/?)>/;
	const htmlCloseRe = /^<\/([a-zA-Z][a-zA-Z\d:]*)([^>]*)>/;
	let cbContent = false;
	let cbIndex = 0;
	let line = "";
	let lineIndex: number | null = null;
	const newLines: string[] = [];
	const temp: { id: number; line: string }[] = [];

	const preStart = (text: string, id: number) => {
		const s = htmlOpenRe.test(text);
		const e = htmlCloseRe.test(text);

		if (s && !e) {
			cbIndex++;
			cbContent = true;
			lineIndex = id;
		}
	};
	const preEnd = (text: string) => {
		const _s = htmlOpenRe.test(text);
		const e = htmlCloseRe.test(text);

		if (cbIndex && e) {
			cbIndex--;
			cbContent = false;
			lineIndex = null;
		}
	};
	for (let i = 0; i < lines.length; i++) {
		line = lines[i];
		preStart(line, i);
		if (!cbIndex) {
			newLines.push(line);
		} else {
			preEnd(line);
			if (cbContent) {
				if (lineIndex) {
					temp.push({ id: lineIndex, line });
				}
				newLines.push("%html%");
			} else {
				newLines.push(line);
			}
			cbContent = true;
		}
	}
	const group = temp.reduce<Record<number, { id: number; line: string }[]>>(
		(acc, current) => {
			if (!acc[current.id]) {
				acc[current.id] = [];
			}
			acc[current.id].push(current);
			return acc;
		},
		{},
	);

	const result = Object.keys(group).map((v) => {
		const arr: { id: number; line: string }[] = group[Number(v)];
		return arr.reduce(
			(pre, cur) => ({
				id: pre.id,
				line: `${pre.line} ${cur.line}`,
			}),
			{ id: arr[0].id, line: "" },
		);
	});

	result.forEach((r) => {
		newLines.splice(r.id, 1, r.line.trim());
	});
	return newLines;
};
