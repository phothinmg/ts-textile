/**
 * Textile-TS: TypeScript implementation of textile-js by Borgar Þorsteinsson.
 *
 * Original textile-js (MIT License, 2012): https://github.com/borgar/textile-js
 *
 * This project adapts and extends the original textile-js parser for TypeScript.
 *
 * @packageDocumentation
 */
import { jml2html } from "./lib/jsonml/html-jml.js";
import textile2jml from "./lib/jsonml/index.js";
import walk from "./lib/jsonml/walk.js";
import type {
	JsonMLAttributes,
	JsonMLElement,
	JsonMLNode,
	JsonMLNodes,
	JsonMLRoot,
	JsonMLVisitor,
	Options,
	TagName,
} from "./lib/shares/types.js";

class Textile {
	private _opts: Options;
	private _text: string;
	private _html: string;
	private _tree: JsonMLRoot;
	private _visitors: JsonMLVisitor[];
	constructor(options?: Options) {
		this._opts = options ?? { breaks: true };
		this._visitors = [];
		this._text = "";
		this._html = "";
		this._tree = [];
	}
	private _init() {
		if (this._text === "") {
			throw new Error("Error: required raw textile string to convert");
		}
		this._tree = textile2jml(this._text, this._opts);
		if (this._visitors.length > 0) {
			this._visitors.forEach((v) => {
				walk(this._tree, v);
			});
		}
		this._html = jml2html(this._tree);
	}
	/**
	 * Register one or more visitors to process the JSON-ML tree before
	 * HTML conversion. Visitors are applied in the order they are added.
	 *
	 * @param {...JsonMLVisitor} visitors - One or more JsonMLVisitor functions
	 * @returns {this} - The Textile instance
	 */
	public use(...visitors: JsonMLVisitor[]): this {
		visitors.forEach((visitor) => {
			this._visitors.push(visitor);
		});
		return this;
	}
	/**
	 * Parses a raw textile string into HTML. The string is processed by first
	 * converting it to JSON-ML and then applying any registered visitors to the
	 * tree. Finally, the JSON-ML tree is converted back to HTML.
	 *
	 * @param {string} raw - The raw textile string
	 * @returns {string} The HTML output
	 */
	public parse(raw: string): string {
		this._text = raw;
		this._init();
		return this._html;
	}
}

export type {
	JsonMLNode,
	JsonMLAttributes,
	JsonMLElement,
	JsonMLNodes,
	JsonMLRoot,
	JsonMLVisitor,
	TagName,
};

export default Textile;
