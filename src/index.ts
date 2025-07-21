/**
 * TS Textile: TypeScript implementation of textile-js by Borgar Þorsteinsson.
 *
 * Original textile-js (MIT License, 2012): https://github.com/borgar/textile-js
 *
 * This project adapts and extends the original textile-js parser for TypeScript.
 *
 * @packageDocumentation
 */
//import { jml2html } from "./lib/jsonml/html-jml.js";
import textile2jml from "./lib/jsonml/index.js";
import {
  ml2hast,
  hast2html,
  type TextileVisitor,
  visit,
} from "./lib/hast/index.js";
import { preProcessedString } from "./lib/pre-process/index.js";
import type {
  Options,
  ElementNode,
  RootNode,
  TextNode,
  TagName,
} from "./lib/shares/types.js";

class Textile<T extends Record<string, any> = Record<string, any>> {
  private _opts: Options;
  private _text: string;
  private _html: string;
  private _tree: RootNode;
  private _visitors: TextileVisitor[];
  private _data: T;
  constructor(options?: Options) {
    this._opts = options ?? { breaks: true };
    this._visitors = [];
    this._text = "";
    this._html = "";
    this._tree = {
      type: "Root",
      children: [],
    };
    this._data = {} as T;
  }
  private _init() {
    if (this._text === "") {
      throw new Error("Error: required raw textile string to convert");
    }
    const { data, content } = preProcessedString<T>(this._text);
    this._data = data;
    const jsonml = textile2jml(content, this._opts);
    this._tree = ml2hast(jsonml);
    if (this._visitors.length > 0) {
      this._visitors.forEach((v) => {
        visit(this._tree, v);
      });
    }
    this._html = hast2html(this._tree);
  }

  public use(...visitors: TextileVisitor[]): this {
    visitors.forEach((visitor) => {
      this._visitors.push(visitor);
    });
    return this;
  }

  public parse(raw: string) {
    this._text = raw;
    this._init();
    return {
      html: this._html,
      data: this._data,
    };
  }
}

export type {
  TagName,
  ElementNode,
  TextNode,
  RootNode,
  Options,
  TextileVisitor,
};

export default Textile;
