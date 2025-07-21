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
export const blockCode = (input: string) => {
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
				line: `${pre.line}\n${cur.line}`,
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

export const bc = (str: string): string =>
	blockCode(str)
		.newLines.filter((i) => i !== "..bc" && i !== "%bc%")
		.join("\n");
