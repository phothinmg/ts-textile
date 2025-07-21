export const createFootnoteId = (input: string | number, r: boolean) => {
	const fn = r ? "fnrev" : "fn";
	const fnId = Buffer.from(`FootNoteID${input}`).toString("hex");
	return `${fn}${fnId}-${input}`;
};
export const createFootnoteHashId = (input: string | number, r: boolean) => {
	const fn = r ? "#fnrev" : "#fn";
	const fnId = Buffer.from(`FootNoteID${input}`).toString("hex");
	return `${fn}${fnId}-${input}`;
};
