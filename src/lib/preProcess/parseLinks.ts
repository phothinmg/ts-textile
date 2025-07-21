import { StateARegexp } from "./regexp.js";
import type { StateABlockNode } from "./types.js";

export function parseLinks(tree: StateABlockNode[]) {
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
