import { regexp } from "./re.js";
import type { TagName } from "./types.js";

const ReTests = {
	testBlock(name: TagName) {
		// "in" test would be better but what about fn#.?
		return /^(?:table|t[dh]|t(?:foot|head|body)|b[qc]|div|notextile|pre|h[1-6]|fn\\d+|p|###)$/.test(
			name,
		);
	},
	testComment(src: string) {
		return regexp.reComment.exec(src);
	},
	testOpenTagBlock(src: string) {
		return regexp.reHtmlTagBlock.exec(src);
	},
	testOpenTag(src: string) {
		return regexp.reTag.exec(src);
	},
	testCloseTag(src: string) {
		return regexp.reEndTag.exec(src);
	},
	testDefList(src: string) {
		return regexp.reDeflist.exec(src);
	},
	testList(src: string) {
		return regexp.reList.exec(src);
	},
	testTable(src: string) {
		return regexp.reTable.exec(src);
	},
};

export default ReTests;
