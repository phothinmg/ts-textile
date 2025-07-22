/**
 * Generates a footnote identifier string based on the input and a flag.
 *
 * @param input - A string or number to be included in the identifier.
 * // cSpell:disable-next-line
 * @param r - A boolean flag indicating whether to use "fnrev" or "fn"
 *            as a prefix.
 * @returns A string that combines the prefix, a hexadecimal representation
 *          of the input, and the original input, formatted as a footnote ID.
 */

export const createFootnoteId = (input: string | number, r: boolean) => {
	// cSpell:disable-next-line
	const fn = r ? "fnrev" : "fn";
	const fnId = Buffer.from(`FootNoteID${input}`).toString("hex");
	return `${fn}${fnId}-${input}`;
};
/**
 * Generates a footnote anchor string based on the input and a flag.
 *
 * @param input - A string or number to be included in the anchor.
 * // cSpell:disable-next-line
 * @param r - A boolean flag indicating whether to use "#fnrev" or "#fn"
 *            as a prefix.
 * @returns A string that combines the prefix, a hexadecimal representation
 *          of the input, and the original input, formatted as a footnote anchor.
 */
export const createFootnoteHashId = (input: string | number, r: boolean) => {
	// cSpell:disable-next-line
	const fn = r ? "#fnrev" : "#fn";
	const fnId = Buffer.from(`FootNoteID${input}`).toString("hex");
	return `${fn}${fnId}-${input}`;
};
