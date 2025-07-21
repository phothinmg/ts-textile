import { StateARegexp } from "./regexp.js";
import type { StateABlockNode } from "./types.js";

export const stateADefineNodeType = (tree: StateABlockNode[]) => {
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
	// Footnotes
	// const footNoteGroup = tree.filter(
	// 	(i) => i.type === "text" && StateARegexp.footNote.def.test(i.dataString),
	// );
	// if (footNoteGroup?.length) {
	// 	for (const node of footNoteGroup) {
	// 		const { type, ...rest } = node;
	// 		const _type = type;
	// 		const newNode = {
	// 			type: "footnoteDef",
	// 			...rest,
	// 		} as StateABlockNode;
	// 		tree.splice(node.lineIndex, 1, newNode);
	// 	}
	// }
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
