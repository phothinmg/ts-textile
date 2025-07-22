export const parseHtmlAttrs = (str: string) => {
	const re = /^\s*([^=\s]+)(?:\s*=\s*("[^"]+"|'[^']+'|[^>\s]+))?/;
	const attr = <Record<string, any>>{};
	let m: RegExpExecArray | null = null;
	while ((m = re.exec(str))) {
		attr[(m as RegExpExecArray)[1] as string] =
			typeof m[2] === "string" ? m[2].replace(/^(["'])(.*)\1$/, "$2") : null;
		str = str.slice(m[0].length);
	}
	const keys = Object.keys(attr);
	const attrs = <Record<string, any>>{};
	const classAttrs: string[] = [];
	const stylesAttrs: string[] = [];

	for (const key of keys) {
		if (key === "class") {
			(attr[key] as string).split(" ").forEach((v) => {
				classAttrs.push(v);
			});
			attrs.className = classAttrs;
		} else if (key === "style") {
			(attr[key] as string).split(";").forEach((v) => {
				stylesAttrs.push(v);
			});
			attrs.styles = stylesAttrs.filter((i) => i !== "");
		} else {
			attrs[key] = attr[key];
		}
	}
	return attrs;
};
