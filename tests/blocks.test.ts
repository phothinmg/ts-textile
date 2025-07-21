import { describe, it, snapshot } from "node:test";
import path from "node:path";
import Textile from "../src/index.js";

const textile = new Textile();

// snapshot dir path
snapshot.setResolveSnapshotPath((testPath) => {
  const _dir = path.dirname(testPath as string);
  const _baseName = path.basename(testPath as string);
  return path.join(_dir, "__snapshots__", `${_baseName}.snapshot`);
});

describe("Paragraphs", () => {
  it("Plain Paragraph", (t) => {
    const text = "A paragraph.";
    const result = "<p>A paragraph.</p>";
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Identifying a paragraph with p.", (t) => {
    const text = "p. A paragraph.";
    const result = "<p>A paragraph.</p>";
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Indentation can be specified by one or more parentheses for every 1em to the right or left", (t) => {
    const text = "p(((. Left indent 3em.";
    const result = '<p style="padding-left:3em;">Left indent 3em.</p>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Indentation can be specified by one or more parentheses for every 1em to the right or left", (t) => {
    const text = "p)))>. right indent 3em";
    const result =
      '<p style="padding-right:3em;text-align:right;">right indent 3em</p>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
});

describe("Headings", () => {
  it("Plain Heading", (t) => {
    const text = "h2. Textile";
    const result = "<h2>Textile</h2>";
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Heading with styles", (t) => {
    const text = "h2{color:green}. This is a title";
    const result = '<h2 style="color:green;">This is a title</h2>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Heading with class , Id and styles", (t) => {
    const text = "h2(foo bar #biz){color:green}. Textile";
    const result =
      '<h2 class="foo bar" id="biz" style="color:green;">Textile</h2>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Heading with formatting modifiers", (t) => {
    const text = "h2<>. Textile";
    const result = '<h2 style="text-align:justify;">Textile</h2>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Headings can be aligned left", (t) => {
    const text = "h3<. Left aligned header";
    const result = '<h3 style="text-align:left;">Left aligned header</h3>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Headings can be aligned right", (t) => {
    const text = "h3>. Right aligned header";
    const result = '<h3 style="text-align:right;">Right aligned header</h3>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Headings can be aligned center", (t) => {
    const text = "h3=. Centered header";
    const result = '<h3 style="text-align:center;">Centered header</h3>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
});
describe("Pre-formatted text", () => {
  it("Displayed in a pre block. Spaces and line breaks are preserved", (t) => {
    const text = "pre. Pre-formatted       text";
    const result = "<pre>Pre-formatted       text</pre>";
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
  it("Blocks with empty lines, pre.. is used:", (t) => {
    const text = `pre.. 
                  The first pre-formatted line.
 
                                  And another line.`;
    const result =
      "<pre>\n                  The first pre-formatted line.\n \n                                  And another line.</pre>";
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
});

describe("Block code", () => {
  it(" For long blocks of code with blank lines in between, use the extended block directive `bc..`.", (t) => {
    const text = `bc(language-js)..
    export default function isAttrNode(input) {
      return (
        typeof input === "object" &&
        Array.isArray(input) === false &&
        input !== null
      );
    }
    ..bc
    `;
    const result =
      '<pre class="language-js"><code class="language-js">    export default function isAttrNode(input) {\n      return (\n        typeof input === "object" &amp;&amp;\n        Array.isArray(input) === false &amp;&amp;\n        input !== null\n      );\n    }\n    </code></pre>';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
});
describe("Block quotations", () => {
  it("Block quotations using `bq.`", (t) => {
    const text = "bq. A block quotation.";
    const result = "<blockquote>\n<p>A block quotation.</p>\n</blockquote>";
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
});
describe("Textile comments", () => {
  it("Use three '#' signs and a full stop to start comment block", (t) => {
    const text = "###. This is a textile comment block.";
    const result = "";
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
});
describe("No formatting (override Textile)", () => {
  it("Skip Textile processing for a block of content.", (t) => {
    const text =
      'notextile. Straight quotation marks are not converted into curly ones "in this example".';
    const result =
      'Straight quotation marks are not converted into curly ones "in this example".';
    const html = textile.parse(text).html;
    t.assert.equal(html, result);
    t.assert.snapshot({ text, html, result });
  });
});
