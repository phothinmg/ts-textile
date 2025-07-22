import type { JsonMLNode, JsonMLNodes, JsonMLRoot } from "./shares/types.js";

class Ribbon {
	private org: string;
	private feed: string;
	private slot: number;
	private pos: number;
	constructor(input: string) {
		this.org = input;
		this.feed = input;
		this.slot = 0;
		this.pos = 0;
	}
	index() {
		return this.pos;
	}
	save() {
		this.slot = this.pos;
		return this;
	}
	load() {
		this.pos = this.slot;
		this.feed = this.org.slice(this.pos);
		return this;
	}
	advance(n: string | number) {
		this.pos += typeof n === "string" ? n.length : n;
		this.feed = this.org.slice(this.pos);
		return this.feed;
	}
	skipWS() {
		const ws = /^\s+/.exec(this.feed);
		if (ws) {
			this.pos += ws[0].length;
			this.feed = this.org.slice(this.pos);
			return ws[0];
		}
		return "";
	}
	lookbehind(nchars: number | null) {
		nchars = nchars == null ? 1 : nchars;
		return this.org.slice(this.pos - nchars, this.pos);
	}
	startsWith(s: string) {
		return this.feed.substring(0, s.length) === s;
	}
	slice(a: number, b?: number | null) {
		return b !== null ? this.feed.slice(a, b) : this.feed.slice(a);
	}
	valueOf() {
		return this.feed;
	}
	toString() {
		return this.feed;
	}
}

class Builder {
	private ar: any[];
	private arr: JsonMLRoot;
	constructor(initArr?: any) {
		this.ar = initArr && Array.isArray(initArr) ? initArr : [];
		this.arr = [...this.ar];
	}
	add(node: JsonMLNode) {
		if (
			typeof node === "string" &&
			typeof this.arr[this.arr.length - 1] === "string"
		) {
			// join if possible
			this.arr[this.arr.length - 1] += node;
		} else if (Array.isArray(node)) {
			this.arr.push(node.filter((s) => s !== undefined) as JsonMLNode);
		} else if (node) {
			this.arr.push(node);
		}
		return this;
	}
	merge(nodes: JsonMLNodes) {
		for (let i = 0, l = nodes.length; i < l; i++) {
			this.add(nodes[i] as JsonMLNode);
		}
		return this;
	}
	linebreak() {
		if (this.arr.length > 0) {
		}
	}
	get() {
		return this.arr;
	}
}

export { Ribbon, Builder };
