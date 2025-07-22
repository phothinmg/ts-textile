//import { stateAAttributes } from "../pre-process/attributes.js";
import { parseAttrs } from "../attrs.js";
import { isPlainObject } from "../helpers.js";
import type { StateABlockNode } from "../pre-process/types.js";
import type { ElementNode, TextileNode, TextNode } from "../types.js";

/**
 * captured group one (m[1]) = list type and depth `*`|`#` up to `***`|`###`, `*` for `ul` `#` for `ol`
 *
 * captured group two (m[2])(undefined) , number `1` to `99` for `start="4"`| r for list's items are in reverse order |
 * `_` for  continuation of a list’s numbering from where you previous ordered list finished.
 *
 * captured group three (m[3])(undefined), i | I | a | A for `type="i"`
 *
 * captured group four (m[4])(undefined), `styles` | `class` | `id` | `lang` attrs.
 *
 * captured group five (m[5])(undefined), list's items text.
 */
const orderedRegexp =
	/^(#{1,3})(?:(\d{1,2}|_|r)(a|A|i|I))?((?:\([^)]*\)|\{[^}]*\}|\[[^\]]*\])*)\s+(.*)(?:\r|\n|$)/;
const olRegexp =
	/^(#{1,3})(?:(\d{1,2}|_|r)(a|A|i|I))?((?:\([^)]*\)|\{[^}]*\}|\[[^\]]*\])*)\.$/;
/**
 * captured group one (m[1]) = list type and depth `*`|`#` up to `***`|`###`, `*` for `ul` `#` for `ol`
 *
 * captured group two (m[2])(undefined), `styles` | `class` | `id` | `lang` attrs.
 *
 * captured group three (m[3])(undefined), list's items text.
 */
const bulletedRegex =
	/^(\*{1,3})((?:\([^)]*\)|\{[^}]*\}|\[[^\]]*\])*)\s+(.+)(?:\r|\n|$)/;
const ulRegexp = /^(\*{1,3})((?:\([^)]*\)|\{[^}]*\}|\[[^\]]*\])*)\.$/;

const _isOl = (str: string) => orderedRegexp.test(str) || olRegexp.test(str);
const olMatch = (str: string) => orderedRegexp.exec(str);
const olMatchDot = (str: string) => olRegexp.exec(str);
const ulMatch = (str: string) => bulletedRegex.exec(str);
const ulMatchDot = (str: string) => ulRegexp.exec(str);

const olM1 = (str: string, index: number) => {
	return str === "_"
		? { start: String(index + 1) }
		: str === "r"
			? { reversed: true }
			: { start: String(str) };
};

export const parseList = (tree: (TextileNode | StateABlockNode)[]) => {
	let olIndex = 0;
	const newTree: (TextileNode | StateABlockNode)[] = [];
	for (const node of tree) {
		if (node.type === "lists") {
			const newNode: ElementNode = {
				type: "Element",
				tagName: "",
				properties: {},
				children: [],
			};
			const lines = node?.dataString?.split("\n");
			for (const line of lines as string[]) {
				const m1Obj = { start: "", reversed: false };
				let m: RegExpExecArray | null = null;
				let liNode: ElementNode | null = null;
				let props: Record<string, any> = {};
				let textValue = "";
				if ((m = olMatchDot(line))) {
					newNode.tagName = "ol";
					if (m[2]) {
						const s = olM1(m[2], olIndex);
						if (s.reversed) m1Obj.reversed = s.reversed;
						if (s.start) m1Obj.start = s.start;
					}
					// Only apply m1Obj to newNode.properties if tagName is 'ol'
					newNode.properties = m[4]
						? { ...m1Obj, ...parseAttrs(m[4].trimStart()) }
						: { ...m1Obj };
				} else if ((m = olMatch(line))) {
					newNode.tagName = "ol";
					if (m[2]) {
						const s = olM1(m[2], olIndex);
						if (s.reversed) m1Obj.reversed = s.reversed;
						if (s.start) m1Obj.start = s.start;
					}
					// Only apply m1Obj to newNode.properties if tagName is 'ol'
					props = m[4] ? { ...parseAttrs(m[4].trimStart()) } : {};
					if (isPlainObject(newNode.properties))
						newNode.properties = { ...m1Obj, ...props };
					textValue = m[5];
					// Handle nesting
					if (m[1].length === 1) {
						liNode = {
							type: "Element",
							tagName: "li",
							properties: props,
							children: [{ type: "Text", value: textValue }],
						};
						newNode.children?.push(liNode);
						olIndex++;
					} else if (m[1].length === 2) {
						liNode = {
							type: "Element",
							tagName: "ol",
							properties: {},
							children: [
								{
									type: "Element",
									tagName: "li",
									properties: props,
									children: [{ type: "Text", value: textValue }],
								},
							],
						};
						newNode.children?.push(liNode);
					} else if (m[1].length === 3) {
						liNode = {
							type: "Element",
							tagName: "ol",
							properties: {},
							children: [
								{
									type: "Element",
									tagName: "ol",
									properties: {},
									children: [
										{
											type: "Element",
											tagName: "li",
											properties: props,
											children: [{ type: "Text", value: textValue }],
										},
									],
								},
							],
						};
						newNode.children?.push(liNode);
					}
				} else if ((m = ulMatchDot(line))) {
					newNode.tagName = "ul";
					newNode.properties = m[2] ? parseAttrs(m[2].trimStart()) : {};
				} else if ((m = ulMatch(line))) {
					newNode.tagName = "ul";
					props = m[2] ? parseAttrs(m[2].trim()) : {};
					textValue = m[3];
					// Handle nesting
					if (m[1].length === 1) {
						liNode = {
							type: "Element",
							tagName: "li",
							properties: props,
							children: [{ type: "Text", value: textValue }],
						};
						newNode.children?.push(liNode);
						olIndex++;
					} else if (m[1].length === 2) {
						liNode = {
							type: "Element",
							tagName: "ul",
							properties: {},
							children: [
								{
									type: "Element",
									tagName: "li",
									properties: props,
									children: [{ type: "Text", value: textValue }],
								},
							],
						};
						newNode.children?.push(liNode);
					} else if (m[1].length === 3) {
						liNode = {
							type: "Element",
							tagName: "ul",
							properties: {},
							children: [
								{
									type: "Element",
									tagName: "ul",
									properties: {},
									children: [
										{
											type: "Element",
											tagName: "li",
											properties: props,
											children: [{ type: "Text", value: textValue }],
										},
									],
								},
							],
						};
						newNode.children?.push(liNode);
					}
				}
			}
			newTree.push(newNode);
		} else {
			newTree.push(node);
		}
	}
	return newTree;
};
