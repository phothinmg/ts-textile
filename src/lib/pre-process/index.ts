/**
 * Pre Process State (State A)
 * ---------------------------
 *
 * The entry point of this package.
 *
 * Raw Textile String ===> Tokens Tree
 *
 * @packageDocumentation
 */
import { isPlainObject } from "../helpers.js";
import { stateABlockNodes } from "./blocks.js";
import { StateARegexp } from "./regexp.js";
import type { StateABlockNode } from "./types.js";

// =================================================================================== //
type PreProcessHook = (...args: any[]) => any;

export const tokenize = (
	input: string,
	hooks?: PreProcessHook[],
): StateABlockNode[] => {
	let tree = createStateANodeTree(input);
	if (hooks?.length) {
		hooks.forEach((fn) => {
			tree = fn();
		});
	}
	return tree;
};

const createStateANodeTree = (input: string): StateABlockNode[] => {
	// Order is important here
	const nodes = stateABlockNodes(input);
	let tree = stateADefineNodeType(nodes);
	tree = tree.map(reStructureNode);
	tree = mergeParagraph(tree);
	tree = mergeLists(tree);
	tree = mergeDefList(tree);
	tree = mergeTable(tree);
	tree = mergeWikiDef(tree);
	tree = parseLinks(tree);
	return tree;
};

/**
 * Given a StateA Block Node, restructures the node to have the properties
 * `type`, `signature`, `attributes`, `dataString`, `rawString`, `linkRef`,
 * `dotNotationCount`, and `footNoteRef` if the node is a footnote definition.
 * @param node the StateA Block Node
 * @returns the restructured node
 */
function reStructureNode(node: StateABlockNode) {
	const typeObj = node.type ? { type: node.type } : {};
	const dso = node.dataString ? { dataString: node.dataString } : {};
	const sigObject = node.signature ? { signature: node.signature } : {};
	const attr = node.attributes ? reStructureAttr(node.attributes) : {};
	const lfo = node.linkRef ? { linkRef: node.linkRef } : {};
	const rso = node.rawString ? { rawString: node.rawString } : {};
	const dnc = node.dotNotationCount
		? { dotNotationCount: node.dotNotationCount }
		: {};
	const fnDef =
		node.type === "footnoteDef" ? { footNoteRef: node.footNoteRef } : {};
	const newNode: StateABlockNode = {
		lineIndex: node.lineIndex,
		...typeObj,
		...sigObject,
		...attr,
		...dso,
		...rso,
		...lfo,
		...fnDef,
		...dnc,
	};
	return newNode;
}

/**
 * Restructures an attribute object by selectively including `className` and `styles`
 * properties if they exist and are non-empty. It combines these with any additional
 * attributes present in the input object. If the resulting object is not a plain object,
 * it wraps the attributes in a new object with an `attributes` key.
 *
 * @param attr - A record containing attribute key-value pairs, including optional
 * `className` and `styles`.
 * @returns A restructured attribute object or an empty object if the restructuring
 * results in a plain object.
 */

function reStructureAttr(attr: Record<string, any>) {
	const { className, styles, ...rest } = attr;
	const _cn = className;
	const _st = styles;
	const cob = attr.className?.length ? { className: attr.className } : {};
	const sto = attr.styles?.length ? { styles: attr.styles } : {};
	const attrObj: Record<string, any> = {
		...cob,
		...sto,
		...rest,
	};
	return !isPlainObject(attrObj) ? { attributes: attrObj } : {};
}

/**
 * Given a StateA Node Tree, merges all consecutive text nodes into a single
 * paragraph node. If the tree contains a node that is not a paragraph or text
 * node, it is left as is. The lineIndex properties of the merged nodes are
 * adjusted to ensure that the output tree is continuous.
 *
 * @param tree the StateA Node Tree
 * @returns the modified StateA Node Tree
 */
function mergeParagraph(tree: StateABlockNode[]) {
	const nodes = tree.filter((i) => i.type === "paragraph" || i.type === "text");
	const merged: StateABlockNode[] = [];
	let i = 0;

	while (i < nodes.length) {
		const node = nodes[i];
		if (node.type === "paragraph") {
			// Start with the paragraph node
			const mergedNode = { ...node };
			let lastLineIndex = node.lineIndex;
			let j = i + 1;
			// Merge all consecutive text nodes by lineIndex
			while (
				j < nodes.length &&
				nodes[j].type === "text" &&
				nodes[j].lineIndex === lastLineIndex + 1
			) {
				(mergedNode.dataString as string) += `%br%${nodes[j].dataString}`;
				(mergedNode.rawString as string) += nodes[j].rawString;
				lastLineIndex = nodes[j].lineIndex;
				j++;
			}
			merged.push(mergedNode);
			// For each merged text node, substitute with its lineIndex
			let k = i + 1;
			while (
				k < nodes.length &&
				nodes[k].type === "text" &&
				nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
			) {
				merged.push({
					lineIndex: nodes[k].lineIndex,
					type: "$rm$",
				});
				k++;
			}
			i = j;
		} else {
			// Not a paragraph, just push as is
			merged.push(node);
			i++;
		}
	}
	merged.forEach((v) => {
		tree.splice(v.lineIndex, 1, v);
	});
	return tree;
}

/**
 * Given a StateA Node Tree, merges all consecutive list nodes into a single
 * lists node. If the tree contains a node that is not a list node, it is left as is.
 * The lineIndex properties of the merged nodes are adjusted to ensure that the
 * output tree is continuous.
 *
 * @param tree the StateA Node Tree
 * @returns the modified StateA Node Tree
 */
function mergeLists(tree: StateABlockNode[]) {
	const nodes = tree.filter((i) => i.type === "lists");

	const merged: StateABlockNode[] = [];
	let i = 0;

	while (i < nodes.length) {
		const node = nodes[i];
		if (node.type === "lists") {
			// Start with the paragraph node
			const mergedNode = { ...node };
			let lastLineIndex = node.lineIndex;
			let j = i + 1;
			// Merge all consecutive text nodes by lineIndex
			while (j < nodes.length && nodes[j].lineIndex === lastLineIndex + 1) {
				mergedNode.dataString += `\n${nodes[j].dataString}`;
				(mergedNode.rawString as string) += nodes[j].rawString;
				lastLineIndex = nodes[j].lineIndex;
				j++;
			}
			merged.push(mergedNode);
			// For each merged text node, substitute with its lineIndex
			let k = i + 1;
			while (
				k < nodes.length &&
				nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
			) {
				merged.push({ lineIndex: nodes[k].lineIndex, type: "$rm$" });
				k++;
			}
			i = j;
		} else {
			merged.push(node);
			i++;
		}
	}
	merged.forEach((v) => {
		tree.splice(v.lineIndex, 1, v);
	});
	return tree;
}

/**
 * Merges all consecutive definitionList nodes into a single
 * definitionList node. If the tree contains a node that is not a
 * definitionList node, it is left as is. The lineIndex properties of
 * the merged nodes are adjusted to ensure that the output tree is
 * continuous.
 *
 * @param tree the StateA Node Tree
 * @returns the modified StateA Node Tree
 */
function mergeDefList(tree: StateABlockNode[]) {
	const nodes = tree.filter((i) => i.type === "definitionList");

	const merged: StateABlockNode[] = [];
	let i = 0;

	while (i < nodes.length) {
		const node = nodes[i];
		if (node.type === "definitionList") {
			const mergedNode = { ...node };
			mergedNode.dataString =
				typeof mergedNode.dataString === "string" ? mergedNode.dataString : "";
			mergedNode.rawString =
				typeof mergedNode.rawString === "string" ? mergedNode.rawString : "";
			let lastLineIndex = node.lineIndex;
			let j = i + 1;
			// Only merge consecutive definitionList nodes
			while (
				j < nodes.length &&
				nodes[j].type === "definitionList" &&
				nodes[j].lineIndex === lastLineIndex + 1
			) {
				mergedNode.dataString += `\n${nodes[j].dataString ?? ""}`;
				mergedNode.rawString += nodes[j].rawString ?? "";
				lastLineIndex = nodes[j].lineIndex;
				j++;
			}
			merged.push(mergedNode);
			let k = i + 1;
			while (
				k < nodes.length &&
				nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
			) {
				merged.push({ lineIndex: nodes[k].lineIndex, type: "$rm$" });
				k++;
			}
			i = j;
		} else {
			merged.push(node);
			i++;
		}
	}
	merged.forEach((v) => {
		tree.splice(v.lineIndex, 1, v);
	});
	return tree;
}
/**
 * Merges all consecutive table nodes into a single table node.
 * If the tree contains a node that is not a table node, it is left as is.
 * The lineIndex properties of the merged nodes are adjusted to ensure that the
 * output tree is continuous.
 *
 * @param tree the StateA Node Tree
 * @returns the modified StateA Node Tree
 */
function mergeTable(tree: StateABlockNode[]) {
	const nodes = tree.filter((i) => i.type === "table");

	const merged: StateABlockNode[] = [];
	let i = 0;

	while (i < nodes.length) {
		const node = nodes[i];
		if (node.type === "table") {
			const mergedNode = { ...node };
			mergedNode.dataString =
				typeof mergedNode.dataString === "string" ? mergedNode.dataString : "";
			mergedNode.rawString =
				typeof mergedNode.rawString === "string" ? mergedNode.rawString : "";
			let lastLineIndex = node.lineIndex;
			let j = i + 1;
			// Only merge consecutive definitionList nodes
			while (
				j < nodes.length &&
				nodes[j].type === "table" &&
				nodes[j].lineIndex === lastLineIndex + 1
			) {
				mergedNode.dataString += `\n${nodes[j].dataString ?? ""}`;
				mergedNode.rawString += nodes[j].rawString ?? "";
				lastLineIndex = nodes[j].lineIndex;
				j++;
			}
			merged.push(mergedNode);
			let k = i + 1;
			while (
				k < nodes.length &&
				nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
			) {
				merged.push({ lineIndex: nodes[k].lineIndex, type: "$rm$" });
				k++;
			}
			i = j;
		} else {
			merged.push(node);
			i++;
		}
	}
	merged.forEach((v) => {
		tree.splice(v.lineIndex, 1, v);
	});

	return tree;
}

// --

function parseLinks(tree: StateABlockNode[]) {
	const linkGroup = tree.filter((node) => node.type === "anchorTag");
	const linkRefGroup = tree.filter((node) => node.type === "linkRef");
	const linkRefs: { name: string; link: string }[] = [];
	if (linkRefGroup?.length) {
		linkRefGroup.forEach((i) => {
			linkRefs.push({
				name: i.linkRef?.name as string,
				link: i.linkRef?.link as string,
			});
		});
	}
	if (linkGroup?.length) {
		for (const link of linkGroup) {
			const newNode = {
				lineIndex: link.lineIndex,
				type: "anchorTag",
				rawString: link.rawString,
				dataString: "",
				attributes: {
					className: [] as string[],
					id: "",
					href: "",
					title: "",
				} as Record<string, any>,
			};
			let m: RegExpExecArray | null = null;
			let m2: RegExpExecArray | null = null;
			let t_data = "";
			let t_href = "";
			if (
				(m = StateARegexp.links.link.exec(link.rawString as string)) ||
				(m = StateARegexp.links.fenced.exec(link.rawString as string))
			) {
				t_data = m[1];
				t_href = m[2];
			} //--
			if (t_href !== "") {
				const lrf = linkRefs.find((i) => i.name === t_href);
				if (lrf) {
					t_href = lrf.link;
				}
				newNode.attributes.href = t_href;
			} //---
			if (t_data !== "") {
				let rm = t_data;
				if ((m2 = StateARegexp.links.title.exec(rm))) {
					let m3: RegExpExecArray | null = null;
					newNode.attributes.title = m2[1];
					rm = rm.slice(0, t_data.length - m2[0].length);
					if ((m3 = StateARegexp.classIdRe.exec(rm.trimStart()))) {
						// split the string by one or more spaces
						const dd = m3[1].split(/\s+/);
						if (dd.length) {
							dd.forEach((d) => {
								if (d.startsWith("#")) {
									newNode.attributes.id = d.slice(1);
								} else if (d.startsWith("*")) {
									newNode.attributes.className.push(`language-${d.slice(1)}`);
								} else {
									newNode.attributes.className.push(d);
								}
							});
						}
						rm = rm.slice(m3[0].length);
					} //--
				}
				t_data = rm;
				newNode.dataString = t_data;
			} //-- t_data
			const cN = newNode.attributes.className.length
				? { className: newNode.attributes.className }
				: {};
			const _id =
				newNode.attributes.id !== "" ? { id: newNode.attributes.id } : {};
			const _title =
				newNode.attributes.title !== ""
					? { title: newNode.attributes.title }
					: {};
			const new_node: StateABlockNode = {
				lineIndex: newNode.lineIndex,
				type: "anchorTag",
				rawString: newNode.rawString,
				dataString: newNode.dataString,
				attributes: {
					href: newNode.attributes.href ?? "",
					...cN,
					..._id,
					..._title,
				},
			};
			tree.splice(link.lineIndex, 1, new_node);
		} // --link
	}
	return tree;
}

// --

const stateADefineNodeType = (tree: StateABlockNode[]) => {
	// links
	const linkGroup = tree.filter(
		(node) =>
			node.type === "text" &&
			(StateARegexp.links.link.test(node.dataString as string) ||
				StateARegexp.links.fenced.test(node.dataString as string)),
	);
	if (linkGroup?.length) {
		for (const link of linkGroup) {
			const { type, ...rest } = link;
			const _type = type;
			const newLink = {
				type: "anchorTag",
				...rest,
			} as StateABlockNode;
			tree.splice(link.lineIndex, 1, newLink);
		}
	}
	// Image
	const imageGroup = tree.filter(
		//TODO regexp for images, here is only for `regexp.test()`
		(i) => i.type === "text" && /^!(.*)!/.test(i.dataString),
	);
	if (imageGroup?.length) {
		for (const node of imageGroup) {
			const { type, ...rest } = node;
			const _type = type;
			const newNode = {
				type: "image",
				...rest,
			} as StateABlockNode;
			tree.splice(node.lineIndex, 1, newNode);
		}
	}
	// Bulleted (unordered) lists and Numbered (ordered) lists
	const listsGroup = tree.filter(
		(i) => i.type === "text" && StateARegexp.lists.test(i.dataString),
	);
	if (listsGroup?.length) {
		for (const node of listsGroup) {
			const { type, ...rest } = node;
			const _type = type;
			const newNode = {
				type: "lists",
				...rest,
			} as StateABlockNode;
			tree.splice(node.lineIndex, 1, newNode);
		}
	}
	// Definition lists
	const defListGroup = tree.filter(
		(i) =>
			i.type === "text" &&
			(StateARegexp.definitionList.list.test(i.dataString) ||
				StateARegexp.definitionList.endList.test(i.dataString) ||
				StateARegexp.definitionList.dd.test(i.dataString) ||
				StateARegexp.definitionList.dt.test(i.dataString)),
	);
	if (defListGroup?.length) {
		for (const node of defListGroup) {
			const { type, ...rest } = node;
			const _type = type;
			const newNode = {
				type: "definitionList",
				...rest,
			} as StateABlockNode;
			tree.splice(node.lineIndex, 1, newNode);
		}
	}
	// Endnotes (auto-numbered notes)
	const noteListGroup = tree.filter(
		(i) => i.type === "text" && StateARegexp.noteList.test(i.dataString),
	);
	if (noteListGroup?.length) {
		for (const node of noteListGroup) {
			const { type, ...rest } = node;
			const _type = type;
			const newNode = {
				type: "noteList",
				...rest,
			} as StateABlockNode;
			tree.splice(node.lineIndex, 1, newNode);
		}
	}
	// Table
	const tableGroup = tree.filter(
		(i) => i.type === "text" && isTable(i.dataString),
	);
	if (tableGroup?.length) {
		for (const node of tableGroup) {
			const { type, ...rest } = node;
			const _type = type;
			const newNode = {
				type: "table",
				...rest,
			} as StateABlockNode;
			tree.splice(node.lineIndex, 1, newNode);
		}
	}
	// break
	const breakGroup = tree.filter(
		(i) => i.type === "text" && i.rawString === "",
	);
	if (breakGroup?.length) {
		for (const node of breakGroup) {
			const { type, dataString, ...rest } = node;
			const _type = type;
			const _ds = dataString;
			const newNode = {
				type: "break",
				dataString: "\n",
				...rest,
			} as StateABlockNode;
			tree.splice(node.lineIndex, 1, newNode);
		}
	}
	// remove link ref from non-linkRef
	const nonRef = tree.filter((i) => i.type !== "linkRef");
	if (nonRef?.length) {
		for (const node of nonRef) {
			const { linkRef, ...rest } = node;
			const _lf = linkRef;
			const newNode = {
				...rest,
			} as StateABlockNode;
			tree.splice(node.lineIndex, 1, newNode);
		}
	}
	// return
	return tree;
};

function isTable(str: string) {
	return (
		StateARegexp.table.table.test(str) ||
		StateARegexp.table.caption.test(str) ||
		StateARegexp.table.colGroup.test(str) ||
		StateARegexp.table.colSpan.test(str) ||
		StateARegexp.table.head.test(str) ||
		StateARegexp.table.row.test(str) ||
		StateARegexp.table.rowGroup.test(str) ||
		StateARegexp.table.rowSpan.test(str) ||
		StateARegexp.table.blocks.test(str)
	);
}

function mergeWikiDef(tree: StateABlockNode[]) {
	const nodes = tree.filter(
		(i) => i.type === "defWiki" || i.type === "defWiki-dd",
	);
	const merged: StateABlockNode[] = [];
	let i = 0;

	while (i < nodes.length) {
		const node = nodes[i];
		if (node.type === "defWiki") {
			const mergedNode = { ...node };
			let lastLineIndex = node.lineIndex;
			let j = i + 1;
			while (
				j < nodes.length &&
				nodes[j].type === "defWiki-dd" &&
				nodes[j].lineIndex === lastLineIndex + 1
			) {
				(mergedNode.dataString as string) += ` ${nodes[j].dataString}`;
				(mergedNode.rawString as string) += nodes[j].rawString;
				lastLineIndex = nodes[j].lineIndex;
				j++;
			}
			merged.push(mergedNode);
			let k = i + 1;
			while (
				k < nodes.length &&
				nodes[k].type === "defWiki-dd" &&
				nodes[k].lineIndex === lastLineIndex + 1 - (j - k)
			) {
				merged.push({
					lineIndex: nodes[k].lineIndex,
					type: "$rm$",
				});
				k++;
			}
			i = j;
		} else {
			merged.push(node);
			i++;
		}
	}
	merged.forEach((v) => {
		tree.splice(v.lineIndex, 1, v);
	});
	return tree;
}
